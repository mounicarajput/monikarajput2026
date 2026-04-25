require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { getWelcomeTemplate, sendEmail } = require('../email-utils');

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ Supabase URL or Anon Key is missing. Database operations will fail. Please set them in .env");
}

const supabase = createClient(supabaseUrl || 'https://xhjostwhhuvhxzfcoygk.supabase.co', supabaseKey || 'sb_publishable_Z_UTZB7rHruwBp515SYFHg_J-xphXlD');

// Email validation helper
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

module.exports = async function handler(req, res) {
  // CORS setup for preflight requests (if any)
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

  const body = req.body || {};
  const email = body.email;

  console.log(`[API] Subscribe request received for email: ${email}`);

  // Validation
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Attempt to insert directly (relies on UNIQUE constraint for duplicates)
    const { error: insertError } = await supabase
      .from('subscribers')
      .insert([{ email: normalizedEmail, status: 'active' }]);

    if (insertError) {
      // 23505 is the PostgreSQL error code for unique_violation
      if (insertError.code === '23505') {
        console.log(`[API] Duplicate detected for ${normalizedEmail}`);
        return res.status(409).json({
          success: false,
          message: 'You are already subscribed to the newsletter.'
        });
      }
      console.error('[API] Supabase Insert Error:', insertError);
      throw insertError;
    }

    console.log(`[API] New subscriber added: ${normalizedEmail}`);

    // Send welcome email if email service is configured
    try {
      const template = getWelcomeTemplate();
      await sendEmail(normalizedEmail, template.subject, template.html);
      console.log(`[API] Welcome email sent to ${normalizedEmail}`);
    } catch (error) {
      console.warn(`[API] Welcome email not sent (service not configured or error): ${error.message}`);
    }

    return res.status(200).json({
      message: 'Thank you for subscribing! Check your inbox for a welcome email.',
      success: true
    });
  } catch (error) {
    console.error('[API] Error saving subscription to Supabase:', error);
    return res.status(500).json({ error: 'Failed to save subscription. Please try again later.' });
  }
};
