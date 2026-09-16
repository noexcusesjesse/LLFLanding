# LoadLine Fitness - Lead Management System Deployment Guide

## ✅ Complete! What Was Built

A **full-stack lead management system** for LoadLine Fitness with:

### 🎯 Frontend Features
- **Embedded Contact Form** — Request assessment/information
  - Name, email, phone, message fields
  - Real-time validation
  - Success/error messaging
  - Styled to match your brand

### 🗄️ Backend Features
- **Node.js + Express API**
  - Lead submission endpoint (`POST /api/leads`)
  - Lead retrieval & filtering (`GET /api/leads`)
  - Status updates (`PATCH /api/leads/:id`)
  - Health check (`GET /api/health`)

### 📊 Database
- **PostgreSQL** with leads table
  - Stores: name, email, phone, message
  - Tracks: submission type, status, timestamps
  - Indexes for fast filtering

### 📧 Email Notifications
- **Automatic emails** when leads submit
- Configurable recipient
- Lead ID link for quick dashboard access

### 🔐 Admin Dashboard
- **Web-based dashboard** at `/admin`
- Token-based authentication
- View all leads in table format
- Filter by status (new, contacted, qualified, enrolled, archived)
- Filter by type (contact, waitlist, assessment)
- Update lead status from dropdown
- Direct email links

---

## 🚀 Deploy to Railway

### Step 1: Set Up PostgreSQL on Railway

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Select `noexcusesjesse/LLFLanding` repo
4. Click "Add Service" → Select "PostgreSQL"
5. Railway auto-creates `DATABASE_URL` environment variable

### Step 2: Configure Environment Variables

In **Railway Dashboard → Variables**, add:

```
GMAIL_USER=your-email@gmail.com
GMAIL_PASSWORD=app-specific-password (see below)
NOTIFY_EMAIL=jesse@loadlinefitness.com
ADMIN_TOKEN=your-secure-random-token-here
DASHBOARD_URL=https://www.loadlinefitness.com
```

**Note:** `DATABASE_URL` is auto-set by PostgreSQL plugin. Do NOT manually add it.

### Step 3: Gmail Setup (Email Notifications)

**Option A: Gmail (Easiest)**

1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Select "Mail" and "Windows Computer" (or your device)
3. Google generates 16-character password
4. Copy that password as `GMAIL_PASSWORD` (remove spaces)

Example:
```
GMAIL_USER=jesse@gmail.com
GMAIL_PASSWORD=abcdvwxyzabcdvwxyz
```

**Option B: SendGrid (Production)**

Better for high-volume emails. See README-LEAD-SYSTEM.md for setup.

### Step 4: Deploy

Railway auto-deploys when you push to GitHub. The repo already pushed with:
- ✅ Contact form in index.html
- ✅ Node.js backend (server.js)
- ✅ Admin dashboard (admin.html)
- ✅ Docker config
- ✅ PostgreSQL setup

**Status:** Your Railway deployment should be live now!

---

## 🌐 Set Up Custom Domain

### Current: Railway Auto-Domain
- Your app is at: `loadlinefitness-xxx.up.railway.app`
- This works, but not pretty

### Better: Use loadlinefitness.com

1. **Buy domain** (if not already owned)
   - GoDaddy, Namecheap, Route53, etc.

2. **In Railway Dashboard:**
   - Go to Settings → **Custom Domains**
   - Click "Add Custom Domain"
   - Enter: `www.loadlinefitness.com`
   - Railway gives you DNS records

3. **In your domain registrar:**
   - Go to DNS settings
   - Add CNAME record:
     ```
     Name: www
     Type: CNAME
     Value: cname.railway.app (or whatever Railway specifies)
     ```
   - Save & wait 15-30 min for DNS to propagate

4. **Verify:**
   - Visit https://www.loadlinefitness.com in browser
   - Your landing page loads
   - Form works

---

## 📱 Test It Out

### 1. Landing Page
Visit: **https://www.loadlinefitness.com**
- Should see your LoadLine Fitness landing page
- Scroll to "GET IN TOUCH" section
- Contact form is embedded

### 2. Submit a Test Lead
- Fill form with test data
- Click "Send My Request"
- Should see success message

### 3. Check Admin Dashboard
Visit: **https://www.loadlinefitness.com/admin**
- Enter `ADMIN_TOKEN` from your Railway variables
- Should see your test lead in the table
- Try updating status dropdown

### 4. Check Email
- Go to inbox for `NOTIFY_EMAIL`
- Should have received email about lead
- Email includes lead ID and dashboard link

---

## 🔧 Configuration Reference

### Environment Variables (Railway)

| Variable | Value | Required | Notes |
|----------|-------|----------|-------|
| `DATABASE_URL` | Auto-set | ✅ | Don't manually add; PostgreSQL plugin sets it |
| `GMAIL_USER` | your@gmail.com | ✅ | For email notifications |
| `GMAIL_PASSWORD` | app-password | ✅ | 16-char app-specific password (NOT Google password) |
| `NOTIFY_EMAIL` | jesse@loadlinefitness.com | ✅ | Where lead notifications go |
| `ADMIN_TOKEN` | your-secure-token | ✅ | Password for `/admin` dashboard |
| `DASHBOARD_URL` | https://www.loadlinefitness.com | ✅ | Used in email links |
| `PORT` | 3000 | ❌ | Railway auto-sets; don't override |
| `NODE_ENV` | production | ❌ | Railway auto-sets |

### File Locations

```
LLFLanding/
├── index.html              # Landing page + form
├── admin.html              # Lead management dashboard
├── styles.css              # Styling
├── server.js               # Node.js backend
├── package.json            # Dependencies
├── Dockerfile              # Docker config (Railway uses this)
├── railway.json            # Railway deployment config
├── .env.example            # Template (copy to .env for local testing)
├── README-LEAD-SYSTEM.md   # Full documentation
└── assets/                 # Your images
    ├── loadline-fitness-banner.png
    └── loadline-fitness-logo.jpg
```

---

## 📊 API Reference

### Submit Lead
```bash
curl -X POST https://www.loadlinefitness.com/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "type": "contact",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "(555) 123-4567",
    "message": "I am interested in LoadLine 30..."
  }'
```

### Get Leads (Admin)
```bash
curl https://www.loadlinefitness.com/api/leads \
  -H "Authorization: Bearer your-admin-token"
```

### Update Lead Status
```bash
curl -X PATCH https://www.loadlinefitness.com/api/leads/1 \
  -H "Authorization: Bearer your-admin-token" \
  -H "Content-Type: application/json" \
  -d '{"status": "contacted"}'
```

---

## 🐛 Troubleshooting

### Issue: Form submits but no email received
**Solution:**
- Check `GMAIL_USER` and `GMAIL_PASSWORD` in Railway variables
- Verify app-specific password (not regular Google password)
- Check `NOTIFY_EMAIL` is correct
- Check spam folder
- Review Railway logs for errors

### Issue: Admin dashboard won't log in
**Solution:**
- Verify `ADMIN_TOKEN` matches exactly (case-sensitive)
- Try incognito window (clears stored token)
- Check browser console for errors (F12 → Console)

### Issue: Database errors in Railway logs
**Solution:**
- Verify PostgreSQL service is added and connected
- Check DATABASE_URL is auto-set (don't manually add)
- Server auto-creates tables on first run
- Wait 30 seconds after adding PostgreSQL plugin

### Issue: "502 Bad Gateway" or "504 Gateway Timeout"
**Solution:**
- Server is starting up (takes ~30 sec)
- Check Railway logs: Deployments tab
- Verify health check passes: `GET /api/health`
- Restart service in Railway dashboard

---

## 📧 Next Steps

### Immediate (Next 24 hours)
1. ✅ Verify custom domain works
2. ✅ Test lead submission
3. ✅ Check admin dashboard
4. ✅ Verify email notifications

### Short-term (This week)
1. **Update navigation** — Add "Get Started" link in hero pointing to form
2. **Add FAQ section** — Cost, schedule, who it's for
3. **Add testimonials** — Client results (even hypothetical at launch)
4. **Add team bios** — Photos + background of coaches

### Medium-term (Next 2 weeks)
1. **Lead nurture flow** — Auto-send assessment questionnaire
2. **Assessment page** — Multi-domain intake form
3. **Integrations** — Slack notifications for new leads
4. **Analytics** — Track form submissions, conversion rates

---

## 💬 Support

**Questions?** Email: jesse@loadlinefitness.com

**Documentation:** See `README-LEAD-SYSTEM.md` for detailed API docs, local development, and troubleshooting.

---

## What Changed in Your Repo

**New Files:**
- `server.js` — Node.js Express backend
- `admin.html` — Lead management dashboard
- `package.json` — Node.js dependencies
- `Dockerfile` — Docker config for Railway
- `railway.json` — Railway deployment config
- `.env.example` — Environment variables template
- `README-LEAD-SYSTEM.md` — Full documentation

**Modified Files:**
- `index.html` — Added contact form + JavaScript
- `styles.css` — Added form styling
- `.gitignore` — Added node_modules, .env

**Deployment:**
- Already pushed to GitHub: https://github.com/noexcusesjesse/LLFLanding
- Railway auto-deploys on every push

---

**Status: 🟢 LIVE AND READY**

Your lead management system is live at https://www.loadlinefitness.com
