const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const createTables = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'professional', 'client')),
        avatar_url TEXT,
        phone VARCHAR(20),
        is_active BOOLEAN DEFAULT true,
        backup_email VARCHAR(255),
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )
    `);

    // Password resets
    await client.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT now()
      )
    `);

    // Clients table
    await client.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        company_name VARCHAR(255) NOT NULL,
        contact_name VARCHAR(255),
        location VARCHAR(255),
        type VARCHAR(20) DEFAULT 'Project',
        revenue DECIMAL(12,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'Active',
        assigned_professional_id UUID REFERENCES users(id) ON DELETE SET NULL,
        industry VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )
    `);

    // Sales pipeline
    await client.query(`
      CREATE TABLE IF NOT EXISTS sales_pipeline (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
        deal_name VARCHAR(255) NOT NULL,
        value DECIMAL(12,2) DEFAULT 0,
        stage VARCHAR(30) DEFAULT 'Lead Generation',
        close_date DATE,
        assigned_closer_id UUID REFERENCES users(id) ON DELETE SET NULL,
        probability INTEGER DEFAULT 20,
        notes TEXT,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )
    `);

    // Accounting
    await client.query(`
      CREATE TABLE IF NOT EXISTS accounting (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
        description VARCHAR(255) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('Income', 'Expense')),
        amount DECIMAL(12,2) NOT NULL,
        date DATE NOT NULL,
        category VARCHAR(50),
        receipt_url TEXT,
        created_at TIMESTAMP DEFAULT now()
      )
    `);

    // Schedule
    await client.query(`
      CREATE TABLE IF NOT EXISTS schedule (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
        date TIMESTAMP NOT NULL,
        location VARCHAR(255),
        status VARCHAR(20) DEFAULT 'Upcoming',
        description TEXT,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )
    `);

    // Schedule assignments
    await client.query(`
      CREATE TABLE IF NOT EXISTS schedule_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        schedule_id UUID REFERENCES schedule(id) ON DELETE CASCADE,
        professional_id UUID REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50),
        created_at TIMESTAMP DEFAULT now(),
        UNIQUE(schedule_id, professional_id)
      )
    `);

    // Tasks
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
        assigned_professional_id UUID REFERENCES users(id) ON DELETE SET NULL,
        created_by UUID REFERENCES users(id),
        deadline DATE,
        status VARCHAR(20) DEFAULT 'Pending',
        priority VARCHAR(20) DEFAULT 'Medium',
        parent_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
        revision_round INTEGER DEFAULT 0,
        estimated_hours DECIMAL(5,1),
        actual_hours DECIMAL(5,1),
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )
    `);

    // Task dependencies
    await client.query(`
      CREATE TABLE IF NOT EXISTS task_dependencies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
        depends_on_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT now(),
        UNIQUE(task_id, depends_on_task_id)
      )
    `);

    // Attendance
    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        professional_id UUID REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        status VARCHAR(20) NOT NULL,
        check_in TIME,
        check_out TIME,
        notes TEXT,
        created_at TIMESTAMP DEFAULT now()
      )
    `);

    // Daily reports
    await client.query(`
      CREATE TABLE IF NOT EXISTS daily_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        professional_id UUID REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        report_text TEXT NOT NULL,
        hours_worked DECIMAL(4,1),
        tasks_completed TEXT,
        created_at TIMESTAMP DEFAULT now()
      )
    `);

    // Client reports
    await client.query(`
      CREATE TABLE IF NOT EXISTS client_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        report_type VARCHAR(30) DEFAULT 'Progress',
        attachment_url TEXT,
        created_by UUID REFERENCES users(id),
        is_published BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )
    `);

    // Activity log
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(50) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id UUID,
        details JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT now()
      )
    `);

    await client.query('COMMIT');
    console.log('[Database] All tables created successfully');

    // Seed default admin
    const adminCheck = await client.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (adminCheck.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('FilmeloAdmin2024!', 12);
      await client.query(`
        INSERT INTO users (email, password_hash, full_name, role, is_active)
        VALUES ($1, $2, $3, 'admin', true)
      `, ['admin@filmelo.media', hashedPassword, 'System Administrator']);
      console.log('[Database] Default admin created: admin@filmelo.media / FilmeloAdmin2024!');
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Database] Error creating tables:', err);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { createTables };
