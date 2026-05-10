---
type: concept
verification: verified
last_updated: 2026-05-09
sources:
  - relevance_ai_agent_prompt_v1.md
summary: The ordered list of documents the assistant consults when answering plan-related questions, plus the topic-based overrides that change the order for specific question types.
---

# Source Hierarchy

## Default hierarchy (plan-specific coverage questions)

For a question about what a specific plan covers, the assistant consults documents in this order:

1. **Evidence of Coverage (EOC)** — primary source for plan-specific coverage. If the answer is in the EOC, that is the answer.
2. **Summary of Benefits (SOB), Formulary, OTC Catalog, Extra Benefits Card** — secondary sources that may clarify or supplement the EOC. Used when the EOC is silent or when the SOB/Formulary contains the structured form of the answer (e.g. a copay table).
3. **Prior Authorization Document** — required reading whenever the question touches PA or DME, regardless of where else the answer appears. See [[answer-dme-or-pa-question]].
4. **CMS Manual Chapters** (e.g. Medicare Prescription Drug Benefit Manual Chapter 14) — used for general Medicare rules that aren't plan-specific (TrOOP, appeals, coordination of benefits, low-income subsidy).
5. **Medicare & You 2026** — the federal annual handbook. Tertiary fallback for general Medicare concepts. Never the primary source for plan-specific or TrOOP carryover questions.

## Topic-based overrides

Three question types override the default order. If a question matches one of these topics, the override applies.

### Drug / Rx / Part D / formulary questions

**Trigger keywords**: tier, tiers, prescription, Rx, drug, medication, script, prescriptions, medications, pharmacy, Part D, formulary.

**Override order**:

1. Plan Formulary (always first — confirms drug is listed, returns tier and PA/ST/QL flags)
2. EOC Part D section (second — cost-sharing, tier definitions, gap coverage)

The Formulary outranks the EOC for drug questions because it is the structured source of truth for "is this drug covered and at what tier."

Skill: [[answer-drug-question]].

### DME / Prior Authorization questions

**Trigger keywords**: DME, durable medical equipment, prior authorization, PA, "is PA required."

**Override**: All three of the following must be searched before answering. None can be skipped.

1. EOC (DME sections + medical benefits chart)
2. Summary of Benefits (DME or medical services section)
3. Prior Authorization for DME Document (specific item + PA rules)

A DME answer based on the EOC alone is incomplete and prohibited.

Skill: [[answer-dme-or-pa-question]].

### TrOOP / out-of-pocket carryover questions

**Trigger keywords**: TrOOP, true out-of-pocket, carryover, accumulation, "does it carry over."

**Override order**:

1. **CMS Medicare Prescription Drug Benefit Manual Chapter 14** (always first — this is the authoritative federal source for TrOOP carryover rules, including the rule that TrOOP DOES carry over when a member changes plans within the same calendar year).
2. EOC (if plan-specific information exists)
3. Medicare & You 2026 (general context only — never the primary source for carryover)

Skill: [[answer-troop-question]].

## Rationale

Why a default hierarchy with topic overrides instead of a single fixed order: see [[adr-004-document-source-hierarchy]].

## Related pages

- [[document-types]]
- [[escalation-language]]
- [[adr-004-document-source-hierarchy]]
- [[answer-drug-question]]
- [[answer-dme-or-pa-question]]
- [[answer-troop-question]]
