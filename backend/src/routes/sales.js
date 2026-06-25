const express = require('express');
const pool = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, c.company_name as client_name, u.full_name as assigned_closer_name
       FROM sales_pipeline s LEFT JOIN clients c ON s.client_id = c.id LEFT JOIN users u ON s.assigned_closer_id = u.id
       ORDER BY s.created_at DESC`
    );
    const byStage = await pool.query(
      `SELECT stage, COUNT(*) as count, SUM(value) as total FROM sales_pipeline GROUP BY stage`
    );
    res.json({ sales: result.rows, total: result.rows.length, by_stage: byStage.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { client_id, deal_name, value, stage, close_date, assigned_closer_id, probability, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO sales_pipeline (client_id, deal_name, value, stage, close_date, assigned_closer_id, probability, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [client_id, deal_name, value || 0, stage || 'Lead Generation', close_date, assigned_closer_id, probability || 20, notes]
    );
    res.status(201).json({ sale: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { deal_name, value, stage, close_date, assigned_closer_id, probability, notes } = req.body;
    const result = await pool.query(
      `UPDATE sales_pipeline SET deal_name = COALESCE($1, deal_name), value = COALESCE($2, value), stage = COALESCE($3, stage),
       close_date = COALESCE($4, close_date), assigned_closer_id = COALESCE($5, assigned_closer_id), probability = COALESCE($6, probability),
       notes = COALESCE($7, notes), updated_at = now() WHERE id = $8 RETURNING *`,
      [deal_name, value, stage, close_date, assigned_closer_id, probability, notes, req.params.id]
    );
    res.json({ sale: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM sales_pipeline WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deal deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
