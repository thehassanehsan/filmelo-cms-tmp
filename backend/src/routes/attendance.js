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
      where += ' AND a.professional_id = $1';
      params.push(req.user.id);
    } else if (req.query.professional_id) {
      where += ` AND a.professional_id = $${params.length + 1}`;
      params.push(req.query.professional_id);
    }
    if (req.query.date_from) { where += ` AND a.date >= $${params.length + 1}`; params.push(req.query.date_from); }
    if (req.query.date_to) { where += ` AND a.date <= $${params.length + 1}`; params.push(req.query.date_to); }
    
    const result = await pool.query(
      `SELECT a.*, u.full_name as professional_name FROM attendance a JOIN users u ON a.professional_id = u.id ${where} ORDER BY a.date DESC`,
      params
    );
    res.json({ entries: result.rows, total: result.rows.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { date, status, check_in, check_out, notes } = req.body;
    const professionalId = req.user.role === 'professional' ? req.user.id : req.body.professional_id;
    const result = await pool.query(
      'INSERT INTO attendance (professional_id, date, status, check_in, check_out, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [professionalId, date, status, check_in, check_out, notes]
    );
    res.status(201).json({ entry: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await pool.query('SELECT professional_id FROM attendance WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    if (req.user.role === 'professional' && existing.rows[0].professional_id !== req.user.id) {
      return res.status(403).json({ error: 'Can only update own attendance' });
    }
    const { status, check_in, check_out, notes } = req.body;
    const result = await pool.query(
      'UPDATE attendance SET status = COALESCE($1, status), check_in = COALESCE($2, check_in), check_out = COALESCE($3, check_out), notes = COALESCE($4, notes) WHERE id = $5 RETURNING *',
      [status, check_in, check_out, notes, req.params.id]
    );
    res.json({ entry: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    await pool.query('DELETE FROM attendance WHERE id = $1', [req.params.id]);
    res.json({ message: 'Entry deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
