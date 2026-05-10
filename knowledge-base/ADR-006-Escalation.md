---
type: adr
status: accepted
verification: verified
last_updated: 2026-05-09
adr_number: 006
sources:
  - relevance_ai_agent_prompt_v1.md
summary: One canonical phrase per outcome type, single source of truth in escalation-language. Mandatory closing disclaimer on every plan-related answer.
---

# ADR-006: Standard Escalation Language and Mandatory Closing Disclaimer

## Context

The same ambiguous outcomes happen over and over: a document doesn't have the answer, two documents conflict, the question is out of scope. If the model writes a fresh "I don't know" each time, the phrasing drifts. Human agents reviewing transcripts have to re-judge each one. Training new agents on the assistant's output gets confused by 17 variations of "I'm not sure."

Standardized phrases solve this. They also solve a compliance problem: regulated industries need disclaimers on plan-related answers, and "the assistant said it most of the time" is not good enough.

## Options considered

1. **Free-form model phrasing per turn** — Pros: natural variety. Cons: drift, audit pain, compliance risk.
2. **Single canonical phrase per outcome type** — Pros: predictable, auditable, drop-in for compliance review. Cons: feels formulaic. Cons: if the canonical phrase is wrong, every answer is wrong (but also: fixing it is one edit).
3. **Phrase library with rotation** — Several approved phrases per outcome, model picks. Pros: variety with control. Cons: adds complexity for marginal value.

## Decision

**Single canonical phrase per outcome type.** The assistant uses these exact phrases (and only these phrases) for the listed outcomes. Phrases are stored in [[escalation-language]] as the single source of truth.

Outcomes covered:

- Information not found in any source
- Documents conflict or are unclear
- Plan name provided without state/county
- Out-of-scope general Medicare question after KB fallback
- Drug not in formulary
- Coverage not confirmed after EOC + CMS check

A **mandatory closing disclaimer** is appended to every answer that references any Aetna plan document. The exact text is in [[escalation-language]].

## Consequences

- **Easier**: Compliance review (one paragraph to approve, applied everywhere). Training human agents (predictable language). Updating the disclaimer (one file edit).
- **Harder**: Tone. The assistant sounds slightly formal and repetitive. This is the right trade for a customer-service-grade product where compliance matters.
- **To revisit if**: Compliance lets us soften phrasing, or if A/B tests show callers respond better to varied language. Until then: predictability wins.

## Related pages

- [[escalation-language]]
- [[adr-007-no-legal-interpretation]]
- [[adr-002-closed-knowledge-base]]
