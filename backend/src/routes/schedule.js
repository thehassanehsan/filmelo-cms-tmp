const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    let where = 'WHERE 1=1';
    const params = [];
    if (req.user.role === 'professional') {
      where += ` AND (s.id IN (SELECT schedule_id FROM schedule_assignments WHERE professional_id = $1) OR s.client_id IN (SELECT id FROM clients WHERE assigned_professional_id = $1))`;
      params.push(req.user.id);
    } else if (req.user.role === 'client') {
      where += ` AND s.client_id IN (SELECT id FROM clients WHERE user_id = $1)`;
      params.push(req.user.id);
    }
    if (req.query.status) { where += ` AND s.status = $${params.length + 1}`; params.push(req.query.status); }
    
    const result = await pool.query(
      `SELECT s.*, c.company_name as client_name,
        COALESCE(json_agg(json_build_object('id', u.id, 'name', u.full_name)) FILTER (WHERE u.id IS NOT NULL), '[]') as assigned_professionals
       FROM schedule s
       LEFT JOIN clients c ON s.client_id = c.id
       LEFT JOIN schedule_assignments sa ON s.id = sa.schedule_id
       LEFT JOIN users u ON sa.professional_id = u.id
       ${where}
       GROUP BY s.id, c.company_name
       ORDER BY s.date DESC`, params
    );
    res.json({ events: result.rows, total: result.rows.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const { title, client_id, date, location, status, description, professional_ids } = req.body;
    const result = await pool.query(
      'INSERT INTO schedule (title, client_id, date, location, status, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, client_id, date, location, status || 'Upcoming', description]
    );
    const eventId = result.rows[0].id;
    if (professional_ids?.length > 0) {
      for (const pid of professional_ids) {
        await pool.query('INSERT INTO schedule_assignments (schedule_id, professional_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [eventId, pid]);
      }
    }
    res.status(201).json({ event: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const { title, client_id, date, location, status, description, professional_ids } = req.body;
    const result = await pool.query(
      'UPDATE schedule SET title = COALESCE($1, title), client_id = COALESCE($2, client_id), date = COALESCE($3, date), location = COALESCE($4, location), status = COALESCE($5, status), description = COALESCE($6, description), updated_at = now() WHERE id = $7 RETURNING *',
      [title, client_id, date, location, status, description, req.params.id]
    );
    if (professional_ids) {
      await pool.query('DELETE FROM schedule_assignments WHERE schedule_id = $1', [req.params.id]);
      for (const pid of professional_ids) {
        await pool.query('INSERT INTO schedule_assignments (schedule_id, professional_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.params.id, pid]);
      }
    }
    res.json({ event: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    await pool.query('DELETE FROM schedule WHERE id = $1', [req.params.id]);
    res.json({ message: 'Event deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
