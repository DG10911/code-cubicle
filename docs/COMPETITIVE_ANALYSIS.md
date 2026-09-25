# COMPETITIVE ANALYSIS (brief §1)

No specific competitor projects are invented. This analyzes *categories* of
likely hackathon approaches and where ORCHESTRA + IMPACTOS differ, grounded in
what the code actually does.

---

## A. What a typical team will probably build
- **General track:** a "prompt → LLM → table" app — send the question to an LLM,
  ask for JSON, render a grid. Optionally a scraping step glued to the model.
- **Cloudinary track:** an upload-and-gallery app — push media to Cloudinary,
  auto-tag, maybe a caption, display a grid with filters. Cloudinary appears as a
  storage/CDN badge.

## B. Why those solutions feel generic
- **No provenance.** The LLM emits values with no source; a judge cannot verify a
  single cell. Confidently wrong is indistinguishable from right.
- **Hidden uncertainty.** No conflict handling, no "unverified" — the model
  always answers, so it always looks the same whether it knows or not.
- **Fake liveness.** Progress bars run on timers unrelated to real work.
- **Sponsor-as-badge.** Cloudinary in the footer; Qdrant/Pathway/n8n named but
  doing nothing architecturally.
- **Causal overreach (media).** "The project improved the road" from a photo —
  not defensible.

## C. What makes ours memorable
- **Click any claim to its source.** `Evidence` per field (sourceUrl, type,
  reliability, retrievedAt, snippet, confidence); publishable rows cannot carry an
  un-cited field (test-enforced).
- **Honesty as a feature.** Deterministic `unverified` record (`org-006`,
  funding `null`), first-class `Conflict` (both values + sources retained),
  `needs_review` / `duplicate` states — surfaced, not hidden.
- **Real event stream.** SSE with monotonic `seq`/`t`; UI derives progress from
  emitted events (`sse.ts`), not a timer.
- **Dynamic plans (WOW).** Adding requirements grows the schema *and* steps
  (`generatePlan`, test-proven) — visibly not hard-coded.
- **Cloudinary as system-of-record.** `originalAssetId` preserved through every
  transform; structured metadata; observations phrased *observed*, never causal,
  with AI-vs-claim separation and explicit limitations.
- **Deterministic-where-it-counts.** Typed state machine, dedupe, confidence, and
  validation are code; the LLM only reasons behind swappable contracts.

## D. What is realistically buildable by 2026-09-30
**Already done:** full domain models, plan/engine/fixtures, evidence/provenance,
state machine, SSE, security utils, Cloudinary provenance delivery, all API
routes, Vitest suite (24/24), and the **full UI for both products** — every
ORCHESTRA (`/run`, `/dataset`, `/trace`, `/history`) and IMPACTOS (dashboard,
`project/[id]`, `search`, `timeline`, `before-after`, `report`, `provenance`)
screen renders; `next build` passes with 23 routes.
**Achievable next (highest demo value first):**
1. Wire the Planner/Extraction LLM behind the existing typed contracts.
2. One real live path (a real Cloudinary cloud; one real search/retrieval call).
**Not realistic (and unnecessary) by the deadline:** production Qdrant/Pathway/n8n
integrations, auth/multi-tenant, live large-scale scraping.

## E. What NOT to build
- A giant single agent (the brief warns against it; we use typed agent contracts).
- Live scraping on the demo path (fragile — deterministic fixtures instead).
- Decorative sponsor integrations (kept as honest roadmap, not fake badges).
- Causal-impact claims from imagery (structurally forbidden in IMPACTOS types).
- More features over one perfect story (brief §42).

## F. What the 180-second demo must prove
1. A sentence becomes a **dynamic** plan (WOW: it grows).
2. Progress is **real** (event-driven), not faked.
3. Every field is **evidence-backed** and clickable to source.
4. The system is **honest** — unverified, conflicts, duplicates, injection-flagged.
5. **Cloudinary is load-bearing** — provenance preserved, structured metadata,
   observed-not-causal reports with limitations.
6. It **survives failure** — deterministic fixtures run with no network/API.

See [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) for the timed path and
[JUDGE_QA.md](./JUDGE_QA.md) for the skeptical-judge answers.
