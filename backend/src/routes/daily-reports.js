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
      where += ' AND dr.professional_id = $1';
      params.push(req.user.id);
    } else if (req.query.professional_id) {
      where += ` AND dr.professional_id = $${params.length + 1}`;
      params.push(req.query.professional_id);
    }
    if (req.query.date_from) { where += ` AND dr.date >= $${params.length + 1}`; params.push(req.query.date_from); }
    
    const result = await pool.query(
      `SELECT dr.*, u.full_name as professional_name FROM daily_reports dr JOIN users u ON dr.professional_id = u.id ${where} ORDER BY dr.date DESC`,
      params
    );
    res.json({ reports: result.rows, total: result.rows.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    if (req.user.role !== 'professional') return res.status(403).json({ error: 'Professional access required' });
    const { date, report_text, hours_worked, tasks_completed } = req.body;
    const result = await pool.query(
      'INSERT INTO daily_reports (professional_id, date, report_text, hours_worked, tasks_completed) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, date, report_text, hours_worked, tasks_completed]
    );
    res.status(201).json({ report: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await pool.query('SELECT professional_id FROM daily_reports WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    if (req.user.role === 'professional' && existing.rows[0].professional_id !== req.user.id) {
      return res.status(403).json({ error: 'Can only edit own reports' });
    }
    const { report_text, hours_worked } = req.body;
    const result = await pool.query(
      'UPDATE daily_reports SET report_text = COALESCE($1, report_text), hours_worked = COALESCE($2, hours_worked) WHERE id = $3 RETURNING *',
      [report_text, hours_worked, req.params.id]
    );
    res.json({ report: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    await pool.query('DELETE FROM daily_reports WHERE id = $1', [req.params.id]);
    res.json({ message: 'Report deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
