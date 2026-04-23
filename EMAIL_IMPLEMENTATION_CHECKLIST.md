# Email Automation - Implementation Checklist

## ✅ What's Been Done

### Backend Infrastructure
- [x] `email-utils.js` - Complete email module with Nodemailer integration
  - Email templates (newsletter, waitlist, project updates)
  - SMTP/Gmail configuration abstraction
  - Email validation and bulk sending functions
  
- [x] `server.js` - Updated with /api/waitlist endpoint
  - Reads/writes waitlist JSON files
  - Duplicate prevention (email validation)
  - Auto-send confirmation emails
  - Graceful degradation if email fails
  
- [x] Three waitlist JSON storage files
  - `data/waitlist-track-ai.json`
  - `data/waitlist-opendocs.json`
  - `data/waitlist-yc-monitor.json`

### CLI Tools for Automation
- [x] `send-newsletter.js` - Send latest article to all subscribers
  - Reads articles.json (first = latest)
  - Sends to all active subscribers
  - Logs success/failure counts
  
- [x] `send-project-update.js` - Send project updates to waitlists
  - Supports all 3 projects (track-ai, opendocs, yc-monitor)
  - Custom title/message via CLI args
  - Error tracking and reporting

### Frontend Integration
- [x] `waitlist-track-ai.html` - Form updated to call /api/waitlist
- [x] `waitlist-opendocs.html` - Form updated to call /api/waitlist
- [x] `waitlist-yc-monitor.html` - Form updated to call /api/waitlist

All forms now:
- POST email + product to /api/waitlist
- Show "Joining..." during request
- Display success/error feedback
- Clear form on success

### Dependencies
- [x] `package.json` - Added nodemailer ^6.9.4
- [x] npm scripts added:
  - `npm run send-newsletter`
  - `npm run send-update` (shortcut for send-project-update.js)

### Documentation
- [x] `EMAIL_AUTOMATION_SETUP.md` - Full setup & troubleshooting guide
- [x] `EMAIL_QUICK_START.md` - 30-second quick reference

---

## 📋 Setup Steps (For You)

### Step 1: Get Email Credentials
```bash
# Gmail recommended (easiest):
# 1. Go to Gmail account settings
# 2. Enable 2-Factor Authentication
# 3. Generate app-specific password
# 4. Copy the 16-character password
```

### Step 2: Set Environment Variables
```bash
# macOS/Linux:
export GMAIL_USER="your@gmail.com"
export GMAIL_PASS="xxxx xxxx xxxx xxxx"
export EMAIL_FROM="Monika Rajput <your@gmail.com>"

# OR create .env file in project root
```

### Step 3: Install & Test
```bash
npm install    # Install nodemailer
npm start      # Start server
```

### Step 4: Test Waitlist Form
1. Go to http://localhost:3000/waitlist-track-ai.html
2. Enter your email
3. Click "Join Waitlist"
4. Check console for confirmation email logs
5. Verify email in `data/waitlist-track-ai.json`

### Step 5: Send Test Newsletter
```bash
# Add test article to articles.json (must be first):
# {
#   "title": "Test Article",
#   "description": "Testing email automation",
#   "link": "https://example.com"
# }

npm run send-newsletter
# or
node send-newsletter.js
```

### Step 6: Send Test Project Update
```bash
node send-project-update.js track-ai "Test Update" "This is a test email"
```

---

## 🚀 Deployment Checklist

### Before Going Live

- [ ] **Test Email Service**
  - [ ] Confirm GMAIL_USER & GMAIL_PASS work
  - [ ] Send test email manually
  - [ ] Check email lands in inbox (not spam)

- [ ] **Test API Endpoints**
  - [ ] POST to /api/subscribe (newsletter)
  - [ ] POST to /api/waitlist (each product)
  - [ ] Verify JSON files updated
  - [ ] Confirm duplicate prevention works

- [ ] **Test CLI Commands**
  - [ ] `npm run send-newsletter` works
  - [ ] `npm run send-update track-ai "Title" "Message"` works
  - [ ] Check logs are clear and helpful

- [ ] **Test Frontend Forms**
  - [ ] Newsletter form on index.html works
  - [ ] Waitlist forms show proper feedback
  - [ ] Forms work even without email configured

- [ ] **Verify Data**
  - [ ] `cat data/subscribers.json` shows format
  - [ ] `cat data/waitlist-track-ai.json` shows format
  - [ ] No corrupted JSON files

### For Production Deployment

- [ ] Set environment variables on server
  ```bash
  GMAIL_USER=your@gmail.com
  GMAIL_PASS=xxxx xxxx xxxx xxxx
  EMAIL_FROM="Monika Rajput <your@gmail.com>"
  ```

- [ ] Test email sending on production server
  ```bash
  node send-newsletter.js
  ```

- [ ] Set up cron job for scheduled newsletter (optional)
  ```bash
  # Add to crontab:
  0 9 * * 1 cd /path/to/portfolio && node send-newsletter.js
  ```

- [ ] Enable process manager (PM2, systemd, etc.)
  ```bash
  npm install -g pm2
  pm2 start server.js
  ```

- [ ] Backup JSON data files regularly
  ```bash
  # Add backup script or use cloud storage
  ```

---

## 📊 Data Structure Reference

### Newsletter Subscribers (data/subscribers.json)
```json
[
  {
    "email": "user@example.com",
    "subscribedAt": "2026-04-22T18:36:15.117Z",
    "status": "active"
  }
]
```

### Waitlist Members (data/waitlist-track-ai.json)
```json
[
  {
    "email": "user@example.com",
    "joinedAt": "2026-04-22T19:42:30.456Z",
    "status": "active",
    "product": "track-ai"
  }
]
```

### Articles (articles.json)
```json
[
  {
    "title": "Article Title",
    "description": "Short description",
    "link": "https://example.com/article"
  }
]
```

---

## 🔗 API Endpoints

### POST /api/subscribe (Newsletter)
```bash
curl -X POST http://localhost:3000/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

### POST /api/waitlist (Waitlist)
```bash
curl -X POST http://localhost:3000/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","product":"track-ai"}'
```

### GET /api/health (Status Check)
```bash
curl http://localhost:3000/api/health
```

---

## 🧪 Testing Commands

```bash
# Start server with logs
npm start

# Send newsletter (after adding article to articles.json)
npm run send-newsletter

# Send project update
npm run send-update track-ai "Beta Launch!" "We're going live tomorrow!"

# View subscriber data
cat data/subscribers.json | jq '.'

# View waitlist data
cat data/waitlist-track-ai.json | jq '.'

# Count subscribers
wc -l data/subscribers.json

# Pretty-print JSON (requires jq)
cat data/subscribers.json | jq '.'
```

---

## 📺 Email Templates

All templates defined in `email-utils.js`:

### Newsletter Template
- Subject: `📚 New Article: [Title]`
- From: EMAIL_FROM variable
- Body: Article description + read link
- Footer: Unsubscribe option

### Waitlist Confirmation Template
- Subject: `You're in 🚀`
- From: EMAIL_FROM variable
- Body: Thank you + product name + next steps
- Footer: Founder signature

### Project Update Template
- Subject: `Update: [Project] – [Title]`
- From: EMAIL_FROM variable
- Body: Custom message + optional CTA button
- Footer: Founder signature

---

## 🎯 Common Workflows

### Publish New Article & Send Newsletter

```bash
# 1. Write article on your platform
# 2. Add to articles.json (AS FIRST ENTRY):
# {
#   "title": "New Title",
#   "description": "Description",
#   "link": "https://..."
# }

# 3. Send to all subscribers:
npm run send-newsletter

# 4. Check output:
# ✓ Email sent to subscriber1@example.com
# ✓ Email sent to subscriber2@example.com
# ✅ Newsletter sent! (Sent: 2, Failed: 0)
```

### Notify Waitlist of Project Update

```bash
# Update Track.AI:
npm run send-update track-ai "Private Beta Available" "You're invited to try the private beta!"

# Update OpenDocs:
npm run send-update opendocs "New Features Released" "We've added support for Claude 3.5 Sonnet!"

# Update YC Monitor:
npm run send-update yc-monitor "Data Feed Live" "Real-time market data is now available!"
```

### Get Engagement Metrics

```bash
# Count newsletter subscribers:
cat data/subscribers.json | jq length

# Count Track.AI waitlist:
cat data/waitlist-track-ai.json | jq length

# Export to CSV (requires jq):
cat data/subscribers.json | jq -r '.[] | [.email, .subscribedAt] | @csv' > subscribers.csv
```

---

## 🔒 Security Notes

✅ **What's Protected:**
- Emails validated before saving
- Duplicates prevented automatically
- Email credentials in env variables (not in code)
- JSON files are local (not exposed via API)

⚠️ **What to Watch:**
- Keep GMAIL_PASS in environment only (not in .env file in git)
- Don't commit credentials to version control
- Use app-specific password for Gmail (not main password)
- Implement rate limiting for /api/subscribe & /api/waitlist if needed

---

## 📞 Support & Troubleshooting

### Email Not Sending

```bash
# Check 1: Credentials set?
echo $GMAIL_USER
echo $GMAIL_PASS

# Check 2: Connection working?
npm start  # Check console for errors

# Check 3: Gmail 2FA enabled?
# Gmail Settings → Security → 2-Step Verification → App Passwords
```

### Duplicates Appearing

They shouldn't! System checks email before saving. If you see duplicates:
1. Check data files for formatting issues
2. Manually remove if needed: `cat data/subscribers.json | grep -v "duplicate@email.com" > temp && mv temp data/subscribers.json`

### SMTP Errors

```bash
# Test SMTP connection manually
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});
transporter.verify((err, success) => {
  if (err) console.log('Error:', err);
  else console.log('Connected!');
});
"
```

---

## ✨ Next Steps

1. **Test everything locally** (this checklist)
2. **Deploy to production** with environment variables
3. **Monitor email delivery** (check spam folders)
4. **Scale as needed** (switch to SendGrid/Resend for higher volume)
5. **Add unsubscribe page** (currently not implemented)

---

**Your email automation is ready to go!** 🎉

See EMAIL_QUICK_START.md for fast reference.
See EMAIL_AUTOMATION_SETUP.md for detailed docs.
