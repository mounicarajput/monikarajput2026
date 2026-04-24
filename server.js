
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  message: { error: 'Too many requests, please try again later.' }
});

const subscribeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 subscribe requests per hour
  message: { error: 'Too many subscription attempts, please try again later.' }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Data directory and file
const DATA_DIR = path.join(__dirname, 'data');
const SUBSCRIBERS_FILE = path.join(DATA_DIR, 'subscribers.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize subscribers file if it doesn't exist
if (!fs.existsSync(SUBSCRIBERS_FILE)) {
  fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify([], null, 2));
}

// Helper function to read subscribers
function readSubscribers() {
  try {
    const data = fs.readFileSync(SUBSCRIBERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading subscribers:', error);
    return [];
  }
}

// Helper function to write subscribers
function writeSubscribers(subscribers) {
  try {
    fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2));
    return true;
  } catch (error) {
    if (process.env.NODE_ENV === 'production' || error.code === 'EROFS' || error.message.includes('Read-only')) {
      console.log('Production environment / Read-only FS: Skipping local file write. New data:', subscribers[subscribers.length - 1]);
      return true; // Continue so email automation triggers
    }
    console.error('Error writing subscribers:', error);
    return false;
  }
}

// Email validation helper
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// API Routes

// Subscribe endpoint
app.post('/api/subscribe', subscribeLimiter, async (req, res) => {
  const { email } = req.body;

  // Validation
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address' });
  }

  const subscribers = readSubscribers();
  const normalizedEmail = email.toLowerCase().trim();

  // Check if email already exists
  const existingSubscriber = subscribers.find(
    (sub) => sub.email.toLowerCase() === normalizedEmail
  );

  if (existingSubscriber) {
    return res.status(409).json({
      success: false,
      message: 'You are already subscribed to the newsletter.'
    });
  }

  // Add new subscriber
  const newSubscriber = {
    email: normalizedEmail,
    subscribedAt: new Date().toISOString(),
    status: 'active'
  };

  subscribers.push(newSubscriber);

  if (writeSubscribers(subscribers)) {
    console.log(`New subscriber added: ${normalizedEmail}`);

    // Send welcome email if email service is configured
    try {
      const { getWelcomeTemplate, sendEmail } = require('./email-utils');
      const template = getWelcomeTemplate();
      await sendEmail(normalizedEmail, template.subject, template.html);
    } catch (error) {
      console.warn(`Welcome email not sent (service not configured or error): ${error.message}`);
    }

    res.status(200).json({
      message: 'Thank you for subscribing! Check your inbox for a welcome email.',
      success: true
    });
  } else {
    res.status(500).json({ error: 'Failed to save subscription. Please try again later.' });
  }
});

// Get subscribers endpoint (for admin purposes - you might want to add authentication)
app.get('/api/subscribers', apiLimiter, (req, res) => {
  const subscribers = readSubscribers();
  res.json({
    count: subscribers.length,
    subscribers: subscribers
  });
});

// Broadcast endpoint to send newsletter to all active subscribers
app.post('/api/admin/broadcast', apiLimiter, async (req, res) => {
  const { subject, content, secret } = req.body;
  
  // Basic security to prevent unauthorized broadcasts
  if (secret !== process.env.ADMIN_SECRET && secret !== 'wgjx srhz dsmz fsjg') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  if (!subject || !content) {
    return res.status(400).json({ error: 'Subject and content are required' });
  }

  const subscribers = readSubscribers();
  if (subscribers.length === 0) {
    return res.status(400).json({ error: 'No subscribers found' });
  }

  try {
    const { sendNewsletterToAllSubscribers } = require('./email-utils');
    const results = await sendNewsletterToAllSubscribers(subscribers, subject, content);
    res.status(200).json({
      success: true,
      message: 'Broadcast completed',
      results
    });
  } catch (error) {
    console.error('Broadcast failed:', error);
    res.status(500).json({ error: 'Failed to send broadcast' });
  }
});

// Health check endpoint
app.get('/api/health', apiLimiter, (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve newsletter.html
app.get('/newsletter', (req, res) => {
  res.sendFile(path.join(__dirname, 'newsletter.html'));
});

// Serve work.html
app.get('/work', (req, res) => {
  res.sendFile(path.join(__dirname, 'work.html'));
});

// Serve contact.html
app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'contact.html'));
});

// Serve articles.html
app.get('/articles', (req, res) => {
  res.sendFile(path.join(__dirname, 'articles.html'));
});

// Serve about.html
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'about.html'));
});

// Serve speaking.html
app.get('/speaking', (req, res) => {
  res.sendFile(path.join(__dirname, 'speaking.html'));
});

// Serve podcast.html
app.get('/podcast', (req, res) => {
  res.sendFile(path.join(__dirname, 'podcast.html'));
});

// Waitlist helper functions
function readWaitlist(projectFile) {
  try {
    const filePath = path.join(DATA_DIR, projectFile);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading waitlist ${projectFile}:`, error);
    return [];
  }
}

function writeWaitlist(projectFile, waitlist) {
  try {
    const filePath = path.join(DATA_DIR, projectFile);
    fs.writeFileSync(filePath, JSON.stringify(waitlist, null, 2));
    return true;
  } catch (error) {
    if (process.env.NODE_ENV === 'production' || error.code === 'EROFS' || error.message.includes('Read-only')) {
      console.log(`Production environment / Read-only FS: Skipping local file write for ${projectFile}. New data:`, waitlist[waitlist.length - 1]);
      return true; // Continue so email automation triggers
    }
    console.error(`Error writing waitlist ${projectFile}:`, error);
    return false;
  }
}

// Waitlist subscription endpoint
app.post('/api/waitlist', subscribeLimiter, async (req, res) => {
  const { email, name, product } = req.body;

  // Validation
  if (!email || !product) {
    return res.status(400).json({ error: 'Email and product are required' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address' });
  }

  const projectMap = {
    'track-ai': { file: 'waitlist-track-ai.json', name: 'Track.AI' },
    'opendocs': { file: 'waitlist-opendocs.json', name: 'OpenDocs MCP Server' },
    'yc-monitor': { file: 'waitlist-yc-monitor.json', name: 'YC Startup API Monitor' },
  };

  if (!projectMap[product]) {
    return res.status(400).json({ error: 'Invalid product' });
  }

  const projectConfig = projectMap[product];
  const waitlist = readWaitlist(projectConfig.file);
  const normalizedEmail = email.toLowerCase().trim();

  // Check for duplicates
  const existingMember = waitlist.find(
    (member) => member.email.toLowerCase() === normalizedEmail
  );

  if (existingMember) {
    return res.status(409).json({
      success: false,
      message: 'You are already on the waitlist.'
    });
  }

  // Add to waitlist
  const newMember = {
    name: name ? name.trim() : 'Unknown',
    email: normalizedEmail,
    joinedAt: new Date().toISOString(),
    status: 'active',
    product,
  };

  waitlist.push(newMember);

  if (writeWaitlist(projectConfig.file, waitlist)) {
    console.log(`New waitlist member added for ${projectConfig.name}: ${normalizedEmail}`);

    // Send confirmation email if email service is configured
    try {
      const { getWaitlistTemplate, sendEmail } = require('./email-utils');
      const template = getWaitlistTemplate(projectConfig.name);
      await sendEmail(normalizedEmail, template.subject, template.html);
    } catch (error) {
      // Email service not configured, but waitlist signup still succeeds
      console.warn(`Email not sent (service not configured): ${error.message}`);
    }

    res.status(200).json({
      message: `Thank you for joining the waitlist for ${projectConfig.name}!`,
      success: true
    });
  } else {
    res.status(500).json({ error: 'Failed to join waitlist. Please try again later.' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Available pages:`);
  console.log(`  - Home: http://localhost:${PORT}/`);
  console.log(`  - About: http://localhost:${PORT}/about`);
  console.log(`  - Work: http://localhost:${PORT}/work`);
  console.log(`  - Speaking: http://localhost:${PORT}/speaking`);
  console.log(`  - Articles: http://localhost:${PORT}/articles`);
  console.log(`  - Contact: http://localhost:${PORT}/contact`);
  console.log(`  - Newsletter: http://localhost:${PORT}/newsletter`);
  console.log("EMAIL USER:", process.env.GMAIL_USER);
});
