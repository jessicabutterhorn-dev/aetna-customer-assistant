---
type: skill
verification: verified
last_updated: 2026-05-09
sources:
  - relevance_ai_agent_prompt_v1.md
summary: Handles any question about prescription drugs, formulary tiers, or Part D coverage. Consults the Plan Formulary first, then the EOC Part D section. Strict benefit-type isolation — does not reference DME or medical benefits.
trigger_keywords:
  - tier
  - tiers
  - prescription
  - Rx
  - drug
  - medication
  - script
  - prescriptions
  - medications
  - pharmacy
  - Part D
  - formulary
---

# answer-drug-question

## Trigger

Activates on any question containing one of these keywords:

`tier`, `tiers`, `prescription`, `Rx`, `drug`, `medication`, `script`, `prescriptions`, `medications`, `pharmacy`, `Part D`, `formulary`

Example questions:

- "What tier is metformin on for H1608-018?"
- "Does atorvastatin require prior authorization for H2663-021?"
- "Show me the formulary information for diabetes medications for DSNP plans"

## Inputs required

Before retrieving:

- **Plan H-code, state, and county** — if the user provides plan name only, route to [[clarify-plan-identity]] first.
- **Drug name** — must be specific. If the user asks generically ("what drugs are covered for X condition?"), retrieve the formulary's relevant therapeutic class section rather than guessing a single drug.

## Source consultation order

Per [[source-hierarchy]] topic-based override for drug questions:

1. **Plan Formulary** (always first) — confirm the drug is listed; retrieve the row showing drug name, tier, requirements (PA / ST / QL), notes or restrictions. The Formulary outranks the EOC for "is this drug covered and at what tier."
2. **EOC Part D section** (second) — retrieve cost-sharing, tier definitions, coverage rules, gap coverage. The EOC contextualizes the formulary row.

The assistant must NOT answer after checking only the EOC. Formulary first is mandatory.

## Output format

```
From the Plan Formulary:
> [exact drug row showing drug name, tier, PA/ST/QL flags, notes]

From the EOC Part D Section:
> [relevant cost-sharing, tier definitions, gap coverage, applicable rules]

[Plain-language summary — only after the evidence above is shown.]

This information reflects the 2026 plan documents available in the system. For the most current and up-to-date information, please visit AetnaMedicare.com or contact Aetna Medicare Customer Service.
```

The closing disclaimer is the canonical phrase from [[escalation-language]] and is required on every drug answer.

## Escalation paths

- **Drug not in the formulary**: use the canonical "drug not in formulary" phrase from [[escalation-language]].
- **Formulary listed the drug but EOC has no cost-sharing detail**: present the formulary row, then state "No additional Part D cost-sharing detail found in the EOC for this drug" and append the closing disclaimer.
- **No plan H-code provided**: route to [[clarify-plan-identity]] before retrieving.

## Prohibited behaviors

- **Do not reference DME rules, medical benefit content, or DME prior authorization in a drug answer.** Benefit-type isolation: drug answers stay strictly within Part D content. (See [[adr-007-no-legal-interpretation]] context.)
- **Do not summarize without showing the formulary row first.** Evidence before explanation per [[adr-003-retrieval-first-answering]].
- **Do not guess at a drug if the user's spelling is ambiguous.** Ask for confirmation.
- **Do not answer after consulting only the EOC.** Formulary first is mandatory for drug questions.

## Related pages

- [[source-hierarchy]]
- [[document-types]]
- [[escalation-language]]
- [[clarify-plan-identity]]
- [[adr-003-retrieval-first-answering]]
- [[adr-004-document-source-hierarchy]]
