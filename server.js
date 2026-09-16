import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pkg from 'pg';
import nodemailer from 'nodemailer';

dotenv.config();

const { Pool } = pkg;
const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));

// Database connection (PostgreSQL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Email transporter (Nodemailer)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(dirname(__dirname)));

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
    console.log('✅ Database initialized');
  } catch (error) {
    console.error('❌ Database init error:', error.message);
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
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
        await transporter.sendMail({
          from: process.env.GMAIL_USER,
          to: process.env.NOTIFY_EMAIL,
          subject: `[LoadLine] New ${type || 'Contact'} Lead: ${name}`,
          html: `
            <h2>New Lead Received</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
            <p><strong>Type:</strong> ${type || 'contact'}</p>
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
            <hr>
            <p>View in dashboard: <a href="${process.env.DASHBOARD_URL || 'https://loadlinefitness.com'}/admin/leads/${leadId}">Lead #${leadId}</a></p>
          `
        });
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
