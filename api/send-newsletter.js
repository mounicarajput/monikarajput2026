require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl || 'https://xhjostwhhuvhxzfcoygk.supabase.co', supabaseKey || 'sb_publishable_Z_UTZB7rHruwBp515SYFHg_J-xphXlD');

module.exports = async function handler(req, res) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Security check: Ensure caller has the ADMIN_SECRET
  const authHeader = req.headers.authorization;
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
    console.warn('[API] Unauthorized attempt to broadcast newsletter');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const body = req.body || {};
  const { title, description, link } = body;

  if (!title || !link) {
    return res.status(400).json({ error: 'Title and link are required' });
  }

  try {
    // 1. Fetch all active subscribers
    const { data: subscribers, error: fetchError } = await supabase
      .from('subscribers')
      .select('email')
      .eq('status', 'active');

    if (fetchError) {
      console.error('[API] Error fetching subscribers:', fetchError);
      throw fetchError;
    }

    if (!subscribers || subscribers.length === 0) {
      return res.status(200).json({ message: 'No active subscribers found', success: true });
    }

    const emails = subscribers.map(s => s.email);
    console.log(`[API] Preparing to broadcast to ${emails.length} active subscribers`);

    // 2. Construct the email template
    const htmlTemplate = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="margin: 0 0 16px; color: #050816; font-size: 24px;">📚 ${title}</h2>
        
        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 24px; font-size: 16px;">
          ${description || 'Check out my latest article!'}
        </p>
        
        <div style="margin: 32px 0;">
          <a href="${link}" style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #0b57d0 0%, #0842a0 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Read Article
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 40px 0;" />
        
        <p style="color: #4b5563; font-size: 14px; line-height: 1.5; margin: 0;">
          You received this because you're subscribed to updates from <a href="https://www.monicarajput.com" style="color: #0b57d0; text-decoration: none;">Monika Rajput</a>
        </p>
        <p style="color: #4b5563; font-size: 14px; margin: 16px 0 0; font-style: italic;">
          – Monika Rajput
        </p>
      </div>
    `;

    // 3. Batch send via Resend (up to 100 emails per batch)
    // Resend Batch API requires an array of email objects
    const BATCH_SIZE = 100;
    let successfulBatches = 0;
    
    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batchEmails = emails.slice(i, i + BATCH_SIZE);
      
      const payload = batchEmails.map(email => ({
        from: 'Monika Rajput <hello@monicarajput.com>', // Update this to your verified Resend domain
        to: email,
        subject: `📚 New Article: ${title}`,
        html: htmlTemplate
      }));

      try {
        await resend.batch.send(payload);
        successfulBatches++;
      } catch (batchError) {
        console.error(`[API] Error sending batch ${i/BATCH_SIZE + 1}:`, batchError);
      }
    }

    return res.status(200).json({
      message: `Successfully processed broadcast to ${emails.length} subscribers`,
      success: true
    });

  } catch (error) {
    console.error('[API] Server error during broadcast:', error);
    return res.status(500).json({ error: 'Failed to send newsletter broadcast' });
  }
};
