# ProtonMail SMTP Setup for LoadLine Fitness

## Get Your ProtonMail App Password (5 minutes)

### Step 1: Log Into ProtonMail
- Go to https://protonmail.com and log in with your account

### Step 2: Open Settings
- Click **Settings** (gear icon, top right)
- Click **"Accounts"** in sidebar

### Step 3: Generate SMTP Password
- Look for **"Other mail services"** or **"IMAP/SMTP"** section
- Click **"Generate new password"** (or "Create password")
- ProtonMail generates a 24-character password
- **Copy it** (you'll need this in 1 minute)

**Example generated password:** `abcd1234efgh5678ijkl9012`

### Step 4: Add to Railway

1. Open your Railway project: https://railway.app
2. Go to **Variables** tab
3. Add two new variables:

| Name | Value |
|------|-------|
| `PROTON_EMAIL` | your-email@protonmail.com |
| `PROTON_PASSWORD` | abcd1234efgh5678ijkl9012 |

4. Click **Save** (or it auto-saves)
5. Railway auto-redeploys (takes ~1-2 minutes)

### Step 5: Test It

1. Visit https://www.loadlinefitness.com
2. Scroll to "GET IN TOUCH"
3. Fill form and click "Send My Request"
4. **Check your inbox** for the lead notification email

---

## ✅ You're Done!

Your site now:
- ✅ Captures leads in database
- ✅ Sends you email notifications via ProtonMail
- ✅ Admin dashboard at `/admin` to manage leads

---

## Troubleshooting

### "Email not sending" error in Railway logs
- Verify `PROTON_PASSWORD` is the **app password**, not your regular password
- Make sure you copied the **entire** password (24 characters)
- Check `PROTON_EMAIL` matches your ProtonMail account exactly

### "Invalid credentials" in logs
- Go back to ProtonMail Settings > Other mail services
- Generate a **new** password (the old one might be wrong)
- Update `PROTON_PASSWORD` in Railway with the new one

### Not receiving notification emails
- Check spam/junk folder
- Verify `NOTIFY_EMAIL` variable is set correctly in Railway
- Check that email address actually exists

---

Still need help? See README-LEAD-SYSTEM.md for full API documentation.
