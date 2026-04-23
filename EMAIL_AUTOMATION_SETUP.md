# Email Automation Setup Guide

## Overview

Your portfolio now has lightweight email automation using Node.js and Nodemailer. All data is stored in JSON files.

## System Architecture

```
subscribers.json          → Newsletter subscribers
data/
  ├── waitlist-track-ai.json
  ├── waitlist-opendocs.json
  └── waitlist-yc-monitor.json
articles.json            → Your articles (provides latest article link)

server.js               → Express backend with API endpoints
email-utils.js         → Email templates & sending functions
send-newsletter.js     → CLI script to send newsletter email
send-project-update.js → CLI script to send project updates
```

## Installation

### 1. Install Dependencies

```bash
npm install
```

This installs:
- `express` - Web server (already had)
- `cors` - Cross-origin support (already had)
- `body-parser` - JSON parser (already had)
- `nodemailer` - Email sending (NEW)

### 2. Configure Email Service

Choose ONE of these options:

#### Option A: Gmail (Simplest for testing)

1. **Gmail Account Setup**
   - Use your existing Gmail account
   - Enable 2-Factor Authentication in Gmail settings
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" + "macOS" (or your device)
   - Generate app-specific password (16 characters)

2. **Set Environment Variables**

   **macOS / Linux:**
   ```bash
   export GMAIL_USER="your.email@gmail.com"
   export GMAIL_PASS="xxxx xxxx xxxx xxxx"  # 16-char app password
   ```

   **Windows (PowerShell):**
   ```powershell
   $env:GMAIL_USER="your.email@gmail.com"
   $env:GMAIL_PASS="xxxx xxxx xxxx xxxx"
   ```

   Or create `.env` file (if you use dotenv library):
   ```
   GMAIL_USER=your.email@gmail.com
   GMAIL_PASS=xxxx xxxx xxxx xxxx
   ```

3. **FROM Address**
   ```bash
   export EMAIL_FROM="Monika Rajput <your.email@gmail.com>"
   ```

#### Option B: SMTP (SendGrid, Mailgun, etc.)

```bash
export SMTP_HOST="smtp.sendgrid.net"
export SMTP_PORT="587"
export SMTP_USER="apikey"
export SMTP_PASS="SG.xxxxx..."
export SMTP_SECURE="false"
export EMAIL_FROM="Monika <noreply@monikarajput.com>"
```

#### Option C: Use Resend API (Modern, Clean)

```bash
npm install resend
```

Then modify `email-utils.js` to use Resend instead of Nodemailer.

## Usage

### Start Server

```bash
npm start
# or
node server.js
```

Server runs on `http://localhost:3000`

### Send Newsletter to All Subscribers

When you publish a new article:

1. Add it to [articles.json](articles.json) (first item is latest)
2. Run:

```bash
node send-newsletter.js
```

**Output:**
```
📧 Sending newsletter...

Found 2 active subscribers

📚 Latest Article: "How to Build Scalable AI Apps"
🔗 Link: https://example.com/article

✓ Email sent to subscriber1@example.com
✓ Email sent to subscriber2@example.com

✅ Newsletter sent!
   Sent: 2
   Failed: 0
```

### Send Project Update to Waitlist

When you update a project, notify waitlist members:

```bash
node send-project-update.js track-ai "We're Launching!" "Track.AI launches next week with full feature support."
```

**For each project:**
```bash
# Track.AI
node send-project-update.js track-ai "Title" "Message"

# OpenDocs MCP Server
node send-project-update.js opendocs "Title" "Message"

# YC Startup API Monitor
node send-project-update.js yc-monitor "Title" "Message"
```

**Example with CTA button:**
```bash
node send-project-update.js track-ai "Beta Access Available" "You're invited to join our private beta! Click below to get started."
```

### View Subscriber Data

#### Newsletter Subscribers

```bash
cat data/subscribers.json
```

Format:
```json
[
  {
    "email": "user@example.com",
    "subscribedAt": "2026-04-22T18:36:15.117Z",
    "status": "active"
  }
]
```

#### Waitlist Members

```bash
cat data/waitlist-track-ai.json
```

Format:
```json
[
  {
    "email": "user@example.com",
    "joinedAt": "2026-04-22T18:36:15.117Z",
    "status": "active",
    "product": "track-ai"
  }
]
```

## API Endpoints

### Newsletter Signup

**POST** `/api/subscribe`

```javascript
fetch('/api/subscribe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com'
  })
})
.then(r => r.json())
.then(data => console.log(data))
```

**Response (Success):**
```json
{
  "message": "Thank you for subscribing! You will receive updates soon.",
  "success": true
}
```

**Response (Already subscribed):**
```json
{
  "error": "This email is already subscribed",
  "message": "You are already subscribed to our newsletter!"
}
```

### Waitlist Signup

**POST** `/api/waitlist`

```javascript
fetch('/api/waitlist', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    product: 'track-ai'  // or 'opendocs' or 'yc-monitor'
  })
})
.then(r => r.json())
.then(data => console.log(data))
```

**Products:**
- `track-ai` → Track.AI
- `opendocs` → OpenDocs MCP Server  
- `yc-monitor` → YC Startup API Monitor

**Response (Success):**
```json
{
  "message": "Thank you for joining the waitlist for Track.AI!",
  "success": true
}
```

Confirmation email is automatically sent on successful join!

### Health Check

**GET** `/api/health`

```bash
curl http://localhost:3000/api/health
```

## Email Templates

All templates are in `email-utils.js`:

### Newsletter Template
- Subject: `📚 New Article: [Title]`
- Includes: Article title, description, Read link, founder tone
- Unsubscribe footer

### Waitlist Confirmation Template
- Subject: `You're in 🚀`
- Message: Personalized thanks, project name, next steps
- Founder signature

### Project Update Template
- Subject: `Update: [Project] – [Title]`
- Includes: Update message, optional CTA button
- Founder signature

## Monitoring & Logs

### View Server Logs

```bash
# Server logs show new subscriptions
npm start
```

Output:
```
New subscriber added: user@example.com
New waitlist member added for Track.AI: user@example.com
✓ Email sent to user@example.com
```

### Check Data Files

```bash
# Count newsletter subscribers
wc -l data/subscribers.json

# Count waitlist members per project
wc -l data/waitlist-*.json
```

## Database Data Format

### subscribers.json

Email + timestamp tracking:
```json
[
  {
    "email": "founder@company.com",
    "subscribedAt": "2026-04-22T18:36:15.117Z",
    "status": "active"
  }
]
```

### waitlist-*.json

Waitlist tracking:
```json
[
  {
    "email": "builder@company.com",
    "joinedAt": "2026-04-22T19:42:30.456Z",
    "status": "active",
    "product": "track-ai"
  }
]
```

## Production Deployment

### Railway / Heroku

```bash
# Set environment variables in dashboard
GMAIL_USER=your@gmail.com
GMAIL_PASS=xxxx xxxx xxxx xxxx
EMAIL_FROM="Monika Rajput <your@gmail.com>"

npm start
```

### Self-hosted (VPS)

```bash
# Create .env file
echo "GMAIL_USER=your@gmail.com" > .env
echo "GMAIL_PASS=xxxx xxxx xxxx xxxx" >> .env
echo "EMAIL_FROM=Monika <your@gmail.com>" >> .env

# Make scripts executable
chmod +x send-newsletter.js
chmod +x send-project-update.js

# Start server
npm start

# Run in background with PM2
pm2 start server.js
```

### Automated Scheduled Sends (Cron)

```bash
# Add to crontab
# Run newsletter every Monday at 9 AM
0 9 * * 1 cd /path/to/portfolio && node send-newsletter.js

# Check cron:
crontab -l
```

## Troubleshooting

### Email Not Sending

**Check 1:** Is email service configured?
```bash
echo $GMAIL_USER
echo $GMAIL_PASS
```

**Check 2:** Are credentials correct?
- Gmail: Try sending test email manually first
- SMTP: Verify host/port with email provider

**Check 3:** Check for errors:
```bash
# Run with verbose logging
node send-newsletter.js
```

### Duplicate Subscribers

The system prevents duplicates automatically:
- Checks lowercase email before saving
- Returns 409 error if already exists
- Data is never overwritten

### Email Authentication Issues

**Gmail fix:**
1. Enable 2FA in Gmail account settings
2. Generate NEW app password (don't reuse old)
3. Use the 16-character password (spaces included)

**SMTP fix:**
1. Test credentials with manual SMTP check:
```bash
# Use telnet to test SMTP connection
telnet smtp.sendgrid.net 587
```

## Next Steps

1. **Configure email service** (Gmail recommended for testing)
2. **Test newsletter send**: `node send-newsletter.js`
3. **Test waitlist signup**: Join from waitlist-track-ai.html
4. **Deploy to production** with environment variables set
5. **Add unsubscribe page** (currently routes to generic endpoint)

## API Reference

See `email-utils.js` for:
- `sendEmail(to, subject, html)` - Send single email
- `sendBulkEmails(recipients, subject, html)` - Send batch
- `getNewsletterTemplate(article)` - Newsletter email template
- `getWaitlistTemplate(projectName)` - Waitlist confirmation template
- `getProjectUpdateTemplate(projectName, update)` - Project update template
- `isValidEmail(email)` - Email validation

## Support

For issues:
1. Check console output: `npm start`
2. Verify JSON files are valid: `cat data/subscribers.json`
3. Test email service separately
4. Check email provider's rate limits

---

**Setup complete! Your portfolio now has email automation.** 🚀

Email questions? Check `email-utils.js` for implementation details.
