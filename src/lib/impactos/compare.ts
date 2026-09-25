import type { Asset, BeforeAfter, ChangeObservation, ImpactReport } from "./types";
import { ASSETS, OBSERVATIONS, PROJECTS, assetsByProject, getProject } from "./fixtures";

function pickAsset(projectId: string, phase: Asset["structuredMetadata"]["phase"]): Asset | undefined {
  return assetsByProject(projectId).find((a) => a.structuredMetadata.phase === phase);
}

/**
 * Build a before/after comparison. Change observations are derived from the
 * observations attached to the "after" asset, always phrased as "observed"
 * and linked back to the originating asset ids.
 */
export function buildBeforeAfter(projectId: string, beforePhase: string, afterPhase: string): BeforeAfter | null {
  const before = pickAsset(projectId, beforePhase as Asset["structuredMetadata"]["phase"]);
  const after = pickAsset(projectId, afterPhase as Asset["structuredMetadata"]["phase"]);
  if (!before || !after) return null;

  const afterObs = OBSERVATIONS.filter((o) => o.assetId === after.id && o.origin === "ai_observation");
  const changes: ChangeObservation[] = afterObs.map((o) => ({
    category: o.category,
    statement: o.statement,
    before: before.id,
    after: after.id,
    confidence: o.confidence,
  }));

  // Ensure we surface the canonical flood-resilience changes even if the
  // chosen "after" asset only carries a subset.
  if (projectId === "prj-bihar-flood" && changes.length < 3) {
    for (const o of OBSERVATIONS.filter((x) => x.projectId === projectId && x.origin === "ai_observation")) {
      if (!changes.some((c) => c.statement === o.statement)) {
        changes.push({ category: o.category, statement: o.statement, before: before.id, after: o.assetId, confidence: o.confidence });
      }
    }
  }

  return { projectId, beforePhase, afterPhase, before, after, changes };
}

export function buildReport(projectId: string): ImpactReport | null {
  const project = getProject(projectId);
  if (!project) return null;
  const assets = assetsByProject(projectId);
  const obs = OBSERVATIONS.filter((o) => o.projectId === projectId);
  const aiObservations = obs.filter((o) => o.origin === "ai_observation");
  const projectClaims = obs.filter((o) => o.origin === "project_claim");

  const first = project.phases[0];
  const last = project.phases[project.phases.length - 1];
  const ba = buildBeforeAfter(projectId, first.phase, last.phase);

  const meanConfidence = Number(
    (aiObservations.reduce((a, o) => a + o.confidence, 0) / Math.max(1, aiObservations.length)).toFixed(2),
  );
  const evidenceCoverage = Number((assets.filter((a) => a.observationIds.length > 0).length / assets.length).toFixed(2));

  return {
    project,
    generatedAt: new Date().toISOString(),
    executiveSummary: `Between ${first.date} and ${last.date}, ${assets.length} field assets were captured for ${project.name} (${project.region}). AI review surfaced ${aiObservations.length} visual observations. These describe observed visual conditions only and are separated from ${projectClaims.length} project-reported claim(s).`,
    observedChanges: ba?.changes ?? [],
    evidenceAssets: assets.map((a) => a.id),
    aiObservations,
    projectClaims,
    confidence: { evidenceCoverage, meanConfidence },
    methodology:
      "Assets ingested to Cloudinary as system of record; structured metadata (phase, activity, location) attached per asset. Captions and observations produced per asset and phrased as observations. Before/after pairs selected by phase. No causal inference is performed.",
    limitations: [
      "Observations describe visual appearance only and do not establish causation.",
      "AI observations may miss or misread occluded, low-light, or ambiguous scenes.",
      "Dates rely on capture metadata, which may be inaccurate if device clocks drift.",
      "Fixture media is used for demonstration and is labelled as such.",
    ],
  };
}

export const PROJECT_IDS = PROJECTS.map((p) => p.id);
