# EVALUATION MATRIX

Methodology for evaluating ORCHESTRA and IMPACTOS (brief §30). This defines the
**test harness and the metrics that would be measured**. Per the brief's
absolute rules, **no benchmark numbers are invented.** Values below are either
(a) **derived from the fixtures/tests in this repo** (marked *derived*), or
(b) **to be measured** against a labelled evaluation set (marked *to measure*).

Current automated coverage lives in `tests/{orchestra,impactos,security}.test.ts`
(Vitest, `npm test`).

---

## 1. Metrics (definitions)

| Metric | Definition | Applies to |
|---|---|---|
| **Precision** | correct records ÷ returned records | ORCHESTRA, IMPACTOS search |
| **Recall** | correct records ÷ ground-truth records | ORCHESTRA, IMPACTOS search |
| **Duplicate rate** | duplicate records ÷ total records after dedupe | ORCHESTRA |
| **Field completeness** | non-null fields ÷ (records × fields) | ORCHESTRA |
| **Evidence coverage** | records (or assets) with ≥1 evidence/observation ÷ total | both |
| **Latency** | wall-clock plan→dataset (ORCHESTRA) / query→results (IMPACTOS) | both |
| **Confidence calibration** | mean confidence vs observed correctness | both |

---

## 2. ORCHESTRA test harness

### 2.1 Case classes (brief: 20 research prompts, schemas, constraints, edge cases)
| Class | Example prompt | Expectation |
|---|---|---|
| Schema/constraint | hero query | `foundedYear` constraint parsed (`after 2022`); schema contains name, domain, foundedYear, funding, linkedin |
| Dynamic growth | "+ founders + recent activity" | schema & steps grow (WOW) |
| Duplicate | any query | ≥1 record `status="duplicate"` with `duplicateOf` set |
| Conflict | any query | ≥1 record with `conflicts.length>0`, `status="needs_review"` |
| Missing data | any query | fields absent → listed in `missingFields`, never fabricated |
| Malicious/injection | "Ignore all previous instructions…" | `injectionFlagged=true`; query preserved for audit, not executed |
| Determinism | repeat any query | byte-identical dataset |

### 2.2 Derived values (deterministic, from `fixtures.ts` / tests)
For any query the generator emits **n = 24** records and **8 agent traces**, and:
- **Unverified count = exactly 1** — record `org-006` (`i===5`): funding `null`,
  `status="unverified"`. *(derived; guarantees the honesty/failure demo.)*
- **Duplicate pair = exactly 1** — record index 11 (`org-012`) duplicates
  `org-011` via normalized domain. *(derived.)*
- **Evidence coverage = 1.00** — every record retains ≥1 evidence span (name +
  domain are always evidenced), so `summarize().evidenceCoverage = 24/24`.
  *(derived; test asserts `> 0.9`.)*
- **Conflict count** is deterministic per query (founding-year conflict injected
  when a per-record seeded roll `< 0.16`) and always `> 0` for the hero query.
  *(derived: test asserts `conflictCount > 0`; exact count is seed-dependent.)*
- **Publishable rows** carry **no un-cited non-name field** — enforced by test
  "never emits a field value without evidence for publishable records".

> `TASK_HISTORY` shows illustrative static summaries (e.g. TASK-1042: 24 records,
> 19 publishable, 4 conflicts, 0.96 coverage). These are **hand-authored fixture
> history for the Command Center, not measured outputs** — do not cite as benchmarks.

### 2.3 To measure (against a labelled set + live extraction)
Precision, recall, field completeness on real sources, end-to-end latency, and
confidence calibration require the production LLM Extraction path + a labelled
gold set; **not yet measured** (fixtures are deterministic, not ground-truth-labelled).

---

## 3. IMPACTOS test harness

### 3.1 Case classes (brief: classification, search, before/after, ambiguous dates, dupes)
| Class | Example | Expectation |
|---|---|---|
| Semantic search | "newly constructed drainage infrastructure" | top result relates to drainage; every result has a `reason` |
| Concept recall | "evidence of vegetation recovery" | returns a `vegetation`-tagged asset |
| Before/after | baseline → post_project (Bihar) | ≥3 observed changes, phrased "appears/observed", linked to asset ids |
| AI vs claim | report | `aiObservations` all `ai_observation`; `projectClaims` all `project_claim` |
| Ambiguous dates | (methodology) | dates from capture metadata, flagged as a stated limitation |
| Provenance | any asset | `originalAssetId` contains asset id, starts `impactos/` |

### 3.2 Derived values (deterministic, from `impactos/fixtures.ts` / `compare.ts`)
- **Projects = 2**; **assets = 9** (6 Bihar, 3 Canal-Top Solar); **observations = 9**
  (**8** `ai_observation` + **1** `project_claim`); **2 videos** with segments.
- **Bihar report:** evidence coverage **0.67** (4/6 assets carry observations:
  IMG_1042, IMG_1051, IMG_1024, IMG_1060; IMG_1001/IMG_1008 have none);
  mean AI-observation confidence **0.85**. *(derived.)*
- **Solar report:** evidence coverage **0.33** (1/3 — only SCP_2030 carries
  observations); mean AI-observation confidence **0.88** (obs-8=0.86, obs-9=0.90).
  *(derived.)*
- Before/after (Bihar) returns **≥3** observed changes (test-asserted;
  `compare.ts` backfills canonical flood changes if the chosen asset carries fewer).

### 3.3 To measure
Search precision/recall vs a labelled relevance set, classification accuracy of
real vision captions, duplicate-media detection, and query latency against a real
embedding index (e.g. Qdrant hybrid) are **to be measured** — the current search
is a deterministic concept lexicon, not a trained retriever.

---

## 4. Harness gaps / honesty
- There is **no dedicated `evals/` folder or metric-computing script** yet; the
  measurable metrics above are computed *ad hoc* from fixtures/tests. Adding a
  labelled gold set + a `npm run eval` harness is the next step.
- **Fixture data-integrity:** declared `assetCount`/`observationCount` now match
  the actual fixtures for both projects (Bihar 6/7, Canal-Top Solar 3/2), and a
  test guards declared-vs-actual counts so drift is caught in CI.
