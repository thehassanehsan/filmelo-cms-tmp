const express = require('express');
const pool = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/', async (req, res) => {
  try {
    const { type, client_id, date_from, date_to } = req.query;
    let where = 'WHERE 1=1';
    const params = [];
    if (type) { where += ` AND a.type = $${params.length + 1}`; params.push(type); }
    if (client_id) { where += ` AND a.client_id = $${params.length + 1}`; params.push(client_id); }
    if (date_from) { where += ` AND a.date >= $${params.length + 1}`; params.push(date_from); }
    if (date_to) { where += ` AND a.date <= $${params.length + 1}`; params.push(date_to); }
    
    const result = await pool.query(
      `SELECT a.*, c.company_name as client_name FROM accounting a LEFT JOIN clients c ON a.client_id = c.id ${where} ORDER BY a.date DESC`,
      params
    );
    const summary = await pool.query(
      `SELECT 
        COALESCE(SUM(amount) FILTER (WHERE type = 'Income'), 0) as total_income,
        COALESCE(SUM(amount) FILTER (WHERE type = 'Expense'), 0) as total_expense
       FROM accounting a ${where}`, params
    );
    res.json({
      entries: result.rows,
      total: result.rows.length,
      summary: {
        income: parseFloat(summary.rows[0].total_income),
        expense: parseFloat(summary.rows[0].total_expense),
        net: parseFloat(summary.rows[0].total_income) - parseFloat(summary.rows[0].total_expense)
      }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { client_id, description, type, amount, date, category, receipt_url } = req.body;
    const result = await pool.query(
      'INSERT INTO accounting (client_id, description, type, amount, date, category, receipt_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [client_id, description, type, amount, date, category, receipt_url]
    );
    res.status(201).json({ entry: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { description, type, amount, date, category } = req.body;
    const result = await pool.query(
      'UPDATE accounting SET description = COALESCE($1, description), type = COALESCE($2, type), amount = COALESCE($3, amount), date = COALESCE($4, date), category = COALESCE($5, category) WHERE id = $6 RETURNING *',
      [description, type, amount, date, category, req.params.id]
    );
    res.json({ entry: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM accounting WHERE id = $1', [req.params.id]);
    res.json({ message: 'Entry deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
