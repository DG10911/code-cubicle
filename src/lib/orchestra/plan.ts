import type { ResearchPlan, SchemaField, PlanStep, Constraint } from "./types";

/**
 * Deterministic requirement parser. This is intentionally NOT an LLM call:
 * at demo time we need identical, inspectable behaviour. In production this is
 * where a Planner LLM would emit the same typed artifact (schema + plan), which
 * downstream deterministic agents then execute. The UI presents this as
 * "What I understood / What I plan to do".
 */

interface FieldSpec {
  match: RegExp;
  field: SchemaField;
  step?: Omit<PlanStep, "id" | "dependsOn">;
}

const BASE_FIELDS: SchemaField[] = [
  { key: "name", label: "Organization", type: "string", required: true, rationale: "Primary entity name is the record key." },
  { key: "domain", label: "Website", type: "url", required: true, rationale: "Official domain anchors identity resolution and evidence." },
];

const OPTIONAL_FIELDS: FieldSpec[] = [
  {
    match: /(fund|raise|raised|investment|seed|series|valuation)/i,
    field: { key: "funding", label: "Funding", type: "money", required: false, rationale: "User asked for funding evidence — treated as verifiable, source-backed field." },
    step: { title: "Verify funding evidence", agent: "Extraction", detail: "Locate funding rounds in news/registry sources; attach source text. Never infer an amount without a citation." },
  },
  {
    match: /(founder|ceo|co-?founder|leadership|team)/i,
    field: { key: "founders", label: "Founders", type: "list", required: false, rationale: "Founder extraction requested — resolved from official/LinkedIn sources." },
    step: { title: "Extract founders", agent: "Extraction", detail: "Extract named founders from official + LinkedIn sources; keep per-name provenance." },
  },
  {
    match: /(linkedin)/i,
    field: { key: "linkedin", label: "LinkedIn", type: "url", required: false, rationale: "LinkedIn URL requested — resolved and URL-validated." },
    step: { title: "Resolve LinkedIn", agent: "SourceDiscovery", detail: "Resolve the organization's LinkedIn company page and validate the URL points to the right entity." },
  },
  {
    match: /(recent activity|active|recently|latest|news|traction)/i,
    field: { key: "recentActivity", label: "Recent Activity", type: "string", required: false, rationale: "Recency signal requested — captured as a dated observation, not a claim." },
    step: { title: "Verify recent activity", agent: "Extraction", detail: "Capture the most recent dated public signal (news, release, hiring) as an observation with a timestamp." },
  },
  {
    match: /(location|city|hq|headquarter|based)/i,
    field: { key: "location", label: "Location", type: "string", required: false, rationale: "Location requested — normalized to city, country." },
  },
];

const SECTORS = ["cybersecurity", "fintech", "saas", "climate", "healthtech", "ai", "logistics", "edtech"];
const GEOS = ["indian", "india", "us", "european", "singapore", "uk"];

export function generatePlan(query: string): ResearchPlan {
  const q = query.toLowerCase();

  // Entities
  const sector = SECTORS.find((s) => q.includes(s));
  const geo = GEOS.find((g) => q.includes(g));
  const entities: string[] = [];
  if (geo) entities.push(cap(geo === "india" ? "Indian" : geo));
  if (sector) entities.push(cap(sector));
  entities.push(/compan/i.test(q) ? "Companies" : "Startups");

  // Constraints
  const constraints: Constraint[] = [];
  const yearMatch = q.match(/after\s*(\d{4})/) || q.match(/since\s*(\d{4})/) || q.match(/founded\s*(?:after|in)?\s*(\d{4})/);
  if (yearMatch) {
    constraints.push({ key: "foundedYear", op: "after", value: yearMatch[1], label: `Founded after ${yearMatch[1]}` });
  }
  if (/verif|public/i.test(q)) {
    constraints.push({ key: "evidence", op: "exists", value: "public", label: "Publicly verifiable evidence required" });
  }
  const countMatch = q.match(/(\d{2,4})\s*(?:companies|startups|orgs|organi[sz]ations)/);
  const targetCount = countMatch ? parseInt(countMatch[1], 10) : 100;

  // Schema
  const schema: SchemaField[] = [...BASE_FIELDS];
  if (constraints.some((c) => c.key === "foundedYear")) {
    schema.push({ key: "foundedYear", label: "Founded", type: "date", required: true, rationale: "Constraint on founding year requires a verifiable field." });
  }
  const dynamicSteps: PlanStep[] = [];
  OPTIONAL_FIELDS.forEach((spec, i) => {
    if (spec.match.test(q)) {
      schema.push(spec.field);
      if (spec.step) {
        dynamicSteps.push({ id: `s-dyn-${i}`, dependsOn: ["s-extract"], ...spec.step });
      }
    }
  });

  // Steps (deterministic skeleton + dynamic additions)
  const steps: PlanStep[] = [
    { id: "s-discover", title: "Discover candidate organizations", agent: "SourceDiscovery", detail: "Enumerate candidate entities from allow-listed public sources and registries.", dependsOn: [] },
    ...(constraints.some((c) => c.key === "foundedYear")
      ? [{ id: "s-year", title: "Verify founding year", agent: "Validation" as const, detail: "Confirm founding year against at least one reliable source; flag conflicts.", dependsOn: ["s-discover"] }]
      : []),
    ...(sector ? [{ id: "s-relevance", title: `Verify ${sector} relevance`, agent: "Validation" as const, detail: `Confirm each candidate genuinely operates in ${sector} — not just keyword mentions.`, dependsOn: ["s-discover"] }] : []),
    { id: "s-extract", title: "Extract structured fields", agent: "Extraction", detail: "Populate schema fields from sources; every value carries provenance.", dependsOn: ["s-discover"] },
    ...dynamicSteps,
    { id: "s-domain", title: "Resolve official domain", agent: "SourceDiscovery", detail: "Resolve and URL-validate the official website; reject parked/aggregator domains.", dependsOn: ["s-extract"] },
    { id: "s-dedupe", title: "Deduplicate organizations", agent: "EntityResolution", detail: "Cluster records by normalized domain + name similarity; keep the best-evidenced record.", dependsOn: ["s-extract"] },
    { id: "s-evidence", title: "Attach source evidence", agent: "Evidence", detail: "Bind each field value to its source snippet and retrieval timestamp.", dependsOn: ["s-extract"] },
    { id: "s-confidence", title: "Calculate confidence", agent: "Quality", detail: "Compute field + record confidence from source reliability and corroboration.", dependsOn: ["s-evidence", "s-dedupe"] },
    { id: "s-dataset", title: "Generate final dataset", agent: "Export", detail: "Assemble the publishable dataset with review flags and export contracts.", dependsOn: ["s-confidence"] },
  ];

  const intent = `Build a verified, evidence-backed dataset of ${targetCount} ${entities.join(" ").toLowerCase()}${
    constraints.length ? ` where ${constraints.map((c) => c.label.toLowerCase()).join(" and ")}` : ""
  }.`;

  return { intent, entities, constraints, schema, steps };
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
