# Missouri Aetna Medicare Assistant

Web app answering questions about 34 Missouri Aetna Medicare plans with 100% accuracy, sourced from official 2026 plan documents.

**Live:** https://aetna-customer-assistant.vercel.app

---

## Local Development

```bash
npm install
cp .env.example .env
# Fill in ANTHROPIC_API_KEY. Add CEREBRAS_API_KEY for failover.
vercel dev     # runs React frontend + API function together at http://localhost:3000
```

---

## Provider Architecture

**Primary:** Anthropic Claude Sonnet 4.6 with prompt caching.
- Cached block: static instructions + Escalation-Language.md + Plan-Service-Areas.md (~1,925 tokens, 5-min TTL)
- Uncached block: per-query plan docs (SOB, ANOC, formulary, etc.)

**Failover chain** (when `INFERENCE_PROVIDER=anthropic`):
Anthropic → Cerebras (llama3.1-8b) → Groq (llama-3.3-70b-versatile). Every fallback is logged.

To bypass Anthropic for local testing:
```bash
INFERENCE_PROVIDER=cerebras vercel dev
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes (primary) | Get at console.anthropic.com |
| `CEREBRAS_API_KEY` | Yes (failover) | Get at cloud.cerebras.ai |
| `GROQ_API_KEY` | Recommended | Get at console.groq.com — last-resort failover |
| `INFERENCE_PROVIDER` | No | `anthropic` (default) \| `cerebras` \| `groq` |
| `MODEL_ID` | No | Defaults: `claude-sonnet-4-6` / `llama3.1-8b` / `llama-3.3-70b-versatile` |
| `KB_PATH` | No | Knowledge-base path. Defaults to `./knowledge-base` |

---

## Deploy to Vercel

```bash
vercel env add ANTHROPIC_API_KEY
vercel env add CEREBRAS_API_KEY
vercel --prod
```

---

## Knowledge Base

All plan documents live in `knowledge-base/`:

```
knowledge-base/
├── *.md                  # Skill files, ADRs, orientation docs — keyword-routed
├── manifest.json         # Routing index for all 102 raw-text files
└── raw-text/
    ├── anoc/             # Annual Notice of Change (year-over-year changes per plan)
    ├── eoc/              # Evidence of Coverage (full coverage terms per plan)
    ├── extra-benefit/    # OTC catalog, extra benefit wallet amounts
    ├── formulary/        # Drug formularies (HMO, DSNP, CSNP)
    ├── sob/              # Summary of Benefits (copay tables per plan)
    └── supplemental/     # LIS premium tables, Medicare & You, Heartland market overview
```

---

## File Structure

```
api/ask-question.js              Serverless function — manifest routing + Anthropic LLM
src/App.jsx                      React frontend — chat UI with source citations
knowledge-base/                  All plan documents (markdown + extracted text)
.env.example                     Required env vars
CLAUDE-MIGRATION-PLAN.md         Anthropic migration design decisions
WIKI-MIGRATION-PLAN.md           KB coverage audit
QUESTION-BATTERY-POST-MIGRATION.md  20-question battery results (20/20 pass)
```
