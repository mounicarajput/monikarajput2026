const express = require('express');
const router = express.Router();

// If Node < 18, uncomment this:
// const fetch = require('node-fetch');

// In-memory cache for explanations
const explanationCache = {};

// AI provider config
const AI_PROVIDER = process.env.AI_PROVIDER || 'openai';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

/**
 * SAFE JSON PARSER (prevents crashes)
 */
function safeParseAI(content, companyName) {
  try {
    return JSON.parse(content);
  } catch (err) {
    console.error("❌ JSON Parse Failed:", content);

    return {
      company_name: companyName,
      what_it_does: "Unable to generate explanation right now.",
      who_its_for: "Try again in a moment.",
      why_it_exists: "AI response format issue.",
      reading_time: "N/A"
    };
  }
}

/**
 * POST /api/yc-explain
 */
router.post('/yc-explain', async (req, res) => {
  const { company_name } = req.body;

  if (!company_name || typeof company_name !== 'string') {
    return res.status(400).json({ error: 'company_name is required' });
  }

  const cacheKey = company_name.toLowerCase();

  // Cache check
  if (explanationCache[cacheKey]) {
    return res.json(explanationCache[cacheKey]);
  }

  try {
    let explanation;

    if (AI_PROVIDER === 'anthropic' && ANTHROPIC_API_KEY) {
      explanation = await generateWithAnthropic(company_name);
    } else if (OPENAI_API_KEY) {
      explanation = await generateWithOpenAI(company_name);
    } else {
      return res.status(500).json({
        error: 'No AI API key configured'
      });
    }

    explanationCache[cacheKey] = explanation;

    return res.json(explanation);

  } catch (error) {
    console.error("❌ API ERROR:", error.message);

    return res.status(500).json({
      error: 'Failed to generate explanation',
      message: error.message
    });
  }
});

/**
 * OPENAI
 */
async function generateWithOpenAI(companyName) {
  const prompt = `
Return STRICT JSON only.

Explain this Y Combinator company:

Company: ${companyName}

Return format:
{
  "what_it_does": "1-2 lines simple explanation",
  "who_its_for": "target users",
  "why_it_exists": "problem it solves",
  "reading_time": "e.g. 45 sec read"
}

Rules:
- NO markdown
- NO extra text
- ONLY valid JSON
`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 300
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'OpenAI API failed');
  }

  const content = data.choices?.[0]?.message?.content || '';

  const explanation = safeParseAI(content, companyName);

  return {
    company_name: companyName,
    ...explanation
  };
}

/**
 * ANTHROPIC (Claude)
 */
async function generateWithAnthropic(companyName) {
  const prompt = `
Return STRICT JSON only.

Explain this Y Combinator company:

Company: ${companyName}

Format:
{
  "what_it_does": "",
  "who_its_for": "",
  "why_it_exists": "",
  "reading_time": ""
}

No markdown. No extra text. Only JSON.
`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Anthropic API failed');
  }

  const content = data.content?.[0]?.text || '';

  const explanation = safeParseAI(content, companyName);

  return {
    company_name: companyName,
    ...explanation
  };
}

/**
 * CACHE DEBUG
 */
router.get('/yc-explain/cache', (req, res) => {
  res.json({
    cached_companies: Object.keys(explanationCache).length,
    companies: Object.keys(explanationCache)
  });
});

module.exports = router;