# ORCHESTRA · IMPACTOS — Intelligence Console

Two evidence-first products for **Code Cubicle 6.0**, one principle:
*every answer carries its provenance, its confidence, and its uncertainty.*

- **ORCHESTRA** — *From one sentence to a verified dataset.* A data-intelligence
  OS: a natural-language request becomes a dynamic research plan, an event-driven
  multi-agent run, and a dataset where every field links to its source,
  confidence, and conflicts.
- **IMPACTOS** — *Turn field media into evidence of impact.* Visual evidence
  intelligence on **Cloudinary**: photos and videos become a searchable evidence
  graph with observations, timelines, before/after comparison, and traceable
  impact reports — **observed, never assumed causal.**

> **Status:** the domain engines, agent/evidence contracts, event stream,
> security utilities, **all API routes, and all UI screens are implemented and
> tested** — `next build` passes with 23 routes and the Vitest suite is 24/24.
> The whole demo runs on **deterministic fixtures** and needs no network, API key,
> or Cloudinary account. See [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md#screen-map--implementation-status).

---

## Problem
Answering "which organizations match these criteria — and prove it" costs
analysts hours and yields a spreadsheet with no provenance. Field programs
generate thousands of photos/videos whose *evidence of impact stays trapped* in
the files. Generic AI tools make it worse: they fabricate plausible values with
no citation and hide uncertainty.

## Solution
- **Provenance by default** — every non-null field is bound to a source snippet,
  type, reliability, and retrieval time; publishable rows can't carry an un-cited
  field (test-enforced).
- **Honest uncertainty** — first-class conflicts, `needs_review`, `unverified`,
  and duplicate states; nothing silently resolved.
- **Real event stream** — SSE progress derived from actual events, not a timer.
- **Cloudinary as system-of-record** — `originalAssetId` preserved through every
  transform; structured metadata; observed-not-causal impact reports.

## Architecture
Next.js 15 App Router; API routes are the event-driven backend over pure,
deterministic `src/lib` functions. Full detail, diagrams, agent contracts, and
the workflow state machine: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.

```
NL query → sanitizeQuery → generatePlan → buildDataset → buildEventLog
         → SSE /api/orchestra/run → dataset / export
media   → Cloudinary (originalAssetId) → observations → semanticSearch
         → before/after → impact report
```

Docs pack:
[ARCHITECTURE](docs/ARCHITECTURE.md) ·
[PRODUCT_SPEC](docs/PRODUCT_SPEC.md) ·
[DESIGN_SYSTEM](docs/DESIGN_SYSTEM.md) ·
[DEMO_SCRIPT](docs/DEMO_SCRIPT.md) ·
[EVALUATION_MATRIX](docs/EVALUATION_MATRIX.md) ·
[TECHNICAL_DECISIONS](docs/TECHNICAL_DECISIONS.md) ·
[COMPETITIVE_ANALYSIS](docs/COMPETITIVE_ANALYSIS.md) ·
[JUDGE_QA](docs/JUDGE_QA.md) ·
[RED_TEAM_REPORT](docs/RED_TEAM_REPORT.md)

## Screenshots
_Placeholder — add captured images here._ Suggested set: Landing (`/`),
ORCHESTRA Command Center (`/orchestra`) with the plan + WOW dynamic growth, the
SSE live-execution stages (`/orchestra/run`), an evidence drawer and a conflict
(`/orchestra/dataset`), and the IMPACTOS search / before-after / report screens.
Save under `docs/assets/` and link here.

## Demo
Full ~3-minute timed script for both products, the WOW moment, and the failure
demo: **[docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md)**.

## Technology stack
- **Next.js 15.1**, **React 19**, **TypeScript 5.7 (strict)**
- **Tailwind CSS 3.4** + custom design tokens, lucide-react, zod
- **Cloudinary** — media system-of-record (delivery/transform URLs, structured
  metadata, provenance-preserving `public_id`)
- **Vitest** — deterministic unit tests
- **Roadmap sponsors (architectural, not yet wired):** **Qdrant** (hybrid
  dense+sparse retrieval behind the `SearchResult` contract), **Pathway**
  (streaming ETL / real-time re-index behind the batch fixtures), **n8n** (visual
  orchestration behind the in-code agent/event contracts). Framed honestly as
  swap-in targets — see [docs/TECHNICAL_DECISIONS.md](docs/TECHNICAL_DECISIONS.md#7).

## AI architecture
The LLM reasons at exactly two seams per product, behind typed contracts:
Planner + Extraction (ORCHESTRA), Media Understanding + Semantic Retrieval
(IMPACTOS). Everything else — validation, dedupe, confidence, state transitions,
evidence binding, before/after pairing — is **deterministic code**. In this demo
those two seams are also deterministic (seeded fixtures) so the run is
byte-identical and offline-safe; the contracts don't change when a real model is
plugged in.

## Data provenance
`Evidence` = `{ field, value, sourceUrl, sourceType, sourceReliability,
retrievedAt, evidenceText, confidence }`, attached per field. Drill path:
`row → field → evidence → source → snippet`. Conflicts keep all disagreeing
sources. IMPACTOS preserves each asset's Cloudinary `originalAssetId` through
transforms and separates `ai_observation` from `project_claim`.

## Security
Implemented and unit-tested in `src/lib/security.ts`: prompt-injection scanning
(`sanitizeQuery`, wired into every route), retrieved-content injection scan
(`scanRetrievedContent`), SSRF guard (`isSafeUrl`), upload allow-list
(`isAllowedUpload`), input length cap + control-char stripping. External content
is treated as untrusted **data**, never instructions. **Roadmap:** rate limiting,
audit logs, signed uploads. Details + residual risks:
[docs/RED_TEAM_REPORT.md](docs/RED_TEAM_REPORT.md).

## Setup
```bash
npm install
npm run dev        # http://localhost:3000
npm test           # Vitest (deterministic core)
npm run typecheck  # tsc --noEmit
npm run build      # production build
```

**Environment (all optional — the demo runs fully without them).** Copy
`.env.example` to `.env.local`. Do **not** commit secrets.

| Var | Purpose |
|---|---|
| `CLOUDINARY_CLOUD_NAME` | Serve real Cloudinary transformation URLs (provenance-preserving). Absent → deterministic placeholder delivery. |
| `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Server-side only; signed uploads / structured-metadata writes in a full deployment. |
| `SEARCH_API_KEY` | Live web research for ORCHESTRA (roadmap). Absent → deterministic research engine. |

## Limitations
- Demo data (records + media) is **seeded fixtures**, clearly labelled; not live
  research and not ground-truth-labelled (so precision/recall are not yet
  measured — see [docs/EVALUATION_MATRIX.md](docs/EVALUATION_MATRIX.md)).
- Qdrant/Pathway/n8n are architectural, not integrated. Rate limiting and audit
  logs are not implemented.
- No auth/persistence/multi-tenant (stateless routes over fixtures).

## Future roadmap
1. Wire the Planner/Extraction LLM behind the existing contracts.
2. Integrate Qdrant (retrieval), Pathway (streaming ingest), n8n (orchestration).
3. Real Cloudinary uploads + AI Video Analysis; live web-research path with the
   SSRF/injection guards active end-to-end.
4. Rate limiting, audit logs, persistence, auth; a labelled eval harness
   (`npm run eval`) computing precision/recall/calibration.

---
_Built for Code Cubicle 6.0. Submission target 2026-09-30._
