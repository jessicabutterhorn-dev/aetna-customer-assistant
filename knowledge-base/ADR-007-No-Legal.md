---
type: adr
status: accepted
verification: verified
last_updated: 2026-05-09
adr_number: 007
sources:
  - relevance_ai_agent_prompt_v1.md
summary: Assistant never declares which document "controls" or is "binding". Presents what each document says; escalates conflicts to a human.
---

# ADR-007: No Legal Interpretation of Source Documents

## Context

It is tempting — for both LLMs and humans — to characterize one document as "controlling" or "authoritative" when answering benefit questions. Lawyers do this in real coverage disputes. The assistant is not a lawyer, has no standing to declare which document controls, and giving callers an opinion on document authority creates two problems: it misrepresents the assistant's role to the caller, and it exposes the operator to liability if the characterization turns out to be wrong in a real coverage dispute.

The Relevance AI prompt explicitly prohibits phrases like "the EOC is the binding source for plan coverage," "the EOC controls," and "the Prior Authorization document provides additional procedural requirements." That prohibition is correct and load-bearing.

## Options considered

1. **Prohibit legal-interpretation phrasing entirely** — Assistant presents what each document says, never characterizes which document "wins" in a conflict. When documents conflict, the assistant escalates to a human (Aetna Medicare Customer Service) using the canonical phrase from [[escalation-language]]. Pros: stays inside the assistant's competence. Pros: limits liability surface. Cons: a few callers will want a definitive answer the assistant cannot give.
2. **Soft preference language only** — Allow "the EOC is generally the most plan-specific source" but prohibit "controls." Pros: gives the caller something. Cons: the line between "preference" and "interpretation" is exactly the kind of thing LLMs cross without realizing.
3. **No prohibition** — Trust the model. Pros: simpler. Cons: this is not a place to be casual; the failure mode is real-money coverage decisions made on bad characterizations.

## Decision

**Prohibit legal-interpretation phrasing entirely.** The assistant must never:

- Declare any document "controls," "is binding," "is authoritative," or "wins" over another document.
- Interpret what a document means *legally* — only what it *says*.
- Tell a caller which document to rely on if multiple documents conflict.

When documents conflict or are unclear, the assistant says so, presents the conflicting text from each, and refers the caller to Aetna Medicare Customer Service using the canonical phrase from [[escalation-language]].

## Consequences

- **Easier**: Liability conversation with legal. Training human agents — the assistant never claims authority it doesn't have. Document conflicts get caught and escalated rather than papered over with confident-sounding interpretation.
- **Harder**: Some callers want a clear answer when sources conflict. The assistant cannot give one. The right answer in that case is to escalate to a human.
- **To revisit if**: Legal sign-off arrives that authorizes specific characterizations (e.g., "the EOC is the contractual document; the SOB is a summary"). Even then, those characterizations should be canonical phrases from [[escalation-language]], not free-form model output.

## Related pages

- [[escalation-language]]
- [[adr-006-standard-escalation-language]]
- [[source-hierarchy]]
