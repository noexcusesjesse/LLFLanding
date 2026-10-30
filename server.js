import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, extname, join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { applySiteNav } from './partials/site-nav.js';
import { escapeHtml, planBuilderLeadError, planBuilderLeadRecord } from './lib/plan-builder-lead.js';
import { DELETION_REQUEST_CONFIRMATION, logRuckDeletionRequest, ruckDeletionRequestError, ruckDeletionRequestRecord, ruckInterestError, ruckInterestRecord, ruckNoticeHtml } from './lib/ruck-interest.js';
import { noindexHeader } from './lib/noindex.js';
import { mountSiteV5, notFound } from './lib/site-v5.js';
import { age18ConfirmedError } from './lib/tracker-age.js';
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
app.use(express.urlencoded({ extended: true }));

// STAGING: v5 site redo. Registered first so the new pages, redirects,
// redirects and new pages win over the legacy routes.
mountSiteV5(app, __dirname);

function sendHtml(res, filename) {
  try {
    const html = applySiteNav(readFileSync(join(__dirname, filename), 'utf8'));
    res.type('html').send(html);
  } catch (error) {
    console.error('Page error:', error.message);
    res.status(404).send('Not found');
  }
}

// Clean paths registered before express.static. A real folder (papers/, apps/)
// would otherwise redirect /papers or /apps onto a directory URL that then
// falls through to the home page.
function cleanPage(urlPath, file) {
  app.get(urlPath, (req, res) => {
    const [path, query] = req.originalUrl.split('?');
    if (path.endsWith('/')) {
      return res.redirect(301, urlPath + (query ? '?' + query : ''));
    }
    sendHtml(res, file);
  });
}

cleanPage('/papers', 'papers.html');
cleanPage('/apps', 'apps.html');
cleanPage('/plan-builder', 'plan-builder.html');
cleanPage('/privacy', 'privacy.html');
cleanPage('/ruck', 'ruck/index.html');
cleanPage('/ruck/privacy', 'ruck/privacy.html');
app.get(['/ruck/index.html', '/ruck/privacy.html'], (req, res) => {
  res.redirect(301, req.path.endsWith('privacy.html') ? '/ruck/privacy' : '/ruck');
});

// The guide sits under the app directory. Register it before static files so
// both /apps/walkingout/help and the trailing-slash URL render this page
// instead of falling through to the home page.
function walkingoutHelp(req, res) {
  const [path, query] = req.originalUrl.split('?');
  const canonical = '/apps/walkingout/help/';
  if (path !== canonical) {
    return res.redirect(301, canonical + (query ? '?' + query : ''));
  }
  sendHtml(res, 'apps/walkingout/help/index.html');
}

app.get(['/apps/walkingout/help', '/apps/walkingout/help/', '/apps/walkingout/help/index.html'], walkingoutHelp);

// HTML articles live next to the PDFs. Serve them through sendHtml so the
// shared nav is filled in. /papers/<slug> redirects to the .html file when
// that article exists. PDF slugs have no .html file, so they fall through
// to the viewer redirect below.
app.get(/^\/papers\/([a-z0-9]+(?:-[a-z0-9]+)*)(?:\.html)?\/?$/, (req, res, next) => {
  const slug = req.params[0];
  const file = join(__dirname, 'papers', `${slug}.html`);
  if (!existsSync(file)) return next();
  const [path, query] = req.originalUrl.split('?');
  const canonical = `/papers/${slug}.html`;
  if (path !== canonical) {
    return res.redirect(301, canonical + (query ? '?' + query : ''));
  }
  sendHtml(res, `papers/${slug}.html`);
});

// WalkQuest was retired. Old links and bookmarks go to WalkingOut Routine
// (Free) with a permanent redirect. The one exception is the old service
// worker script: browsers re-check it, and a redirect there would leave the
// cached app installed. Serve a worker that clears the WalkQuest cache and
// unregisters itself instead.
const WALKQUEST_RETIRED_SW = `self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('walkquest-')).map((key) => caches.delete(key))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) => clients.forEach((client) => client.navigate('/apps/walkingout/'))),
  );
});
`;
app.get('/apps/walkquest/sw.js', (req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.type('application/javascript').send(WALKQUEST_RETIRED_SW);
});
app.all(['/apps/walkquest', /^\/apps\/walkquest\/.*/], (req, res) => {
  res.redirect(301, '/apps/walkingout/');
});

// Eating Window is a static PWA, hidden from search. Canonical URL keeps the
// trailing slash so its relative paths, service worker scope and manifest
// start_url all resolve under /eating-window/. Served as-is (no site nav).
app.use('/eating-window', noindexHeader);
app.get(['/eating-window', '/eating-window/index.html'], (req, res, next) => {
  const [path, query] = req.originalUrl.split('?');
  if (path === '/eating-window/') return next();
  return res.redirect(301, '/eating-window/' + (query ? '?' + query : ''));
});

const STATIC_HTML = new Set(['admin.html', 'tracker-admin.html', 'tracker.html']);

app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  if (req.path === '/' || req.path === '/index.html') return sendHtml(res, 'index.html');
  if (!req.path.endsWith('.html') || req.path.includes('..')) return next();
  const name = req.path.slice(1);
  if (name.includes('/') || STATIC_HTML.has(name)) return next();
  if (!existsSync(join(__dirname, name))) return next();
  return sendHtml(res, name);
});

// The bundled mime table doesn't know .avif; set it (and .webp) explicitly.
const IMAGE_TYPES = { '.avif': 'image/avif', '.webp': 'image/webp' };
app.use(express.static(__dirname, {
  setHeaders(res, filePath) {
    const type = IMAGE_TYPES[extname(filePath).toLowerCase()];
    if (type) res.setHeader('Content-Type', type);
  },
}));

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
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // Ensure status column exists (for upgrades)
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'`).catch(() => {});
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS age18_confirmed BOOLEAN NOT NULL DEFAULT false`).catch(() => {});

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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS access_requests (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(30),
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`ALTER TABLE access_requests ADD COLUMN IF NOT EXISTS age18_confirmed BOOLEAN NOT NULL DEFAULT false`).catch(() => {});

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ruck_interest (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        zip VARCHAR(10) NOT NULL,
        interests TEXT[] NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_ruck_interest_email ON ruck_interest(email);
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ruck_deletion_requests (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
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
  const ageError = age18ConfirmedError(req.body);
  if (ageError) return res.status(400).json({ error: ageError });
  try {
    const existing = await pool.query('SELECT id FROM users WHERE username = $1 OR email = $2', [username, email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Username or email already taken' });
    }
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, display_name, age18_confirmed) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, display_name',
      [username, email, hash, displayName || username, true]
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
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended. Contact support.' });
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

// Submit lead (contact form, or the plan builder's name/email/consent only)
app.post('/api/leads', async (req, res) => {
  const body = req.body || {};
  if (body.type === 'ruck' || body.source === 'ruck' || body.table === 'ruck_interest' || body.table === 'ruck_deletion_requests') {
    return res.status(400).json({ error: 'Foundation interest is not stored with leads.' });
  }
  if (body.source === 'plan-builder') {
    const leadError = planBuilderLeadError(body);
    if (leadError) return res.status(400).json({ error: leadError });
    const lead = planBuilderLeadRecord(body);
    try {
      const result = await pool.query(
        `INSERT INTO leads (type, name, email, phone, message)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, created_at`,
        [lead.type, lead.name, lead.email, lead.phone, lead.message]
      );
      const leadId = result.rows[0].id;
      if (process.env.NOTIFY_EMAIL) {
        try {
          await sendEmail(
            process.env.NOTIFY_EMAIL,
            `[LoadLine] New plan-builder Lead: ${lead.name}`,
            `
              <h2>New Plan Builder Lead</h2>
              <p><strong>Name:</strong> ${escapeHtml(lead.name)}</p>
              <p><strong>Email:</strong> ${escapeHtml(lead.email)}</p>
              <p><strong>Type:</strong> plan-builder</p>
              <p>${escapeHtml(lead.message).replace(/\n/g, '<br>')}</p>
              <hr>
              <p>View in dashboard: <a href="${process.env.DASHBOARD_URL || 'https://loadlinefitness.com'}/admin">Lead #${leadId}</a></p>
            `
          );
        } catch (emailError) {
          console.error('Email send error (non-blocking):', emailError.message);
        }
      }
      return res.json({
        success: true,
        message: 'Thank you. Your plan is ready to download.',
        leadId
      });
    } catch (error) {
      console.error('Lead submission error:', error);
      return res.status(500).json({ error: 'Failed to submit lead' });
    }
  }

  const { type, name, email, phone, message } = body;

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
            <p><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            ${phone ? `<p><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : ''}
            <p><strong>Type:</strong> ${escapeHtml(type || 'contact')}</p>
            <p><strong>Message:</strong></p>
            <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
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

// ===================== ACCESS REQUESTS =====================

// Submit access request (public)
app.post('/api/access-request', async (req, res) => {
  const { name, email, phone } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
  const ageError = age18ConfirmedError(req.body);
  if (ageError) return res.status(400).json({ error: ageError });
  try {
    // Check if already requested
    const existing = await pool.query("SELECT id FROM access_requests WHERE email = $1 AND status = 'pending'", [email]);
    if (existing.rows.length > 0) return res.json({ success: true, message: 'Request already submitted' });
    await pool.query('INSERT INTO access_requests (name, email, phone, age18_confirmed) VALUES ($1, $2, $3, $4)', [name, email, phone || null, true]);
    res.json({ success: true, message: 'Access request submitted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit request' });
  }
});

// ===================== ADMIN USER MANAGEMENT =====================

// List all users
app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, display_name, status, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list users' });
  }
});

// Create user (admin)
app.post('/api/admin/users', authenticateAdmin, async (req, res) => {
  const { username, email, password, displayName } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'Username, email, and password required' });
  const ageError = age18ConfirmedError(req.body);
  if (ageError) return res.status(400).json({ error: ageError });
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, display_name, age18_confirmed) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, display_name, status, created_at',
      [username, email, hash, displayName || username, true]
    );
    await pool.query('INSERT INTO tracker_data (user_id, data) VALUES ($1, $2) ON CONFLICT DO NOTHING', [result.rows[0].id, '{}']);
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Username or email already exists' });
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Reset user password
app.patch('/api/admin/users/:id/reset-password', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  try {
    const hash = await bcrypt.hash(newPassword, 10);
    const result = await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, username, display_name', [hash, id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Suspend / Unsuspend user
app.patch('/api/admin/users/:id/status', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!['active', 'suspended'].includes(status)) return res.status(400).json({ error: 'Status must be active or suspended' });
  try {
    const result = await pool.query('UPDATE users SET status = $1 WHERE id = $2 RETURNING id, username, display_name, status', [status, id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Delete user
app.delete('/api/admin/users/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tracker_data WHERE user_id = $1', [id]);
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id, username', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, deleted: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get user's tracker data (admin view)
app.get('/api/admin/users/:id/data', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const user = await pool.query('SELECT id, username, display_name, status FROM users WHERE id = $1', [id]);
    if (user.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const data = await pool.query('SELECT data, updated_at FROM tracker_data WHERE user_id = $1', [id]);
    res.json({ user: user.rows[0], trackerData: data.rows[0]?.data || {}, updatedAt: data.rows[0]?.updated_at });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

// List access requests
app.get('/api/admin/access-requests', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM access_requests ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list requests' });
  }
});

// Approve access request (creates user)
app.post('/api/admin/access-requests/:id/approve', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  try {
    const reqResult = await pool.query('SELECT * FROM access_requests WHERE id = $1', [id]);
    if (reqResult.rows.length === 0) return res.status(404).json({ error: 'Request not found' });
    const request = reqResult.rows[0];
    const hash = await bcrypt.hash(password, 10);
    const userResult = await pool.query(
      'INSERT INTO users (username, email, password_hash, display_name, age18_confirmed) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, display_name',
      [username, request.email, hash, request.name, true]
    );
    await pool.query('INSERT INTO tracker_data (user_id, data) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userResult.rows[0].id, '{}']);
    await pool.query("UPDATE access_requests SET status = 'approved' WHERE id = $1", [id]);
    res.json({ success: true, user: userResult.rows[0], request });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Username already exists' });
    res.status(500).json({ error: 'Failed to approve request' });
  }
});

// Deny access request
app.patch('/api/admin/access-requests/:id/deny', authenticateAdmin, async (req, res) => {
  try {
    await pool.query("UPDATE access_requests SET status = 'denied' WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to deny request' });
  }
});

function ruckRespond(req, res, status, payload) {
  if (req.is('json')) return res.status(status).json(payload);
  return res.status(status).type('html').send(ruckNoticeHtml({
    title: payload.error ? 'Check the form' : 'R.U.C.K. Foundation',
    message: payload.error || payload.message,
  }));
}

// Foundation interest list. Rows stay in ruck_interest and are not emailed.
app.post('/api/ruck/interest', async (req, res) => {
  const error = ruckInterestError(req.body);
  if (error) return ruckRespond(req, res, 400, { error });
  const row = ruckInterestRecord(req.body);
  try {
    await pool.query(
      `INSERT INTO ruck_interest (name, email, zip, interests)
       VALUES ($1, $2, $3, $4::text[])`,
      [row.name, row.email, row.zip, row.interests]
    );
    return ruckRespond(req, res, 200, { success: true, message: "You're on the list. We'll be in touch when a program launches." });
  } catch (err) {
    console.error('Ruck interest error:', err.message);
    return ruckRespond(req, res, 500, { error: 'The list could not be saved. Try again later.' });
  }
});

app.post('/api/ruck/deletion-request', async (req, res) => {
  const error = ruckDeletionRequestError(req.body);
  if (error) return ruckRespond(req, res, 400, { error });
  const row = ruckDeletionRequestRecord(req.body);
  try {
    await logRuckDeletionRequest((text, params) => pool.query(text, params), row);
    return ruckRespond(req, res, 200, { success: true, message: DELETION_REQUEST_CONFIRMATION });
  } catch (err) {
    console.error('Ruck deletion request error:', err.message);
    return ruckRespond(req, res, 500, { error: 'The request could not be saved. Try again later.' });
  }
});

// Serve admin dashboard
app.get('/admin', (req, res) => {
  res.sendFile(join(__dirname, 'admin.html'));
});

// Serve tracker admin
app.get('/tracker-admin', (req, res) => {
  res.sendFile(join(__dirname, 'tracker-admin.html'));
});

// /papers/<slug> is a paper detail page. Real files in papers/ (the PDF, the
// cover, papers.js) are already served by express.static above. A slug with
// no matching file would otherwise fall through to the home page.
app.get(['/papers/:slug', '/papers/:slug/'], (req, res, next) => {
  const slug = req.params.slug;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return next();
  if (!existsSync(join(__dirname, 'papers', `${slug}.pdf`))) return next();
  const query = req.originalUrl.split('?')[1];
  return res.redirect(301, '/paper.html?p=' + encodeURIComponent(slug) + (query ? '&' + query : ''));
});

// Unknown paths get a real 404 (v5 redo; no soft-200 catch-all).
app.get('*', notFound);

// Start server
async function start() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`🚀 LoadLine Fitness API running on port ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/admin`);
  });
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  start().catch(error => {
    console.error('Startup error:', error);
    process.exit(1);
  });
}

export { app };

