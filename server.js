require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ Supabase URL or Anon Key is missing. Database operations will fail. Please set them in .env");
}

const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
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

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Check if email already exists in Supabase
    const { data: existingSubscriber, error: fetchError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('email', normalizedEmail)
      .single();

    if (existingSubscriber) {
      return res.status(409).json({
        success: false,
        message: 'You are already subscribed to the newsletter.'
      });
    }

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is expected here. Any other error is an issue.
      throw fetchError;
    }

    // Insert new subscriber into Supabase
    const { error: insertError } = await supabase
      .from('subscribers')
      .insert([{ email: normalizedEmail, status: 'active' }]);

    if (insertError) throw insertError;

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
  } catch (error) {
    console.error('Error saving subscription to Supabase:', error);
    res.status(500).json({ error: 'Failed to save subscription. Please try again later.' });
  }
});

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
    'track-ai': { name: 'Track.AI' },
    'opendocs': { name: 'OpenDocs MCP Server' },
    'yc-monitor': { name: 'YC Startup API Monitor' },
  };

  if (!projectMap[product]) {
    return res.status(400).json({ error: 'Invalid product' });
  }

  const projectConfig = projectMap[product];
  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Check for duplicates in Supabase
    const { data: existingMember, error: fetchError } = await supabase
      .from('waitlist')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('product', product)
      .single();

    if (existingMember) {
      return res.status(409).json({
        success: false,
        message: 'You are already on the waitlist.'
      });
    }

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    // Insert into Supabase waitlist table
    const { error: insertError } = await supabase
      .from('waitlist')
      .insert([{ 
        name: name ? name.trim() : 'Unknown', 
        email: normalizedEmail, 
        product: product,
        status: 'active' 
      }]);

    if (insertError) throw insertError;

    console.log(`New waitlist member added for ${projectConfig.name}: ${normalizedEmail}`);

    // Send confirmation email
    try {
      const { getWaitlistTemplate, sendEmail } = require('./email-utils');
      const template = getWaitlistTemplate(projectConfig.name);
      await sendEmail(normalizedEmail, template.subject, template.html);
    } catch (error) {
      console.warn(`Email not sent (service not configured): ${error.message}`);
    }

    res.status(200).json({
      message: `Thank you for joining the waitlist for ${projectConfig.name}!`,
      success: true
    });
  } catch (error) {
    console.error('Error saving waitlist to Supabase:', error);
    res.status(500).json({ error: 'Failed to join waitlist. Please try again later.' });
  }
});

// Get subscribers endpoint (for admin purposes)
app.get('/api/subscribers', apiLimiter, async (req, res) => {
  try {
    const { data: subscribers, error } = await supabase
      .from('subscribers')
      .select('*');

    if (error) throw error;

    res.json({
      count: subscribers.length,
      subscribers: subscribers
    });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
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

  try {
    const { data: subscribers, error: fetchError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('status', 'active');

    if (fetchError) throw fetchError;

    if (!subscribers || subscribers.length === 0) {
      return res.status(400).json({ error: 'No active subscribers found' });
    }

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

// Serve HTML pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/newsletter', (req, res) => res.sendFile(path.join(__dirname, 'newsletter.html')));
app.get('/work', (req, res) => res.sendFile(path.join(__dirname, 'work.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, 'contact.html')));
app.get('/articles', (req, res) => res.sendFile(path.join(__dirname, 'articles.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'about.html')));
app.get('/speaking', (req, res) => res.sendFile(path.join(__dirname, 'speaking.html')));
app.get('/podcast', (req, res) => res.sendFile(path.join(__dirname, 'podcast.html')));

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
