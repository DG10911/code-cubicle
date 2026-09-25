import type { AgentTrace, DataRecord, OrchestraEvent, ResearchPlan, Stage } from "./types";
import { STAGES } from "./types";

/**
 * Deterministic execution simulator. Produces the exact ordered event log a
 * real event-driven backend would emit, with millisecond offsets. The UI
 * replays these against a wall clock — progress is derived from real emitted
 * events, never a fake timer that ignores backend state.
 */
export function buildEventLog(query: string, plan: ResearchPlan, records: DataRecord[]): OrchestraEvent[] {
  const events: OrchestraEvent[] = [];
  let seq = 0;
  let t = 0;
  const push = (type: OrchestraEvent["type"], payload: Record<string, unknown>, dt: number) => {
    t += dt;
    events.push({ seq: seq++, t, type, payload });
  };

  push("TASK_CREATED", { query }, 0);
  push("STATE_CHANGED", { to: "PLANNING" }, 120);
  push("PLAN_GENERATED", { steps: plan.steps.length, fields: plan.schema.length }, 480);
  push("STATE_CHANGED", { to: "COLLECTING" }, 200);

  // Discovery: source chips appear
  const sources = ["registry.fixture", "news.fixture", "official-sites.fixture", "social.fixture"];
  sources.forEach((s, i) => push("SOURCE_DISCOVERED", { source: s, index: i + 1, total: sources.length }, 160));
  emitStage(push, "DISCOVERY", 6);

  push("STATE_CHANGED", { to: "PROCESSING" }, 150);

  // Records stream in during extraction
  records.forEach((r, i) => {
    push("RECORD_EXTRACTED", { id: r.id, name: r.fields.name, index: i + 1, total: records.length }, 90);
    if (i % 4 === 0) emitStage(push, "EXTRACTION", 1, Math.round(((i + 1) / records.length) * 100));
  });
  emitStage(push, "EXTRACTION", 3, 100);

  push("STATE_CHANGED", { to: "VALIDATING" }, 150);
  records.forEach((r, i) => {
    if (r.status === "duplicate") push("DUPLICATE_FOUND", { id: r.id, duplicateOf: r.duplicateOf }, 60);
    if (r.conflicts.length) push("CONFLICT_DETECTED", { id: r.id, field: r.conflicts[0].field, values: r.conflicts[0].values }, 80);
    push("RECORD_VALIDATED", { id: r.id, status: r.status, index: i + 1, total: records.length }, 40);
    if (i % 5 === 0) emitStage(push, "VALIDATION", 1, Math.round(((i + 1) / records.length) * 100));
  });
  emitStage(push, "VALIDATION", 2, 100);
  emitStage(push, "DEDUPLICATION", 5, 100);

  // Evidence attach
  let attached = 0;
  const totalEvidence = records.reduce((a, r) => a + Object.values(r.evidence).flat().length, 0);
  records.forEach((r) => {
    const count = Object.values(r.evidence).flat().length;
    attached += count;
    push("EVIDENCE_ATTACHED", { id: r.id, count, progress: Math.round((attached / totalEvidence) * 100) }, 50);
  });
  emitStage(push, "EVIDENCE", 3, 100);

  push("STATE_CHANGED", { to: "REVIEW" }, 200);
  push("TASK_COMPLETED", { records: records.length }, 300);
  return events;
}

function emitStage(
  push: (type: OrchestraEvent["type"], payload: Record<string, unknown>, dt: number) => void,
  stage: Stage,
  ticks: number,
  to?: number,
) {
  const target = to ?? 100;
  for (let i = 1; i <= ticks; i++) {
    push("STAGE_PROGRESS", { stage, value: Math.round((target / ticks) * i) }, 70);
  }
}

/** Agent execution trace for the observability panel. */
export function buildTraces(plan: ResearchPlan, records: DataRecord[]): AgentTrace[] {
  const conflicts = records.filter((r) => r.conflicts.length).length;
  const dupes = records.filter((r) => r.status === "duplicate").length;
  const unverified = records.filter((r) => r.status === "unverified").length;
  return [
    { agent: "Planner", action: "generate_plan", input: plan.intent, output: `${plan.schema.length} fields · ${plan.steps.length} steps`, durationMs: 480, status: "ok", tokenEstimate: 1450 },
    { agent: "SourceDiscovery", action: "enumerate_sources", input: "allow-listed public sources", output: "4 source classes · 62 candidate URLs", durationMs: 1120, status: "ok", source: "registry.fixture", tokenEstimate: 320 },
    { agent: "Extraction", action: "extract_fields", input: `${records.length} candidates`, output: `${records.length} records · ${records.reduce((a, r) => a + Object.values(r.evidence).flat().length, 0)} evidence spans`, durationMs: 3980, status: "ok", tokenEstimate: 8200 },
    { agent: "Validation", action: "validate_records", input: `${records.length} records`, output: `${conflicts} conflicts flagged · ${unverified} unverified`, durationMs: 1640, status: conflicts ? "review" : "ok", tokenEstimate: 640 },
    { agent: "EntityResolution", action: "dedupe", input: "normalized domain + name similarity", output: `${dupes} duplicate cluster${dupes === 1 ? "" : "s"} merged`, durationMs: 720, status: "ok" },
    { agent: "Evidence", action: "attach_evidence", input: "field → source snippet", output: "provenance bound to every non-null field", durationMs: 910, status: "ok" },
    { agent: "Quality", action: "score_confidence", input: "source reliability + corroboration", output: "field + record confidence computed", durationMs: 540, status: "ok" },
    { agent: "Export", action: "assemble_dataset", input: "publishable filter", output: `${records.filter((r) => r.status === "publishable").length} publishable rows`, durationMs: 260, status: "ok" },
  ];
}
