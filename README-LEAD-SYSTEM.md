# LoadLine Fitness - Lead Management System

Complete lead capture, management, and email notification system for LoadLine Fitness landing page.

## Features

✅ **Lead Capture Forms**
- Contact form (name, email, phone, message)
- Email validation
- Success/error messaging

✅ **Database Storage**
- PostgreSQL leads table
- Lead status tracking (new, contacted, qualified, enrolled, archived)
- Lead type categorization
- Timestamps for all submissions

✅ **Admin Dashboard**
- View all leads with filters (status, type)
- Update lead status from dashboard
- Direct email links
- Lead count summary
- Token-based authentication

✅ **Email Notifications**
- Nodemailer integration (Gmail, SendGrid, etc.)
- Automatic emails on lead submission
- Link to manage lead in dashboard

✅ **Production Ready**
- CORS configured
- Error handling
- Environment-based configuration
- Health check endpoint
- Railway-ready Dockerfile

## Tech Stack

- **Backend:** Node.js + Express.js
- **Database:** PostgreSQL
- **Frontend:** Vanilla JavaScript (no build tools)
- **Email:** Nodemailer
- **Hosting:** Railway

## Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env`:

```
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/loadline_fitness
GMAIL_USER=your-gmail@gmail.com
GMAIL_PASSWORD=your-app-password
NOTIFY_EMAIL=jesse@loadlinefitness.com
ADMIN_TOKEN=your-secure-random-token-here
DASHBOARD_URL=https://www.loadlinefitness.com
```

### 3. Database Setup (Local PostgreSQL)

```bash
# Create database
createdb loadline_fitness

# Server will auto-create tables on first run
npm start
```

### 4. Run Server

```bash
npm start
```

Server runs on `http://localhost:3000`

- **Landing page:** http://localhost:3000
- **Contact form:** http://localhost:3000 (scroll to form)
- **Admin dashboard:** http://localhost:3000/admin

### 5. Test Contact Form

1. Visit http://localhost:3000 and scroll to "GET IN TOUCH" section
2. Fill form and submit
3. Check your email (NOTIFY_EMAIL)
4. Check admin dashboard at /admin (use ADMIN_TOKEN)

## Deployment to Railway

### 1. Create Railway Project

- Go to [railway.app](https://railway.app)
- Click "New Project"
- Select "Deploy from GitHub"
- Choose `noexcusesjesse/LLFLanding` repository

### 2. Add PostgreSQL

- In Railway, click "Add Service" → Select "PostgreSQL"
- Database URL will be auto-set as `DATABASE_URL`

### 3. Set Environment Variables

In Railway dashboard, go to **Variables** and add:

```
PORT=3000
NODE_ENV=production
GMAIL_USER=your-gmail@gmail.com
GMAIL_PASSWORD=your-app-password (use Gmail app-specific password)
NOTIFY_EMAIL=jesse@loadlinefitness.com
ADMIN_TOKEN=your-secure-random-token-here
DASHBOARD_URL=https://www.loadlinefitness.com
```

**Note:** `DATABASE_URL` is auto-set by Railway's PostgreSQL plugin.

### 4. Deploy

- Railway auto-detects Node.js and deploys
- Public URL: `https://your-railway-domain.up.railway.app`
- Database tables auto-created on first run

### 5. Connect Custom Domain

- Buy domain (loadlinefitness.com if not already purchased)
- In Railway > Settings > Custom Domains
- Add `www.loadlinefitness.com`
- Follow DNS setup instructions from your registrar

## API Endpoints

### Submit Lead
```
POST /api/leads

Body:
{
  "type": "contact",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "(555) 123-4567",
  "message": "Interested in LoadLine 30..."
}

Response (success):
{
  "success": true,
  "message": "Thank you for your interest...",
  "leadId": 1
}
```

### Get Leads (Admin)
```
GET /api/leads?status=new&type=contact&limit=100&offset=0

Headers:
Authorization: Bearer {ADMIN_TOKEN}

Response:
[
  {
    "id": 1,
    "type": "contact",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "(555) 123-4567",
    "message": "...",
    "status": "new",
    "created_at": "2026-09-16T14:30:00Z",
    "updated_at": "2026-09-16T14:30:00Z"
  },
  ...
]
```

### Update Lead Status (Admin)
```
PATCH /api/leads/:id

Headers:
Authorization: Bearer {ADMIN_TOKEN}

Body:
{
  "status": "contacted"
}

Response:
{
  "id": 1,
  "status": "contacted",
  ...
}
```

### Health Check
```
GET /api/health

Response:
{
  "status": "ok",
  "uptime": 123.45
}
```

## Admin Dashboard

Access at `/admin` (e.g., `https://www.loadlinefitness.com/admin`)

1. Enter ADMIN_TOKEN when prompted
2. View all leads in table format
3. Filter by status or type
4. Click status dropdown to update lead status
5. Click "Email" to send direct email

## Email Configuration

### ProtonMail (Your Setup)

1. Log in to ProtonMail account
2. Go to **Settings → Accounts → Other mail services**
3. Click **"Generate new password"** for IMAP/SMTP access
4. Copy the generated password
5. Use in Railway variables:

```
PROTON_EMAIL=your-proton@protonmail.com
PROTON_PASSWORD=your-generated-proton-password
```

**Note:** This is NOT your regular ProtonMail password. It's an app-specific password for SMTP access.

### Alternative: SendGrid (If ProtonMail doesn't work)

1. Create SendGrid account at sendgrid.com
2. Generate API key
3. Modify `server.js` to use SendGrid:

```javascript
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Then use: sgMail.send({ ... })
```

Install SendGrid:
```bash
npm install @sendgrid/mail
```

## Troubleshooting

### "Database connection failed"
- Check `DATABASE_URL` is set correctly
- Ensure PostgreSQL server is running
- On Railway: Check PostgreSQL service is connected and running

### "Email not sending"
- Check `GMAIL_USER` and `GMAIL_PASSWORD` are correct
- Gmail: Verify app-specific password is used (not regular password)
- Check email in `NOTIFY_EMAIL` is valid
- Enable "Less secure apps" if still failing

### "Admin dashboard blank"
- Check `ADMIN_TOKEN` is set and correct
- Open browser DevTools (F12) > Console for errors
- Try incognito window (clears localStorage)

### "Form not submitting"
- Check `/api/leads` endpoint is responding (test in Postman)
- Check browser console for errors
- Ensure database is running and connected

## File Structure

```
loadline-fitness/
├── index.html              # Landing page with embedded form
├── admin.html              # Admin dashboard
├── styles.css              # Styles for landing page
├── server.js               # Node.js + Express backend
├── package.json            # Dependencies
├── .env.example            # Environment variables template
├── .env                    # (not in git) Your actual env vars
├── .gitignore              # Ignore node_modules, .env, etc.
├── assets/                 # Images
│   ├── loadline-fitness-banner.png
│   └── loadline-fitness-logo.jpg
├── Dockerfile              # Docker config for Railway
├── railway.json            # Railway deployment config
└── README.md               # This file
```

## Next Steps / Roadmap

1. **Lead Nurture Campaign**
   - Email sequence for new leads
   - Send assessment questionnaire link
   - Follow-up schedule

2. **Assessment Workflow**
   - Online intake form
   - Multi-domain questionnaire
   - Auto-generate assessment report

3. **Client Portal**
   - Personal LoadLine Green Zone
   - Daily tracking dashboard
   - Coach messaging

4. **Payment Integration**
   - Stripe for LoadLine 30 enrollment
   - Subscription management

## Support

For issues or questions:
- Email: jesse@loadlinefitness.com
- GitHub Issues: https://github.com/noexcusesjesse/LLFLanding/issues

## License

© 2026 LoadLine Fitness. All rights reserved.
