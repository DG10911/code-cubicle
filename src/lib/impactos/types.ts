/**
 * IMPACTOS domain model — visual evidence intelligence.
 * Cloudinary is the media system of record: every asset preserves its
 * originalAssetId through all derivatives/transformations. Application
 * entities (Project/Observation/Evidence) live alongside, keyed back to it.
 */

export interface GeoPoint {
  lat: number;
  lng: number;
  place: string;
}

export type MediaKind = "image" | "video";

export interface Asset {
  id: string;
  /** Cloudinary public_id — the source of truth that survives transforms. */
  originalAssetId: string;
  kind: MediaKind;
  projectId: string;
  capturedAt: string; // ISO
  location: GeoPoint;
  /** Cloudinary structured metadata (typed, validated, searchable). */
  structuredMetadata: {
    project_code: string;
    phase: "baseline" | "construction" | "implementation" | "post_project";
    activity: string;
    verified: boolean;
  };
  width: number;
  height: number;
  durationSec?: number;
  /** AI-derived caption. For video this stands in for timestamped analysis. */
  aiCaption: string;
  /** Timestamped observations (video analysis style). */
  segments?: { t: number; description: string }[];
  tags: string[];
  observationIds: string[];
}

/** An AI observation — strictly "observed", never causal. */
export interface Observation {
  id: string;
  assetId: string;
  projectId: string;
  label: string;
  /** Always phrased as an observation, e.g. "drainage structure appears present". */
  statement: string;
  category: "infrastructure" | "environment" | "activity" | "condition";
  confidence: number;
  observedAt: string;
  /** Distinguish machine observation from human/project claim. */
  origin: "ai_observation" | "project_claim";
}

export interface Project {
  id: string;
  code: string;
  name: string;
  org: string;
  region: string;
  location: GeoPoint;
  summary: string;
  phases: { phase: Asset["structuredMetadata"]["phase"]; label: string; date: string }[];
  assetCount: number;
  observationCount: number;
}

export interface SearchResult {
  asset: Asset;
  score: number;
  /** Human-readable reason for the match — never a bare similarity number. */
  reason: string;
  matchedOn: string[];
}

export interface ChangeObservation {
  category: Observation["category"];
  statement: string;
  before: string; // asset id
  after: string; // asset id
  confidence: number;
}

export interface BeforeAfter {
  projectId: string;
  beforePhase: string;
  afterPhase: string;
  before: Asset;
  after: Asset;
  changes: ChangeObservation[];
}

export interface ImpactReport {
  project: Project;
  generatedAt: string;
  executiveSummary: string;
  observedChanges: ChangeObservation[];
  evidenceAssets: string[];
  aiObservations: Observation[];
  projectClaims: Observation[];
  confidence: { evidenceCoverage: number; meanConfidence: number };
  methodology: string;
  limitations: string[];
}
