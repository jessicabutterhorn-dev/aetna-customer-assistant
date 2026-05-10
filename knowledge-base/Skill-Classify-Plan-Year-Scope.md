---
type: skill
verification: verified
last_updated: 2026-05-09
sources:
  - relevance_ai_agent_prompt_v1.md
summary: Decides whether a question is asking about movement between plans (PLAN scope) or about behavior across calendar years (YEAR scope). The two have different answers and the assistant must anchor to the user's exact keywords. When ambiguous, ask before retrieving.
trigger_keywords:
  - plan
  - switch plans
  - change plans
  - year
  - next year
  - calendar year
  - carry over
---

# classify-plan-vs-year-scope

## Trigger

Runs as a pre-check on any question that touches carryover, reset, accumulation, deductibles, TrOOP, MOOP, or anything that varies between plans or between years. Specifically, runs when the question contains either set of keywords:

- **PLAN keywords**: `plan`, `switch plans`, `change plans`, `plan to plan`, `switching plans`, `new plan`, `if I change plans`
- **YEAR keywords**: `year`, `next year`, `new year`, `calendar year`, `year to year`, `yearly reset`

## Inputs required

The user's exact wording. The classification is **keyword-anchored**, not vibe-based — the assistant must classify based on what the user actually said, not on what the assistant thinks they meant.

## Source consultation order

This skill is a router — it does no retrieval itself. It dispatches to the appropriate downstream skill ([[answer-troop-question]], [[answer-drug-question]], etc.) once the scope is clear.

## Classification logic

| Question contains | Scope | Behavior |
|---|---|---|
| Only PLAN keywords | PLAN | Begin answer with: "Since you asked about plans, here is the plan-level rule…" Treat as movement between plans within the same calendar year unless the user says otherwise. |
| Only YEAR keywords | YEAR | Begin answer with: "Since you asked about years, here is the year-level rule…" Treat strictly as year-to-year reset, not plan change. |
| Both PLAN and YEAR keywords | AMBIGUOUS | Do not answer. Ask the canonical clarifying question (below). |
| Neither set of keywords but the question depends on the distinction | AMBIGUOUS | Ask the canonical clarifying question. |

## Output format

When PLAN scope is unambiguous, the downstream skill begins its answer with:

> "Since you asked about plans, here is the plan-level rule…"

When YEAR scope is unambiguous, the downstream skill begins its answer with:

> "Since you asked about years, here is the year-level rule…"

When ambiguous, this skill asks (canonical phrase from [[escalation-language]]):

> "Are you asking about switching plans within the same calendar year, or about what happens between different plan years? Please specify."

The assistant must wait for the user's response before retrieving.

## Escalation paths

- **User does not respond with a clear scope** but rephrases or pushes for an answer: hold the line. Re-ask the same canonical clarifying question. Do not infer scope.
- **User says "both"**: answer in two parts, clearly labeled — first the PLAN-level rule, then the YEAR-level rule, with the appropriate opening line for each.
- **Follow-up turn changes scope**: if the user previously asked a YEAR question and then asks a PLAN question (or vice versa), do NOT carry the prior scope forward. Re-anchor to the new question's keywords.

## Prohibited behaviors

- **Do not switch frames (PLAN vs YEAR) without user instruction.** The assistant cannot decide on its own that a "plan" question is "really" a "year" question.
- **Do not assume a "plan" question is actually about year boundaries** (or vice versa).
- **Do not silently widen scope across turns.** A prior PLAN-scope answer does not justify giving a YEAR-scope answer to a follow-up.
- **Always anchor interpretation to the exact keyword(s) the user used.**

## Related pages

- [[escalation-language]]
- [[answer-troop-question]]
- [[adr-005-mandatory-clarification-before-retrieval]]
