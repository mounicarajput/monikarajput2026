# Email Automation - Troubleshooting Guide

Quick solutions for common problems.

---

## 🔴 Common Issues

### Issue: "Email service not configured"

**What it means:** Environment variables for email not set

**Solutions:**

**Option 1: Gmail Setup (Recommended)**
```bash
# 1. Go to Gmail settings
# 2. Enable 2-Factor Authentication
# 3. Generate app-specific password
# 4. Set environment variables:

export GMAIL_USER="your@gmail.com"
export GMAIL_PASS="xxxx xxxx xxxx xxxx"  # 16-char password
export EMAIL_FROM="Monika Rajput <your@gmail.com>"

# 5. Verify:
echo $GMAIL_USER
# Should print: your@gmail.com
```

**Option 2: SMTP (SendGrid, Mailgun, etc.)**
```bash
export SMTP_HOST="smtp.sendgrid.net"
export SMTP_PORT="587"
export SMTP_USER="apikey"
export SMTP_PASS="SG.xxxxx..."
export SMTP_SECURE="false"
export EMAIL_FROM="Monika <your@example.com>"
```

**Option 3: Check if Already Set**
```bash
# See all environment variables:
env | grep GMAIL
env | grep SMTP

# If nothing prints, they're not set!
```

---

### Issue: "Failed to send email" or Email Not Received

**What it means:** Email authentication or delivery failed

**Check 1: Credentials Valid?**
```bash
# Are your GMAIL_USER and GMAIL_PASS correct?
# Try sending test email from Gmail manually first

# For Gmail: Open Gmail → Click gear → Settings
# Scroll to "Forwarding and POP/IMAP"
# Make sure IMAP is enabled
```

**Check 2: Gmail 2FA Enabled?**
```bash
# If Gmail login works but email doesn't send:
# 1. Gmail Settings → Security
# 2. Enable 2-Step Verification (if not already)
# 3. Go to App Passwords
# 4. Select "Mail" + your device type
# 5. Generate NEW password
# 6. Update GMAIL_PASS with new password
```

**Check 3: Check Spam Folder**
```bash
# Email might be in spam!
# Gmail → More → Spam
# Mark as "Not spam" if found there
```

**Check 4: FROM Address Valid?**
```bash
# EMAIL_FROM should be a real email address
# ❌ Bad: EMAIL_FROM="Monika"
# ✅ Good: EMAIL_FROM="Monika <your@gmail.com>"
# ✅ Good: EMAIL_FROM="your@gmail.com"
```

**Check 5: Test Connection**
```bash
# Test SMTP connection manually:
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
  if (err) console.log('❌ Error:', err.message);
  else console.log('✅ Connected!');
});
"
```

---

### Issue: Duplicates in Subscriber List

**What it means:** Same email appears multiple times

**Why it happens:** Usually data file corruption or manual edits

**Prevent It:**
```bash
# System automatically prevents duplicates!
# Check is case-insensitive
# If you see duplicates, file was manually edited
```

**Fix It:**
```bash
# Remove duplicates from data/subscribers.json
# Using cat with uniq (case-insensitive):

cat data/subscribers.json | jq -c '.[] | .email' | \
sort | uniq -i | while read email; do
  jq --arg e "$email" '.[] | select(.email == $e)' data/subscribers.json
done | jq -s '.' > data/subscribers.json.dedup

# Verify it looks good:
cat data/subscribers.json.dedup | jq '.'

# If good, replace original:
mv data/subscribers.json.dedup data/subscribers.json
```

---

### Issue: JSON File Corrupted

**What it means:** JSON file has invalid syntax

**Detect It:**
```bash
# Try to read the file:
cat data/subscribers.json | jq '.'

# If error like "invalid JSON", file is corrupted
```

**Fix It:**
```bash
# Backup original (just in case):
cp data/subscribers.json data/subscribers.json.backup

# Restore from backup if you have one, or
# Create new empty file:
echo '[]' > data/subscribers.json

# If you have email backup, restore it:
# (You'll need to have backed up emails previously)
```

**Prevent It:**
```bash
# Never manually edit JSON files!
# Use proper tools (jq, VS Code JSON editor)
# Or restore from backups regularly
```

---

### Issue: Server Won't Start

**What it means:** Node server failing to launch

**Check 1: Port Already in Use**
```bash
# Is port 3000 already in use?
lsof -i :3000

# If something is using it, kill it:
kill -9 <PID>

# Or use different port:
PORT=3001 npm start
```

**Check 2: Dependencies Missing**
```bash
# Install dependencies:
npm install

# Check if nodemailer installed:
npm list nodemailer

# If not installed:
npm install nodemailer
```

**Check 3: Syntax Error in Code**
```bash
# Check for typos in server.js or email-utils.js
# Run with verbose output:
node server.js

# Look for error line numbers and fix
```

**Check 4: File Permissions**
```bash
# Make sure files are readable:
ls -la server.js email-utils.js

# If permissions wrong (macOS/Linux):
chmod 644 server.js email-utils.js
chmod 755 send-newsletter.js send-project-update.js
```

---

### Issue: Newsletter Not Sending

**What it means:** npm run send-newsletter didn't work

**Check 1: Articles File Empty?**
```bash
# Check articles.json exists and has content:
cat articles.json | jq '.'

# Should show at least one article:
# [
#   {
#     "title": "...",
#     "description": "...",
#     "link": "..."
#   }
# ]
```

**Check 2: No Subscribers**
```bash
# Check if anyone is subscribed:
cat data/subscribers.json | jq '.'

# Should show at least one subscriber
# If empty: manually add subscriber for testing

# Manual test - add subscriber to JSON:
echo '[{"email":"test@example.com","subscribedAt":"2026-04-22T00:00:00Z","status":"active"}]' > data/subscribers.json
```

**Check 3: Email Config Not Set**
```bash
# Make sure email is configured:
echo $GMAIL_USER
echo $GMAIL_PASS

# If empty, set them:
export GMAIL_USER="your@gmail.com"
export GMAIL_PASS="xxxx xxxx xxxx xxxx"
```

**Check 4: Run With Debug Output**
```bash
# Run send-newsletter with full output:
node send-newsletter.js

# Look for error messages
# Common: ENOENT (file not found), SMTP errors, etc.
```

---

### Issue: Waitlist Form Shows Error

**What it means:** Form submission failed with error message

**Check 1: Server Running?**
```bash
# Is server running on port 3000?
curl http://localhost:3000/api/health

# Should return: {"status":"ok"}
# If fails: npm start (in another terminal)
```

**Check 2: Email Already Registered?**
```bash
# Error message says "Already subscribed"?
# That means this email already joined this waitlist

# Check data file:
cat data/waitlist-track-ai.json | grep "your-email@example.com"

# To reset for testing, remove email from JSON or
# Delete the entire JSON and recreate:
echo '[]' > data/waitlist-track-ai.json
```

**Check 3: Invalid Email**
```bash
# Email format wrong?
# ❌ Bad: "email" (missing @)
# ❌ Bad: "email@" (missing domain)
# ❌ Bad: "email @example.com" (space)
# ✅ Good: "email@example.com"

# Try with valid email format
```

**Check 4: Browser Console Errors**
```bash
# Press F12 in browser → Console tab
# Look for JavaScript errors
# Common: CORS error, Network error, etc.

# If CORS error:
# Check server.js has cors() enabled
# Should see: const cors = require('cors');
#            app.use(cors());
```

---

### Issue: Email Service Timeout

**What it means:** Email server not responding

**Why It Happens:**
- Internet connection down
- SMTP server down (rare)
- Firewall blocking port 587

**Solutions:**
```bash
# Check internet:
ping google.com

# Check SMTP port open (macOS/Linux):
telnet smtp.gmail.com 587

# If hangs, firewall might block it
# Contact network admin or use different port

# Try port 465 (secure):
export SMTP_PORT="465"
export SMTP_SECURE="true"
npm start
```

---

### Issue: "ENOENT: no such file or directory"

**What it means:** File or directory doesn't exist

**Common Causes:**
```bash
# articles.json missing?
ls articles.json

# data/ directory missing?
ls -la data/

# Create missing directory:
mkdir -p data

# Create empty files if needed:
echo '[]' > articles.json
echo '[]' > data/subscribers.json
```

---

### Issue: Wrong Data in JSON Files

**What it means:** JSON shows unexpected content

**Inspect It:**
```bash
# Pretty print to see structure:
cat data/subscribers.json | jq '.'

# Count entries:
cat data/subscribers.json | jq 'length'

# Find specific email:
cat data/subscribers.json | jq '.[] | select(.email == "test@example.com")'

# Get all emails (one per line):
cat data/subscribers.json | jq -r '.[] | .email'
```

**Fix It:**
```bash
# Remove specific entry:
cat data/subscribers.json | \
  jq 'map(select(.email != "unwanted@example.com"))' \
  > data/subscribers.json.new
mv data/subscribers.json.new data/subscribers.json

# Clear entire file (start fresh):
echo '[]' > data/subscribers.json
```

---

## 🧪 Testing Commands

Run these to verify everything works:

```bash
# 1. Check server running
curl http://localhost:3000/api/health
# Should return: {"status":"ok"}

# 2. Test newsletter send
npm run send-newsletter
# Should show: "✅ Newsletter sent!"

# 3. Test waitlist save
curl -X POST http://localhost:3000/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","product":"track-ai"}'
# Should return: {"success":true}

# 4. Verify data saved
cat data/waitlist-track-ai.json | jq '.'
# Should show your test email
```

---

## 📋 Debugging Checklist

When something doesn't work:

- [ ] Server running? `npm start` in one terminal
- [ ] Ports free? `lsof -i :3000` (should be empty)
- [ ] Email configured? `echo $GMAIL_USER` (should print email)
- [ ] Dependencies installed? `npm list` (should show all packages)
- [ ] JSON files valid? `cat data/*.json | jq '.'` (no errors)
- [ ] Network working? `ping google.com` (should respond)
- [ ] Email credentials correct? Test manually in Gmail
- [ ] 2FA enabled for Gmail? Check Gmail settings
- [ ] Form values correct? Check browser console (F12)
- [ ] API endpoint working? `curl http://localhost:3000/api/health`

---

## 🔍 Advanced Debugging

### View Full Error Details

```bash
# Run send-newsletter with debugging:
NODE_DEBUG=* node send-newsletter.js

# Run server with debugging:
NODE_DEBUG=express,nodemailer npm start
```

### Check Email Headers

```bash
# After email received, check headers in Gmail
# Gmail → Open email → Show original
# Look for:
# - X-Mailer: nodemailer
# - Authentication-Results: PASS
```

### Monitor File Changes

```bash
# Watch data files for changes (macOS):
while true; do
  echo "--- $(date) ---"
  wc -l data/*.json
  sleep 5
done

# Watch data files for changes (Linux):
watch 'wc -l data/*.json'
```

---

## ✅ Verification Checklist

To confirm everything is working:

- [ ] `npm start` - Server starts without errors
- [ ] `curl http://localhost:3000/api/health` - Returns {"status":"ok"}
- [ ] Check `data/subscribers.json` - Shows valid JSON array
- [ ] Check `data/waitlist-track-ai.json` - Shows valid JSON array
- [ ] Visit `http://localhost:3000/waitlist-track-ai.html` - Page loads
- [ ] Submit test email in form - No console errors
- [ ] Check `data/waitlist-track-ai.json` - Email was saved
- [ ] Check email inbox - Confirmation email received
- [ ] `npm run send-newsletter` - Runs without errors
- [ ] Check console output - Shows "✅ Newsletter sent!"

---

## 📞 When to Ask for Help

If you've tried the above and still stuck:

1. **Save error messages** - Copy the full error text
2. **Describe what happened** - Step-by-step what you did
3. **Share relevant files**:
   - Error output
   - Server console logs
   - JSON file contents (remove personal emails)
4. **Include setup info**:
   - OS (macOS, Linux, Windows)
   - Node version: `node --version`
   - npm version: `npm --version`

---

## 🎯 Quick Fixes

**Email not sending?**
```bash
# 1. Check credentials:
echo $GMAIL_USER
echo $GMAIL_PASS

# 2. Regenerate Gmail app password
# 3. Update environment variables
# 4. Restart server: npm start
```

**Duplicate emails?**
```bash
# Reset waitlist:
echo '[]' > data/waitlist-track-ai.json
echo '[]' > data/waitlist-opendocs.json
echo '[]' > data/waitlist-yc-monitor.json

# Or remove specific email:
cat data/waitlist-track-ai.json | \
  jq 'map(select(.email != "duplicate@example.com"))' \
  > temp && mv temp data/waitlist-track-ai.json
```

**Server won't start?**
```bash
# Kill process on port 3000:
lsof -i :3000
kill -9 <PID>

# Install missing dependencies:
npm install

# Try again:
npm start
```

---

## 📚 Need More Help?

- **Full setup guide:** See EMAIL_AUTOMATION_SETUP.md
- **Implementation guide:** See EMAIL_IMPLEMENTATION_CHECKLIST.md
- **Architecture guide:** See EMAIL_ARCHITECTURE.md
- **Quick start:** See EMAIL_QUICK_START.md

---

**Most issues are resolved by:**
1. Setting environment variables correctly
2. Checking email credentials
3. Restarting the server
4. Verifying file permissions

**Good luck! 🚀**
