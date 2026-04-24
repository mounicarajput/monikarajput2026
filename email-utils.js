require('dotenv').config();
const nodemailer = require('nodemailer');

/**
 * Get email transporter based on environment variables
 */
const getEmailTransporter = () => {
  // 1. SMTP Config
  if (process.env.SMTP_HOST) {
    console.log('Using SMTP configuration for emails');
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // 2. Gmail Fallback
  if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
    console.log(`Using Gmail configuration for ${process.env.GMAIL_USER}`);
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });
  }

  throw new Error('Email configuration not found. Please set SMTP_* or GMAIL_* environment variables in .env');
};

// Initialize transporter
let transporter;
try {
  transporter = getEmailTransporter();
} catch (error) {
  console.warn('⚠️ Email transporter not initialized:', error.message);
}


/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Newsletter email template
 */
const getNewsletterTemplate = (article) => {
  return {
    subject: `📚 New Article: ${article.title}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="margin: 0 0 16px; color: #050816; font-size: 24px;">📚 ${article.title}</h2>
        
        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 24px; font-size: 16px;">
          ${article.description || 'Check out my latest article'}
        </p>
        
        <div style="margin: 32px 0;">
          <a href="https://monikarajput.com/${article.link || ''}" style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #0b57d0 0%, #0842a0 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Read Article
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 40px 0;" />
        
        <p style="color: #4b5563; font-size: 14px; line-height: 1.5; margin: 0;">
          Sent to <strong>${article.sendTo || 'newsletter subscribers'}</strong><br />
          You received this because you're subscribed to updates from <a href="https://monikarajput.com" style="color: #0b57d0; text-decoration: none;">Monika Rajput</a><br />
          <a href="https://monikarajput.com/unsubscribe" style="color: #0b57d0; text-decoration: none;">Unsubscribe</a>
        </p>
        
        <p style="color: #4b5563; font-size: 14px; margin: 16px 0 0; font-style: italic;">
          – Monika Rajput
        </p>
      </div>
    `,
  };
};

/**
 * Welcome email template for new newsletter subscribers
 */
const getWelcomeTemplate = () => {
  return {
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
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 40px 0;" />
        
        <p style="color: #4b5563; font-size: 14px; line-height: 1.5; margin: 0;">
          – Monika Rajput
        </p>
      </div>
    `,
  };
};

/**
 * Waitlist confirmation email template
 */
const getWaitlistTemplate = (projectName) => {
  return {
    subject: 'You\'re in 🚀',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="margin: 0 0 16px; color: #050816; font-size: 24px;">You're in 🚀</h2>
        
        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 24px; font-size: 16px;">
          Thanks for joining the waitlist for <strong>${projectName}</strong>.
        </p>
        
        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 24px; font-size: 16px;">
          We'll share updates, private beta access, and launch news soon. Stay tuned!
        </p>
        
        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 32px; font-size: 16px;">
          In the meantime, explore other <a href="https://monikarajput.com#projects" style="color: #0b57d0; text-decoration: none;">projects I'm building</a>.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 40px 0;" />
        
        <p style="color: #4b5563; font-size: 14px; line-height: 1.5; margin: 0;">
          – Monika Rajput
        </p>
      </div>
    `,
  };
};

/**
 * Project update email template
 */
const getProjectUpdateTemplate = (projectName, update) => {
  return {
    subject: `Update: ${projectName} – ${update.title}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="margin: 0 0 16px; color: #050816; font-size: 24px;">${projectName}</h2>
        
        <h3 style="margin: 0 0 16px; color: #050816; font-size: 18px;">${update.title}</h3>
        
        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 24px; font-size: 16px;">
          ${update.message}
        </p>
        
        ${update.cta ? `
        <div style="margin: 32px 0;">
          <a href="${update.ctaLink}" style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #0b57d0 0%, #0842a0 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
            ${update.cta}
          </a>
        </div>
        ` : ''}
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 40px 0;" />
        
        <p style="color: #4b5563; font-size: 14px; line-height: 1.5; margin: 0;">
          – Monika Rajput<br />
          <a href="https://monikarajput.com" style="color: #0b57d0; text-decoration: none;">monikarajput.com</a>
        </p>
      </div>
    `,
  };
};

/**
 * Send email via configured transporter
 */
const sendEmail = async (to, subject, html) => {
  try {
    if (!transporter) {
      transporter = getEmailTransporter();
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.GMAIL_USER,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✓ Email sent to ${to}: ${info.messageId}`);
    return { success: true, id: info.messageId };
  } catch (error) {
    console.error(`✗ Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send bulk emails to list
 */
const sendBulkEmails = async (recipients, subject, html) => {
  const results = {
    sent: 0,
    failed: 0,
    errors: [],
  };

  for (const email of recipients) {
    if (!isValidEmail(email)) {
      console.warn(`⚠ Skipping invalid email: ${email}`);
      results.failed++;
      continue;
    }

    const result = await sendEmail(email, subject, html);
    if (result.success) {
      results.sent++;
    } else {
      results.failed++;
      results.errors.push({ email, error: result.error });
    }
    
    // Simple rate limiting: wait 500ms between emails to avoid hitting limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
};

/**
 * Send a custom newsletter to all subscribers
 */
const sendNewsletterToAllSubscribers = async (subscribers, subject, content) => {
  console.log(`Starting newsletter broadcast to ${subscribers.length} subscribers...`);
  
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="margin: 0 0 16px; color: #050816; font-size: 24px;">${subject}</h2>
      
      <div style="color: #4b5563; line-height: 1.6; margin: 0 0 24px; font-size: 16px; white-space: pre-wrap;">
        ${content}
      </div>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 40px 0;" />
      
      <p style="color: #4b5563; font-size: 14px; line-height: 1.5; margin: 0;">
        You received this because you're subscribed to updates from <a href="https://monikarajput.com" style="color: #0b57d0; text-decoration: none;">Monika Rajput</a><br />
        <a href="https://monikarajput.com/unsubscribe" style="color: #0b57d0; text-decoration: none;">Unsubscribe</a>
      </p>
      
      <p style="color: #4b5563; font-size: 14px; margin: 16px 0 0; font-style: italic;">
        – Monika Rajput
      </p>
    </div>
  `;

  // Filter only active subscribers
  const emails = subscribers.filter(s => s.status === 'active').map(s => s.email);
  return await sendBulkEmails(emails, subject, html);
};

module.exports = {
  getEmailTransporter,
  isValidEmail,
  getNewsletterTemplate,
  getWelcomeTemplate,
  getWaitlistTemplate,
  getProjectUpdateTemplate,
  sendEmail,
  sendBulkEmails,
  sendNewsletterToAllSubscribers,
};
