# ✅ LoadLine Fitness — UPDATED Setup (SendGrid Instead of ProtonMail)

**Good news:** You can't use ProtonMail Free for SMTP, but **SendGrid is better anyway** — it's free, reliable, and made for this exact use case.

---

## What Changed

❌ **Old:** ProtonMail SMTP (requires ProtonMail Plus = $48/year)  
✅ **New:** SendGrid API (free tier = 100 emails/day, no upgrade needed)

**Everything else:** Stays the same. Same form. Same dashboard. Same database.

---

## New Setup (10 minutes total)

### Step 1: Create SendGrid Account (3 min)

1. Go to **https://sendgrid.com**
2. Click **"Sign Up"** (top right)
3. Create account (email + password)
4. **Verify your email** (check inbox for confirmation link)

### Step 2: Get API Key (2 min)

1. Log into SendGrid
2. Go to **Settings** (left sidebar) → **API Keys**
3. Click **"Create API Key"** (blue button)
4. Name it: `LoadLine Fitness`
5. Click **"Create & Verify"**
6. **COPY THE KEY** (looks like: `SG.abcd1234efgh5678...`)

### Step 3: Verify Sender Email (2 min)

1. Still in SendGrid
2. Go to **Settings** → **Sender Authentication**
3. Click **"Verify a Single Sender"**
4. Fill in:
   - From Email: `noreply@loadlinefitness.com`
   - From Name: `LoadLine Fitness`
5. Click **"Create"**
6. SendGrid sends verification email → **click the link in your inbox**

### Step 4: Add to Railway (3 min)

1. Go to https://railway.app
2. Open LoadLine Fitness project
3. Click **"Variables"** tab
4. Add 5 variables:

```
SENDGRID_API_KEY       → SG.abcd1234efgh5678ijkl9012
SENDGRID_FROM_EMAIL    → noreply@loadlinefitness.com
NOTIFY_EMAIL           → jesse@loadlinefitness.com
ADMIN_TOKEN            → any-secure-password
DASHBOARD_URL          → https://www.loadlinefitness.com
```

5. Save → Railway auto-redeploys (30 sec)

### Done! ✅

Your site now:
- ✅ Captures leads on contact form
- ✅ Saves to database
- ✅ Sends email notifications via SendGrid
- ✅ Admin dashboard works at `/admin`

---

## Test It (1 minute)

1. Visit **https://www.loadlinefitness.com**
2. Scroll to **"GET IN TOUCH"**
3. Fill form + submit
4. Check your inbox for notification email
5. Go to **https://www.loadlinefitness.com/admin** (log in with ADMIN_TOKEN)
6. See your lead in the dashboard

---

## Why SendGrid is Better

| Feature | ProtonMail Free | SendGrid Free |
|---------|-----------------|---------------|
| Email limit | ❌ No SMTP access | ✅ 100/day free |
| Cost | $48/year (Plus) | $0 (free tier) |
| Reliability | Good | Excellent |
| Setup | Complex | 5 minutes |
| Upgrades | Limited | Seamless (pay as you grow) |

---

## Documentation Updated

- `SENDGRID-SETUP.md` — Step-by-step SendGrid guide
- `QUICK-START.md` — Updated checklist
- `DEPLOYMENT-CHECKLIST.md` — Updated Railway steps
- `README-LEAD-SYSTEM.md` — Updated email section
- All files in your GitHub repo

---

## Summary

**Old plan:** ProtonMail (blocked by account limitation)  
**New plan:** SendGrid (free, better, faster)  
**Result:** Same system, better setup  

**Status:** 🟢 Ready to deploy (10 minutes)

---

**Next step:** Follow QUICK-START.md checklist above.
