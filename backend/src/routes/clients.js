const express = require('express');
const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const { authenticate, requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

// List clients (role-filtered)
router.get('/', async (req, res) => {
  try {
    let where = 'WHERE 1=1';
    const params = [];
    if (req.user.role === 'professional') {
      where += ' AND assigned_professional_id = $1';
      params.push(req.user.id);
    } else if (req.user.role === 'client') {
      const clientRow = await pool.query('SELECT id FROM clients WHERE user_id = $1', [req.user.id]);
      if (clientRow.rows.length === 0) return res.json({ clients: [], total: 0 });
      where += ' AND id = $1';
      params.push(clientRow.rows[0].id);
    }
    const result = await pool.query(
      `SELECT c.*, u.full_name as contact_name, u.email as contact_email, p.full_name as assigned_professional_name
       FROM clients c LEFT JOIN users u ON c.user_id = u.id LEFT JOIN users p ON c.assigned_professional_id = p.id
       ${where} ORDER BY c.created_at DESC`, params
    );
    res.json({ clients: result.rows, total: result.rows.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create client (admin)
router.post('/', requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { company_name, contact_name, location, type, revenue, status, assigned_professional_id, industry, notes, user_email, user_password } = req.body;
    
    let userId = null;
    if (user_email) {
      const hashedPassword = await bcrypt.hash(user_password || 'FilmeloClient2024!', 12);
      const userResult = await client.query(
        'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id',
        [user_email, hashedPassword, contact_name || company_name, 'client']
      );
      userId = userResult.rows[0].id;
    }
    
    const result = await client.query(
      `INSERT INTO clients (user_id, company_name, contact_name, location, type, revenue, status, assigned_professional_id, industry, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [userId, company_name, contact_name, location, type || 'Project', revenue || 0, status || 'Active', assigned_professional_id, industry, notes]
    );
    await client.query('COMMIT');
    res.status(201).json({ client: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally { client.release(); }
});

// Get client detail
router.get('/:id', async (req, res) => {
  try {
    const clientResult = await pool.query(
      `SELECT c.*, u.full_name as contact_name, u.email as contact_email, p.full_name as assigned_professional_name
       FROM clients c LEFT JOIN users u ON c.user_id = u.id LEFT JOIN users p ON c.assigned_professional_id = p.id
       WHERE c.id = $1`, [req.params.id]
    );
    if (clientResult.rows.length === 0) return res.status(404).json({ error: 'Client not found' });
    
    const [tasks, sales, accounting, schedule, reports] = await Promise.all([
      pool.query('SELECT * FROM tasks WHERE client_id = $1 ORDER BY created_at DESC', [req.params.id]),
      pool.query('SELECT * FROM sales_pipeline WHERE client_id = $1 ORDER BY created_at DESC', [req.params.id]),
      pool.query('SELECT * FROM accounting WHERE client_id = $1 ORDER BY date DESC', [req.params.id]),
      pool.query('SELECT * FROM schedule WHERE client_id = $1 ORDER BY date DESC', [req.params.id]),
      pool.query('SELECT * FROM client_reports WHERE client_id = $1 ORDER BY created_at DESC', [req.params.id])
    ]);
    
    res.json({
      client: clientResult.rows[0],
      tasks: tasks.rows,
      sales: sales.rows,
      accounting: accounting.rows,
      schedule: schedule.rows,
      reports: reports.rows
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update client
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { company_name, contact_name, location, type, revenue, status, assigned_professional_id, industry, notes } = req.body;
    const result = await pool.query(
      `UPDATE clients SET company_name = COALESCE($1, company_name), contact_name = COALESCE($2, contact_name),
       location = COALESCE($3, location), type = COALESCE($4, type), revenue = COALESCE($5, revenue),
       status = COALESCE($6, status), assigned_professional_id = COALESCE($7, assigned_professional_id),
       industry = COALESCE($8, industry), notes = COALESCE($9, notes), updated_at = now() WHERE id = $10 RETURNING *`,
      [company_name, contact_name, location, type, revenue, status, assigned_professional_id, industry, notes, req.params.id]
    );
    res.json({ client: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete client
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM clients WHERE id = $1', [req.params.id]);
    res.json({ message: 'Client deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
