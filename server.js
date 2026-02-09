const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

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
app.post('/api/subscribe', (req, res) => {
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
      error: 'This email is already subscribed',
      message: 'You are already subscribed to our newsletter!' 
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
    res.status(200).json({ 
      message: 'Thank you for subscribing! You will receive updates soon.',
      success: true 
    });
  } else {
    res.status(500).json({ error: 'Failed to save subscription. Please try again later.' });
  }
});

// Get subscribers endpoint (for admin purposes - you might want to add authentication)
app.get('/api/subscribers', (req, res) => {
  const subscribers = readSubscribers();
  res.json({ 
    count: subscribers.length,
    subscribers: subscribers 
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
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
});
