# JUDGE Q&A (brief §37)

Strong, factual answers to the 16 skeptical-judge questions, grounded in the code.

---

**1. What is genuinely novel?**
The unit of output is not a table — it's **evidence**. Every field carries its
source, reliability, retrieval time, snippet, and confidence (`Evidence` in
`orchestra/types.ts`), and publishable rows *cannot* carry an un-cited field
(test-enforced). Conflicts are first-class objects that retain all disagreeing
sources. For media, every observation is tagged `ai_observation` vs
`project_claim` and phrased "observed", never causal. Provenance + honesty are
the product, not a feature.

**2. Why can't this be a wrapper around an LLM?**
Because the LLM's output is the *least* trusted part. Around it sits: a typed
state machine (`TRANSITIONS`/`canTransition`), deterministic dedupe/validation/
confidence, an evidence-binding layer, a real event stream, and security guards —
all code, all tested. Swap the model out and the contracts
(`ResearchPlan`, `DataRecord`, `SearchResult`) are unchanged. A bare wrapper has
none of this and cannot prove a single claim.

**3. What is technically difficult?**
Provenance that survives (`originalAssetId` preserved through Cloudinary
transforms); an event-sourced progress model with monotonic ordering that the UI
derives progress from (no fake timers); a plan generator that *dynamically*
grows schema+steps from language; conflict/duplicate/unverified handling that
never fabricates; and doing all of it deterministically so it's testable.

**4. Where is the AI actually useful?**
Two seams only: the **Planner** (language → typed plan) and **Extraction**
(source text → cited values) for ORCHESTRA; **media understanding** (captions/
observations) and **semantic retrieval** for IMPACTOS. Everything else is
deliberately deterministic.

**5. Where are deterministic systems used?**
State transitions, validation, deduplication (normalized domain + name),
confidence scoring, evidence binding, export, before/after pairing, and (in this
demo) the whole data layer via a seeded PRNG. See `engine.ts`, `fixtures.ts`,
`compare.ts`, `types.ts`.

**6. How is data verified?**
Field values are bound to sources with a reliability prior; confidence is
computed from source reliability + corroboration and *reduced* on conflict.
Constraints from the query (e.g. `founded after 2022`) become explicit
`Constraint` checks. If evidence is insufficient, the field stays `null` and the
record becomes `unverified` — verification failing is a valid, visible outcome.

**7. How is hallucination handled?**
Structurally prevented: publishable records may not contain an un-cited non-name
field (test: "never emits a field value without evidence"). Missing data goes to
`missingFields`; unverifiable data → `unverified` (record `org-006`, funding
`null`). For media, causal claims are impossible in the type system.

**8. Why is Cloudinary / Qdrant / n8n / Pathway actually necessary?**
- **Cloudinary — necessary and integrated.** Media system-of-record: real
  transformation/delivery URLs that **preserve the public_id** (provenance
  anchor) plus typed structured metadata (`cloudinary.ts`). Without it there is
  no traceable media layer.
- **Qdrant / Pathway / n8n — architectural, honestly not yet wired.** Qdrant is
  the production retrieval index behind `SearchResult` (today a deterministic
  concept lexicon); Pathway is streaming ingest/re-index behind the batch
  fixtures; n8n is visual orchestration behind the in-code agent/event contracts.
  Each sits behind an existing typed contract so adoption changes no downstream
  code. (See [TECHNICAL_DECISIONS.md](./TECHNICAL_DECISIONS.md#7).)

**9. Can this scale?**
The contracts are built for it: event-sourced progress streams, stateless route
handlers over pure functions, a vector-index-shaped retrieval contract, and
Cloudinary handling media/derivatives at CDN scale. The current demo is a
single-node deterministic slice; the scale-out path is swapping stand-ins for
Qdrant (retrieval), Pathway (streaming), and a job runner — no rewrite of the
domain layer.

**10. What happens when the network fails?**
Nothing breaks on the demo path — it uses deterministic fixtures and placeholder
media, so it runs fully offline. The `sse.ts` reader also treats a stream that
ends without `DONE` as complete and aborts cleanly.

**11. What happens when sources disagree?**
A `Conflict` is created retaining every value + source; the record becomes
`needs_review`; the conflicted field's confidence is reduced. We never silently
choose (brief §7).

**12. What happens when the AI is wrong?**
It's caught by deterministic guards (schema/constraint/URL validation), surfaced
as `needs_review`/`unverified`, and — because provenance is attached — a human
can inspect the source and override. Confidence bands (`classifyConfidence`)
flag low-trust fields visually.

**13. What is the business value?**
ORCHESTRA collapses hours of manual, un-auditable research into a reproducible,
evidence-backed, exportable dataset (diligence, GTM, market/competitor mapping).
IMPACTOS turns dormant field media into defensible impact evidence for funders,
audits, and reporting — with the honesty that survives scrutiny.

**14. Who pays for this?**
ORCHESTRA: analyst/research/diligence/GTM teams who today pay in analyst hours.
IMPACTOS: NGOs, sustainability/ESG teams, infrastructure and government programs
who must *prove* impact to funders and regulators.

**15. What would it take to deploy this?**
Set `CLOUDINARY_CLOUD_NAME` (+ server-side key/secret for signed uploads); wire
the Planner/Extraction LLM and a live retrieval index (Qdrant); add rate
limiting, audit logs, persistence, and auth. The `.env.example` already documents
the optional variables, and the app runs today with none of them.

**16. What is prototype vs production architecture?**
**Production-real:** typed domain model, state machine, event/agent contracts,
evidence/provenance model, security utilities (tested), Cloudinary
provenance-preserving delivery, and the **full UI** (all ORCHESTRA + IMPACTOS
screens built; `next build` passes with 23 routes). **Prototype/fixture:** seeded
record + media data and deterministic stand-ins for the LLM and retrieval.
We say so plainly — see [PRODUCT_SPEC.md](./PRODUCT_SPEC.md#screen-map--implementation-status).
