# Email Automation - System Architecture

## Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     YOUR PORTFOLIO WEBSITE                              │
│                   (HTML Forms + JavaScript)                              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌─────────────┬─┴──────────────┬──────────────┐
                    │             │                │              │
                    ▼             ▼                ▼              ▼
            ┌─────────────┐  ┌──────────────┐ ┌──────────────┐ ┌──────────┐
            │ index.html  │  │ waitlist-    │ │ waitlist-    │ │waitlist- │
            │Newsletter   │  │ track-ai.html│ │opendocs.html │ │yc-mon.html
            │Form (input) │  │ Form (input) │ │ Form (input) │ │Form(input
            └──────┬──────┘  └──────┬───────┘ └──────┬───────┘ └────┬─────┘
                   │                │                 │              │
                   └────────────┬───┴─────────────────┴──────────────┘
                                │
                    POST /api/subscribe OR /api/waitlist
                                │
                       ┌────────▼────────┐
                       │  server.js      │
                       │  (Express)      │
                       ├─────────────────┤
                       │ ✓ Validate      │
                       │ ✓ Check Dupes   │
                       │ ✓ Save to JSON  │
                       │ ✓ Send Email    │
                       └────────┬────────┘
                                │
                    ┌───────────┼───────────┐
                    │           │           │
                    ▼           ▼           ▼
          ┌─────────────────┐ ┌──────────────┐ ┌──────────────────┐
          │ data/          │ │email-utils.js│ │  nodemailer      │
          │ subscribers.json│ │              │ │  (Email Service) │
          │ waitlist-*.json │ │ • Templates  │ │                  │
          └─────────────────┘ │ • Validation │ │ GMAIL or SMTP    │
                              │ • Sending    │ └──────────────────┘
                              └──────────────┘         │
                                                        ▼
                              ┌─────────────────────────────────┐
                              │ USER'S EMAIL INBOX              │
                              │ ✓ Confirmation Email            │
                              │ ✓ Newsletter                    │
                              │ ✓ Project Updates               │
                              └─────────────────────────────────┘
```

---

## CLI Commands Flow

```
┌──────────────────────────────────────────────────────────────┐
│              YOUR TERMINAL / COMMAND LINE                    │
└──────────────────────────────────────────────────────────────┘

npm run send-newsletter
    │
    └─→ send-newsletter.js
        │
        ├─→ Read articles.json (get latest)
        ├─→ Read data/subscribers.json
        ├─→ For each subscriber:
        │   └─→ email-utils.js → sendBulkEmails()
        │       └─→ nodemailer → Gmail/SMTP
        │           └─→ Send newsletter email
        │
        └─→ Log results: "Sent: 42, Failed: 0" ✅


npm run send-update [project] "[Title]" "[Message]"
    │
    └─→ send-project-update.js
        │
        ├─→ Get project key (track-ai|opendocs|yc-monitor)
        ├─→ Read data/waitlist-[project].json
        ├─→ For each active member:
        │   └─→ email-utils.js → sendBulkEmails()
        │       └─→ nodemailer → Gmail/SMTP
        │           └─→ Send project update email
        │
        └─→ Log results: "Sent: 15, Failed: 0" ✅
```

---

## Real-World User Journey

### Scenario: User Joins Track.AI Waitlist

```
1. USER VISITS WEBSITE
   └─→ Clicks "Join Waitlist" on waitlist-track-ai.html

2. FORM SUBMISSION (Browser JavaScript)
   └─→ POST /api/waitlist
       {
         "email": "user@example.com",
         "product": "track-ai"
       }

3. SERVER RECEIVES REQUEST (server.js)
   ├─→ Validate email format ✓
   ├─→ Check if email already in waitlist-track-ai.json ✓
   ├─→ Save to JSON:
   │   {
   │     "email": "user@example.com",
   │     "joinedAt": "2026-04-22T19:42:30.456Z",
   │     "status": "active",
   │     "product": "track-ai"
   │   }
   └─→ Call email-utils.getWaitlistTemplate() ✓

4. EMAIL SENT (email-utils.js + nodemailer)
   ├─→ Build email HTML with template
   ├─→ Connect to Gmail via SMTP
   ├─→ Send confirmation email
   └─→ Log: "✓ Email sent to user@example.com"

5. RESPONSE TO BROWSER
   ├─→ Return: {"success": true}
   ├─→ Show "✓ Added to Waitlist!" message for 3 seconds
   ├─→ Clear form
   └─→ User sees success ✅

6. DATA STORED PERMANENTLY
   └─→ data/waitlist-track-ai.json now contains user's email
       (available for future project updates)
```

---

## Files & Their Purposes

```
server.js
├─ Express app setup
├─ /api/subscribe endpoint
│  └─ Newsletter signup handler
├─ /api/waitlist endpoint (NEW)
│  ├─ Validate & deduplicate emails
│  ├─ Save to JSON
│  └─ Call email-utils → send confirmation email
└─ /api/health status check

email-utils.js (NEW)
├─ getEmailTransporter()
│  └─ Abstracts Gmail/SMTP config from env vars
├─ sendEmail(to, subject, html)
│  └─ Send single email, return result
├─ sendBulkEmails(recipients, subject, html)
│  └─ Send to many, track success/failures
├─ Templates:
│  ├─ getNewsletterTemplate(article)
│  ├─ getWaitlistTemplate(projectName)
│  └─ getProjectUpdateTemplate(projectName, update)
└─ isValidEmail(email)
   └─ Email format validation

send-newsletter.js (NEW - CLI)
├─ Read articles.json (get latest article)
├─ Read data/subscribers.json (get all subscribers)
├─ Call email-utils.sendBulkEmails()
│  └─ Format article in template & send
└─ Print results with counts

send-project-update.js (NEW - CLI)
├─ Parse project key from CLI args
├─ Read data/waitlist-[project].json
├─ Call email-utils.sendBulkEmails()
│  └─ Format update in template & send
└─ Print results with counts

data/subscribers.json
└─ Newsletter subscriber list
   [{ email, subscribedAt, status }, ...]

data/waitlist-track-ai.json
data/waitlist-opendocs.json
data/waitlist-yc-monitor.json
└─ Waitlist for each project
   [{ email, joinedAt, status, product }, ...]

index.html
└─ Newsletter form (already working)
   └─ POST /api/subscribe

waitlist-track-ai.html
waitlist-opendocs.html
waitlist-yc-monitor.html
└─ Waitlist forms (UPDATED - now use /api/waitlist)
   └─ POST /api/waitlist with product key
```

---

## Environment Variables

```
Environment Variables (Set Once Per Server)
├─ Option A: Gmail
│  ├─ GMAIL_USER=your@gmail.com
│  ├─ GMAIL_PASS=16-char-app-password
│  └─ EMAIL_FROM="Monika Rajput <your@gmail.com>"
│
├─ Option B: SMTP (SendGrid, Mailgun, etc.)
│  ├─ SMTP_HOST=smtp.sendgrid.net
│  ├─ SMTP_PORT=587
│  ├─ SMTP_USER=apikey
│  ├─ SMTP_PASS=SG.xxxxx
│  ├─ SMTP_SECURE=false
│  └─ EMAIL_FROM="Monika <noreply@example.com>"
│
└─ Either way: EMAIL_FROM (already set above)
```

---

## npm Scripts

```
package.json scripts:
├─ "start" → node server.js
│  └─ Start web server
├─ "dev" → node server.js
│  └─ Same as start (alias)
├─ "send-newsletter" → node send-newsletter.js
│  └─ Send latest article to all subscribers
└─ "send-update" → node send-project-update.js
   └─ Send project update to waitlist
      (also accepts CLI args)
```

---

## Data Flow: Sending Newsletter

```
You Run: npm run send-newsletter
     │
     ▼
send-newsletter.js starts
     │
     ├─→ fs.readFileSync('articles.json')
     │   └─→ Get [0] = latest article
     │       {
     │         "title": "My Article",
     │         "description": "...",
     │         "link": "https://..."
     │       }
     │
     ├─→ fs.readFileSync('data/subscribers.json')
     │   └─→ Get all subscriber emails
     │
     ├─→ Filter for status: "active"
     │
     └─→ Call email-utils.sendBulkEmails()
          │
          ├─→ getNewsletterTemplate(article)
          │   └─→ Returns HTML email template
          │
          ├─→ For each subscriber email:
          │   ├─→ nodemailer.sendMail({
          │   │     from: EMAIL_FROM,
          │   │     to: subscriber,
          │   │     subject: "📚 New Article: [Title]",
          │   │     html: template
          │   │   })
          │   └─→ Track success/failure
          │
          └─→ Return { sent: 42, failed: 0, errors: [] }
               │
               └─→ Console.log results
                   "✅ Newsletter sent!"
                   "Sent: 42, Failed: 0"
```

---

## Error Handling

```
At each stage:

Email Validation
├─ Is format valid? user@example.com
└─ Reject if: missing @, space in email, etc.

Duplicate Check
├─ Read JSON file
├─ Check if email already exists
└─ Return: "Already subscribed" error

Email Sending
├─ Connect to SMTP/Gmail
├─ If connection fails: log error, continue
├─ If send fails: track in failed array
└─ If send succeeds: track in sent array

Graceful Degradation
├─ Email service down? Forms still work!
├─ Data saved to JSON regardless
└─ Users see success message either way
```

---

## Scaling Considerations

```
Current Setup (JSON Files):
├─ Pros:
│  ├─ No database needed
│  ├─ Easy to backup (just files)
│  ├─ Simple to understand
│  └─ Works for up to ~10k subscribers
│
└─ Cons:
   ├─ Slow with massive lists
   ├─ Concurrent writes problematic
   └─ Not ideal for real-time queries

If You Scale Past 10k Subscribers:
├─ Migrate to SQLite:
│  └─ sqlite3 npm package
│
├─ Migrate to PostgreSQL:
│  └─ pg npm package
│
└─ Use email service API directly:
   └─ SendGrid / Mailgun / Resend
      (replaces Nodemailer)
```

---

## Summary

This architecture provides:
- ✅ Simple, no-database email system
- ✅ Automatic confirmation emails
- ✅ Bulk newsletter sending
- ✅ Project-specific waitlists
- ✅ CLI automation commands
- ✅ Persistent JSON storage
- ✅ Duplicate prevention
- ✅ Flexible email service (Gmail/SMTP)

**Total Code: ~1000 lines (very lightweight!)**
