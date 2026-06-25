const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/database');
const { authenticate, JWT_SECRET } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { z } = require('zod');

const router = express.Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(1),
  role: z.enum(['admin', 'professional', 'client']),
  phone: z.string().optional()
});

const forgotSchema = z.object({
  email: z.string().email()
});

const resetSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8)
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8)
});

const profileSchema = z.object({
  full_name: z.string().min(1).optional(),
  phone: z.string().optional(),
  avatar_url: z.string().optional(),
  backup_email: z.string().email().optional().or(z.literal(''))
});

module.exports = (loginLimiter, forgotPasswordLimiter) => {
  // Register (admin only)
  router.post('/register', authenticate, async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      const data = registerSchema.parse(req.body);
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [data.email]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      const hashedPassword = await bcrypt.hash(data.password, 12);
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, full_name, role, phone)
         VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, role, phone, created_at`,
        [data.email, hashedPassword, data.full_name, data.role, data.phone || null]
      );
      res.status(201).json({ user: result.rows[0] });
    } catch (err) {
      if (err.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: err.errors });
      res.status(500).json({ error: err.message });
    }
  });

  // Login
  router.post('/login', loginLimiter, async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      const result = await pool.query(
        'SELECT id, email, full_name, role, avatar_url, phone, is_active, backup_email, password_hash FROM users WHERE email = $1',
        [data.email]
      );
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      const user = result.rows[0];
      if (!user.is_active) {
        return res.status(401).json({ error: 'Account is deactivated' });
      }
      const validPassword = await bcrypt.compare(data.password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      // Update last login
      await pool.query('UPDATE users SET last_login = now() WHERE id = $1', [user.id]);
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      const { password_hash, ...userWithoutPassword } = user;
      res.json({ token, user: userWithoutPassword });
    } catch (err) {
      if (err.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: err.errors });
      res.status(500).json({ error: err.message });
    }
  });

  // Forgot password
  router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
    try {
      const data = forgotSchema.parse(req.body);
      const result = await pool.query('SELECT id FROM users WHERE email = $1', [data.email]);
      if (result.rows.length === 0) {
        return res.json({ message: 'If an account exists, a reset link has been sent.' });
      }
      const userId = result.rows[0].id;
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      await pool.query(
        'INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
        [userId, tokenHash, expiresAt]
      );
      
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${rawToken}`;
      console.log(`[Password Reset] Link for ${data.email}: ${resetUrl}`);
      
      res.json({ message: 'If an account exists, a reset link has been sent.' });
    } catch (err) {
      if (err.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: err.errors });
      res.status(500).json({ error: err.message });
    }
  });

  // Reset password
  router.post('/reset-password', async (req, res) => {
    try {
      const data = resetSchema.parse(req.body);
      const tokenHash = crypto.createHash('sha256').update(data.token).digest('hex');
      const result = await pool.query(
        `SELECT pr.*, u.email FROM password_resets pr
         JOIN users u ON pr.user_id = u.id
         WHERE pr.token_hash = $1 AND pr.expires_at > now() AND pr.used_at IS NULL`,
        [tokenHash]
      );
      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }
      const reset = result.rows[0];
      const hashedPassword = await bcrypt.hash(data.newPassword, 12);
      await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, reset.user_id]);
      await pool.query('UPDATE password_resets SET used_at = now() WHERE id = $1', [reset.id]);
      res.json({ message: 'Password reset successfully. Please log in with your new password.' });
    } catch (err) {
      if (err.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: err.errors });
      res.status(500).json({ error: err.message });
    }
  });

  // Get current user
  router.get('/me', authenticate, async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT id, email, full_name, role, avatar_url, phone, is_active, backup_email, last_login, created_at FROM users WHERE id = $1',
        [req.user.id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ user: result.rows[0] });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update profile
  router.put('/profile', authenticate, async (req, res) => {
    try {
      const data = profileSchema.parse(req.body);
      const updates = [];
      const values = [];
      let idx = 1;
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          updates.push(`${key} = $${idx}`);
          values.push(value);
          idx++;
        }
      }
      if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
      values.push(req.user.id);
      const result = await pool.query(
        `UPDATE users SET ${updates.join(', ')}, updated_at = now() WHERE id = $${idx} RETURNING id, email, full_name, role, avatar_url, phone, is_active, backup_email`,
        values
      );
      res.json({ user: result.rows[0] });
    } catch (err) {
      if (err.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: err.errors });
      res.status(500).json({ error: err.message });
    }
  });

  // Change password
  router.put('/change-password', authenticate, async (req, res) => {
    try {
      const data = changePasswordSchema.parse(req.body);
      const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
      const validPassword = await bcrypt.compare(data.currentPassword, result.rows[0].password_hash);
      if (!validPassword) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
      const hashedPassword = await bcrypt.hash(data.newPassword, 12);
      await pool.query('UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2', [hashedPassword, req.user.id]);
      res.json({ message: 'Password changed successfully' });
    } catch (err) {
      if (err.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: err.errors });
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
