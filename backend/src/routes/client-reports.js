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
      where += ' AND cr.created_by = $1';
      params.push(req.user.id);
    } else if (req.user.role === 'client') {
      where += ' AND cr.client_id IN (SELECT id FROM clients WHERE user_id = $1) AND cr.is_published = true';
      params.push(req.user.id);
    }
    if (req.query.client_id) { where += ` AND cr.client_id = $${params.length + 1}`; params.push(req.query.client_id); }
    
    const result = await pool.query(
      `SELECT cr.*, c.company_name as client_name, u.full_name as created_by_name
       FROM client_reports cr
       LEFT JOIN clients c ON cr.client_id = c.id
       LEFT JOIN users u ON cr.created_by = u.id
       ${where}
       ORDER BY cr.created_at DESC`, params
    );
    res.json({ reports: result.rows, total: result.rows.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    if (req.user.role === 'client') return res.status(403).json({ error: 'Access denied' });
    const { client_id, title, content, report_type, attachment_url } = req.body;
    const result = await pool.query(
      'INSERT INTO client_reports (client_id, title, content, report_type, attachment_url, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [client_id, title, content, report_type || 'Progress', attachment_url, req.user.id]
    );
    res.status(201).json({ report: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT cr.*, c.company_name as client_name, u.full_name as created_by_name
       FROM client_reports cr LEFT JOIN clients c ON cr.client_id = c.id LEFT JOIN users u ON cr.created_by = u.id
       WHERE cr.id = $1`, [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Report not found' });
    const report = result.rows[0];
    if (req.user.role === 'client') {
      const clientCheck = await pool.query('SELECT id FROM clients WHERE user_id = $1', [req.user.id]);
      if (clientCheck.rows.length === 0 || report.client_id !== clientCheck.rows[0].id || !report.is_published) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    res.json({ report });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    if (req.user.role === 'client') return res.status(403).json({ error: 'Access denied' });
    const { title, content, report_type, is_published, attachment_url } = req.body;
    const result = await pool.query(
      'UPDATE client_reports SET title = COALESCE($1, title), content = COALESCE($2, content), report_type = COALESCE($3, report_type), is_published = COALESCE($4, is_published), attachment_url = COALESCE($5, attachment_url), updated_at = now() WHERE id = $6 RETURNING *',
      [title, content, report_type, is_published, attachment_url, req.params.id]
    );
    res.json({ report: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    await pool.query('DELETE FROM client_reports WHERE id = $1', [req.params.id]);
    res.json({ message: 'Report deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
