#!/usr/bin/env node

/**
 * Send project update to waitlist members
 * Usage: node send-project-update.js track-ai
 *        node send-project-update.js opendocs
 *        node send-project-update.js yc-monitor
 */

const fs = require('fs');
const path = require('path');
const { getProjectUpdateTemplate, sendBulkEmails } = require('./email-utils');

const projectMap = {
  'track-ai': {
    name: 'Track.AI',
    file: 'data/waitlist-track-ai.json',
  },
  'opendocs': {
    name: 'OpenDocs MCP Server',
    file: 'data/waitlist-opendocs.json',
  },
  'yc-monitor': {
    name: 'YC Startup API Monitor',
    file: 'data/waitlist-yc-monitor.json',
  },
};

const run = async () => {
  try {
    const projectKey = process.argv[2];

    if (!projectKey || !projectMap[projectKey]) {
      console.error(
        '✗ Invalid project. Options: track-ai, opendocs, yc-monitor',
      );
      console.error(
        '\nUsage: node send-project-update.js <project-key> <title> <message>',
      );
      console.error(
        'Example: node send-project-update.js track-ai "Launch Date" "We\'re launching next week!"',
      );
      process.exit(1);
    }

    const title = process.argv[3];
    const message = process.argv[4];

    if (!title || !message) {
      console.error('✗ Missing title or message');
      console.error(
        'Usage: node send-project-update.js <project> <title> <message>',
      );
      process.exit(1);
    }

    const project = projectMap[projectKey];
    const filePath = path.join(__dirname, project.file);

    console.log(`📧 Sending update for ${project.name}...\n`);

    // Read waitlist
    if (!fs.existsSync(filePath)) {
      console.error(`✗ ${project.file} not found`);
      process.exit(1);
    }

    const waitlistData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const emails = waitlistData
      .filter((w) => w.status === 'active')
      .map((w) => w.email);

    if (emails.length === 0) {
      console.log('⚠ No active waitlist members found');
      process.exit(0);
    }

    console.log(`Found ${emails.length} waitlist members\n`);
    console.log(`📢 Title: "${title}"`);
    console.log(`📝 Message: "${message}"\n`);

    // Get template
    const update = {
      title,
      message,
    };

    const template = getProjectUpdateTemplate(project.name, update);

    // Send emails
    const results = await sendBulkEmails(
      emails,
      template.subject,
      template.html,
    );

    console.log('\n✅ Project update sent!');
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
