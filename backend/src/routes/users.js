const express = require('express');
const pool = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

// List all users (admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, role, search } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];
    if (role) { where += ` AND role = $${params.length + 1}`; params.push(role); }
    if (search) { where += ` AND (full_name ILIKE $${params.length + 1} OR email ILIKE $${params.length + 1})`; params.push(`%${search}%`); }
    
    const countResult = await pool.query(`SELECT COUNT(*) FROM users ${where}`, params);
    params.push(limit, offset);
    const result = await pool.query(
      `SELECT id, email, full_name, role, avatar_url, phone, is_active, backup_email, last_login, created_at 
       FROM users ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json({ users: result.rows, total: parseInt(countResult.rows[0].count) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get single user
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, full_name, role, avatar_url, phone, is_active, backup_email, last_login, created_at FROM users WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update user
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { full_name, email, role, is_active, phone } = req.body;
    const result = await pool.query(
      `UPDATE users SET full_name = COALESCE($1, full_name), email = COALESCE($2, email), 
       role = COALESCE($3, role), is_active = COALESCE($4, is_active), phone = COALESCE($5, phone), updated_at = now()
       WHERE id = $6 RETURNING id, email, full_name, role, avatar_url, phone, is_active, backup_email`,
      [full_name, email, role, is_active, phone, req.params.id]
    );
    res.json({ user: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Deactivate user (soft delete)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('UPDATE users SET is_active = false, updated_at = now() WHERE id = $1', [req.params.id]);
    res.json({ message: 'User deactivated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// List professionals (for dropdowns)
router.get('/professionals/list', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, full_name as name, email, role FROM users WHERE role = 'professional' AND is_active = true ORDER BY full_name"
    );
    res.json({ users: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Professional stats
router.get('/professional/stats', async (req, res) => {
  try {
    if (req.user.role !== 'professional') return res.status(403).json({ error: 'Professional access only' });
    const profId = req.user.id;
    const tasksResult = await pool.query(
      `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'Completed') as completed FROM tasks WHERE assigned_professional_id = $1`,
      [profId]
    );
    const today = new Date().toISOString().split('T')[0];
    const attendanceResult = await pool.query(
      'SELECT * FROM attendance WHERE professional_id = $1 AND date = $2', [profId, today]
    );
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const reportsResult = await pool.query(
      'SELECT COALESCE(SUM(hours_worked), 0) as total_hours FROM daily_reports WHERE professional_id = $1 AND date >= $2',
      [profId, weekStart.toISOString().split('T')[0]]
    );
    res.json({
      stats: {
        total_tasks: parseInt(tasksResult.rows[0].total),
        completed_tasks: parseInt(tasksResult.rows[0].completed),
        punched_in_today: attendanceResult.rows.length > 0,
        hours_this_week: parseFloat(reportsResult.rows[0].total_hours)
      }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
