---
type: skill
verification: verified
last_updated: 2026-05-09
sources:
  - relevance_ai_agent_prompt_v1.md
summary: Handles any question about Durable Medical Equipment (DME) or Prior Authorization (PA). Requires consultation of three sources before answering — EOC, Summary of Benefits, and the Prior Authorization for DME Document. Single-source DME answers are prohibited.
trigger_keywords:
  - DME
  - durable medical equipment
  - prior authorization
  - PA
  - pre-auth
---

# answer-dme-or-pa-question

## Trigger

Activates on any question containing one of these concepts:

- `DME`, `durable medical equipment`
- `prior authorization`, `PA`, `pre-auth`, `is PA required`
- DME-specific items in a coverage context (CPAP, walker, hospital bed, oxygen, wheelchair, nebulizer, etc.) when paired with a coverage or PA question

Example questions:

- "Does plan H2663-005 require prior authorization for CPAP machines?"
- "What DME is covered under H1608-018 and how do I request it?"
- "Find information about prior authorization requirements for all Heartland Market plans."

## Inputs required

- **Plan H-code, state, and county** — route to [[clarify-plan-identity]] if missing.
- **Specific DME item** — if the user asks generically ("what DME is covered?"), retrieve the EOC DME chart and the SOB DME section in full rather than answering with a partial list.
- **Plan-type scope** — if question could span DSNP only vs all plans, ask for scope per [[escalation-language]].

## Source consultation order

Per [[source-hierarchy]] topic-based override for DME/PA questions, **all three** sources must be consulted before answering. None can be skipped.

1. **Evidence of Coverage (EOC)** — DME sections + medical benefits chart. What does the plan cover and at what cost-sharing.
2. **Summary of Benefits (SOB)** — DME or medical services section. Often contains the structured copay or coinsurance summary.
3. **Prior Authorization for DME Document** — search for the specific item; retrieve PA rules and "How to request DME" procedure if applicable.

A DME or PA answer based on fewer than three sources is incomplete and must not be given.

## Output format

```
From the EOC:
> [exact retrieved text from EOC DME / medical benefits section]

From the Summary of Benefits:
> [SOB text covering this DME item or category]

From the Prior Authorization for DME Document:
> [whether the item is listed and what the PA requirements are]

[Plain-language summary — only after all three evidence blocks above are shown.]

This information reflects the 2026 plan documents available in the system. For the most current and up-to-date information, please visit AetnaMedicare.com or contact Aetna Medicare Customer Service.
```

The closing disclaimer is the canonical phrase from [[escalation-language]] and is required on every DME/PA answer.

If the user explicitly asked "how do I request" the item, OR the PA Document specifies that PA-request instructions are required for coverage, also include the "How to request DME" procedure from the PA Document.

## Escalation paths

- **One or more sources contain no relevant content**: state explicitly which source had no content (e.g. "No DME-specific text found in the SOB for this plan and item.") and continue with the remaining sources.
- **Sources conflict**: use the "documents conflict or are unclear" phrase from [[escalation-language]].
- **Item not found in any of the three sources**: use the "I cannot confirm this from the available knowledge base." phrase.

## Prohibited behaviors

- **Do not answer after checking only the EOC.** All three sources required.
- **Do not rely on one document while ignoring the others.** Three sources required.
- **Do not summarize without showing retrieved text from each source.** Evidence before explanation per [[adr-003-retrieval-first-answering]].
- **Do not reference Part D drug PA rules in a DME PA answer.** DME PA and drug PA are separate systems with separate rules.
- **Do not provide a final conclusion unless ALL three sources have been searched.**

## Related pages

- [[source-hierarchy]]
- [[document-types]]
- [[escalation-language]]
- [[clarify-plan-identity]]
- [[adr-003-retrieval-first-answering]]
- [[adr-004-document-source-hierarchy]]
