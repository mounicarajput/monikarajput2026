# Quick API Key Setup (2 minutes)

## Option 1: OpenAI (GPT-3.5) ⭐ Recommended

### Step 1: Get API Key
1. Visit: https://platform.openai.com/api-keys
2. Sign in (create account if needed)
3. Click "Create new secret key"
4. Copy the key (looks like: `sk-proj-...`)

### Step 2: Add to .env
Open `.env` file and add:
```
OPENAI_API_KEY=sk-proj-your-actual-key-here
AI_PROVIDER=openai
```

### Step 3: Restart Server
```bash
npm start
```

## Option 2: Anthropic Claude (Claude 3)

### Step 1: Get API Key
1. Visit: https://console.anthropic.com/
2. Sign in (create account if needed)
3. Go to "API Keys" section
4. Create new key
5. Copy it (looks like: `sk-ant-...`)

### Step 2: Add to .env
```
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
AI_PROVIDER=anthropic
```

### Step 3: Restart Server
```bash
npm start
```

## Done! 🎉

Now visit: http://localhost:3000/yc

Search for a company, click it, and see the AI explanation!

---

## Costs

- **OpenAI**: ~$0.01 per company explanation (GPT-3.5-turbo)
- **Anthropic**: ~$0.002 per company (Claude 3 Haiku)

Cache kicks in immediately, so second searches are free.

## Troubleshooting

**"API key not configured" error?**
- Check you added the key to `.env`
- Make sure no spaces around the `=`
- Restart the server
- Check terminal output

**"Invalid API key" error?**
- Double-check the key is correct (copy-paste from console)
- Make sure you're using the right provider (OPENAI_API_KEY or ANTHROPIC_API_KEY)
- Verify the key hasn't been revoked

**Still not working?**
- Check `.env` file was saved
- Restart terminal and server
- Try the other API provider
