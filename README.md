# Missouri Aetna Medicare Assistant

Web app answering questions about 34 Missouri Aetna Medicare plans with 100% accuracy, sourced from official 2026 plan documents.

**Live:** https://aetna-customer-assistant.vercel.app

---

## Local Development

```bash
npm install
```

Create `.env`:
```
GROQ_API_KEY=gsk_...
```

Run with Vercel CLI (runs React frontend + API function together):
```bash
npm install -g vercel
vercel dev
```

Then open http://localhost:3000

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
    ├── formulary/        # Drug formularies (HMO, HMO-POS, PPO, C-SNP, D-SNP)
    ├── sob/              # Summary of Benefits (copay tables per plan)
    └── supplemental/     # LIS premium tables, Medicare & You, Heartland market overview
```

**To add new plan documents:**
1. Drop PDFs in `raw/` (gitignored — stays in Obsidian vault only)
2. Run: `.venv/Scripts/python scripts/extract-pdfs.py`
3. Add entry to `knowledge-base/manifest.json`
4. Redeploy

**To update a markdown skill/ADR file:**
1. Edit the file in `knowledge-base/`
2. Commit + redeploy

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | Groq API key. Get one at console.groq.com |
| `KB_PATH` | No | Absolute path to knowledge-base/. Defaults to `./knowledge-base` |
| `MODEL_ID` | No | Groq model ID. Defaults to `llama-3.3-70b-versatile` |

---

## Deploy to Vercel

```bash
vercel --prod
```

Set `GROQ_API_KEY` in Vercel project settings → Environment Variables.

---

## File Structure

```
api/ask-question.js      Serverless function — manifest routing + Groq LLM
src/App.jsx              React frontend — chat UI with source citations
knowledge-base/          All plan documents (markdown + extracted text)
package.json
vercel.json
.env.example
WIKI-MIGRATION-PLAN.md   Coverage audit + migration decisions
KB-COVERAGE-REPORT.md    Full KB coverage analysis
```
