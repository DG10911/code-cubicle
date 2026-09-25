# ARCHITECTURE

**Code Cubicle 6.0 — ORCHESTRA + IMPACTOS**
Two products, one repository, one principle: *every answer carries its provenance, confidence, and uncertainty.*

> **Honesty note (read first).** This is a hackathon vertical slice. The **domain
> engines, agent contracts, evidence/provenance model, event stream, security
> utilities, and API routes are fully implemented and unit-tested.** The
> reasoning steps that a production system would delegate to an LLM are, at demo
> time, implemented as **deterministic code over seeded fixtures** so the demo is
> byte-identical every run and survives API/network loss. Where an LLM *would*
> reason in production, this document says so explicitly. UI implementation
> status is tracked in [PRODUCT_SPEC.md](./PRODUCT_SPEC.md#screen-map--implementation-status).

---

## 1. Stack & app structure

| Layer | Technology | Where |
|---|---|---|
| Framework | Next.js 15.1 (App Router) + React 19 | `src/app/**` |
| Language | TypeScript 5.7 (strict) | everywhere |
| Styling | Tailwind CSS 3.4 + design tokens | `tailwind.config.ts`, `src/app/globals.css` |
| Icons | lucide-react | components |
| Validation dep | zod (available) | `package.json` |
| Media SoR | Cloudinary (delivery/transform URLs) | `src/lib/impactos/cloudinary.ts` |
| Tests | Vitest | `tests/*.test.ts` |

The Next.js **API routes are the event-driven backend**. There is no separate
server: route handlers (`runtime = "nodejs"`) call pure, deterministic library
functions in `src/lib/**`. The `src/lib` modules are UI-agnostic and are the
single source of truth shared by API + UI + tests.

```
src/
  app/
    page.tsx                 landing (Intelligence Console)
    orchestra/page.tsx       ORCHESTRA Command Center
    api/
      orchestra/{plan,run,dataset,export}/route.ts
      impactos/{search,report,before-after,projects}/route.ts
  lib/
    orchestra/{types,plan,fixtures,engine}.ts
    impactos/{types,fixtures,search,compare,cloudinary}.ts
    security.ts   utils.ts
  components/
    shell.tsx  ui.tsx
    orchestra/{command-box,nav,task-list}.tsx  orchestra/sse.ts
    impactos/{cloudinary-indicator,nav}.tsx
tests/{security,orchestra,impactos}.test.ts
```

### Deterministic vs LLM reasoning — the boundary

| Concern | Implementation | In production |
|---|---|---|
| Intent → schema → plan | **Deterministic** parser (`plan.ts`, regex/lexicon) emitting a typed `ResearchPlan` | An LLM Planner emits the *same typed artifact*; downstream code is unchanged |
| Field extraction / values | **Fixture** generator (`fixtures.ts`, seeded PRNG) | LLM extraction over retrieved sources, each value cited |
| Validation, dedupe, confidence, state transitions | **Deterministic code** (`engine.ts`, `types.ts`) | Unchanged — deterministic on purpose |
| Semantic media search | **Deterministic** concept lexicon (`search.ts`) with explained matches | Hybrid dense+sparse retrieval (e.g. Qdrant) — same `SearchResult` shape |
| Media understanding / captions / observations | **Fixture** captions + observations (`impactos/fixtures.ts`) | Cloudinary AI analysis / vision model; observations still phrased "observed" |

The architectural point: **the LLM is swappable behind typed contracts.** Nothing
downstream of the plan or extraction knows whether a model or a fixture produced
it, because both emit the same `ResearchPlan` / `DataRecord` / `Asset` types.

---

## 2. ORCHESTRA — from one sentence to a verified dataset

### 2.1 Pipeline

```
Natural language query
  → sanitizeQuery (security)               src/lib/security.ts
  → generatePlan  (intent, entities,       src/lib/orchestra/plan.ts
      constraints, schema, steps)
  → buildDataset  (seeded records +        src/lib/orchestra/fixtures.ts
      evidence + conflicts + dupes)
  → buildEventLog (ordered event stream)   src/lib/orchestra/engine.ts
  → SSE /api/orchestra/run                 src/app/api/orchestra/run/route.ts
  → dataset / export                       .../dataset, .../export
```

### 2.2 Workflow state machine

Workflows are never driven by ad-hoc booleans. States and legal transitions live
in `src/lib/orchestra/types.ts` (`WorkflowState`, `TRANSITIONS`, `canTransition`).

```
        ┌─────────┐
        │ CREATED │
        └────┬────┘
             ▼
        ┌──────────┐
        │ PLANNING │──┐
        └────┬─────┘  │
             ▼        │
      ┌────────────┐  │
      │ COLLECTING │──┤
      └─────┬──────┘  │
            ▼         │
      ┌────────────┐  │  (any active state may go → FAILED or → CANCELLED)
      │ PROCESSING │──┤
      └─────┬──────┘  │
            ▼         │
     ┌─────────────┐  │
     │ VALIDATING  │──┤
     └───┬──────┬──┘  │
         ▼      ▼     │
   ┌────────┐ ┌───────────┐
   │ REVIEW │ │ COMPLETED │
   └───┬────┘ └───────────┘
       ▼
  ┌───────────┐        FAILED ──► PLANNING (retry)
  │ COMPLETED │        CANCELLED / COMPLETED are terminal
  └───────────┘
```

Exact transition table (from `TRANSITIONS`):

| From | Allowed → |
|---|---|
| CREATED | PLANNING, CANCELLED |
| PLANNING | COLLECTING, FAILED, CANCELLED |
| COLLECTING | PROCESSING, FAILED, CANCELLED |
| PROCESSING | VALIDATING, FAILED, CANCELLED |
| VALIDATING | REVIEW, COMPLETED, FAILED, CANCELLED |
| REVIEW | COMPLETED, CANCELLED |
| COMPLETED | — (terminal) |
| FAILED | PLANNING (retry only) |
| CANCELLED | — (terminal) |

`STATE_ORDER` defines the happy path; the test suite asserts it is fully
connected and that illegal jumps (e.g. `CREATED→COMPLETED`) are rejected.

### 2.3 Event-driven backend & SSE

`buildEventLog()` produces the exact ordered log a real event-driven backend
would emit, each event carrying a monotonic `seq` and a millisecond offset `t`.
`/api/orchestra/run` streams them as Server-Sent Events, pacing frames by the
real `t` deltas (compressed by a `speed` factor). The client
(`components/orchestra/sse.ts`) reads frames via `fetch` + `ReadableStream` and
**derives all progress from emitted events — never a local timer.** This is the
brief's "do not fake progress" rule, enforced in code.

Event types (`OrchestraEventType`): `TASK_CREATED`, `PLAN_GENERATED`,
`STATE_CHANGED`, `SOURCE_DISCOVERED`, `RECORD_EXTRACTED`, `RECORD_VALIDATED`,
`DUPLICATE_FOUND`, `EVIDENCE_ATTACHED`, `CONFLICT_DETECTED`, `STAGE_PROGRESS`,
`AGENT_TRACE`, `TASK_COMPLETED`.

```
Client (sse.ts)                 API /run                Engine
   │  GET ?q=&speed  ─────────────►│                       │
   │                               │ generatePlan ─────────►│
   │                               │ buildDataset ─────────►│
   │                               │ buildEventLog ────────►│
   │  ◄── event: TASK_CREATED ─────│                        │
   │  ◄── event: STATE_CHANGED ────│  (paced by t deltas)   │
   │  ◄── event: SOURCE_DISCOVERED │                        │
   │  ◄── event: RECORD_EXTRACTED  │  × N records           │
   │  ◄── event: CONFLICT_DETECTED │                        │
   │  ◄── event: STAGE_PROGRESS    │  → reaches 100/stage   │
   │  ◄── event: TASK_COMPLETED    │                        │
   │  ◄── event: DONE ─────────────│                        │
```

Five progress stages (`Stage`): `DISCOVERY → EXTRACTION → VALIDATION →
DEDUPLICATION → EVIDENCE`, each animated by `BlockMeter` in the UI.

### 2.4 Agent architecture (contracts)

`generatePlan` assigns each `PlanStep` to a named agent (`AgentName`), and
`buildTraces()` emits one observability trace per agent (`AgentTrace`:
agent/action/input/output/durationMs/status/source/tokenEstimate). Contracts
below follow the brief's INPUT / OUTPUT / TOOLS / GUARDRAILS / FAILURE shape.

| Agent | INPUT | OUTPUT | TOOLS | GUARDRAILS | FAILURE |
|---|---|---|---|---|---|
| **Planner** | NL query | `ResearchPlan` (intent, entities, constraints, schema, steps) | requirement parser, field/constraint lexicon | never invents constraints the user didn't state; every field carries a `rationale` | empty query → 400 |
| **SourceDiscovery** | allow-listed source classes | candidate URLs, resolved domains/LinkedIn | source enumerator, URL validator (`isSafeUrl`) | only allow-listed/public sources; reject parked/aggregator/private hosts | skip source, continue |
| **Extraction** | candidates + schema | `DataRecord` fields | field extractor | **never populate a value without a source citation** | leave field null, add to `missingFields` |
| **Validation** | records | `RecordStatus` per record | schema validator, constraint checker | never fabricate to satisfy a constraint | return `needs_review` / `unverified` |
| **EntityResolution** | records | duplicate clusters | normalized-domain + name similarity | keep best-evidenced record, don't silently drop | mark `duplicate`, set `duplicateOf` |
| **Evidence** | field → source snippet | `Evidence[]` per field | snippet binder, timestamp | every non-null field bound to source + `retrievedAt` | field flagged uncovered |
| **Quality** | evidence + corroboration | field + record confidence | reliability prior × corroboration | conflicts subtract confidence, never hidden | low confidence surfaced, not suppressed |
| **Export** | publishable filter | dataset (CSV/JSON) | serializer | review flags travel with the data | empty export is valid output |

*Where the LLM lives:* Planner (intent→plan) and Extraction (source→value) are
the two LLM-reasoning seams. Validation, EntityResolution, Evidence binding,
Quality scoring, and Export are deterministic by design and stay code even in
production.

### 2.5 Evidence & provenance model

`Evidence` (per `types.ts`): `field, value, sourceUrl, sourceType,
sourceReliability (0..1 prior), retrievedAt, evidenceText, confidence`.
`DataRecord` carries `evidence: Record<field, Evidence[]>`, `conflicts`,
per-field + `overallConfidence`, `status`, `missingFields`, and optional
`duplicateOf`. The drill path the brief demands is native to the type:

```
ROW (DataRecord) → FIELD (fields[key]) → EVIDENCE (evidence[key][])
     → SOURCE (sourceUrl, sourceType, sourceReliability) → retrievedAt / evidenceText
```

**Conflicts are first-class:** when sources disagree (`Conflict`), the record is
`needs_review` and both values + sources are retained (never silently resolved).
Confidence for a conflicted field is reduced by 0.25 in `fixtures.ts`.

---

## 3. IMPACTOS — field media into evidence of impact

### 3.1 Pipeline

```
Raw media
  → Cloudinary ingest (originalAssetId = public_id)   impactos/cloudinary.ts
  → structuredMetadata (phase/activity/verified)      impactos/types.ts
  → aiCaption + segments (video) + Observations        impactos/fixtures.ts
  → semanticSearch (concept lexicon, explained)        impactos/search.ts
  → buildBeforeAfter / buildReport                     impactos/compare.ts
  → /api/impactos/{search,before-after,report,projects}
```

### 3.2 Cloudinary as media system-of-record

`cloudinary.ts` builds **real** Cloudinary delivery/transformation URLs when
`CLOUDINARY_CLOUD_NAME` is set, and a **deterministic placeholder** (picsum seed
from the public_id) otherwise — so the layout, timeline, and before/after render
with zero configuration. Critically, **`originalAssetId` (the Cloudinary
`public_id`) is preserved through every transform**: transformation segments are
prepended, the public_id stays the provenance anchor. The test suite asserts
`originalAssetId` contains the asset id and starts with `impactos/` for every
asset. Structured metadata (`toStructuredMetadata`) maps typed app fields to
Cloudinary's typed/validated/searchable structured-metadata payload.

The `CloudinaryIndicator` component **never fakes a live integration** — it shows
"connected" vs "fixture delivery" from the server-computed `cloudinaryConfigured()`.

### 3.3 AI evidence graph

```
PROJECT (Project: code, org, region, phases[])
  ├── LOCATION      (GeoPoint on project + asset)
  ├── TIMELINE      (phases: baseline → construction → implementation → post_project)
  ├── ASSETS        (Asset: originalAssetId, kind, capturedAt, structuredMetadata)
  │     └── SEGMENTS (video: timestamped descriptions)
  ├── OBSERVATIONS  (Observation: statement, category, confidence,
  │                   origin = ai_observation | project_claim)   ← key distinction
  ├── BEFORE / AFTER (BeforeAfter: phase-selected asset pair + ChangeObservation[])
  └── REPORTS       (ImpactReport: exec summary, observed changes, claims, limits)
```

Every `Observation` is tagged `origin: "ai_observation" | "project_claim"`, and
every AI statement is phrased *"appears / observed"* — **never causal.** The
`ImpactReport` keeps `aiObservations` and `projectClaims` in separate arrays and
ships an explicit `limitations[]` list ("Observations describe visual appearance
only and do not establish causation.").

### 3.4 IMPACTOS agents (contracts)

| Agent | INPUT | OUTPUT | TOOLS | GUARDRAILS | FAILURE |
|---|---|---|---|---|---|
| **Media Understanding** | asset bytes | `aiCaption`, `segments[]` (video) | vision/caption model (prod) / fixture caption | describe visible content only | no caption → asset still ingested |
| **Metadata** | asset + context | `structuredMetadata` (phase/activity/verified) | Cloudinary structured metadata | typed + validated fields only | unverified flag |
| **Project Clustering** | assets | `projectId` grouping | project_code, location | keep asset↔project link stable | ungrouped asset flagged |
| **Timeline** | assets by capturedAt | phase-ordered timeline | phase enum, dates | dates from capture metadata, flagged as such | ambiguous date → surfaced |
| **Semantic Retrieval** | NL query | `SearchResult[]` with `reason` | concept lexicon (prod: hybrid dense+sparse) | **return a reason, never a bare score** | empty results is valid |
| **Change Detection** | before/after assets | `ChangeObservation[]` | phase pairing, observation join | "observed", link to asset ids, no causation | <3 changes → backfill from project obs |
| **Report** | project | `ImpactReport` | aggregator | separate AI obs from claims; list limits | unknown project → 404 |

---

## 4. API surface (implemented)

| Route | Method | Input | Output | Notes |
|---|---|---|---|---|
| `/api/orchestra/plan` | POST | `{query}` | `{plan, query, injectionFlagged}` | sanitize + flag injection |
| `/api/orchestra/run` | GET | `?q&speed` | SSE event stream | real event log, paced |
| `/api/orchestra/dataset` | GET | `?q` | `{query, plan, records, traces, summary}` | full assembled dataset |
| `/api/orchestra/export` | GET | `?q&format&publishable` | CSV or JSON download | `Content-Disposition` attachment |
| `/api/impactos/projects` | GET | — | `{projects}` | |
| `/api/impactos/search` | GET | `?q` | `{query, results}` | explained matches |
| `/api/impactos/before-after` | GET | `?project&before&after` | `BeforeAfter` or 404 | phase-selected pair |
| `/api/impactos/report` | GET | `?project` | `ImpactReport` or 404 | AI obs vs claims separated |

All routes run on the Node.js runtime and pass user text through
`sanitizeQuery` first.

---

## 5. Prototype vs production (honest boundary)

**Production-grade already:** typed domain model, explicit state machine, event
stream contract, evidence/provenance model, security utilities (SSRF/injection/
upload guards) with unit tests, Cloudinary provenance-preserving delivery,
deterministic reproducibility.

**Full UI is built:** all ORCHESTRA and IMPACTOS screens render; `next build`
passes with 23 routes (see
[PRODUCT_SPEC.md](./PRODUCT_SPEC.md#screen-map--implementation-status)).

**Prototype / fixture for the demo:** record values and media are seeded
fixtures (clearly labelled); the LLM Planner/Extraction and live web retrieval
are stubbed by deterministic code; Qdrant/Pathway/n8n are **architectural
targets, not wired** (see [TECHNICAL_DECISIONS.md](./TECHNICAL_DECISIONS.md)).
