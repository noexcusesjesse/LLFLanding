import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pkg from 'pg';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const { Pool } = pkg;
const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));
const JWT_SECRET = process.env.JWT_SECRET || 'loadline-core-secret-2026';

// Database connection (PostgreSQL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// SendGrid email function
const sendEmail = async (to, subject, html) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('⚠️ SENDGRID_API_KEY not set - emails won\'t send');
    return false;
  }

  try {
    await axios.post('https://api.sendgrid.com/v3/mail/send', {
      personalizations: [{ to: [{ email: to }] }],
      from: { email: process.env.SENDGRID_FROM_EMAIL || 'noreply@loadlinefitness.com' },
      subject: subject,
      content: [{ type: 'text/html', value: html }]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✓ Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Email error:', error.response?.data || error.message);
    return false;
  }
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Initialize database
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL DEFAULT 'contact',
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        message TEXT,
        status VARCHAR(50) DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
      CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tracker_data (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        data JSONB NOT NULL DEFAULT '{}',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      );
    `);

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tracker_user ON tracker_data(user_id);`);

    console.log('✅ Database initialized');
  } catch (error) {
    console.error('❌ Database init error:', error.message);
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ===================== AUTH MIDDLEWARE =====================
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Login required' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// ===================== AUTH ENDPOINTS =====================

// Register
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password, displayName } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  try {
    const existing = await pool.query('SELECT id FROM users WHERE username = $1 OR email = $2', [username, email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Username or email already taken' });
    }
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, display_name) VALUES ($1, $2, $3, $4) RETURNING id, username, display_name',
      [username, email, hash, displayName || username]
    );
    const user = result.rows[0];
    // Create empty tracker data
    await pool.query('INSERT INTO tracker_data (user_id, data) VALUES ($1, $2) ON CONFLICT DO NOTHING', [user.id, '{}']);
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, username: user.username, displayName: user.display_name } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1 OR email = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, username: user.username, displayName: user.display_name } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, display_name, created_at FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// ===================== TRACKER DATA ENDPOINTS =====================

// Save tracker data
app.post('/api/tracker/sync', authenticateToken, async (req, res) => {
  const { data } = req.body;
  if (!data) return res.status(400).json({ error: 'No data provided' });
  try {
    await pool.query(
      'INSERT INTO tracker_data (user_id, data, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (user_id) DO UPDATE SET data = $2, updated_at = NOW()',
      [req.user.id, JSON.stringify(data)]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

// Load tracker data
app.get('/api/tracker/data', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT data, updated_at FROM tracker_data WHERE user_id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.json({ data: {}, updated_at: null });
    res.json({ data: result.rows[0].data, updated_at: result.rows[0].updated_at });
  } catch (error) {
    console.error('Load error:', error);
    res.status(500).json({ error: 'Load failed' });
  }
});

// Submit lead (contact form)
app.post('/api/leads', async (req, res) => {
  const { type, name, email, phone, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields (name, email, message)' });
  }

  try {
    // Save to database
    const result = await pool.query(
      `INSERT INTO leads (type, name, email, phone, message) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, created_at`,
      [type || 'contact', name, email, phone || null, message]
    );

    const leadId = result.rows[0].id;

    // Send email notification (if configured)
    if (process.env.NOTIFY_EMAIL) {
      try {
        await sendEmail(
          process.env.NOTIFY_EMAIL,
          `[LoadLine] New ${type || 'Contact'} Lead: ${name}`,
          `
            <h2>New Lead Received</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
            <p><strong>Type:</strong> ${type || 'contact'}</p>
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
            <hr>
            <p>View in dashboard: <a href="${process.env.DASHBOARD_URL || 'https://loadlinefitness.com'}/admin">Lead #${leadId}</a></p>
          `
        );
      } catch (emailError) {
        console.error('Email send error (non-blocking):', emailError.message);
      }
    }

    res.json({
      success: true,
      message: 'Thank you for your interest in LoadLine Fitness. We will be in touch shortly.',
      leadId
    });
  } catch (error) {
    console.error('Lead submission error:', error);
    res.status(500).json({ error: 'Failed to submit lead' });
  }
});

// Get leads (admin dashboard - requires token)
app.get('/api/leads', authenticateAdmin, async (req, res) => {
  try {
    const { status, type, limit = 100, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM leads WHERE 1=1';
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    if (type) {
      params.push(type);
      query += ` AND type = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// Update lead status (admin)
app.patch('/api/leads/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['new', 'contacted', 'qualified', 'enrolled', 'archived'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const result = await pool.query(
      'UPDATE leads SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

// Admin authentication middleware
function authenticateAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

// Serve admin dashboard
app.get('/admin', (req, res) => {
  res.sendFile(join(__dirname, 'admin.html'));
});

// Migration endpoint (temporary)
app.get('/api/migrate', async (req, res) => {
  try {
    // Check if tables exist
    const checkUsers = await pool.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')");
    const checkTracker = await pool.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tracker_data')");
    
    let results = [];
    
    if (!checkUsers.rows[0].exists) {
      await pool.query('CREATE TABLE users (id SERIAL PRIMARY KEY, username VARCHAR(100) UNIQUE NOT NULL, email VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, display_name VARCHAR(100), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
      results.push('users created');
    } else {
      results.push('users already exists');
    }
    
    if (!checkTracker.rows[0].exists) {
      await pool.query(`CREATE TABLE tracker_data (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, data JSONB NOT NULL DEFAULT '{}', updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id))`);
      results.push('tracker_data created');
    } else {
      // Drop and recreate to fix FK constraint
      await pool.query('DROP TABLE IF EXISTS tracker_data');
      await pool.query(`CREATE TABLE tracker_data (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, data JSONB NOT NULL DEFAULT '{}', updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id))`);
      results.push('tracker_data recreated');
    }
    
    await pool.query('CREATE INDEX IF NOT EXISTS idx_tracker_user ON tracker_data(user_id)');
    results.push('index ok');
    
    res.json({ success: true, tables: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'), (err) => {
    if (err) res.status(404).send('Not found');
  });
});

// Start server
async function start() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`🚀 LoadLine Fitness API running on port ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/admin`);
  });
}

start().catch(error => {
  console.error('Startup error:', error);
  process.exit(1);
});

