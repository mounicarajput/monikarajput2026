#!/usr/bin/env node

/**
 * Send latest article to all newsletter subscribers
 * Usage: node send-newsletter.js
 */

const fs = require('fs');
const path = require('path');
const { getNewsletterTemplate, sendBulkEmails } = require('./email-utils');

const SUBSCRIBERS_FILE = path.join(__dirname, 'data', 'subscribers.json');
const ARTICLES_FILE = path.join(__dirname, 'articles.json');

const run = async () => {
  try {
    console.log('📧 Sending newsletter...\n');

    // Read subscribers
    if (!fs.existsSync(SUBSCRIBERS_FILE)) {
      console.error('✗ subscribers.json not found');
      process.exit(1);
    }

    const subscribersData = JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, 'utf8'));
    const subscribers = subscribersData
      .filter((s) => s.status === 'active')
      .map((s) => s.email);

    if (subscribers.length === 0) {
      console.log('⚠ No active subscribers found');
      process.exit(0);
    }

    console.log(`Found ${subscribers.length} active subscribers\n`);

    // Read articles and get latest
    if (!fs.existsSync(ARTICLES_FILE)) {
      console.error('✗ articles.json not found');
      process.exit(1);
    }

    const articles = JSON.parse(fs.readFileSync(ARTICLES_FILE, 'utf8'));
    if (!articles.articles || articles.articles.length === 0) {
      console.error('✗ No articles found in articles.json');
      process.exit(1);
    }

    const latestArticle = articles.articles[0];

    console.log(`📚 Latest Article: "${latestArticle.title}"`);
    console.log(`🔗 Link: ${latestArticle.link}\n`);

    // Get template
    const template = getNewsletterTemplate(latestArticle);

    // Send emails
    const results = await sendBulkEmails(
      subscribers,
      template.subject,
      template.html,
    );

    console.log('\n✅ Newsletter sent!');
    console.log(`   Sent: ${results.sent}`);
    console.log(`   Failed: ${results.failed}`);

    if (results.errors.length > 0) {
      console.log('\n⚠ Failed emails:');
      results.errors.forEach((err) => {
        console.log(`   ${err.email}: ${err.error}`);
      });
    }
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
};

run();
