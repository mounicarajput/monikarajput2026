# Email Automation - Quick Start

## 30-Second Setup

### 1. Install Nodemailer
```bash
npm install
```

### 2. Configure Gmail (Easiest)
```bash
# Gmail Settings → Security → App Passwords (generate 16-char password)
export GMAIL_USER="your@gmail.com"
export GMAIL_PASS="xxxx xxxx xxxx xxxx"
export EMAIL_FROM="Monika Rajput <your@gmail.com>"
```

### 3. Start Server
```bash
npm start
```

### 4. Send Newsletter
```bash
# Add new article to articles.json (must be first entry)
node send-newsletter.js
```

### 5. Send Project Update
```bash
node send-project-update.js track-ai "Title" "Message"
```

---

## Waitlist Automation (Built-In)

When someone joins a waitlist on the website:
1. ✅ Email is saved to `data/waitlist-*.json`
2. ✅ Confirmation email sent automatically
3. ✅ Duplicates prevented automatically

---

## Files Created

```
email-utils.js                    ← Email templates & functions
send-newsletter.js               ← Send latest article to all
send-project-update.js           ← Send project updates
data/waitlist-track-ai.json      ← Track.AI waitlist
data/waitlist-opendocs.json      ← OpenDocs waitlist
data/waitlist-yc-monitor.json    ← YC Monitor waitlist
EMAIL_AUTOMATION_SETUP.md        ← Full documentation
```

---

## Command Reference

| Task | Command |
|------|---------|
| Start server | `npm start` |
| Send newsletter | `node send-newsletter.js` |
| Update Track.AI | `node send-project-update.js track-ai "Title" "Message"` |
| Update OpenDocs | `node send-project-update.js opendocs "Title" "Message"` |
| Update YC Monitor | `node send-project-update.js yc-monitor "Title" "Message"` |
| View newsletter subscribers | `cat data/subscribers.json` |
| View Track.AI waitlist | `cat data/waitlist-track-ai.json` |

---

## Email Service Options

### Gmail (Recommended - Free, Simple)
- No setup fee
- 2FA required
- App-specific password needed
- Works globally

### SendGrid
- 100 free emails/day
- Better for production
- `SMTP_HOST=smtp.sendgrid.net`

### Resend
- Developer-friendly
- Clean API
- Modern alternative

---

## How It Works

### Newsletter Flow
```
articles.json (latest article)
         ↓
    node send-newsletter.js
         ↓
   Loop through subscribers
         ↓
   Send email with article link
         ↓
   Log results
```

### Waitlist Flow
```
User visits waitlist-track-ai.html
         ↓
  Fills email form
         ↓
  Form submits to /api/waitlist
         ↓
  Email saved to waitlist-track-ai.json
         ↓
  Confirmation email sent automatically
         ↓
  Success message shown
```

---

## Tips

✅ **Newsletter:** Always add article to articles.json FIRST entry  
✅ **Duplicates:** System prevents same email joining twice  
✅ **Email Format:** Validate before sending (done automatically)  
✅ **Logs:** Watch console output for success/failures  
✅ **Testing:** Use your own email first to test  

---

## Troubleshooting

**"Email service not configured"**
→ Set GMAIL_USER & GMAIL_PASS environment variables

**"Failed to send email"**
→ Check credentials, ensure GMAIL_USER account has 2FA enabled

**"Duplicate emails"**
→ System automatically prevents duplicates

**Need help?**
→ See EMAIL_AUTOMATION_SETUP.md for full documentation

---

**That's it! Your portfolio now sends emails automatically.** 🚀
