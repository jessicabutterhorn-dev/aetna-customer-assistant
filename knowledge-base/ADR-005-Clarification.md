---
type: adr
status: accepted
verification: verified
last_updated: 2026-05-09
adr_number: 005
sources:
  - relevance_ai_agent_prompt_v1.md
summary: Fixed list of triggers that force the assistant to ask before retrieving — plan identity, PLAN-vs-YEAR scope, plan-type scope, and context inheritance.
---

# ADR-005: Mandatory Clarification Before Retrieval

## Context

Aetna Medicare plan names are not unique. "Aetna Medicare Signature (PPO)" is the name of multiple distinct plans across different states, counties, and H-codes — each with different benefits, copays, and networks. If a caller asks "what's the dental benefit for Aetna Medicare Signature?" and the assistant answers from whichever EOC happens to match first, it will be wrong for most callers.

The same problem applies to question-type ambiguity: "Will my deductible carry over?" can mean either "if I switch plans mid-year" (PLAN scope) or "into next plan year" (YEAR scope) — and the answer is different. And to scope ambiguity: "Tell me about DME" might mean DSNP only or all 34 plans in the Heartland market.

If the assistant guesses, it will be confident and wrong. The cure is to refuse retrieval until the question is unambiguous.

## Options considered

1. **Clarify only when truly necessary** — Model decides per-question whether to clarify. Pros: minimal friction for clear questions. Cons: model decisions about "what's clear enough" drift over time and across question types; we can't audit the line.
2. **Clarify on a fixed list of triggers** — Spell out exactly which conditions force a clarifying question, regardless of model judgment. Pros: predictable, auditable, training-document-able for human agents using the assistant. Cons: a few false-positive clarifications on questions that turn out to be unambiguous.
3. **Always confirm before retrieval** — Every question gets a "did I understand correctly?" turn. Pros: zero ambiguity errors. Cons: terrible UX, kills the value prop.

## Decision

**Clarify on a fixed list of triggers.** The assistant must stop and ask before retrieving when any of the following conditions apply:

- **Plan identity is incomplete.** User mentions a plan by name without state + county + H-code. Skill: [[clarify-plan-identity]].
- **PLAN-vs-YEAR scope is ambiguous.** Question contains both "plan" and "year" keywords, or context is unclear. Skill: [[classify-plan-vs-year-scope]].
- **Plan-type scope is ambiguous.** Question could refer to DSNP only vs. all Medicare Advantage plans vs. all 34 Heartland-market plans. The assistant must ask before retrieving.
- **Context inheritance from a prior turn is uncertain.** If the user previously narrowed scope (e.g. "DSNP only") and then asks something broader, the assistant must re-confirm scope rather than continue assuming the narrower frame.

The exact clarifying language for each trigger is captured in [[escalation-language]] and the relevant skill pages.

## Consequences

- **Easier**: Wrong-plan and wrong-scope errors collapse to near-zero. Human agents trust the assistant more because the failure mode is "asks for clarification" rather than "produces confident wrong answer."
- **Harder**: A small fraction of callers feel the friction of being asked something they expected the assistant to infer. We should monitor: are clarification rates higher than ~15% of turns? If so, the trigger list may be too aggressive.
- **To revisit if**: We add a deterministic disambiguation layer (e.g., a CRM lookup that returns the caller's known plan) that lets us skip clarification when we already have the answer.

## Related pages

- [[clarify-plan-identity]]
- [[classify-plan-vs-year-scope]]
- [[escalation-language]]
- [[heartland-market-scope]]
