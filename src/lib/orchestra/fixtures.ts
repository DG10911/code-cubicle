import type { DataRecord, Evidence, TaskSummary } from "./types";
import { seededRandom, hashString } from "@/lib/utils";

/**
 * DEMO / FIXTURE DATA — deterministic, clearly-fictional companies.
 * We never present fabricated data as real. Every record is generated from a
 * seed so the demo is byte-identical every run, and the UI labels the dataset
 * as fixture-backed. This exists so the 3-minute demo survives API/network loss.
 */

const FIRST = ["Sentinel", "Aegis", "Cipher", "Kavach", "Prahari", "Netra", "Vajra", "Rakshak", "Shield", "Pulse", "Obsid", "Trace", "Bastion", "Verdant", "Quill", "Mira", "Astra", "Nirvaan", "Zenith", "Koval", "Suraksha", "Drishti", "Anvil", "Falcon"];
const LAST = ["Sec", "Labs", "Defense", "Guard", "Shield", "Systems", "AI", "Cyber", "Works", "Intel"];
const CITIES = ["Bengaluru, IN", "Hyderabad, IN", "Pune, IN", "Gurugram, IN", "Mumbai, IN", "Chennai, IN", "Noida, IN"];
const NICHES = ["cloud posture management", "API security", "identity threat detection", "OT/ICS security", "attack-surface management", "SOC automation", "data-loss prevention", "zero-trust access"];

function ev(field: string, value: string, opts: Partial<Evidence> & { day: number }): Evidence {
  const types: Evidence["sourceType"][] = ["official_site", "registry", "news", "public_web"];
  return {
    field,
    value,
    sourceUrl: opts.sourceUrl ?? `https://source.fixture/${field}/${encodeURIComponent(value).slice(0, 24)}`,
    sourceType: opts.sourceType ?? types[opts.day % types.length],
    sourceReliability: opts.sourceReliability ?? 0.8,
    retrievedAt: new Date(2026, 8, 20 + (opts.day % 5), 9, opts.day % 59).toISOString(),
    evidenceText: opts.evidenceText ?? `"${value}" — extracted from the cited source snippet.`,
    confidence: opts.confidence ?? 0.9,
  };
}

export function buildDataset(query: string): DataRecord[] {
  const seed = hashString(query || "default");
  const rand = seededRandom(seed);
  const n = 24;
  const records: DataRecord[] = [];

  for (let i = 0; i < n; i++) {
    const name = `${FIRST[i % FIRST.length]}${LAST[Math.floor(rand() * LAST.length)]}`;
    const slug = name.toLowerCase();
    const domain = `https://${slug}.example`;
    const city = CITIES[Math.floor(rand() * CITIES.length)];
    const niche = NICHES[Math.floor(rand() * NICHES.length)];
    const year = 2022 + Math.floor(rand() * 4); // 2022..2025
    const fundingAmt = [1, 2, 3, 4, 6, 8, 12][Math.floor(rand() * 7)];
    const hasLinkedIn = rand() > 0.15;
    const roll = rand();

    const fields: Record<string, string | null> = {
      name,
      domain,
      foundedYear: String(year),
      location: city,
      funding: `$${fundingAmt}M`,
      founders: `${FIRST[(i + 3) % FIRST.length]} R., ${FIRST[(i + 7) % FIRST.length]} K.`,
      linkedin: hasLinkedIn ? `https://linkedin.com/company/${slug}` : null,
      recentActivity: `Announced ${niche} capability, ${["Aug", "Jul", "Sep"][i % 3]} 2026`,
    };

    const evidence: Record<string, Evidence[]> = {
      name: [ev("name", name, { day: i, sourceType: "official_site", sourceReliability: 0.95, confidence: 0.98 })],
      domain: [ev("domain", domain, { day: i, sourceType: "official_site", sourceReliability: 0.95, confidence: 0.97 })],
      foundedYear: [ev("foundedYear", String(year), { day: i, sourceType: "registry", sourceReliability: 0.9, confidence: 0.9 })],
      location: [ev("location", city, { day: i, sourceType: "official_site", sourceReliability: 0.85, confidence: 0.88 })],
      funding: [ev("funding", `$${fundingAmt}M`, { day: i, sourceType: "news", sourceReliability: 0.82, confidence: 0.85 })],
      founders: [ev("founders", fields.founders!, { day: i, sourceType: "public_web", sourceReliability: 0.75, confidence: 0.78 })],
      recentActivity: [ev("recentActivity", fields.recentActivity!, { day: i, sourceType: "news", sourceReliability: 0.8, confidence: 0.8 })],
    };
    if (hasLinkedIn) evidence.linkedin = [ev("linkedin", fields.linkedin!, { day: i, sourceType: "social", sourceReliability: 0.7, confidence: 0.82 })];

    const conflicts: DataRecord["conflicts"] = [];
    const missingFields: string[] = [];
    if (!hasLinkedIn) missingFields.push("linkedin");

    let status: DataRecord["status"] = "publishable";

    // Inject a founding-year conflict for ~1 in 6 records
    if (roll < 0.16) {
      const altYear = year - 1;
      evidence.foundedYear.push(ev("foundedYear", String(altYear), { day: i + 2, sourceType: "news", sourceReliability: 0.7, confidence: 0.72 }));
      conflicts.push({
        field: "foundedYear",
        values: [
          { value: String(year), sourceUrl: evidence.foundedYear[0].sourceUrl, sourceType: "registry" },
          { value: String(altYear), sourceUrl: evidence.foundedYear[1].sourceUrl, sourceType: "news" },
        ],
        status: "needs_review",
      });
      status = "needs_review";
    }

    // One clearly unverified funding case
    if (i === 5) {
      fields.funding = null;
      evidence.funding = [];
      missingFields.push("funding");
      status = "unverified";
    }

    // Field confidences
    const confidence: Record<string, number> = {};
    for (const k of Object.keys(fields)) {
      const evs = evidence[k] ?? [];
      confidence[k] = evs.length ? Math.min(0.99, evs.reduce((a, e) => a + e.confidence, 0) / evs.length - (conflicts.some((c) => c.field === k) ? 0.25 : 0)) : 0;
    }
    const present = Object.values(fields).filter(Boolean).length;
    const overallConfidence = Number(
      (Object.values(confidence).reduce((a, b) => a + b, 0) / Object.keys(confidence).length).toFixed(2),
    );

    records.push({
      id: `org-${String(i + 1).padStart(3, "0")}`,
      fields,
      evidence,
      conflicts,
      confidence,
      overallConfidence,
      status,
      missingFields,
    });
  }

  // Inject a duplicate pair (record 11 duplicates 10 via normalized domain)
  const dupSource = records[10];
  const dup = records[11];
  dup.fields.domain = dupSource.fields.domain;
  dup.fields.name = dupSource.fields.name + " Technologies";
  dup.status = "duplicate";
  dup.duplicateOf = dupSource.id;

  return records;
}

export function summarize(query: string, records: DataRecord[], state: TaskSummary["state"], id: string, createdAt: string): TaskSummary {
  const publishable = records.filter((r) => r.status === "publishable").length;
  const conflictCount = records.reduce((a, r) => a + r.conflicts.length, 0);
  const withEvidence = records.filter((r) => Object.values(r.evidence).some((e) => e.length > 0)).length;
  return {
    id,
    query,
    state,
    createdAt,
    recordCount: records.length,
    publishableCount: publishable,
    conflictCount,
    evidenceCoverage: Number((withEvidence / records.length).toFixed(2)),
  };
}

/** Prebuilt task history for the Command Center. */
export const TASK_HISTORY: TaskSummary[] = [
  { id: "TASK-1042", query: "Indian cybersecurity startups founded after 2022", state: "COMPLETED", createdAt: "2026-09-24T10:00:00Z", recordCount: 24, publishableCount: 19, conflictCount: 4, evidenceCoverage: 0.96 },
  { id: "TASK-1039", query: "Indian SaaS companies with Series A funding", state: "COMPLETED", createdAt: "2026-09-23T14:20:00Z", recordCount: 1284, publishableCount: 1102, conflictCount: 47, evidenceCoverage: 0.91 },
  { id: "TASK-1036", query: "Climate-tech startups in Southeast Asia", state: "REVIEW", createdAt: "2026-09-22T09:12:00Z", recordCount: 312, publishableCount: 240, conflictCount: 22, evidenceCoverage: 0.88 },
];
