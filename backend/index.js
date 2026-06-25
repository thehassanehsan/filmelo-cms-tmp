require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { createTables } = require('./src/utils/init-db');

const app = express();

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts. Please try again later.' }
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: 'Too many password reset requests. Please try again later.' }
});

// Routes
app.use('/api/auth', require('./src/routes/auth')(loginLimiter, forgotPasswordLimiter));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/clients', require('./src/routes/clients'));
app.use('/api/sales', require('./src/routes/sales'));
app.use('/api/accounting', require('./src/routes/accounting'));
app.use('/api/schedule', require('./src/routes/schedule'));
app.use('/api/tasks', require('./src/routes/tasks'));
app.use('/api/attendance', require('./src/routes/attendance'));
app.use('/api/daily-reports', require('./src/routes/daily-reports'));
app.use('/api/client-reports', require('./src/routes/client-reports'));
app.use('/api/dashboard', require('./src/routes/dashboard'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 3001;

const start = async () => {
  try {
    await createTables();
    app.listen(PORT, () => {
      console.log(`[Filmelo Backend] Server running on port ${PORT}`);
      console.log(`[Filmelo Backend] Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('[Filmelo Backend] Failed to start:', err);
    process.exit(1);
  }
};

start();
