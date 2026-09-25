# RED-TEAM REPORT (brief §36)

Adversarial cases, how the system handles each **today** (with code citations),
residual risk, and status. Honest about mitigated vs roadmap.

Status legend: **✅ Mitigated** · **🟡 Partial** · **⏳ Roadmap**

---

| # | Attack / failure | Current handling (code) | Residual risk | Status |
|---|---|---|---|---|
| 1 | **Malicious prompt** (jailbreak in the query) | `sanitizeQuery` scans `INJECTION_PATTERNS`, returns `{value, flagged}`; `/api/orchestra/plan` returns `injectionFlagged`; treated as data, never executed. Tested. | Regex set is finite; novel phrasings may pass unflagged (query still only *parsed*, never executed) | ✅ Mitigated |
| 2 | **Prompt injection via retrieved webpage** | `scanRetrievedContent(text)` → `{safe, reasons}` flags embedded "ignore instructions / run the following command / reveal system prompt". Tested. | Only exercised once the live-retrieval path exists; heuristic, not exhaustive | 🟡 Partial (built+tested; live path roadmap) |
| 3 | **Duplicate records** | `EntityResolution` dedupe by normalized domain + name similarity; fixtures inject a duplicate pair; `status="duplicate"` + `duplicateOf`. Tested. | Similarity threshold is simple; near-duplicates with different domains may slip | ✅ Mitigated (demo scope) |
| 4 | **Conflicting sources** | `Conflict` retains all values + sources; record → `needs_review`; conflicted-field confidence −0.25. Tested (`conflictCount>0`). | Resolution is manual (by design) | ✅ Mitigated |
| 5 | **Empty results** | Search returns `[]` (valid); screens render the `EmptyState` component; export of empty set is valid. | Empty states are wired across the built screens | ✅ Mitigated |
| 6 | **API failure / network loss** | Demo path uses deterministic fixtures + placeholder media — runs offline. `sse.ts` treats missing `DONE` as complete, aborts cleanly, `onError` handler. | No automatic retry/backoff on the (roadmap) live path | ✅ Mitigated (demo) |
| 7 | **Invalid URLs / SSRF** | `isSafeUrl` allows only http(s), blocks localhost/127./0.0.0.0/10./192.168./169.254./172.16-31/`.internal`/`metadata.`. Tested (incl. `file://`, AWS metadata IP). | Applies to server-side fetch; DNS-rebinding to a public IP that resolves private is not covered | 🟡 Partial (strong for static hosts; live fetch path roadmap) |
| 8 | **Huge datasets** | `sanitizeQuery` caps input at 500 chars; SSE frame wait capped at 500ms; generator fixed at n=24 for the demo. | No pagination/streaming for large real result sets yet | ⏳ Roadmap |
| 9 | **Hallucination trap** ("give me funding you can't verify") | Publishable rows may not carry an un-cited non-name field (test-enforced); insufficient evidence → `null` + `unverified` (`org-006`). | Depends on Extraction honesty in production; guard is structural on publishable set | ✅ Mitigated |
| 10 | **Missing media** | `getAsset`/`getProject` return `undefined`; `buildBeforeAfter`/`buildReport` return `null` → API routes 404 (correct); the built pages handle these with `EmptyState` / graceful fallbacks. | API-null→404 is intentional; UI degrades gracefully | ✅ Mitigated |
| 11 | **Corrupted / disallowed uploads** | `isAllowedUpload` allow-lists jpeg/png/webp/mp4/mov; rejects e.g. `application/x-msdownload`. Tested. | MIME check only; no content/byte sniffing or size cap yet; upload endpoint itself is roadmap | 🟡 Partial |
| 12 | **Contradictory / ambiguous dates** | Dates come from capture metadata; report `limitations[]` explicitly states dates may drift with device clocks; timeline ordered by phase. | No automatic anomaly detection on dates | 🟡 Partial (disclosed, not auto-detected) |
| 13 | **Low-confidence evidence** | Field + `overallConfidence`; `classifyConfidence` bands (high/med/low → impact/warn/danger); conflicts reduce confidence; surfaced, never hidden. | Calibration vs real correctness not yet measured | ✅ Mitigated (surfaced) |
| 14 | **Model timeout / model failure** | Demo has no live model dependency; deterministic engine cannot time out. | Live LLM path needs timeout/fallback policy | ✅ Mitigated (demo) · ⏳ Roadmap (live) |
| 15 | **Cloudinary failure / not configured** | `cloudinaryConfigured()` drives an honest status pill; `deliveryUrl` falls back to deterministic placeholder so layout/timeline/before-after still render. Tested (deterministic URL). | Real upload/transform errors need retry/error UI on the live path | ✅ Mitigated (graceful degrade) |

---

## Cross-cutting residual risks / gaps (honest)
- **Rate limiting & audit logs** (brief §28) are **not implemented** — ⏳ roadmap.
- **Live retrieval / upload paths** don't exist yet, so #2, #7, #11 guards are
  built and unit-tested but not yet exercised end-to-end in a request.
- **UI coverage:** all screens are built and render (`next build` passes with 23
  routes); failure UIs (empty/404/error) use `EmptyState` / graceful fallbacks.
- **Injection/SSRF heuristics are allow/deny lists** — strong for known patterns,
  not a substitute for a hardened production gateway.

## What is solidly demonstrable today
Injection flagging (#1), unverified-not-fabricated (#9), conflict surfacing (#4),
duplicate detection (#3), SSRF/upload allow-lists (#7/#11 as unit tests), and
graceful offline/Cloudinary-absent operation (#6/#15) — all covered by
`tests/{security,orchestra,impactos}.test.ts`.
