# Wiki Migration Plan
**Date:** 2026-05-09  
**Status:** Phase B in progress — PDF extraction complete, Groq migration complete, pending commit + cleanup + smoke test

---

## A.1 — Coverage Analysis

### Summary
All 102 PDFs have been extracted to plaintext in `knowledge-base/raw-text/`. The markdown files in `knowledge-base/` are **partial summaries only** — they are used for keyword routing and general orientation, not as the source of truth for specific plan data. The raw-text extracted files are the authoritative source.

### Markdown files: honest assessment

| File | Coverage rating | Notes |
|---|---|---|
| `Pricing.md` | PARTIAL | Explicitly says H2663-021 as example only. Real data lives in SOB raw-text files. |
| `Coverage-Details.md` | PARTIAL | H2663-021 example only. Real data in EOC/SOB raw-text. |
| `Plans-Overview.md` | PARTIAL | Plan list + H-codes correct, but copay/benefit tables absent. |
| `Eligibility.md` | PARTIAL | General rules correct; plan-specific enrollment periods in ANOCs only. |
| `Exclusions-Limitations.md` | PARTIAL | General exclusions correct; plan-specific exceptions in EOCs. |
| `FAQs.md` | PARTIAL | General Q&A; plan-specific answers need SOB/EOC lookup. |
| `Plan-Service-Areas.md` | YES | Full county-to-plan mapping, accurate for all 34 plans. |
| `Missouri-Cities-Counties.md` | YES | Full city→county lookup. |
| `Escalation-Language.md` | YES | Verbatim escalation phrases, complete. |
| `Source-Hierarchy.md` | YES | Decision logic for conflicting documents, complete. |
| `Heartland-Market-Scope.md` | YES | Market overview, 34-plan scope, complete. |
| `ADR-005-Clarification.md` | YES | Clarification rules, complete. |
| `ADR-006-Escalation.md` | YES | Escalation rules, complete. |
| `ADR-007-No-Legal.md` | YES | No legal interpretation rule, complete. |
| `Skill-Drug-Question.md` | YES | Drug question routing logic, complete. |
| `Skill-TrOOP-Question.md` | YES | TrOOP routing logic, complete. |
| `Skill-DME-PA-Question.md` | YES | DME/PA routing logic, complete. |
| `Skill-Clarify-Plan-Identity.md` | YES | Plan identity clarification logic, complete. |
| `Skill-Classify-Plan-Year-Scope.md` | YES | Plan year scope logic, complete. |

### PDF-to-raw-text coverage (102 PDFs → 103 txt files)

| Category | PDF count | Extracted txt | Coverage |
|---|---|---|---|
| Evidence of Coverage (EOC) | 30 | 30 | YES — full text extracted |
| Annual Notice of Change (ANOC) | 30 | 25 | PARTIAL — 5 ANOCs missing (manifest gap, not extraction gap) |
| Summary of Benefits (SOB) | 32 | 32 | YES — full text extracted |
| Formulary | 5 | 5 | YES — full drug lists extracted |
| Extra Benefit / OTC | 7 | 7 | YES — wallet amounts, OTC catalog extracted |
| Supplemental | 4 | 4 | YES — LIS tables, Medicare & You, Heartland Plans |

**Bottom line:** Markdown alone = invented/incomplete coverage. Markdown + raw-text = full, accurate coverage for all 34 plans. The app currently uses both layers via manifest routing.

---

## A.2 — Plan-ID Data Location

| Data category | Where it lives | Status |
|---|---|---|
| Copay tables | `raw-text/sob/Summary of Benefits H*.txt` | YES — SOB routing wired in ask-question.js |
| Drug formulary entries | `raw-text/formulary/FORMULARY *.txt` | YES — drug keyword + H-number routing wired |
| LIS premiums | `raw-text/supplemental/2026 LIS Premium Summary Table.txt` | YES — LIS keyword routing wired |
| OTC wallet amounts | `raw-text/extra-benefit/*.txt` | YES — OTC keyword routing wired |
| Annual changes (ANOC) | `raw-text/anoc/Annual Notice of Change H*.txt` | YES — year keyword routing wired |
| County service areas | `knowledge-base/Plan-Service-Areas.md` + `Missouri-Cities-Counties.md` | YES — always loaded |
| D-SNP/C-SNP specifics | `raw-text/eoc/Evidence of Coverage H5325*.txt` + SOBs | YES — H-number routing hits correct plan |

---

## A.3 — Wiki Structure

**Decision: `knowledge-base/` is the canonical location. No change needed.**

Current layout (correct):
```
knowledge-base/
├── *.md                  ← skill/ADR/orientation files (keyword-routed)
├── manifest.json         ← routing index for all 102 raw-text files
└── raw-text/
    ├── anoc/             ← 25 ANOC text files
    ├── eoc/              ← 30 EOC text files
    ├── extra-benefit/    ← 7 extra benefit text files
    ├── formulary/        ← 5 formulary text files
    ├── sob/              ← 32 SOB text files
    └── supplemental/     ← 4 supplemental text files
```

`Missouri-Aetna-Plans/` at repo root is a **duplicate** of the `knowledge-base/*.md` files from an earlier session. It should be deleted — it's not referenced by `api/ask-question.js`.

---

## A.4 — Repo Size

| Content | Size | Decision |
|---|---|---|
| Raw PDFs (`raw/`) | 184.9 MB | **Exclude from git** — already in .gitignore via comment |
| Extracted raw-text | 18.8 MB | **Commit** — this is what the app reads |
| Markdown KB files | 510 KB | **Commit** |
| `node_modules/` | ~350 MB | Excluded (in .gitignore already) |
| `.venv/` | ~35 MB | Excluded (in .gitignore already) |

**Repo will be ~20 MB committed.** Well under 100 MB threshold. No git-lfs needed. PDFs stay in Obsidian vault only.

---

## A.5 — Submodule vs Direct Copy

**Direct copy. Already done.**

The wiki and app are the same repo (`Jessica-LLM-Wiki`). No submodule needed. The "wiki" content was never a separate remote — it was Obsidian vault files in the same directory.

---

## A.6 — File Loading

**Current implementation: manifest.json + keyword routing. This is the correct approach.**

The `selectFiles()` function in `api/ask-question.js`:
1. Always loads 2 universal files (Escalation-Language.md, Plan-Service-Areas.md)
2. Extracts H-numbers from the question → routes to specific SOB/EOC/ANOC/Formulary
3. Matches keyword arrays → routes to relevant markdown skill/ADR files
4. Scores and ranks remaining markdown files by keyword match count

This prevents context window overflow: a single formulary is 240KB of text — loading all 5 at once would blow the model context. The routing pulls only what's needed per question.

**No change to file loading architecture needed.** The existing implementation handles plan-ID routing correctly.

---

## A.7 — Hybrid PDF Strategy

**Not needed.** All 102 PDFs are extracted. The `raw/` folder holds the originals for re-extraction only (if content updates). The app never reads PDFs directly — only `raw-text/*.txt`.

---

## A.8 — Phase B: What Remains

### Already done (committed)
- [x] Feature branch `feature/wiki-into-repo` created
- [x] All 102 PDFs extracted to `knowledge-base/raw-text/`
- [x] `manifest.json` created with routing for all extracted files
- [x] `api/ask-question.js` refactored to manifest + keyword routing
- [x] Skill files, ADR files, escalation language added to KB
- [x] Missouri cities/counties, plan service areas added

### Remaining (to be committed now)
- [ ] Commit Groq migration (api/ask-question.js, package.json, vercel.json changes)
- [ ] Delete `Missouri-Aetna-Plans/` duplicate folder
- [ ] Add Obsidian files to .gitignore
- [ ] Clean up untracked Obsidian/doc files from git view
- [ ] Update README with new KB structure
- [ ] Smoke test (5 questions)
- [ ] Push branch

---

## Phase B — Execution Log

### Step 1: Commit Groq migration
Files: `api/ask-question.js`, `package.json`, `vercel.json`, `.claude/settings.local.json`

### Step 2: Cleanup
- Delete `Missouri-Aetna-Plans/` (duplicate)
- Update `.gitignore` to exclude Obsidian vault files and other non-app content

### Step 3: README update

### Step 4: Smoke test — 5 questions

### Step 5: Push `feature/wiki-into-repo`
