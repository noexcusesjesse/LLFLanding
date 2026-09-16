# LoadLine Fitness — Quick Start Checklist

## ✅ What's Done
- [x] Contact form added to landing page
- [x] Backend API deployed to Railway
- [x] Node.js server handling submissions
- [x] Admin dashboard at `/admin`
- [x] All code pushed to GitHub
- [x] Railway auto-deploys on every push

## 🚀 What You Need to Do (15 minutes)

### [ ] 1. Get ProtonMail App Password (5 min)
**Why:** Allows Railway to send you email notifications

1. Go to https://protonmail.com → **Settings → Accounts**
2. Find **"Other mail services"** or **"IMAP/SMTP"**
3. Click **"Generate new password"**
4. **Copy the 24-character password** (you'll use this next)

### [ ] 2. Set Up Railway PostgreSQL (3 min)
**Why:** Stores all lead submissions

1. Go to https://railway.app
2. Open your LoadLine Fitness project
3. Click **"+ Create"** → Select **"PostgreSQL"**
4. Wait 1-2 minutes for database to initialize
5. ✅ `DATABASE_URL` is auto-set (you don't need to do anything)

### [ ] 3. Add Environment Variables (5 min)
**Why:** Connects email, database, and authentication

1. In Railway, click **Variables** tab
2. Add these 5 variables:

```
PROTON_EMAIL          → your-email@protonmail.com
PROTON_PASSWORD       → (paste the 24-char password from step 1)
NOTIFY_EMAIL          → jesse@loadlinefitness.com
ADMIN_TOKEN           → (pick any secure password, e.g., "MySecure123!")
DASHBOARD_URL         → https://www.loadlinefitness.com
```

3. Click **Save** (or auto-saves)
4. Wait 30 seconds for Railway to redeploy

### [ ] 4. Test Everything (2 min)
**Why:** Verify the system works end-to-end

1. **Visit your site:**
   - https://www.loadlinefitness.com

2. **Fill the contact form** (scroll to "GET IN TOUCH")
   - Name: Your Name
   - Email: your-email@example.com
   - Phone: 555-1234
   - Message: Testing the form

3. **Click "Send My Request"**
   - Should show green "✓ Thank you" message

4. **Check your email:**
   - (jesse@loadlinefitness.com or NOTIFY_EMAIL)
   - Should receive notification with lead details

5. **Test admin dashboard:**
   - Go to https://www.loadlinefitness.com/admin
   - Enter `ADMIN_TOKEN` (the one you created in step 3)
   - Should see your test lead in the table

---

## 📊 After Setup — What You Have

✅ **Contact form** captures name, email, phone, message  
✅ **Database** stores all submissions with status tracking  
✅ **Email notifications** sent to you on every lead  
✅ **Admin dashboard** to view, filter, and manage leads  
✅ **Auto-deployment** → push GitHub changes → live in 2 minutes  

---

## 🔗 Quick Links

- **Site:** https://www.loadlinefitness.com
- **Admin Dashboard:** https://www.loadlinefitness.com/admin
- **GitHub Repo:** https://github.com/noexcusesjesse/LLFLanding
- **Railway:** https://railway.app
- **ProtonMail:** https://protonmail.com

---

## 📧 Still Need Help?

**ProtonMail password issue?**
- See `PROTONMAIL-SETUP.md` in GitHub repo

**Railway setup questions?**
- See `DEPLOYMENT-CHECKLIST.md` in GitHub repo

**API documentation?**
- See `README-LEAD-SYSTEM.md` in GitHub repo

---

**Questions?** Email: jesse@loadlinefitness.com
