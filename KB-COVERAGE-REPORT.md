# KB Coverage Report — Aetna Customer Assistant
**Audit Date:** 2026-05-09  
**Auditor:** Claude Code (claude-sonnet-4-6)  
**Project:** C:\JessicaLLMWiki\aetna-customer-assistant  
**Wiki:** C:\JessicaLLMWiki\Jessica-LLM-Wiki  

---

## Scope Statement

I read **28 of 28** wiki markdown files in full.  
I read **7 of 7** app source files in full (api/, src/, config files).  
Raw PDFs: 102 files inventoried by filename; binary — not text-readable without extraction.

---

## Phase 0 — Knowledge Base Inventory

### Top-Level Wiki Files (10 files)

| File | Size | Content Summary |
|------|------|-----------------|
| CLAUDE (1).md | 6.3K | Build instructions for Claude Code, meta |
| Claude-Code-Build-Instructions.md | 3.3K | Step-by-step Vercel build guide, meta |
| Claude-Code-KB-Coverage-Verification-Prompt.md | 13.0K | This audit prompt, meta |
| Obsidian-KB-Structure-Missouri-Aetna.md | 1.4K | Obsidian vault structure doc, meta |
| QUICKSTART.md | 3.2K | Quick start guide, meta |
| Untitled.base | 39B | Obsidian base file, meta |
| Vercel-Deployment-Guide.md | 3.2K | Vercel deployment steps, meta |
| Web-App-PRD.md | 3.2K | PRD: specifies claude-opus-4-6, Anthropic SDK |
| Welcome.md | 203B | Vault welcome file, meta |
| missouri_cities_and_counties.md | 63.6K | **KNOWLEDGE**: 938 municipalities → 114 counties mapping |

### Missouri-Aetna-Plans/ (7 files)

| File | Size | Content Summary |
|------|------|-----------------|
| Coverage-Details.md | ~8K | Benefit categories, dental/vision/hearing, OTC |
| Eligibility.md | ~6K | Age 65, disability, ESRD, D-SNP dual eligibility rules |
| Exclusions-Limitations.md | ~7K | Cosmetic surgery, non-covered services, limitations |
| FAQs.md | ~5K | Common member questions and answers |
| Plan-Service-Areas.md | ~18K | 31 plans × county availability (app-extracted from PDFs) |
| Plans-Overview.md | ~6K | HMO/PPO/DSNP/CSNP plan types, H-numbers, premiums |
| Pricing.md | ~6K | Premium, deductible, MOOP ranges |

### wiki/ (8 files)

| File | Size | Content Summary |
|------|------|-----------------|
| document-types.md | 4.6K | Reference taxonomy for all raw/ PDF types |
| escalation-language.md | 4.7K | Verbatim escalation phrases, closing disclaimers |
| heartland-market-scope.md | 3.4K | All 34 plans listed; H2663-069 pending verification |
| index.md | 3.1K | Wiki index/overview |
| log.md | 3.3K | Change log |
| source-hierarchy.md | 3.5K | Default EOC→SOB→PA→CMS→M&Y hierarchy |
| verification-status.base | 1.7K | Obsidian base file |

### wiki/decisions/ (7 ADR files)

| File | Rule |
|------|------|
| adr-001-use-obsidian-and-md-for-project-wiki.md | Obsidian as single source of truth |
| adr-002-closed-knowledge-base.md | Never use model training data; KB only |
| adr-003-retrieval-first-answering.md | Show evidence before synthesis |
| adr-004-document-source-hierarchy.md | EOC > SOB > PA > CMS > M&Y |
| adr-005-mandatory-clarification-before-retrieval.md | Ask plan identity if ambiguous |
| adr-006-standard-escalation-language.md | Verbatim escalation phrases |
| adr-007-no-legal-interpretation.md | Decline legal interpretation requests |

### wiki/skills/ (5 skill files)

| File | Skill |
|------|-------|
| answer-drug-question.md | Multi-source drug lookup (formulary + EOC + SOB) |
| answer-troop-question.md | TrOOP accumulation logic (requires CMS Chapter 14) |
| answer-dme-or-pa-question.md | DME/PA lookup (requires PA document in raw/) |
| clarify-plan-identity.md | Disambiguate plan name → H-number |
| classify-plan-vs-year-scope.md | PLAN vs YEAR keyword routing |

### raw/ PDFs (103 files = 102 PDFs + 1 .md)

**Total raw/ files:** 103  
**Total estimated size:** ~120 MB

**Unique Plan IDs extracted from filenames (regex H\d{4}_\d{3,4}):**

| Contract | Plan IDs | Count |
|----------|----------|-------|
| H1608 | 013, 016, 018, 050, 051, 067 | 6 |
| H2663 | 002, 005, 006, 021, 022, 023, 026, 041, 042, 043, 052, 054, 055, 056, 057, 061, 063, 064, 098, 102 | 20 |
| H5325 | 003, 004, 005, 006, 012, 013, 014, 015 | 8 |
| **Total** | | **34** |

**NOTE:** `Summary of Benefits 2663_063.pdf` — missing `H` prefix. File is present but naming is inconsistent.

**Document type breakdown (raw/):**
- ANOC: 29 files (some combined: H2663_002cH2663_006, H2663_054cH2663_052, H2663_055cH2663_052)
- EOC: 23 files
- SOB: 27 files
- Formularies: 5 (HMO, HMO_POS, PPO, CSNP, DSNP)
- Extra Benefit/OTC: 7 (CSNP card, DSNP cards x2, HMO_POS cards x3, OTC_CATALOG)
- Federal references: 3 (2026_MEDICARE_AND_YOU, LIS Premium Summary x2)
- Market overview: 1 (Aetna_Medicare_Missouri_Heartland_Plans.pdf)
- Agent prompt: 1 (relevance_ai_agent_prompt_v1.md)

---

## Phase 1 — App Architecture

**Framework:** Create React App (React 18.2) + Vercel serverless function  
**Runtime:** Node.js serverless (`api/ask-question.js`)  
**LLM:** Groq SDK, model `llama-3.1-8b-instant` (PRD specifies `claude-opus-4-6` — MISMATCH)  
**KB loading:** `fs.readFileSync` from `knowledge-base/` directory at request time  
**Retrieval:** Keyword scoring — top-2 files per query  

**Request lifecycle (`POST /api/ask-question`):**
```
1. Parse req.body → {question} or {messages}
2. selectRelevantFiles(conversationText) → keyword score → top-2 files
3. loadKnowledgeBase(relevantFiles) → fs.readFileSync each file, truncate at limits
4. buildSystemPrompt(kb) → inject KB text into system prompt string
5. groq.chat.completions.create({model: "llama-3.1-8b-instant", max_tokens: 700, ...})
6. extractSources(raw) → split on "SOURCES_JSON:" marker
7. return {answer, sources}
```

**Content truncation limits (api/ask-question.js:68-69):**
- Plan-Service-Areas.md → 5,000 chars (~780 words)
- Missouri-Cities-Counties.md → 3,500 chars (~540 words; file is 63.6K — 94% discarded)
- All other files → 2,000 chars

**CRITICAL — Missouri-Cities-Counties.md truncated to 5.5% of content.** A 63.6K file truncated to 3,500 chars cannot cover 938 municipalities. Cities early in the alphabet (A-B) are likely covered; cities late in the alphabet (W-Z) are likely truncated off. City lookups for truncated cities will silently fail (no county found, model may hallucinate).

**KB files in `knowledge-base/` but NOT wired into `KB_FILES` array:**
- `Source-Hierarchy.md` — exists in repo at `knowledge-base/Source-Hierarchy.md`, never loaded
- `ADR-005-Clarification.md` — exists, never loaded
- `ADR-006-Escalation.md` — exists, never loaded
- `ADR-007-No-Legal.md` — exists, never loaded

**Environment variables:**
- `GROQ_API_KEY` — required, set in `.env` (local), must be in Vercel env settings
- `KB_PATH` — optional override, defaults to `process.cwd()/knowledge-base`
- `.env.example` — DELETED (shows as `D .env.example` in git status)
- `README.md` — documents `ANTHROPIC_API_KEY` (stale; app uses `GROQ_API_KEY`)

---

## Phase 2 — Coverage Matrix

**Legend:** ✓ = Yes | ✗ = No | ~ = Partial

| File (Wiki Source) | Bucket | In Repo? | In KB_FILES? | Runtime-Loadable? | Status |
|---|---|---|---|---|---|
| Coverage-Details.md | Plans | ✓ | ✓ | ✓ | **PASS** |
| Eligibility.md | Plans | ✓ | ✓ | ✓ | **PASS** |
| Exclusions-Limitations.md | Plans | ✓ | ✓ | ✓ | **PASS** |
| FAQs.md | Plans | ✓ | ✓ | ✓ | **PASS** |
| Plan-Service-Areas.md | Plans | ✓ | ✓ | ~ (5000 char limit) | **PARTIAL** |
| Plans-Overview.md | Plans | ✓ | ✓ | ✓ | **PASS** |
| Pricing.md | Plans | ✓ | ✓ | ✓ | **PASS** |
| escalation-language.md | wiki/ | ✓ | ✓ | ✓ | **PASS** |
| heartland-market-scope.md | wiki/ | ✓ | ✓ | ✓ | **PASS** |
| source-hierarchy.md | wiki/ | ✓ (as Source-Hierarchy.md) | ✗ | ✗ | **FAIL** |
| document-types.md | wiki/ | ✗ | ✗ | ✗ | **FAIL** |
| index.md | wiki/ | ✗ | ✗ | ✗ | not required (meta) |
| log.md | wiki/ | ✗ | ✗ | ✗ | not required (meta) |
| adr-001 | decisions/ | ✗ | ✗ | ✗ | not required (meta) |
| adr-002 | decisions/ | ✗ | ✗ | ✗ | not required (meta) |
| adr-003 | decisions/ | ✗ | ✗ | ✗ | not required (meta) |
| adr-004 | decisions/ | ✗ | ✗ | ✗ | not required (meta) |
| adr-005 | decisions/ | ✓ (ADR-005-Clarification.md) | ✗ | ✗ | **FAIL** |
| adr-006 | decisions/ | ✓ (ADR-006-Escalation.md) | ✗ | ✗ | **FAIL** |
| adr-007 | decisions/ | ✓ (ADR-007-No-Legal.md) | ✗ | ✗ | **FAIL** |
| answer-drug-question.md | skills/ | ✓ | ✓ | ✓ | **PASS** |
| answer-troop-question.md | skills/ | ✓ | ✓ | ✓ | **PASS** |
| answer-dme-or-pa-question.md | skills/ | ✓ | ✓ | ✓ | **PASS** |
| clarify-plan-identity.md | skills/ | ✓ | ✓ | ✓ | **PASS** |
| classify-plan-vs-year-scope.md | skills/ | ✓ | ✓ | ✓ | **PASS** |
| missouri_cities_and_counties.md | top-level | ✓ | ✓ | ~ (3500/63600 chars = 5.5%) | **PARTIAL** |
| relevance_ai_agent_prompt_v1.md | raw/ | ✗ | ✗ | ✗ | incorporated via ADRs/skills |
| **All 102 raw/ PDFs** | raw/ | ✗ | ✗ | ✗ | **FAIL (102 files)** |

**Remediation for FAIL rows:**

| Failed File | Fix |
|---|---|
| Source-Hierarchy.md | Add `{ name: "Source-Hierarchy.md", label: "Source Hierarchy" }` to `KB_FILES` in `api/ask-question.js:5` and add keyword triggers |
| ADR-005, ADR-006, ADR-007 | Same: add to `KB_FILES` or fold their rules into the system prompt |
| Missouri-Cities-Counties.md (truncation) | Increase char limit to 20000 or pre-index with a trie. Current 3500-char limit cuts ~94% of the file. |
| All 102 raw/ PDFs | Run `pdftotext` or `pdfplumber` in a build script; commit extracted `.txt` files to `knowledge-base/raw-text/`; add to `KB_FILES` with aggressive keyword routing |

---

## Phase 3 — Plan ID Coverage

| Plan ID | ANOC | EOC | SOB | Status |
|---------|------|-----|-----|--------|
| H1608-013 | ✗ (no ANOC file) | ✓ | ✓ | PARTIALLY COVERED — missing ANOC |
| H1608-016 | ✓ | ✓ | ✓ | PARTIALLY COVERED — not accessible to app |
| H1608-018 | ✓ | ✓ | ✓ | PARTIALLY COVERED — not accessible to app |
| H1608-050 | ✓ | ✓ | ✓ | PARTIALLY COVERED — not accessible to app |
| H1608-051 | ✓ | ✓ | ✓ | PARTIALLY COVERED — not accessible to app |
| H1608-067 | ✓ | ✓ | ✓ | PARTIALLY COVERED — not accessible to app |
| H2663-002 | ✓ (combined w/006) | ✗ | ✗ | PARTIALLY COVERED — ANOC only |
| H2663-005 | ✓ | ✓ | ✓ | PARTIALLY COVERED — not accessible to app |
| H2663-006 | ✓ (combined) | ✓ | ✓ | PARTIALLY COVERED — not accessible to app |
| H2663-021 | ✓ | ✓ | ✓ | PARTIALLY COVERED — not accessible to app |
| H2663-022 | ✓ | ✓ | ✓ | PARTIALLY COVERED — not accessible to app |
| H2663-023 | ✗ (no ANOC) | ✓ | ✓ | PARTIALLY COVERED — missing ANOC |
| H2663-026 | ✓ | ✓ | ✓ | PARTIALLY COVERED — not accessible to app |
| H2663-041 | ✓ | ✓ | ✓ | PARTIALLY COVERED — not accessible to app |
| H2663-042 | ✓ | ✓ | ✓ | PARTIALLY COVERED — not accessible to app |
| H2663-043 | ✓ | ✓ | ✓ | PARTIALLY COVERED — not accessible to app |
| H2663-052 | ✓ | ✓ | ✓ | PARTIALLY COVERED — not accessible to app |
| H2663-054 | ✓ (combined) | ✗ | ✗ | PARTIALLY COVERED — ANOC only |
| H2663-055 | ✓ (combined) | ✗ | ✗ | PARTIALLY COVERED — ANOC only |
| H2663-056 | ✓ | ✓ | ✓ | PARTIALLY COVERED — not accessible to app |
| H2663-057 | ✗ | ✓ | ✓ | PARTIALLY COVERED — missing ANOC |
| H2663-061 | ✓ | ✓ | ✗ | PARTIALLY COVERED — missing SOB |
| H2663-063 | ✓ | ✓ | ✓ (non-standard filename) | PARTIALLY COVERED — SOB filename anomaly |
| H2663-064 | ✓ | ✓ | ✓ | PARTIALLY COVERED — not accessible to app |
| H2663-098 | ✗ | ✓ | ✓ | PARTIALLY COVERED — missing ANOC |
| H2663-102 | ✗ | ✓ | ✓ | PARTIALLY COVERED — missing ANOC |
| H5325-003 | ✓ | ✓ | ✓ | PARTIALLY COVERED — not accessible to app |
| H5325-004 | ✓ | ✗ | ✓ | PARTIALLY COVERED — missing EOC |
| H5325-005 | ✓ | ✓ | ✓ | PARTIALLY COVERED — not accessible to app |
| H5325-006 | ✓ | ✓ | ✓ | PARTIALLY COVERED — not accessible to app |
| H5325-012 | ✗ | ✓ | ✓ | PARTIALLY COVERED — missing ANOC |
| H5325-013 | ✗ | ✓ | ✓ | PARTIALLY COVERED — missing ANOC |
| H5325-014 | ✗ | ✓ | ✓ | PARTIALLY COVERED — missing ANOC |
| H5325-015 | ✗ | ✓ | ✓ | PARTIALLY COVERED — missing ANOC |

**Plan ID Score: 0 / 34 fully covered** (all PDFs inaccessible to app; some plans also missing individual docs in raw/)

**Document gaps in raw/ (missing files):**
- H1608-013: No ANOC
- H2663-002: No EOC, No SOB (only combined ANOC)
- H2663-023: No ANOC
- H2663-054, H2663-055: ANOC only (combined file references these as changers from H2663-052)
- H2663-057: No ANOC
- H2663-061: No SOB
- H2663-098: No ANOC
- H2663-102: No ANOC
- H5325-004: No EOC
- H5325-012, 013, 014, 015: No ANOC

**H2663-069:** Listed in `wiki/heartland-market-scope.md` as "pending verification" — NO PDFs exist in raw/ for this plan ID at all. Either a future plan or a data entry error.

---

## Phase 4 — Geographic Coverage

**Source files:** `Plan-Service-Areas.md` (app KB, extracted from PDFs), `Missouri-Cities-Counties.md` (app KB, truncated to 3,500 chars)

**Critical constraint:** Missouri-Cities-Counties.md is 63,600 chars but only 3,500 chars are loaded at runtime. Approximately the first 55-80 cities (alphabetically) are accessible. Cities from roughly "C" onward are likely truncated.

**5-County Sample Queries (assessed against loaded content):**

| County | Query | Assessment |
|--------|-------|------------|
| Jackson (urban) | "What plans are in Jackson County?" | **PASS** — Plan-Service-Areas.md covers Jackson County; city-to-county lookup not needed if user says "Jackson County" directly |
| St. Charles (suburban) | "What plans are available in St. Charles County?" | **PASS** — Plan-Service-Areas.md covers this |
| Taney (Ozarks) | "What plans in Taney County?" | **PASS** — service areas file covers this |
| Nodaway (rural north) | "What plans in Nodaway County?" | **PASS** — if county named directly |
| Pemiscot (Bootheel) | "What plans in Pemiscot County?" | **PASS** — if county named directly |

**BUT:** If user gives a city name in those counties (e.g., "Branson" for Taney, "Maryville" for Nodaway, "Caruthersville" for Pemiscot), city→county lookup likely **FAILS** because those cities are deep in the alphabet and beyond the 3,500-char truncation point.

**Live server testing note:** Could not run live Phase 4 queries during this audit. Production URL `aetna-customer-assistant.vercel.app` is accessible; Springfield timeout issue (multi-county city) was confirmed in prior session.

---

## Phase 5 — Question Battery

**Note:** Live testing was not feasible during this audit session (requires running dev server). Verdicts below are based on code analysis of what content is accessible.

| # | Question | Must Cite | Verdict | Reason |
|---|----------|-----------|---------|--------|
| 1 | Monthly premium for H2663-005 in 2026? | SoB H2663_005.pdf | **FAIL** | PDF not in app; Pricing.md has only general ranges |
| 2 | What changed 2025→2026 for H1608-018? | ANOC H1608_018.pdf | **FAIL** | PDF not in app |
| 3 | Insulin on HMO formulary? | FORMULARY HMO PDF | **FAIL** | PDF not in app |
| 4 | Insulin on DSNP formulary? | DSNP_Formulary PDF | **FAIL** | PDF not in app |
| 5 | OTC items on wallet card? | OTC_CATALOG_2026.pdf | **FAIL** | PDF not in app |
| 6 | D-SNP eligibility rule? | Eligibility.md | **PASS** | Eligibility.md in KB_FILES with "dual" keyword trigger |
| 7 | Counties in Heartland service area? | heartland-market-scope + Plan-Service-Areas | **PASS** | Both files in KB_FILES |
| 8 | H5325-004 dental? | SoB H5325_004.pdf | **FAIL** | PDF not in app |
| 9 | LIS premium Missouri 2026? | LIS PDF | **FAIL** | PDF not in app |
| 10 | Medicare AEP start date? | 2026_MEDICARE_AND_YOU.pdf | **FAIL** | PDF not in app; model may hallucinate from training data (ADR-002 violation) |
| 11 | Plans in Greene County? | Plan-Service-Areas.md | **PASS** | Plan-Service-Areas in KB_FILES with "county" keyword trigger |
| 12 | Springfield HMO availability? | Service Areas + Cities | **FAIL** | Springfield timeout confirmed; multi-county city overwhelms truncated cities file |
| 13 | Exclusions for cosmetic surgery? | Exclusions-Limitations.md | **PASS** | In KB_FILES with "exclusion" trigger |
| 14 | How to escalate a complaint? | Escalation-Language.md | **PASS** | In KB_FILES with "escalate" trigger |
| 15 | Source-of-truth hierarchy? | wiki/source-hierarchy.md | **FAIL** | Source-Hierarchy.md in repo but NOT in KB_FILES — never loaded |
| 16 | Every C-SNP extra benefit? | CSNP_Extra_Benefit_Card.pdf | **FAIL** | PDF not in app |
| 17 | HMO-POS extra support wallet? | HMO_POS extra PDF | **FAIL** | PDF not in app |
| 18 | H2663-002 vs H2663-006 changes? | ANOC H2663_002cH2663_006.pdf | **FAIL** | PDF not in app |
| 19 | Plan with H2663-098? | EOC + SoB H2663_098 | **FAIL** | PDFs not in app |
| 20 | Aetna MO Heartland family summary? | Aetna_Medicare_Missouri_Heartland_Plans.pdf | **FAIL** | PDF not in app; Heartland-Market-Scope.md is a stub-level summary only |

**Question Battery Score: 5 / 20**

---

## Phase 6 — Deployment Parity

1. **`.gitignore`:** Standard Create React App `.gitignore`. `knowledge-base/` is NOT excluded — all 19 KB files are committed and will deploy. Raw PDFs are not in the repo, so they cannot be excluded or included.

2. **`.env.example`:** DELETED (git status shows `D .env.example`). Vercel deployments with no `.env.example` have no documentation of required vars. **`GROQ_API_KEY` is undocumented.**

3. **`vercel.json`:** Sets `maxDuration: 60` for `api/ask-question.js`. No `outputFileTracingIncludes` needed because files are committed in repo (not outside build root). KB files at `knowledge-base/` will be included in the serverless function bundle.

4. **Serverless bundle size:** 19 markdown files total. Largest is Plan-Service-Areas.md (~18K) and Missouri-Cities-Counties.md (~64K). Total KB ≈ 200KB. Well within Vercel's 50MB limit. PDFs are NOT bundled (not in repo), so no size concern there.

5. **`ANTHROPIC_API_KEY` vs `GROQ_API_KEY`:** Code uses `process.env.GROQ_API_KEY` correctly. README documents `ANTHROPIC_API_KEY` — stale. `.env.example` deleted. Must manually add `GROQ_API_KEY` to Vercel project settings; no documentation reminds you to do this.

6. **Ingest script:** None exists. No `npm run ingest`. No vector DB. KB is flat files — no ingestion needed for markdown, but PDFs would require an extraction build step before they could be added.

---

## FINAL VERDICT

### Scores

| Metric | Score | % |
|--------|-------|---|
| **Coverage Score** (wiki knowledge files reachable) | 15 / 28 | 54% |
| **Coverage including raw PDFs** | 15 / 130 | 12% |
| **Plan ID Score** (fully covered = ANOC+EOC+SOB all accessible to app) | 0 / 34 | 0% |
| **Question Battery Score** | 5 / 20 | 25% |

### Critical Issues (ordered by severity)

**CRITICAL-1: All 102 raw PDFs are inaccessible to the app.**  
The `raw/` directory is not in the Vercel app repo. PDFs for every ANOC, EOC, SOB, Formulary, OTC Catalog, LIS tables, Medicare & You, Extra Benefit Cards, and market overview exist only in the Obsidian vault. Zero plan-specific data (copays, drug coverage, annual changes, extra benefits) is answerable from source documents. The app answers these questions using only manually-written markdown summaries or model training data (violating ADR-002).

**CRITICAL-2: Missouri-Cities-Counties.md truncated to 5.5% of content.**  
63,600-char file limited to 3,500 chars at runtime (`api/ask-question.js:69`). Cities beyond the first ~80 entries cannot be looked up. City→county→plan resolution fails silently for the majority of Missouri municipalities. This also causes the Springfield timeout (multi-county city).

**CRITICAL-3: Model is `llama-3.1-8b-instant`, not `claude-opus-4-6` as specified in PRD.**  
Groq's LLaMA model will answer questions from training data when KB evidence is absent (ADR-002 violation). PRD (`Web-App-PRD.md`) explicitly specifies Anthropic's `claude-opus-4-6`.

**CRITICAL-4: `Source-Hierarchy.md` committed to repo but never loaded.**  
`knowledge-base/Source-Hierarchy.md` exists but is absent from `KB_FILES` in `api/ask-question.js`. Question 15 of the battery fails because of this one missing array entry.

**CRITICAL-5: ADR-003 (retrieval-first) not implemented.**  
ADR-003 requires showing evidence (document excerpt + citation) before synthesis. App shows synthesized answer with citations appended at the end. Violates the closed-KB accountability principle.

**CRITICAL-6: CMS Chapter 14 not ingested.**  
`Skill-TrOOP-Question.md` (loaded by the app) explicitly states: "if CMS Chapter 14 is not in raw/, escalate and do not answer." The file is not present in raw/ or knowledge-base/. TrOOP questions will trigger the skill but hit a dead escalation path.

**CRITICAL-7: `.env.example` deleted; README documents wrong API key.**  
New developers cannot determine that `GROQ_API_KEY` is required. README says `ANTHROPIC_API_KEY`. Deployments will silently fail with a 500 error if `GROQ_API_KEY` is not in Vercel environment settings.

### Recommended Next Steps (priority order)

**Priority 1 — Fix Source-Hierarchy.md not loading (30 min)**  
Add to `KB_FILES` array in `api/ask-question.js`. Add keyword triggers: `"source hierarchy", "hierarchy", "which document", "conflicts"`. One file, one array entry.

**Priority 2 — Increase Missouri-Cities-Counties.md limit (15 min)**  
Change `"Missouri-Cities-Counties.md": 3500` to `20000` in `api/ask-question.js:68`. The full file is 63.6K so even 20K only gets ~31%; to cover all cities properly, raise to 63000 or implement a pre-filter (look up only matching cities, not full file).

**Priority 3 — Restore `.env.example` and fix README (15 min)**  
Create `.env.example` with `GROQ_API_KEY=`. Update README to say `GROQ_API_KEY`. This is a deployment safety issue.

**Priority 4 — Extract PDFs and commit text to knowledge-base/ (1-2 days)**  
Run `python -m pdfplumber` or `pdftotext` on every file in `raw/`. Commit extracted text to `knowledge-base/raw-text/`. Add intelligent keyword routing to load the right plan's docs based on H-number mentioned in query. This is the single largest gap — it unlocks 102 files and all 20 question battery items.

**Priority 5 — Switch to Anthropic Claude per PRD (2 hours)**  
Replace `groq-sdk` with `@anthropic-ai/sdk`. Change model to `claude-opus-4-6`. Change env var from `GROQ_API_KEY` to `ANTHROPIC_API_KEY`. Update Vercel env settings. Claude is more likely to respect system prompt constraints (ADR-002) than LLaMA on Groq.

**Priority 6 — Add ADR-005, ADR-006, ADR-007 to KB_FILES (30 min)**  
Three files in `knowledge-base/` are committed but never loaded. Add them with keyword triggers.

**Priority 7 — Implement city pre-filter for county lookup (4 hours)**  
Instead of loading the full 63.6K cities file and truncating, build a lookup: extract city name from query with regex, grep the file for just that city, inject only the matching county line into the prompt. Eliminates truncation problem entirely.

---

## Sign-off

**NOT READY — see Critical Issues.**

Coverage = 12% (raw PDFs excluded) / 54% (markdown only).  
Plan ID Score = 0% (no plan-specific PDF data accessible).  
Question Battery = 5/20 (25%).  
Critical Issues = 7.

The app correctly answers county-based plan lookups, eligibility rules, escalation language, and general coverage questions from its 15 loaded markdown files. It cannot answer any question requiring specific plan documents (copays, formulary entries, annual changes, extra benefits, OTC items, or LIS premiums). The core architecture is sound; the data pipeline to the PDFs is missing.
