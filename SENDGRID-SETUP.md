# SendGrid Setup — Free Email for LoadLine Fitness

## Why SendGrid?

- **Free tier:** 100 emails/day (perfect for a growing business)
- **Reliable:** Industry-standard email service
- **No account limitations** (unlike ProtonMail Free which doesn't support SMTP)
- **Simple API:** Just copy your API key

---

## Get Your SendGrid API Key (3 minutes)

### Step 1: Create SendGrid Account
1. Go to **https://sendgrid.com** 
2. Click **"Sign Up"** (top right)
3. Fill in:
   - Email: your-email@example.com
   - Name: Your Name
   - Password: Create secure password
4. Click **"Create Account"**
5. Verify your email (check inbox)

### Step 2: Create API Key
1. Log in to SendGrid dashboard
2. Go to **Settings** (left sidebar) → **API Keys**
3. Click **"Create API Key"** (blue button)
4. Name it: `LoadLine Fitness`
5. Permissions: Select **"Full Access"** (default)
6. Click **"Create & Verify"**
7. **COPY THE API KEY** (looks like: `SG.abcd1234efgh5678...`)

**Important:** SaveGrid only shows this key once. Copy it immediately!

### Step 3: Verify Your Email (Sender)
1. Still in SendGrid dashboard
2. Go to **Settings** → **Sender Authentication**
3. Click **"Verify a Single Sender"** (blue button)
4. Fill in:
   - From Email: `noreply@loadlinefitness.com`
   - From Name: `LoadLine Fitness`
5. Click **"Create"**
6. SendGrid sends verification email to your inbox
7. Click the link in the email to verify

---

## Add to Railway (2 minutes)

1. Open your Railway project: https://railway.app
2. Go to **Variables** tab
3. Add these variables:

| Name | Value |
|------|-------|
| `SENDGRID_API_KEY` | SG.abcd1234efgh5678... |
| `SENDGRID_FROM_EMAIL` | noreply@loadlinefitness.com |
| `NOTIFY_EMAIL` | jesse@loadlinefitness.com |
| `ADMIN_TOKEN` | any-secure-password |
| `DASHBOARD_URL` | https://www.loadlinefitness.com |

4. Click **Save** (or auto-saves)
5. Wait 30 seconds for Railway to redeploy

---

## Test It (2 minutes)

1. Visit https://www.loadlinefitness.com
2. Scroll to "GET IN TOUCH"
3. Fill form + submit
4. **Check your inbox** (NOTIFY_EMAIL)
5. Should receive lead notification from `noreply@loadlinefitness.com`

---

## Troubleshooting

### Email not received
- Verify `SENDGRID_API_KEY` is copied exactly (no spaces)
- Check that you completed the **"Verify a Single Sender"** step
- Check spam folder
- Wait 2-3 minutes and try again

### "Invalid API Key" error in Railway logs
- Copy the API key again from SendGrid (must be exact)
- Go to SendGrid → Settings → API Keys
- Create a new key if unsure

### Emails going to spam
- Add SPF & DKIM records (advanced, optional)
- For now, emails should work fine for testing

---

## Free Tier Limits

- **100 emails/day** (plenty for early stage)
- **$0** (free forever, no card required... actually wait, may need card for verification)
- Easy upgrade later if you hit limits

---

## Next Steps

After testing, you have:
- ✅ Contact form captures leads
- ✅ Email notifications sent  
- ✅ Admin dashboard at `/admin`
- ✅ All leads stored in database

Your lead management system is **live and converting** visitors!

---

**Questions?** See README-LEAD-SYSTEM.md for full API documentation.
