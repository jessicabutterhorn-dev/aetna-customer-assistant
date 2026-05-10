---
type: concept
verification: working hypothesis
last_updated: 2026-05-09
sources:
  - Aetna_Medicare_Missouri_Heartland_Plans.pdf
  - relevance_ai_agent_prompt_v1.md
summary: The Aetna Medicare Heartland Market is the geographic and plan-set scope this assistant covers. 34 plans across Missouri counties (and, per the v1 prompt, Kansas plans as well — to be confirmed). Anything outside this scope routes to escalation.
---

# Heartland Market Scope

## In-scope plans (34 total)

Full list with Contract-PBP, plan name, and Missouri county service areas: see `raw/Aetna_Medicare_Missouri_Heartland_Plans.pdf`. As of 2026-05-09, one plan (H2663-025, Aetna Medicare Eagle HMO-POS) has its service area marked **pending verification**.

By contract:

- **H1608** (PPO contract): -013, -016, -018, -050, -051, -052, -067 — 7 plans
- **H2663** (HMO / HMO-POS contract): -005, -006, -021, -022, -023, -025*, -026, -041, -042, -043, -052, -056, -057, -061, -063, -064, -069, -098 (CSNP), -102 (CSNP) — 19 plans
- **H5325** (DSNP contract): -003, -004, -005, -006, -012, -013, -014, -015 — 8 plans

*H2663-025 service area is pending verification.

By plan family:

- **PPO**: Aetna Medicare Signature, Elite, Enhanced
- **HMO / HMO-POS**: Aetna Medicare Signature, Signature Extra, Premier, Select, Eagle, Value Plus, Enhanced Extra
- **HMO C-SNP** (Chronic Care): Aetna Medicare Chronic Care
- **HMO D-SNP** (Dual Eligible): Aetna Medicare Dual, Dual Care, Full Dual, Full Dual Care

## Geographic regions (informal grouping)

The 34 plans cluster into roughly four Missouri regions, useful when a caller mentions a county but not a plan:

- **Western Missouri (Kansas City area)**: Caldwell, Clay, Clinton, Jackson, Lafayette, Livingston, Platte, Ray, Saline (often extended with Bates, Benton, Carroll, Cass, Henry, Johnson, Pettis, Vernon)
- **Northwest Missouri**: Andrew, Atchison, Buchanan, Daviess, DeKalb, Gentry, Grundy, Harrison, Holt, Mercer, Nodaway, Worth
- **Southwest Missouri (Springfield-Joplin)**: Barry, Barton, Cedar, Christian, Dade, Dallas, Douglas, Greene, Hickory, Jasper, Laclede, Lawrence, McDonald, Newton, Ozark, Polk, St. Clair, Stone, Taney, Webster, Wright
- **Central / Southeast / St. Louis Missouri**: a long list including Adair, Audrain, Boone, Cape Girardeau, Cole, Franklin, Jefferson, St. Charles, St. Louis, St. Louis City, Ste. Genevieve, and many others

## Out-of-scope

Questions that fall outside the in-scope plans should escalate. Examples:

- Plans in markets other than Heartland (e.g. a caller's plan from another state)
- Plans not in the 34-plan list (different contracts or PBPs)
- Original Medicare-only questions with no plan context (route to general Medicare fallback per [[answer-troop-question]] / [[source-hierarchy]] tertiary level if appropriate)
- Non-Aetna Medicare plans

For out-of-scope plan questions, use the escalation phrases in [[escalation-language]].

## Open questions

- **Kansas plans**: The Relevance AI prompt references "Aetna Medicare Heartland Market documents... for Missouri and Kansas plans." The Aetna_Medicare_Missouri_Heartland_Plans.pdf in `raw/` covers Missouri only. Confirm whether Kansas plans are part of this assistant's scope and ingest Kansas plan documents if so.
- **H2663-025 service area**: marked pending verification on the plan list PDF; resolve to fully complete the in-scope plan set.

## Related pages

- [[document-types]]
- [[clarify-plan-identity]]
- [[escalation-language]]
