/**
 * ORCHESTRA domain model — the single source of truth shared by API + UI.
 * Deterministic-first: nothing here calls an LLM at demo time; the LLM-shaped
 * reasoning (intent → schema → plan) is captured as inspectable artifacts.
 */

export type WorkflowState =
  | "CREATED"
  | "PLANNING"
  | "COLLECTING"
  | "PROCESSING"
  | "VALIDATING"
  | "REVIEW"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export const STATE_ORDER: WorkflowState[] = [
  "CREATED",
  "PLANNING",
  "COLLECTING",
  "PROCESSING",
  "VALIDATING",
  "REVIEW",
  "COMPLETED",
];

/** Legal transitions — workflows are never driven by ad-hoc booleans. */
export const TRANSITIONS: Record<WorkflowState, WorkflowState[]> = {
  CREATED: ["PLANNING", "CANCELLED"],
  PLANNING: ["COLLECTING", "FAILED", "CANCELLED"],
  COLLECTING: ["PROCESSING", "FAILED", "CANCELLED"],
  PROCESSING: ["VALIDATING", "FAILED", "CANCELLED"],
  VALIDATING: ["REVIEW", "COMPLETED", "FAILED", "CANCELLED"],
  REVIEW: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  FAILED: ["PLANNING"],
  CANCELLED: [],
};

export function canTransition(from: WorkflowState, to: WorkflowState): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export type FieldType = "string" | "url" | "date" | "money" | "enum" | "list";

export interface SchemaField {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  /** Why the planner decided this field belongs in the schema. */
  rationale: string;
}

export interface PlanStep {
  id: string;
  title: string;
  agent: AgentName;
  /** Human-readable description of the deterministic + reasoning work. */
  detail: string;
  dependsOn: string[];
}

export interface ResearchPlan {
  intent: string;
  entities: string[];
  constraints: Constraint[];
  schema: SchemaField[];
  steps: PlanStep[];
}

export interface Constraint {
  key: string;
  op: "after" | "before" | "equals" | "exists" | "matches";
  value: string;
  label: string;
}

export type AgentName =
  | "Planner"
  | "SourceDiscovery"
  | "Extraction"
  | "Validation"
  | "EntityResolution"
  | "Evidence"
  | "Quality"
  | "Export";

export type SourceType = "public_web" | "official_site" | "registry" | "news" | "social";

export interface Evidence {
  field: string;
  value: string;
  sourceUrl: string;
  sourceType: SourceType;
  sourceReliability: number; // 0..1 prior on the source
  retrievedAt: string;
  evidenceText: string;
  confidence: number; // field-level confidence
}

export interface Conflict {
  field: string;
  values: { value: string; sourceUrl: string; sourceType: SourceType }[];
  status: "needs_review" | "resolved";
  resolution?: string;
}

export type RecordStatus = "publishable" | "needs_review" | "unverified" | "duplicate";

export interface DataRecord {
  id: string;
  fields: Record<string, string | null>;
  evidence: Record<string, Evidence[]>;
  conflicts: Conflict[];
  /** Field-level confidences keyed by field. */
  confidence: Record<string, number>;
  overallConfidence: number;
  status: RecordStatus;
  missingFields: string[];
  duplicateOf?: string;
}

export type OrchestraEventType =
  | "TASK_CREATED"
  | "PLAN_GENERATED"
  | "STATE_CHANGED"
  | "SOURCE_DISCOVERED"
  | "RECORD_EXTRACTED"
  | "RECORD_VALIDATED"
  | "DUPLICATE_FOUND"
  | "EVIDENCE_ATTACHED"
  | "CONFLICT_DETECTED"
  | "STAGE_PROGRESS"
  | "AGENT_TRACE"
  | "TASK_COMPLETED";

export interface OrchestraEvent {
  seq: number;
  t: number; // ms offset from task start
  type: OrchestraEventType;
  payload: Record<string, unknown>;
}

export interface AgentTrace {
  agent: AgentName;
  action: string;
  input: string;
  output: string;
  durationMs: number;
  status: "ok" | "review" | "skipped" | "error";
  source?: string;
  tokenEstimate?: number;
}

export type Stage = "DISCOVERY" | "EXTRACTION" | "VALIDATION" | "DEDUPLICATION" | "EVIDENCE";
export const STAGES: Stage[] = ["DISCOVERY", "EXTRACTION", "VALIDATION", "DEDUPLICATION", "EVIDENCE"];

export interface TaskSummary {
  id: string;
  query: string;
  state: WorkflowState;
  createdAt: string;
  recordCount: number;
  publishableCount: number;
  conflictCount: number;
  evidenceCoverage: number; // 0..1
}
