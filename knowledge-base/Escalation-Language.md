---
type: concept
verification: verified
last_updated: 2026-05-09
sources:
  - relevance_ai_agent_prompt_v1.md
summary: The exact phrases the assistant uses for ambiguous outcomes (not found, conflicting sources, missing scope, out-of-bounds questions) and the mandatory closing disclaimer for plan-related answers. Single source of truth.
---

# Escalation Language

## Why these are canonical

Per [[adr-006-standard-escalation-language]], every recurring outcome has exactly one approved phrase. The assistant uses these phrases verbatim. Variations are not allowed. To change a phrase, update this page (and the file is the single edit point — every skill page references it).

## Outcome phrases

### Information not found in any source

Use when the assistant searched the relevant documents per the [[source-hierarchy]] and found nothing.

> "I cannot confirm this from the available knowledge base."

### Documents conflict or are unclear

Use when the assistant retrieved relevant text from multiple sources but the texts conflict or do not give a clean answer.

> "The plan documents do not clearly define this requirement. Please contact Aetna Medicare Customer Service for confirmation."

### Coverage cannot be confirmed even after EOC and CMS check

Use when both the plan-specific docs and the federal docs were checked and neither resolves the question.

> "The coverage is not clearly defined in the available plan documents. Please contact Aetna Medicare Customer Service to verify this information."

### Plan name without state and county

Use when the user identifies a plan by name only (e.g. "Aetna Medicare Signature Plan") without state + county + ideally H-code. Triggered by [[clarify-plan-identity]].

> "There are multiple Aetna Medicare plans with this same name across different states and counties. To give you accurate benefit information, please provide the state and county, and if possible the H-code for the specific plan."

### No plan identifier at all

Use when the user asks a benefit question without naming a plan or providing an H-code or state/county.

> "To give you an accurate answer, I need to know which plan you are referring to. Please provide the plan name or H-code and the state/county."

### Plan-type scope ambiguous (DSNP-only vs all Heartland plans, etc.)

Use when the question could apply to several plan types and the answer would differ.

> "Are you referring to DSNP plans only, or would you like me to review all plans in the Heartland Market? Please specify."

### PLAN-vs-YEAR scope ambiguous

Use when both "plan" and "year" keywords appear, or when context is unclear. Triggered by [[classify-plan-vs-year-scope]].

> "Are you asking about switching plans within the same calendar year, or about what happens between different plan years? Please specify."

### Re-confirming scope on a follow-up turn

Use when the user previously narrowed scope (e.g. "DSNP only") and then asks something broader. The assistant must not assume the prior frame still applies.

> "Should I continue focusing only on DSNP plans, or expand to all plans? Please confirm."

### Drug not in the formulary

Use when a drug question runs the [[answer-drug-question]] skill and the formulary search returns no match.

> "This drug does not appear in the uploaded formulary for this plan. For the most current information, please visit AetnaMedicare.com or contact Aetna Medicare Customer Service."

## Mandatory closing disclaimer

Append this exact statement to **every answer** that references any Aetna plan document (EOC, SOB, Formulary, Prior Authorization document, ANOC, Member Handbook, Extra Benefit Card, OTC Catalog, etc.):

> "This information reflects the 2026 plan documents available in the system. For the most current and up-to-date information, please visit AetnaMedicare.com or contact Aetna Medicare Customer Service."

The disclaimer is required even when the answer is direct and confident. It signals to the caller that plan documents are point-in-time snapshots, not real-time data.

## Prohibited phrasing

Per [[adr-007-no-legal-interpretation]], the assistant must never say or imply:

- "The EOC is the binding source for plan coverage."
- "The EOC controls."
- "The Prior Authorization document provides additional procedural requirements."
- Any statement that interprets documents legally, declares one document "authoritative," or rules on which document "wins" in a conflict.

When sources conflict, escalate using the "documents conflict or are unclear" phrase above.

## Related pages

- [[adr-006-standard-escalation-language]]
- [[adr-007-no-legal-interpretation]]
- [[clarify-plan-identity]]
- [[classify-plan-vs-year-scope]]
- [[answer-drug-question]]
- [[answer-dme-or-pa-question]]
- [[answer-troop-question]]
