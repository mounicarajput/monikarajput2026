require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { getWaitlistTemplate, sendEmail } = require('../email-utils');

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ Supabase URL or Anon Key is missing. Database operations will fail. Please set them in .env");
}

const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');

// Email validation helper
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

module.exports = async function handler(req, res) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, name, product } = req.body;
  
  console.log(`[API] Waitlist request received for email: ${email}, product: ${product}`);

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
      console.log(`[API] Duplicate waitlist detected for ${normalizedEmail} on ${product}`);
      return res.status(409).json({
        success: false,
        message: 'You are already on the waitlist.'
      });
    }

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[API] Supabase Fetch Error:', fetchError);
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

    if (insertError) {
      console.error('[API] Supabase Insert Error:', insertError);
      throw insertError;
    }

    console.log(`[API] New waitlist member added for ${projectConfig.name}: ${normalizedEmail}`);

    // Send confirmation email
    try {
      const template = getWaitlistTemplate(projectConfig.name);
      await sendEmail(normalizedEmail, template.subject, template.html);
      console.log(`[API] Waitlist confirmation email sent to ${normalizedEmail}`);
    } catch (error) {
      console.warn(`[API] Email not sent (service not configured): ${error.message}`);
    }

    return res.status(200).json({
      message: `Thank you for joining the waitlist for ${projectConfig.name}!`,
      success: true
    });
  } catch (error) {
    console.error('[API] Error saving waitlist to Supabase:', error);
    return res.status(500).json({ error: 'Failed to join waitlist. Please try again later.' });
  }
};
