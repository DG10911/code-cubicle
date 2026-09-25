import type { Asset, Observation, Project } from "./types";

/**
 * DEMO / FIXTURE DATA for IMPACTOS. Clearly-labelled fictional field programs.
 * Media is served through the Cloudinary helper (deterministic placeholders
 * when no cloud is configured). Observations are phrased as observations,
 * never causal claims.
 */

export const PROJECTS: Project[] = [
  {
    id: "prj-bihar-flood",
    code: "BFR-2024",
    name: "Bihar Flood Resilience",
    org: "Riverline Foundation",
    region: "Bettiah, Bihar, IN",
    location: { lat: 26.802, lng: 84.503, place: "Bettiah" },
    summary: "Drainage reconstruction and embankment works across three wards following recurrent monsoon flooding.",
    phases: [
      { phase: "baseline", label: "Baseline survey", date: "2024-06-10" },
      { phase: "construction", label: "Construction", date: "2025-03-22" },
      { phase: "implementation", label: "Implementation", date: "2026-02-14" },
      { phase: "post_project", label: "Post-project evidence", date: "2026-08-14" },
    ],
    assetCount: 6,
    observationCount: 7,
  },
  {
    id: "prj-solar-canal",
    code: "SCP-2025",
    name: "Canal-Top Solar",
    org: "Surya Collective",
    region: "Mehsana, Gujarat, IN",
    location: { lat: 23.588, lng: 72.369, place: "Mehsana" },
    summary: "Canal-top photovoltaic installation reducing evaporation while generating distributed power.",
    phases: [
      { phase: "baseline", label: "Baseline", date: "2025-01-12" },
      { phase: "construction", label: "Installation", date: "2025-09-30" },
      { phase: "post_project", label: "Post-project", date: "2026-07-19" },
    ],
    assetCount: 3,
    observationCount: 2,
  },
];

function asset(a: Partial<Asset> & Pick<Asset, "id" | "projectId" | "capturedAt" | "aiCaption" | "structuredMetadata">): Asset {
  const proj = PROJECTS.find((p) => p.id === a.projectId)!;
  return {
    originalAssetId: `impactos/${a.projectId}/${a.id}`,
    kind: "image",
    location: proj.location,
    width: 1600,
    height: 1067,
    tags: [],
    observationIds: [],
    ...a,
  } as Asset;
}

export const ASSETS: Asset[] = [
  // Bihar — baseline
  asset({
    id: "IMG_1001",
    projectId: "prj-bihar-flood",
    capturedAt: "2024-06-10T08:20:00Z",
    aiCaption: "Unpaved lane with visible standing water and no drainage channel along the roadside.",
    structuredMetadata: { project_code: "BFR-2024", phase: "baseline", activity: "site survey", verified: true },
    tags: ["road", "standing-water", "baseline"],
  }),
  asset({
    id: "IMG_1008",
    projectId: "prj-bihar-flood",
    capturedAt: "2024-06-10T09:05:00Z",
    aiCaption: "Open field with sparse vegetation adjacent to residential structures.",
    structuredMetadata: { project_code: "BFR-2024", phase: "baseline", activity: "site survey", verified: true },
    tags: ["field", "vegetation", "baseline"],
  }),
  // Bihar — construction
  asset({
    id: "IMG_1024",
    projectId: "prj-bihar-flood",
    capturedAt: "2025-03-22T11:30:00Z",
    kind: "video",
    durationSec: 42,
    aiCaption: "Workers installing pre-cast drainage segments alongside an excavated trench.",
    segments: [
      { t: 3, description: "Excavated trench visible along the roadside" },
      { t: 18, description: "Workers lowering a pre-cast drainage segment" },
      { t: 33, description: "Partially assembled drainage line" },
    ],
    structuredMetadata: { project_code: "BFR-2024", phase: "construction", activity: "drainage installation", verified: true },
    tags: ["drainage", "workers", "construction"],
  }),
  // Bihar — implementation / post
  asset({
    id: "IMG_1042",
    projectId: "prj-bihar-flood",
    capturedAt: "2026-08-14T07:50:00Z",
    aiCaption: "Reconstructed road surface with a visible covered drainage structure along the edge.",
    structuredMetadata: { project_code: "BFR-2024", phase: "post_project", activity: "post survey", verified: true },
    tags: ["road", "drainage", "post"],
  }),
  asset({
    id: "IMG_1051",
    projectId: "prj-bihar-flood",
    capturedAt: "2026-08-14T08:10:00Z",
    aiCaption: "Field area with increased vegetation coverage and no visible standing water.",
    structuredMetadata: { project_code: "BFR-2024", phase: "post_project", activity: "post survey", verified: true },
    tags: ["field", "vegetation", "post"],
  }),
  asset({
    id: "IMG_1060",
    projectId: "prj-bihar-flood",
    capturedAt: "2026-02-14T10:00:00Z",
    aiCaption: "Completed drainage channel carrying flow away from the residential lane.",
    structuredMetadata: { project_code: "BFR-2024", phase: "implementation", activity: "inspection", verified: true },
    tags: ["drainage", "implementation"],
  }),
  // Solar canal
  asset({
    id: "SCP_2001",
    projectId: "prj-solar-canal",
    capturedAt: "2025-01-12T09:00:00Z",
    aiCaption: "Open irrigation canal exposed to direct sunlight with no overhead structure.",
    structuredMetadata: { project_code: "SCP-2025", phase: "baseline", activity: "baseline", verified: true },
    tags: ["canal", "baseline"],
  }),
  asset({
    id: "SCP_2014",
    projectId: "prj-solar-canal",
    capturedAt: "2025-09-30T09:00:00Z",
    kind: "video",
    durationSec: 30,
    aiCaption: "Solar panel array being mounted on a steel frame spanning the canal.",
    segments: [
      { t: 5, description: "Steel mounting frame spanning the canal" },
      { t: 20, description: "Panels being fixed onto the frame" },
    ],
    structuredMetadata: { project_code: "SCP-2025", phase: "construction", activity: "panel installation", verified: true },
    tags: ["solar", "construction"],
  }),
  asset({
    id: "SCP_2030",
    projectId: "prj-solar-canal",
    capturedAt: "2026-07-19T09:00:00Z",
    aiCaption: "Completed canal-top solar array shading the water surface below.",
    structuredMetadata: { project_code: "SCP-2025", phase: "post_project", activity: "post survey", verified: true },
    tags: ["solar", "canal", "post"],
  }),
];

export const OBSERVATIONS: Observation[] = [
  { id: "obs-1", assetId: "IMG_1042", projectId: "prj-bihar-flood", label: "Road surface", statement: "Road surface appears reconstructed and paved.", category: "infrastructure", confidence: 0.9, observedAt: "2026-08-14T07:50:00Z", origin: "ai_observation" },
  { id: "obs-2", assetId: "IMG_1042", projectId: "prj-bihar-flood", label: "Drainage", statement: "A covered drainage structure appears present along the road edge.", category: "infrastructure", confidence: 0.91, observedAt: "2026-08-14T07:50:00Z", origin: "ai_observation" },
  { id: "obs-3", assetId: "IMG_1051", projectId: "prj-bihar-flood", label: "Standing water", statement: "Standing water appears reduced compared with the baseline image.", category: "condition", confidence: 0.78, observedAt: "2026-08-14T08:10:00Z", origin: "ai_observation" },
  { id: "obs-4", assetId: "IMG_1051", projectId: "prj-bihar-flood", label: "Vegetation", statement: "Vegetation coverage appears increased relative to baseline.", category: "environment", confidence: 0.82, observedAt: "2026-08-14T08:10:00Z", origin: "ai_observation" },
  { id: "obs-5", assetId: "IMG_1024", projectId: "prj-bihar-flood", label: "Activity", statement: "Workers appear to be installing drainage segments.", category: "activity", confidence: 0.88, observedAt: "2025-03-22T11:30:00Z", origin: "ai_observation" },
  { id: "obs-6", assetId: "IMG_1042", projectId: "prj-bihar-flood", label: "Program claim", statement: "Project reports 1.2 km of covered drainage completed across three wards.", category: "infrastructure", confidence: 1, observedAt: "2026-08-20T00:00:00Z", origin: "project_claim" },
  { id: "obs-7", assetId: "IMG_1060", projectId: "prj-bihar-flood", label: "Flow", statement: "Drainage channel appears to carry flow away from the lane.", category: "condition", confidence: 0.8, observedAt: "2026-02-14T10:00:00Z", origin: "ai_observation" },
  { id: "obs-8", assetId: "SCP_2030", projectId: "prj-solar-canal", label: "Shading", statement: "Solar array appears to shade the canal water surface.", category: "infrastructure", confidence: 0.86, observedAt: "2026-07-19T09:00:00Z", origin: "ai_observation" },
  { id: "obs-9", assetId: "SCP_2030", projectId: "prj-solar-canal", label: "Array", statement: "A completed photovoltaic array appears installed over the canal.", category: "infrastructure", confidence: 0.9, observedAt: "2026-07-19T09:00:00Z", origin: "ai_observation" },
];

// Wire observation ids back onto assets
for (const o of OBSERVATIONS) {
  const a = ASSETS.find((x) => x.id === o.assetId);
  if (a) a.observationIds.push(o.id);
}

export function assetsByProject(projectId: string): Asset[] {
  return ASSETS.filter((a) => a.projectId === projectId);
}
export function getProject(id: string): Project | undefined {
  return PROJECTS.find((p) => p.id === id);
}
export function getAsset(id: string): Asset | undefined {
  return ASSETS.find((a) => a.id === id);
}
