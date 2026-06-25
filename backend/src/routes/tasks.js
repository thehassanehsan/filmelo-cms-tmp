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
      where += ' AND t.assigned_professional_id = $1';
      params.push(req.user.id);
    } else if (req.user.role === 'client') {
      where += ' AND t.client_id IN (SELECT id FROM clients WHERE user_id = $1)';
      params.push(req.user.id);
    }
    if (req.query.client_id) { where += ` AND t.client_id = $${params.length + 1}`; params.push(req.query.client_id); }
    if (req.query.status) { where += ` AND t.status = $${params.length + 1}`; params.push(req.query.status); }
    if (req.query.priority) { where += ` AND t.priority = $${params.length + 1}`; params.push(req.query.priority); }
    
    const result = await pool.query(
      `SELECT t.*, c.company_name as client_name, p.full_name as assigned_professional_name,
        COALESCE(json_agg(json_build_object('id', d.depends_on_task_id, 'title', dt.title)) FILTER (WHERE d.id IS NOT NULL), '[]') as dependencies
       FROM tasks t
       LEFT JOIN clients c ON t.client_id = c.id
       LEFT JOIN users p ON t.assigned_professional_id = p.id
       LEFT JOIN task_dependencies d ON t.id = d.task_id
       LEFT JOIN tasks dt ON d.depends_on_task_id = dt.id
       ${where}
       GROUP BY t.id, c.company_name, p.full_name
       ORDER BY t.created_at DESC`, params
    );
    res.json({ tasks: result.rows, total: result.rows.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    if (req.user.role === 'client') return res.status(403).json({ error: 'Access denied' });
    const { title, description, client_id, assigned_professional_id, deadline, status, priority, parent_task_id, estimated_hours, depends_on } = req.body;
    const result = await pool.query(
      `INSERT INTO tasks (title, description, client_id, assigned_professional_id, created_by, deadline, status, priority, parent_task_id, estimated_hours)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [title, description, client_id, assigned_professional_id, req.user.id, deadline, status || 'Pending', priority || 'Medium', parent_task_id, estimated_hours]
    );
    const taskId = result.rows[0].id;
    if (depends_on?.length > 0) {
      for (const depId of depends_on) {
        await pool.query('INSERT INTO task_dependencies (task_id, depends_on_task_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [taskId, depId]);
      }
    }
    res.status(201).json({ task: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, c.company_name as client_name, p.full_name as assigned_professional_name
       FROM tasks t LEFT JOIN clients c ON t.client_id = c.id LEFT JOIN users p ON t.assigned_professional_id = p.id
       WHERE t.id = $1`, [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    const deps = await pool.query(
      `SELECT d.*, t.title FROM task_dependencies d JOIN tasks t ON d.depends_on_task_id = t.id WHERE d.task_id = $1`, [req.params.id]
    );
    const subtasks = await pool.query('SELECT * FROM tasks WHERE parent_task_id = $1', [req.params.id]);
    res.json({ task: result.rows[0], dependencies: deps.rows, subtasks: subtasks.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, description, status, priority, deadline, actual_hours } = req.body;
    const existing = await pool.query('SELECT assigned_professional_id, created_by FROM tasks WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    
    const task = existing.rows[0];
    if (req.user.role === 'professional' && task.assigned_professional_id !== req.user.id) {
      return res.status(403).json({ error: 'Can only update your assigned tasks' });
    }
    if (req.user.role === 'professional') {
      const result = await pool.query(
        'UPDATE tasks SET status = COALESCE($1, status), actual_hours = COALESCE($2, actual_hours), updated_at = now() WHERE id = $3 RETURNING *',
        [status, actual_hours, req.params.id]
      );
      return res.json({ task: result.rows[0] });
    }
    
    const result = await pool.query(
      `UPDATE tasks SET title = COALESCE($1, title), description = COALESCE($2, description), status = COALESCE($3, status),
       priority = COALESCE($4, priority), deadline = COALESCE($5, deadline), actual_hours = COALESCE($6, actual_hours), updated_at = now() WHERE id = $7 RETURNING *`,
      [title, description, status, priority, deadline, actual_hours, req.params.id]
    );
    res.json({ task: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ message: 'Task deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/dependencies', async (req, res) => {
  try {
    if (req.user.role === 'client') return res.status(403).json({ error: 'Access denied' });
    const { depends_on_task_id } = req.body;
    const result = await pool.query(
      'INSERT INTO task_dependencies (task_id, depends_on_task_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *',
      [req.params.id, depends_on_task_id]
    );
    res.status(201).json({ dependency: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id/dependencies/:depId', async (req, res) => {
  try {
    if (req.user.role === 'client') return res.status(403).json({ error: 'Access denied' });
    await pool.query('DELETE FROM task_dependencies WHERE id = $1', [req.params.depId]);
    res.json({ message: 'Dependency removed' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
