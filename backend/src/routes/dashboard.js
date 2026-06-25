const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

// Admin dashboard
router.get('/admin', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    
    const [statsResult, recentTasks, upcomingEvents, recentActivity] = await Promise.all([
      pool.query(`
        SELECT
          (SELECT COUNT(*) FROM clients) as total_clients,
          (SELECT COUNT(*) FROM clients WHERE status = 'Active') as active_projects,
          (SELECT COALESCE(SUM(amount), 0) FROM accounting WHERE type = 'Income') as total_revenue,
          (SELECT COUNT(*) FROM tasks WHERE status = 'Pending' OR status = 'In Progress') as pending_tasks
      `),
      pool.query(`
        SELECT t.*, c.company_name as client_name, p.full_name as assigned_professional_name
        FROM tasks t LEFT JOIN clients c ON t.client_id = c.id LEFT JOIN users p ON t.assigned_professional_id = p.id
        WHERE t.status != 'Completed' ORDER BY t.created_at DESC LIMIT 10
      `),
      pool.query(`
        SELECT s.*, c.company_name as client_name FROM schedule s LEFT JOIN clients c ON s.client_id = c.id
        WHERE s.date >= now() ORDER BY s.date LIMIT 5
      `),
      pool.query(`
        SELECT al.*, u.full_name as user_name FROM activity_log al LEFT JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC LIMIT 10
      `)
    ]);
    
    // Monthly revenue for chart (last 6 months)
    const monthlyRevenue = await pool.query(`
      SELECT 
        TO_CHAR(date, 'YYYY-MM') as month,
        SUM(amount) FILTER (WHERE type = 'Income') as income,
        SUM(amount) FILTER (WHERE type = 'Expense') as expense
      FROM accounting
      WHERE date >= now() - interval '6 months'
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY month
    `);

    res.json({
      stats: statsResult.rows[0],
      recent_tasks: recentTasks.rows,
      upcoming_events: upcomingEvents.rows,
      recent_activity: recentActivity.rows,
      monthly_revenue: monthlyRevenue.rows
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Professional dashboard
router.get('/professional', async (req, res) => {
  try {
    if (req.user.role !== 'professional') return res.status(403).json({ error: 'Professional access required' });
    const profId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [statsResult, myTasks, mySchedule, myAttendance] = await Promise.all([
      pool.query(`
        SELECT
          (SELECT COUNT(*) FROM tasks WHERE assigned_professional_id = $1) as my_tasks,
          (SELECT COUNT(*) FROM tasks WHERE assigned_professional_id = $1 AND status = 'Completed') as completed_tasks,
          (SELECT COALESCE(SUM(hours_worked), 0) FROM daily_reports WHERE professional_id = $1 AND date >= $2) as hours_this_week,
          EXISTS(SELECT 1 FROM attendance WHERE professional_id = $1 AND date = $3) as punched_in_today
      `, [profId, weekStart, today]),
      pool.query(`
        SELECT t.*, c.company_name as client_name FROM tasks t LEFT JOIN clients c ON t.client_id = c.id
        WHERE t.assigned_professional_id = $1 ORDER BY t.created_at DESC LIMIT 10
      `, [profId]),
      pool.query(`
        SELECT s.*, c.company_name as client_name FROM schedule s
        LEFT JOIN clients c ON s.client_id = c.id
        WHERE s.id IN (SELECT schedule_id FROM schedule_assignments WHERE professional_id = $1)
        AND s.date >= now() ORDER BY s.date LIMIT 5
      `, [profId]),
      pool.query(`
        SELECT * FROM attendance WHERE professional_id = $1 AND date >= $2 ORDER BY date DESC LIMIT 30
      `, [profId, weekStart])
    ]);

    res.json({
      stats: statsResult.rows[0],
      my_tasks: myTasks.rows,
      my_schedule: mySchedule.rows,
      my_attendance: myAttendance.rows
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Client dashboard
router.get('/client', async (req, res) => {
  try {
    if (req.user.role !== 'client') return res.status(403).json({ error: 'Client access required' });
    const clientResult = await pool.query('SELECT id FROM clients WHERE user_id = $1', [req.user.id]);
    if (clientResult.rows.length === 0) return res.json({ stats: {}, my_projects: [], recent_reports: [], upcoming_events: [] });
    const clientId = clientResult.rows[0].id;

    const [statsResult, myProjects, recentReports, upcomingEvents] = await Promise.all([
      pool.query(`
        SELECT
          (SELECT COUNT(*) FROM tasks WHERE client_id = $1 AND status != 'Completed') as active_projects,
          (SELECT COUNT(*) FROM tasks WHERE client_id = $1 AND status = 'Completed') as completed_tasks,
          (SELECT COUNT(*) FROM client_reports WHERE client_id = $1 AND is_published = true) as total_reports
      `, [clientId]),
      pool.query(`
        SELECT * FROM tasks WHERE client_id = $1 ORDER BY created_at DESC LIMIT 10
      `, [clientId]),
      pool.query(`
        SELECT * FROM client_reports WHERE client_id = $1 AND is_published = true ORDER BY created_at DESC LIMIT 5
      `, [clientId]),
      pool.query(`
        SELECT s.* FROM schedule s WHERE s.client_id = $1 AND s.date >= now() ORDER BY s.date LIMIT 5
      `, [clientId])
    ]);

    res.json({
      stats: statsResult.rows[0],
      my_projects: myProjects.rows,
      recent_reports: recentReports.rows,
      upcoming_events: upcomingEvents.rows
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
