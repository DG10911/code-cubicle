# PRODUCT SPEC

**ORCHESTRA** — *From one sentence to a verified dataset.*
**IMPACTOS** — *Turn field media into evidence of impact.*

---

## 1. Problem

**ORCHESTRA.** Answering "which organizations match these criteria, and prove
it" takes analysts hours of manual web research. The output is a spreadsheet
with no provenance: you cannot tell which cell came from where, how confident it
is, or where two sources disagreed. Generic "AI scrapers" make this worse — they
fabricate plausible values with no citation and hide uncertainty.

**IMPACTOS.** Field teams (NGOs, sustainability programs, infrastructure and
government projects) generate enormous volumes of photos and videos. The
*evidence of impact is trapped inside thousands of files*. Existing tools are
galleries: they store media but cannot search it by meaning, compare conditions
over time, or produce a traceable, honest impact report that separates what a
machine *observed* from what a program *claims*.

## 2. Users

| Product | Primary users | Job to be done |
|---|---|---|
| ORCHESTRA | Analysts, researchers, GTM/data teams, diligence teams | "Turn a research question into a reproducible, evidence-backed dataset I can trust and export." |
| IMPACTOS | NGOs, sustainability teams, field programs, infrastructure/government projects, environmental orgs | "Turn our field media into searchable, traceable visual evidence of impact — without overclaiming." |

## 3. Core experience

**ORCHESTRA:** `QUESTION → PLAN → RESEARCH → VERIFY → EVIDENCE → DATASET`.
A natural-language request becomes a dynamically generated research plan (schema
+ steps), an event-driven multi-agent run you can watch live, and a dataset
where every field links to its source, confidence, and conflicts — with honest
`unverified` / `needs_review` / `duplicate` flags.

**IMPACTOS:** `MEDIA → UNDERSTAND → ORGANIZE → SEARCH → COMPARE → EVIDENCE →
IMPACT`. Media on Cloudinary becomes an evidence graph: observations (always
phrased "observed", never causal), semantic search that explains each match, a
phase timeline, before/after change detection linked back to original assets,
and a one-click impact report that separates AI observations from project claims
and lists its own limitations.

## 4. User journeys

### ORCHESTRA (target flow)
1. Command Center → type/pick the hero query → **RUN RESEARCH**.
2. Plan generates: intent, entities, constraints, schema fields (each with a
   *rationale*), and agent-assigned steps.
3. **WOW moment:** adding requirements ("+ founders + recent activity") grows
   the schema and steps dynamically — proven by `generatePlan` and the test
   "dynamically grows the plan".
4. Live execution: SSE events drive stage meters (DISCOVERY→EVIDENCE), source
   chips, streaming records, conflict/duplicate flags.
5. Dataset Explorer: filter/sort, confidence + status, "Why this record?"
   evidence drawer.
6. **Failure demo:** record `org-006` is `unverified` (funding could not be
   verified → value is `null`, not fabricated). An injection query is
   `injectionFlagged`.
7. Export CSV/JSON (optionally publishable-only).

### IMPACTOS (target flow)
1. Projects dashboard → open **Bihar Flood Resilience**.
2. Semantic Search: "evidence of drainage infrastructure" → explained matches.
3. Timeline: baseline → construction → implementation → post_project.
4. Before/After: baseline vs post_project → observed changes linked to assets.
5. Impact Report: exec summary, observed changes, AI observations vs project
   claims, evidence coverage + mean confidence, methodology, limitations.
6. Provenance: every asset traces back to its Cloudinary `originalAssetId`.

## 5. Screen map & implementation status

> **Status (as of the final integration build).** All screens are implemented and
> render; `next build` passes with 23 routes and the full Vitest suite (24/24)
> passes. Every route below is backed by both a `page.tsx` and its API route.

### ORCHESTRA routes
| Route | Screen | Status |
|---|---|---|
| `/orchestra` | Command Center | **Built** (`app/orchestra/page.tsx`) |
| `/orchestra/run` | Plan + WOW plan-edit + live SSE execution | **Built** — API `/api/orchestra/run` |
| `/orchestra/dataset` | Dataset Explorer + Evidence Drawer + AI Explanation + wired CSV/JSON export | **Built** — API `/api/orchestra/dataset`, `/export` |
| `/orchestra/history` | Workflow History | **Built** — `TASK_HISTORY` |
| `/orchestra/trace` | Observability / agent traces | **Built** — `buildTraces` |

### IMPACTOS routes
| Route | Screen | Status |
|---|---|---|
| `/impactos` | Projects dashboard | **Built** |
| `/impactos/project/[id]` | Evidence graph + gallery + asset detail | **Built** — API `/api/impactos/projects` |
| `/impactos/search` | Reason-led Semantic Search | **Built** — API `/api/impactos/search` |
| `/impactos/timeline` | Timeline | **Built** |
| `/impactos/before-after` | Before / After (draggable slider + observed changes) | **Built** — API `/api/impactos/before-after` |
| `/impactos/report` | Impact Report (ReportDocument + print/PDF + copy JSON) | **Built** — API `/api/impactos/report` |
| `/impactos/provenance` | Asset Provenance | **Built** |

### Shared / built
- `/` Landing "Intelligence Console" (`app/page.tsx`) — **Built**.
- `AppShell` (left rail + top bar + persistent fixture indicator) — **Built**.
- UI kit (`components/ui.tsx`): Button, Panel/PanelHeader, Chip, Badge,
  ProgressBar, BlockMeter, ConfidenceMeter, Skeleton, Sparkline, Stat,
  EmptyState — **Built**.

## 6. Definition of Done (brief §40) mapped to reality

### ORCHESTRA
| DoD item | Status | Evidence |
|---|---|---|
| natural-language request works | Logic ✓, UI on `/orchestra` | `plan.ts`, Command Center |
| workflow generated dynamically | ✓ | `generatePlan`, tested WOW growth |
| data collection works | ✓ (fixture) | `buildDataset` |
| data normalized | ✓ | domain/name normalization in plan/dedupe |
| deduplication works | ✓ | injected duplicate pair, `EntityResolution` |
| validation works | ✓ | `RecordStatus`, Validation agent |
| evidence attached | ✓ | `Evidence[]` per field |
| confidence shown | ✓ | field + `overallConfidence`, `ConfidenceMeter` |
| workflow observable | ✓ | SSE events + `buildTraces` |
| task history works | ✓ | `TASK_HISTORY`, `/orchestra/history` |
| dataset searchable | ✓ | `/orchestra/dataset` Explorer + API |
| export works | ✓ | `/api/orchestra/export` CSV/JSON, wired in Explorer |
| failures handled | ✓ | `unverified` record, injection flag |
| UI polished | ✓ | all ORCHESTRA screens built |
| demo deterministic | ✓ | seeded PRNG, byte-identical (tested) |
| security reviewed | ✓ | `security.ts` + tests, see RED_TEAM |

### IMPACTOS
| DoD item | Status | Evidence |
|---|---|---|
| media upload works | Ingest model ✓ (allow-list guard); live upload endpoint roadmap | `Asset`, `isAllowedUpload` |
| Cloudinary genuinely integrated | ✓ (delivery/transform + provenance) | `cloudinary.ts` |
| metadata generated | ✓ | `structuredMetadata` |
| projects represented | ✓ | `PROJECTS`, `/api/impactos/projects` |
| semantic search works | ✓ (explained matches) | `search.ts`, tested |
| timeline works | ✓ | `phases[]`, `/impactos/timeline` |
| before/after works | ✓ | `buildBeforeAfter`, tested |
| evidence traceability works | ✓ | `originalAssetId` preserved, tested |
| report generation works | ✓ | `buildReport`, tested |
| AI limitations shown | ✓ | `limitations[]`, obs vs claims |
| UI polished | ✓ | all IMPACTOS screens built |
| demo deterministic | ✓ | fixtures + deterministic delivery |

## 7. Non-goals / out of scope (this slice)
- No causal-impact claims (IMPACTOS structurally forbids them).
- No live third-party scraping in the demo path (deterministic fixtures instead).
- No auth/multi-tenant, no persistence layer (stateless routes over fixtures).
