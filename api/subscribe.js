require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // Send welcome email asynchronously without blocking the API response
    try {
      await resend.emails.send({
        from: 'Monika Rajput <hello@monicarajput.com>', // Ensure this domain is verified in Resend
        to: normalizedEmail,
        subject: 'Welcome to the inner circle! 🎉',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="margin: 0 0 16px; color: #050816; font-size: 24px;">Welcome! 🎉</h2>
            <p style="color: #4b5563; line-height: 1.6; margin: 0 0 24px; font-size: 16px;">
              Thanks for subscribing. You'll now receive high-signal updates, actionable ideas, and my latest articles directly in your inbox.
            </p>
            <p style="color: #4b5563; line-height: 1.6; margin: 0 0 32px; font-size: 16px;">
              I respect your inbox. You'll only get the good stuff, and you can unsubscribe at any time.
            </p>
            <div style="margin: 32px 0;">
              <a href="https://www.monicarajput.com" style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #0b57d0 0%, #0842a0 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Visit the site
              </a>
            </div>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 40px 0;" />
            <p style="color: #4b5563; font-size: 14px; line-height: 1.5; margin: 0;">
              – Monika Rajput
            </p>
          </div>
        `
      });
      console.log(`[API] Welcome email sent to ${normalizedEmail}`);
    } catch (error) {
      console.warn(`[API] Welcome email failed (non-blocking): ${error.message}`);
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
