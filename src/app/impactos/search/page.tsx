"use client";

import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell";
import { IMPACTOS_NAV } from "@/components/impactos/nav";
import { CloudinaryIndicator } from "@/components/impactos/cloudinary-indicator";
import { Panel, Button, Chip, Badge, Skeleton, EmptyState, ConfidenceMeter } from "@/components/ui";
import { phaseLabel } from "@/components/impactos/asset-card";
import { deliveryUrl, cloudinaryConfigured } from "@/lib/impactos/cloudinary";
import { getProject } from "@/lib/impactos/fixtures";
import type { SearchResult } from "@/lib/impactos/types";
import { Search, Sparkles, MapPin, Clock, ArrowRight, SearchX } from "lucide-react";

const EXAMPLES = [
  "Show images of newly constructed drainage infrastructure",
  "evidence of vegetation recovery",
  "field videos where workers are installing",
  "reduced standing water",
];

export default function SearchPage() {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [ran, setRan] = React.useState(false);

  const run = React.useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setRan(true);
    try {
      const res = await fetch(`/api/impactos/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AppShell
      product="impactos"
      nav={IMPACTOS_NAV}
      title="Semantic Media Search"
      right={<CloudinaryIndicator configured={cloudinaryConfigured()} />}
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-ink">Search the evidence graph</h2>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">
            Hybrid dense + sparse retrieval over captions, tags, video segments and observations. Every match
            returns a human-readable reason — not a bare similarity score.
          </p>
        </div>

        <Panel className="p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(query);
            }}
            className="flex items-center gap-2"
          >
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-line-strong bg-base-200 px-3">
              <Search size={16} className="text-ink-faint" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Show images of newly constructed drainage infrastructure"
                className="h-11 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-ghost"
              />
            </div>
            <Button type="submit" variant="primary" accent="impact" size="md" disabled={loading}>
              {loading ? "Searching…" : "Search"}
            </Button>
          </form>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-2xs uppercase tracking-wider text-ink-faint">Try</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setQuery(ex);
                  run(ex);
                }}
                className="chip transition-colors hover:border-impact/40 hover:text-impact"
              >
                {ex}
              </button>
            ))}
          </div>
        </Panel>

        {loading && (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        )}

        {!loading && results && results.length > 0 && (
          <div className="space-y-3">
            <div className="text-2xs uppercase tracking-wider text-ink-faint">
              {results.length} matches · ranked by relevance
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {results.map((r) => (
                <ResultCard key={r.asset.id} result={r} />
              ))}
            </div>
          </div>
        )}

        {!loading && ran && results && results.length === 0 && (
          <Panel>
            <EmptyState
              icon={<SearchX size={28} />}
              title="No matching evidence"
              description="Try a broader concept like drainage, vegetation, workers, solar or standing water."
            />
          </Panel>
        )}

        {!loading && !ran && (
          <Panel>
            <EmptyState
              icon={<Sparkles size={28} />}
              title="Ask the evidence graph a question"
              description="Results lead with why each asset matched — intelligence, not a gallery."
            />
          </Panel>
        )}
      </div>
    </AppShell>
  );
}

function ResultCard({ result }: { result: SearchResult }) {
  const a = result.asset;
  const project = getProject(a.projectId);
  return (
    <Link
      href={`/impactos/project/${a.projectId}`}
      className="group panel flex gap-4 overflow-hidden p-3 transition-all hover:border-line-strong"
    >
      <div className="relative h-32 w-40 shrink-0 overflow-hidden rounded-lg">
        <img
          src={deliveryUrl(a.originalAssetId, { w: 400, h: 320, crop: "fill", gravity: "auto" })}
          alt={a.aiCaption}
          width={400}
          height={320}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-1.5 top-1.5">
          <Badge tone="impact">{phaseLabel(a.structuredMetadata.phase)}</Badge>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs font-medium text-ink">{project?.name ?? a.projectId}</span>
          <ArrowRight size={14} className="shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-impact" />
        </div>

        {/* Reason leads */}
        <div className="mt-1.5 flex items-start gap-1.5 rounded-md border border-impact/20 bg-impact/5 px-2.5 py-1.5">
          <Sparkles size={12} className="mt-0.5 shrink-0 text-impact" />
          <p className="text-xs leading-snug text-ink">{result.reason}</p>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {result.matchedOn.map((m) => (
            <Chip key={m} className="text-2xs">
              {m}
            </Chip>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <span className="mono-num flex items-center gap-2 text-2xs text-ink-faint">
            <span className="flex items-center gap-1">
              <MapPin size={10} /> {a.location.place}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={10} /> {new Date(a.capturedAt).toISOString().slice(0, 10)}
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-2xs text-ink-faint">score</span>
            <ConfidenceMeter value={result.score} />
          </span>
        </div>
      </div>
    </Link>
  );
}
