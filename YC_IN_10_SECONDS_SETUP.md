# YC in 10 Seconds - MVP Setup Guide

## What is this?

A minimal web app that helps users search Y Combinator companies and understand them instantly using AI-generated structured explanations.

## ✅ What's Included

- **Frontend**: `/yc-in-10-seconds.html` - Simple search interface
- **Data**: `/data/yc-companies.json` - 25+ YC companies (static list, no scraping)
- **API**: `/api/yc-explain.js` - AI explanation generation with caching
- **Integration**: Links to existing `/waitlist-yc-monitor.html`

## 🚀 Quick Start

### 1. Access the App

Once the server is running, visit:
```
http://localhost:3000/yc
```

### 2. Set Up AI Integration (REQUIRED)

The app needs an AI API key to generate explanations. Choose one:

#### **Option A: OpenAI (GPT-3.5)**

Add to `.env`:
```
OPENAI_API_KEY=sk-your-key-here
AI_PROVIDER=openai
```

Get your key: https://platform.openai.com/api-keys

#### **Option B: Anthropic (Claude)**

Add to `.env`:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
AI_PROVIDER=anthropic
```

Get your key: https://console.anthropic.com/

### 3. Start the Server

```bash
npm start
```

The server will log:
```
✓ Server is running on http://localhost:3000
✓ YC in 10 Seconds: http://localhost:3000/yc
```

## 📖 How It Works

### User Flow
1. **Search** - User types a company name (e.g., "Stripe")
2. **Select** - Click on a matching company card
3. **Explain** - AI generates structured explanation:
   - What it does
   - Who it's for
   - Why it exists
   - Reading time estimate
4. **Explore More** - Click "Back to search" to try another company
5. **Waitlist** - Join the waitlist for more YC insights

### Caching Strategy
- First request for a company → calls AI API
- Subsequent requests for same company → returns cached result instantly
- Cache stored in memory (resets on server restart)

### Example Response
```json
{
  "company_name": "Stripe",
  "what_it_does": "Payment processing API that lets businesses accept online payments with minimal complexity.",
  "who_its_for": "E-commerce companies, SaaS platforms, and any business that needs to accept payments.",
  "why_it_exists": "Online payments were fragmented and hard to integrate; Stripe unified them into a simple API.",
  "reading_time": "45 sec read"
}
```

## 🎨 Design Features

- **Minimal UI** - White background, clean typography
- **Search Results** - Real-time matching company cards
- **Detail View** - Collapsible sections for "Who it's for" and "Why it exists"
- **Mobile Responsive** - Works on all screen sizes
- **No Animations** - Only simple expand/collapse actions

## 📊 API Endpoints

### Generate Explanation
```
POST /api/yc-explain
Content-Type: application/json

{
  "company_name": "Stripe"
}
```

Response:
```json
{
  "company_name": "Stripe",
  "what_it_does": "...",
  "who_its_for": "...",
  "why_it_exists": "...",
  "reading_time": "45 sec read"
}
```

### Get Cache Stats (Debug)
```
GET /api/yc-explain/cache-stats
```

Returns:
```json
{
  "total_cached": 3,
  "cache_size_bytes": 1024,
  "cache_size_kb": "1.00"
}
```

## 📈 Performance Targets

- **Search results**: < 2 seconds
- **First AI call**: 3-5 seconds (depends on API)
- **Cached responses**: < 100ms
- **Cache hit ratio**: After 2-3 searches, most queries are cached

## 🔗 Integration Points

### Waitlist Link
- Location: Bottom of detail view
- Text: "For more YC insights and updates, join the waitlist."
- Button: "Join Waitlist" → `/waitlist-yc-monitor.html`
- No API calls needed - simple redirect

### Existing Waitlist Page
The app uses the existing page at:
```
/waitlist-yc-monitor.html
```

No modifications needed to the waitlist page.

## 🛠️ Troubleshooting

### "AI API key not configured" Error
**Solution**: Add your API key to `.env` and restart server.

### Slow AI Responses
**Solution**: This is normal for first request. Subsequent requests use cache.

### App Not Loading
**Solution**: Ensure server is running on port 3000 and visit `http://localhost:3000/yc`

### Cache Not Working
**Solution**: Cache is in-memory. If server restarts, cache is cleared.

## 📝 Adding More Companies

Edit `/data/yc-companies.json`:

```json
[
  {
    "id": "your-company-id",
    "name": "Company Name",
    "batch": "S24",
    "website": "company.com"
  }
]
```

Restart server and refresh browser.

## ⚡ Key Features Summary

✅ **Search** - Real-time company search  
✅ **AI Explanations** - Structured, simple, factual  
✅ **Caching** - Instant responses for cached companies  
✅ **Mobile Ready** - Responsive design  
✅ **Waitlist Integration** - Link to existing waitlist  
✅ **No Complexity** - Pure MVP, no auth/analytics/scraping  
✅ **Production Ready** - Rate limiting, error handling, caching  

## 🎯 Success Criteria

- [ ] User searches company in < 2 seconds
- [ ] Click → instant structured explanation
- [ ] Feels like "I understand this startup in 10 seconds"
- [ ] Waitlist link is prominently visible
- [ ] App works on mobile devices
- [ ] No errors in browser console

---

**Built**: April 28, 2026  
**Status**: MVP Production Ready  
**Requires**: AI API key (OpenAI or Anthropic)
