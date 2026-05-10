---
type: skill
verification: verified
last_updated: 2026-05-09
sources:
  - relevance_ai_agent_prompt_v1.md
  - Aetna_Medicare_Missouri_Heartland_Plans.pdf
summary: When a user asks a benefit question without identifying the specific plan, this skill blocks retrieval and asks the canonical clarifying question. Aetna plan names are reused across markets, so a name alone is never enough.
---

# clarify-plan-identity

## Trigger

Activates when the user asks a benefit, coverage, or plan-specific question and any of the following are missing:

- **Plan H-code** (e.g. H1608-018) — the unambiguous identifier
- **State**
- **County**

Triggers especially when the user names a plan generically. Examples:

- "What is the copay for DME for the Aetna Medicare Signature Plan?" (plan name reused across many H-codes)
- "What does the Aetna Medicare Premier Plan cover?"
- "What is the dental benefit for Aetna Medicare Advantage Plan?"
- Any question where the plan name is generic, reused nationally, or accompanied by no state/county.

## Inputs required

This is the clarification skill itself — its job is to *gather* the inputs that other skills need. The output of this skill (once the user responds) becomes the input to whichever downstream skill matches the user's actual question.

## Source consultation order

Before asking, the assistant may consult `raw/Aetna_Medicare_Missouri_Heartland_Plans.pdf` to recognize whether the named plan exists in the Heartland market and produce a more useful clarification. But the assistant must NOT retrieve from EOCs, SOBs, or formularies until the user has clarified.

## Output format

When the user provides a plan name only (no state/county):

> "There are multiple Aetna Medicare plans with this same name across different states and counties. To give you accurate benefit information, please provide the state and county, and if possible the H-code for the specific plan."

When the user provides no plan identifier at all:

> "To give you an accurate answer, I need to know which plan you are referring to. Please provide the plan name or H-code and the state/county."

Both phrases are canonical and stored in [[escalation-language]].

After the user responds with state + county (and ideally H-code), the assistant resolves to a specific plan using `raw/Aetna_Medicare_Missouri_Heartland_Plans.pdf` and proceeds to the downstream skill matching the original question.

## Escalation paths

- **User responds with state + county but the combination resolves to multiple plans of the same name** (e.g. several "Aetna Medicare Signature" plans cover overlapping counties): present the matching H-codes and ask the user to confirm one. Example response:
  > "Three plans named Aetna Medicare Signature cover [county]: H1608-016 (PPO), H2663-026 (HMO-POS), and H2663-061 (HMO-POS Extra). Which one is the caller's plan? The H-code is on the front of their member ID card."
- **User responds with a state/county outside the Heartland market** (currently Missouri only — verify Kansas status per [[heartland-market-scope]]): use the out-of-scope escalation, recommend Aetna Medicare Customer Service.
- **User does not respond with an identifier and pushes for an answer**: hold the line. The assistant may explain why identification is required ("the same plan name covers different benefits in different counties") but must not retrieve until the plan is identified.

## Prohibited behaviors

- **Do not retrieve from any plan-specific document until the plan is identified.** This is the load-bearing constraint of this skill.
- **Do not guess at the plan based on context cues** (most popular plan, plan from a previous conversation, default to DSNP, etc.).
- **Do not suggest a plan to the user.** Ask for the H-code or state + county and let the user supply it.

## Related pages

- [[escalation-language]]
- [[heartland-market-scope]]
- [[document-types]]
- [[adr-005-mandatory-clarification-before-retrieval]]
