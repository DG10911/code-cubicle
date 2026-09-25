"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Download, FileJson, FileSpreadsheet, Table2, ArrowRight, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/shell";
import { Panel, Stat, Badge, Skeleton, Button } from "@/components/ui";
import { ORCHESTRA_NAV, DEFAULT_QUERY } from "@/components/orchestra/nav";
import { DataGrid } from "@/components/orchestra/data-grid";
import { AIExplanation } from "@/components/orchestra/ai-explanation";
import type { DataRecord, ResearchPlan, TaskSummary } from "@/lib/orchestra/types";

interface DatasetResponse {
  query: string;
  plan: ResearchPlan;
  records: DataRecord[];
  summary: TaskSummary;
}

function DatasetInner() {
  const params = useSearchParams();
  const q = (params.get("q") || DEFAULT_QUERY).trim();
  const [data, setData] = useState<DatasetResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    fetch(`/api/orchestra/dataset?q=${encodeURIComponent(q)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`dataset failed: ${r.status}`);
        return r.json();
      })
      .then((d: DatasetResponse) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError((e as Error).message));
    return () => {
      cancelled = true;
    };
  }, [q]);

  const exportHref = (format: "csv" | "json", publishable?: boolean) =>
    `/api/orchestra/export?q=${encodeURIComponent(q)}&format=${format}${publishable ? "&publishable=1" : ""}`;

  if (error) {
    return (
      <Panel className="border-danger/30">
        <div className="flex items-center gap-2 px-5 py-4 text-sm text-danger">
          <AlertTriangle size={15} /> Could not load the dataset: {error}
        </div>
      </Panel>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const { plan, records, summary } = data;
  const evidenceCoverage = Math.round(summary.evidenceCoverage * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-2xs uppercase tracking-wider text-ink-faint">
            <Table2 size={13} className="text-signal" /> Dataset explorer
          </div>
          <p className="mt-1 max-w-2xl text-sm text-ink" title={q}>
            {q}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href={exportHref("csv")} download>
            <Button variant="outline" size="sm">
              <FileSpreadsheet size={14} /> CSV
            </Button>
          </a>
          <a href={exportHref("json")} download>
            <Button variant="outline" size="sm">
              <FileJson size={14} /> JSON
            </Button>
          </a>
          <a href={exportHref("csv", true)} download>
            <Button variant="primary" accent="signal" size="sm">
              <Download size={14} /> Publishable CSV
            </Button>
          </a>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Records" value={summary.recordCount} accent="signal" />
        <Stat label="Publishable" value={summary.publishableCount} accent="impact" />
        <Stat label="Conflicts" value={summary.conflictCount} hint="needs review" />
        <Stat label="Evidence coverage" value={`${evidenceCoverage}%`} hint="records with ≥1 source" />
      </div>

      <AIExplanation plan={plan} records={records} />

      <DataGrid plan={plan} records={records} />

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-base-100/60 px-5 py-4">
        <div className="text-xs text-ink-faint">Want the agent-level trace? Inspect every action, input, output and duration.</div>
        <Link href={`/orchestra/trace?q=${encodeURIComponent(q)}`}>
          <Button variant="outline" size="sm">
            Open trace <ArrowRight size={14} />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function DatasetPage() {
  return (
    <AppShell
      product="orchestra"
      nav={ORCHESTRA_NAV}
      title="Dataset"
      right={<Badge tone="signal">fixture dataset</Badge>}
    >
      <Suspense fallback={<div className="p-8 text-sm text-ink-faint">Loading dataset…</div>}>
        <DatasetInner />
      </Suspense>
    </AppShell>
  );
}
