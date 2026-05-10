# Aetna Missouri Medicare Assistant

Web app for answering questions about 34 Missouri Aetna Medicare plans with 100% accuracy, sourced from plan documents.

## Local Development

```bash
npm install
```

Create a `.env` file:
```
ANTHROPIC_API_KEY=sk-ant-...
```

Start the dev server (React only — API needs Vercel CLI for local):
```bash
npm start
```

To test the API locally:
```bash
npm install -g vercel
vercel dev
```

Then open http://localhost:3000

## Deploy to Vercel

1. Push this repo to GitHub
2. Import project in vercel.com
3. Set environment variable: `ANTHROPIC_API_KEY`
4. Deploy — Vercel auto-detects React + serverless function

## Knowledge Base

Files in `/knowledge-base/` are read at runtime by the API function. Keep these in sync with the source files in your wiki. To update:

1. Edit source files in `Jessica-LLM-Wiki/Missouri-Aetna-Plans/`
2. Copy updated files into `knowledge-base/`
3. Redeploy

## File Structure

```
/api/ask-question.js     Backend serverless function (Claude API)
/src/App.jsx             React frontend
/src/index.js            React entry point
/public/index.html       HTML shell (Tailwind CDN)
/knowledge-base/         6 markdown KB files (committed to repo)
/package.json
/vercel.json
/.env.example
```

## Environment Variables

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Required. Your Anthropic API key. |
| `KB_PATH` | Optional. Absolute path to KB files. Defaults to `./knowledge-base`. |
"# aetna-customer-assistant" 
