import type { Asset, SearchResult } from "./types";
import { ASSETS, OBSERVATIONS } from "./fixtures";

/**
 * Deterministic semantic search. In production this is a hybrid dense + sparse
 * retrieval over an embedding index (e.g. Qdrant: dense vectors + BM25 sparse).
 * Here we model the same behaviour with an inspectable concept lexicon so the
 * demo is reproducible AND every match returns a *reason*, not a bare score.
 */

const CONCEPTS: Record<string, string[]> = {
  drainage: ["drainage", "drain", "channel", "culvert", "sewer", "trench", "flow"],
  road: ["road", "surface", "paved", "lane", "street", "reconstructed"],
  vegetation: ["vegetation", "green", "plants", "grass", "recovery", "foliage"],
  water: ["water", "standing water", "flood", "waterlogging", "canal"],
  solar: ["solar", "panel", "photovoltaic", "pv", "array"],
  workers: ["worker", "workers", "installing", "installation", "construction", "labour"],
  barrier: ["barrier", "embankment", "flood barrier"],
};

function expand(query: string): { concepts: string[]; terms: string[] } {
  const q = query.toLowerCase();
  const terms = q.split(/\W+/).filter((t) => t.length > 2);
  const concepts: string[] = [];
  for (const [concept, syns] of Object.entries(CONCEPTS)) {
    if (syns.some((s) => q.includes(s))) concepts.push(concept);
  }
  return { concepts, terms };
}

function assetText(a: Asset): string {
  const obs = OBSERVATIONS.filter((o) => o.assetId === a.id).map((o) => o.statement);
  return [a.aiCaption, ...a.tags, ...(a.segments?.map((s) => s.description) ?? []), ...obs].join(" ").toLowerCase();
}

export function semanticSearch(query: string, limit = 8): SearchResult[] {
  const { concepts, terms } = expand(query);
  const results: SearchResult[] = [];

  for (const a of ASSETS) {
    const text = assetText(a);
    const matchedOn: string[] = [];
    let score = 0;

    for (const c of concepts) {
      if (CONCEPTS[c].some((s) => text.includes(s))) {
        score += 0.4;
        matchedOn.push(c);
      }
    }
    for (const t of terms) {
      if (text.includes(t)) score += 0.08;
    }
    // Prefer verified + higher-confidence observations
    const obs = OBSERVATIONS.filter((o) => o.assetId === a.id && o.origin === "ai_observation");
    if (obs.length) score += 0.1 * Math.max(...obs.map((o) => o.confidence));

    if (score <= 0) continue;
    const reason = buildReason(a, matchedOn, obs.map((o) => o.statement));
    results.push({
      asset: a,
      score: Number(Math.min(0.99, score).toFixed(2)),
      reason,
      matchedOn: matchedOn.length ? matchedOn : terms.filter((t) => text.includes(t)),
    });
  }

  return results.sort((x, y) => y.score - x.score).slice(0, limit);
}

function buildReason(a: Asset, concepts: string[], statements: string[]): string {
  if (concepts.length) {
    const stmt = statements[0] ? ` ${statements[0]}` : "";
    return `Matched on ${concepts.join(", ")} in the ${a.structuredMetadata.phase} phase.${stmt}`;
  }
  return `Caption and tags reference the queried terms (${a.structuredMetadata.phase} phase).`;
}
