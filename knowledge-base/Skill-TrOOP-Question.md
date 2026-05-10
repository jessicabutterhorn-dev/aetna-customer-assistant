---
type: skill
verification: verified
last_updated: 2026-05-09
sources:
  - relevance_ai_agent_prompt_v1.md
summary: Handles questions about TrOOP (True Out-of-Pocket) accumulation, carryover, and reset behavior. Consults the CMS Medicare Prescription Drug Benefit Manual Chapter 14 first — it is the authoritative federal source. Never relies on Medicare & You alone.
trigger_keywords:
  - TrOOP
  - True Out-of-Pocket
  - carryover
  - carry over
  - accumulation
---

# answer-troop-question

## Trigger

Activates on any question about Medicare Part D out-of-pocket cost accumulation, including:

- `TrOOP`, `True Out-of-Pocket`
- `carry over`, `carryover`, `accumulation`
- `does it carry over`, `does it reset`
- Any question about whether out-of-pocket costs transfer between plans or reset between years

Example questions:

- "Will my TrOOP carry over from one plan to the next?"
- "Does TrOOP reset at the start of the new year?"
- "What are the general TrOOP rules for Medicare Part D?"

## Inputs required

- **Scope**: PLAN-level (mid-year plan switch) vs YEAR-level (calendar year reset). Apply [[classify-plan-vs-year-scope]] before retrieving.
- **Plan H-code** if the question is plan-specific. General TrOOP questions (federal rules) do not require a specific plan.

## Source consultation order

Per [[source-hierarchy]] topic-based override for TrOOP questions, ALL of the following must be searched in this order:

1. **CMS Medicare Prescription Drug Benefit Manual — Chapter 14** (always first) — the authoritative CMS source for TrOOP carryover rules. The federal rule is that TrOOP DOES carry over when a member changes plans during the same calendar year.
2. **EOC** (second) — only if the question is plan-specific and Chapter 14 referenced plan-level rules.
3. **Medicare & You 2026** (third) — general context only. Never the primary source.

Chapter 14 outranks both the EOC and Medicare & You for carryover questions because it is the authoritative federal source and its rules are uniform across plans.

## Output format

```
From Medicare Prescription Drug Benefit Manual Chapter 14 (CMS authoritative source):
> [exact retrieved text about TrOOP carryover or the relevant rule]

From EOC (if plan-specific information exists):
> [plan-specific TrOOP information if found, otherwise: "No plan-specific TrOOP language found in the EOC."]

From Medicare & You 2026:
> [general Medicare context if relevant, otherwise: "No additional general context found in Medicare & You for this question."]

[Plain-language summary — only after the evidence above is shown. Distinguish PLAN-level vs YEAR-level explicitly.]

[Mandatory closing disclaimer if any Aetna plan document was referenced in the EOC line.]
```

If only Chapter 14 was consulted (purely federal-rule question with no plan-specific component), the closing disclaimer is not required — but include attribution to Chapter 14 as the source.

## Escalation paths

- **Chapter 14 not in `raw/` yet**: do not answer. Use "I cannot confirm this from the available knowledge base." Tell the user the federal source has not been ingested yet. Do not substitute Medicare & You.
- **Question is ambiguous between PLAN and YEAR scope**: trigger [[classify-plan-vs-year-scope]] before retrieving.
- **Conflicting text between Chapter 14 and the EOC**: present both, then use the "documents conflict or are unclear" phrase from [[escalation-language]].

## Prohibited behaviors

- **Never state that "TrOOP does not carry over from one plan to the next" without checking Chapter 14.** This is a known incorrect default that a model may produce from training data.
- **Never rely only on Medicare & You for TrOOP carryover questions.** It is incomplete on this topic.
- **Never generalize that "TrOOP resets" without specifying the context** (new calendar year vs. plan change vs. neither).
- **Always distinguish calendar-year reset from mid-year plan change scenarios** in the plain-language summary.

## Related pages

- [[source-hierarchy]]
- [[document-types]]
- [[escalation-language]]
- [[classify-plan-vs-year-scope]]
- [[adr-004-document-source-hierarchy]]
