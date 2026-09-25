import { describe, it, expect } from "vitest";
import { generatePlan } from "@/lib/orchestra/plan";
import { buildDataset, summarize } from "@/lib/orchestra/fixtures";
import { buildEventLog, buildTraces } from "@/lib/orchestra/engine";
import { canTransition, STATE_ORDER } from "@/lib/orchestra/types";

const HERO = "Find 100 Indian cybersecurity startups founded after 2022 with verified funding, official website and LinkedIn.";

describe("ORCHESTRA planner", () => {
  it("extracts entities, constraints and dynamic fields from the hero query", () => {
    const plan = generatePlan(HERO);
    expect(plan.entities).toContain("Cybersecurity");
    expect(plan.constraints.some((c) => c.key === "foundedYear" && c.value === "2022")).toBe(true);
    const keys = plan.schema.map((f) => f.key);
    expect(keys).toEqual(expect.arrayContaining(["name", "domain", "foundedYear", "funding", "linkedin"]));
  });

  it("dynamically grows the plan when the request adds requirements (the WOW moment)", () => {
    const base = generatePlan("Find 100 cybersecurity startups founded after 2022");
    const grown = generatePlan("Find 100 cybersecurity startups founded after 2022 with founders and recent activity");
    expect(grown.schema.length).toBeGreaterThan(base.schema.length);
    expect(grown.steps.length).toBeGreaterThan(base.steps.length);
    expect(grown.schema.map((f) => f.key)).toContain("founders");
    expect(grown.schema.map((f) => f.key)).toContain("recentActivity");
  });
});

describe("ORCHESTRA dataset", () => {
  it("is deterministic for a given query", () => {
    const a = buildDataset(HERO);
    const b = buildDataset(HERO);
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
  });

  it("contains an unverified record, a conflict, and a duplicate — honesty cases", () => {
    const records = buildDataset(HERO);
    expect(records.some((r) => r.status === "unverified")).toBe(true);
    expect(records.some((r) => r.conflicts.length > 0)).toBe(true);
    expect(records.some((r) => r.status === "duplicate" && r.duplicateOf)).toBe(true);
  });

  it("never emits a field value without evidence for publishable records", () => {
    const records = buildDataset(HERO);
    for (const r of records.filter((x) => x.status === "publishable")) {
      for (const [k, v] of Object.entries(r.fields)) {
        if (v != null && k !== "name") {
          // every present non-name field either has evidence or is explicitly allowed null
          const evs = r.evidence[k] ?? [];
          expect(evs.length, `${r.id}.${k}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it("summarizes evidence coverage and conflict counts", () => {
    const records = buildDataset(HERO);
    const s = summarize(HERO, records, "COMPLETED", "T-1", new Date().toISOString());
    expect(s.recordCount).toBe(records.length);
    expect(s.evidenceCoverage).toBeGreaterThan(0.9);
    expect(s.conflictCount).toBeGreaterThan(0);
  });
});

describe("ORCHESTRA engine", () => {
  it("emits a monotonic, ordered event log ending in TASK_COMPLETED", () => {
    const plan = generatePlan(HERO);
    const records = buildDataset(HERO);
    const events = buildEventLog(HERO, plan, records);
    for (let i = 1; i < events.length; i++) {
      expect(events[i].seq).toBe(events[i - 1].seq + 1);
      expect(events[i].t).toBeGreaterThanOrEqual(events[i - 1].t);
    }
    expect(events[0].type).toBe("TASK_CREATED");
    expect(events.at(-1)!.type).toBe("TASK_COMPLETED");
    // one RECORD_EXTRACTED per record
    expect(events.filter((e) => e.type === "RECORD_EXTRACTED").length).toBe(records.length);
    // stage progress reaches 100 for every stage
    for (const stage of ["DISCOVERY", "EXTRACTION", "VALIDATION", "DEDUPLICATION", "EVIDENCE"]) {
      const max = Math.max(...events.filter((e) => e.type === "STAGE_PROGRESS" && e.payload.stage === stage).map((e) => e.payload.value as number));
      expect(max, stage).toBe(100);
    }
  });

  it("produces one trace per agent", () => {
    const plan = generatePlan(HERO);
    const records = buildDataset(HERO);
    const traces = buildTraces(plan, records);
    expect(new Set(traces.map((t) => t.agent)).size).toBe(traces.length);
    expect(traces.length).toBe(8);
  });
});

describe("ORCHESTRA state machine", () => {
  it("only allows explicit transitions", () => {
    expect(canTransition("CREATED", "PLANNING")).toBe(true);
    expect(canTransition("PLANNING", "COLLECTING")).toBe(true);
    expect(canTransition("COMPLETED", "PLANNING")).toBe(false);
    expect(canTransition("CREATED", "COMPLETED")).toBe(false);
  });

  it("the happy path is fully connected", () => {
    for (let i = 1; i < STATE_ORDER.length; i++) {
      expect(canTransition(STATE_ORDER[i - 1], STATE_ORDER[i]), `${STATE_ORDER[i - 1]}→${STATE_ORDER[i]}`).toBe(true);
    }
  });
});
