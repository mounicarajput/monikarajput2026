require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { getWelcomeTemplate, sendEmail } = require('../email-utils');

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

  const { email } = req.body;

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
    // Check if email already exists in Supabase
    const { data: existingSubscriber, error: fetchError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('email', normalizedEmail)
      .single();

    if (existingSubscriber) {
      console.log(`[API] Duplicate detected for ${normalizedEmail}`);
      return res.status(409).json({
        success: false,
        message: 'You are already subscribed to the newsletter.'
      });
    }

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is expected here. Any other error is an issue.
      console.error('[API] Supabase Fetch Error:', fetchError);
      throw fetchError;
    }

    // Insert new subscriber into Supabase
    const { error: insertError } = await supabase
      .from('subscribers')
      .insert([{ email: normalizedEmail, status: 'active' }]);

    if (insertError) {
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
