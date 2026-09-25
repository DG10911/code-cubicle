import { describe, it, expect } from "vitest";
import { ASSETS, OBSERVATIONS, PROJECTS, assetsByProject } from "@/lib/impactos/fixtures";
import { semanticSearch } from "@/lib/impactos/search";
import { buildBeforeAfter, buildReport } from "@/lib/impactos/compare";
import { deliveryUrl } from "@/lib/impactos/cloudinary";

describe("IMPACTOS fixtures integrity", () => {
  it("every observation references a real asset and project", () => {
    for (const o of OBSERVATIONS) {
      expect(ASSETS.some((a) => a.id === o.assetId), o.id).toBe(true);
      expect(PROJECTS.some((p) => p.id === o.projectId), o.id).toBe(true);
    }
  });

  it("declared project asset/observation counts match the actual fixtures", () => {
    for (const p of PROJECTS) {
      expect(assetsByProject(p.id).length, `${p.id} assetCount`).toBe(p.assetCount);
      expect(OBSERVATIONS.filter((o) => o.projectId === p.id).length, `${p.id} observationCount`).toBe(p.observationCount);
    }
  });

  it("preserves originalAssetId (Cloudinary provenance anchor) on every asset", () => {
    for (const a of ASSETS) {
      expect(a.originalAssetId).toContain(a.id);
      expect(a.originalAssetId.startsWith("impactos/")).toBe(true);
    }
  });
});

describe("IMPACTOS semantic search", () => {
  it("returns explained matches (reason present), not bare scores", () => {
    const results = semanticSearch("newly constructed drainage infrastructure");
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.reason.length).toBeGreaterThan(0);
      expect(r.score).toBeGreaterThan(0);
    }
    // top result should relate to drainage
    expect(results[0].matchedOn.join(" ") + results[0].asset.aiCaption).toMatch(/drain/i);
  });

  it("finds vegetation recovery evidence", () => {
    const results = semanticSearch("evidence of vegetation recovery");
    expect(results.some((r) => r.asset.tags.includes("vegetation"))).toBe(true);
  });
});

describe("IMPACTOS before/after", () => {
  it("builds a comparison with observed (non-causal) changes linked to assets", () => {
    const ba = buildBeforeAfter("prj-bihar-flood", "baseline", "post_project");
    expect(ba).not.toBeNull();
    expect(ba!.changes.length).toBeGreaterThanOrEqual(3);
    for (const c of ba!.changes) {
      expect(c.statement).toMatch(/appear|observed/i); // phrased as observation
      expect(c.before).toBeTruthy();
      expect(c.after).toBeTruthy();
    }
  });
});

describe("IMPACTOS report", () => {
  it("separates AI observations from project claims and lists limitations", () => {
    const report = buildReport("prj-bihar-flood");
    expect(report).not.toBeNull();
    expect(report!.aiObservations.every((o) => o.origin === "ai_observation")).toBe(true);
    expect(report!.projectClaims.every((o) => o.origin === "project_claim")).toBe(true);
    expect(report!.projectClaims.length).toBeGreaterThan(0);
    expect(report!.limitations.length).toBeGreaterThan(0);
    expect(report!.confidence.evidenceCoverage).toBeGreaterThan(0);
  });
});

describe("IMPACTOS cloudinary helper", () => {
  it("produces a deterministic delivery url without a configured cloud", () => {
    const a = deliveryUrl("impactos/prj-bihar-flood/IMG_1042", { w: 800 });
    const b = deliveryUrl("impactos/prj-bihar-flood/IMG_1042", { w: 800 });
    expect(a).toBe(b);
    expect(a).toMatch(/^https:\/\//);
  });
});
