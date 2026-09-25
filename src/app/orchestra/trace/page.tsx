"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Activity, AlertTriangle, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/shell";
import { Panel, PanelHeader, Badge, Skeleton, Stat, Button } from "@/components/ui";
import { ORCHESTRA_NAV, DEFAULT_QUERY } from "@/components/orchestra/nav";
import type { AgentTrace } from "@/lib/orchestra/types";

const STATUS_TONE: Record<AgentTrace["status"], React.ComponentProps<typeof Badge>["tone"]> = {
  ok: "impact",
  review: "warn",
  skipped: "neutral",
  error: "danger",
};

function TraceInner() {
  const params = useSearchParams();
  const q = (params.get("q") || DEFAULT_QUERY).trim();
  const [traces, setTraces] = useState<AgentTrace[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setTraces(null);
    setError(null);
    fetch(`/api/orchestra/dataset?q=${encodeURIComponent(q)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`trace failed: ${r.status}`);
        return r.json();
      })
      .then((d: { traces: AgentTrace[] }) => !cancelled && setTraces(d.traces))
      .catch((e) => !cancelled && setError((e as Error).message));
    return () => {
      cancelled = true;
    };
  }, [q]);

  if (error) {
    return (
      <Panel className="border-danger/30">
        <div className="flex items-center gap-2 px-5 py-4 text-sm text-danger">
          <AlertTriangle size={15} /> Could not load traces: {error}
        </div>
      </Panel>
    );
  }

  if (!traces) return <Skeleton className="h-96" />;

  const totalMs = traces.reduce((a, t) => a + t.durationMs, 0);
  const totalTokens = traces.reduce((a, t) => a + (t.tokenEstimate ?? 0), 0);
  const flagged = traces.filter((t) => t.status !== "ok").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-2xs uppercase tracking-wider text-ink-faint">
            <Activity size={13} className="text-signal" /> Agent observability
          </div>
          <p className="mt-1 max-w-2xl text-sm text-ink" title={q}>
            {q}
          </p>
        </div>
        <Link href={`/orchestra/dataset?q=${encodeURIComponent(q)}`}>
          <Button variant="outline" size="sm">
            View dataset <ArrowRight size={14} />
          </Button>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Agents" value={traces.length} accent="signal" />
        <Stat label="Total time" value={`${(totalMs / 1000).toFixed(2)}s`} />
        <Stat label="Tokens (est.)" value={totalTokens.toLocaleString()} />
        <Stat label="Non-OK steps" value={flagged} hint="review / skipped / error" />
      </div>

      <Panel className="overflow-hidden">
        <PanelHeader
          title="Execution trace"
          subtitle="Every agent action with its input, output, duration and status"
          icon={<Activity size={16} />}
        />
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-2xs uppercase tracking-wider text-ink-faint">
                <th className="px-4 py-2.5 font-medium">Agent</th>
                <th className="px-4 py-2.5 font-medium">Action</th>
                <th className="px-4 py-2.5 font-medium">Input</th>
                <th className="px-4 py-2.5 font-medium">Output</th>
                <th className="px-4 py-2.5 text-right font-medium">Duration</th>
                <th className="px-4 py-2.5 text-right font-medium">Tokens</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {traces.map((t, i) => (
                <tr key={i} className="border-b border-line align-top last:border-0 hover:bg-base-200/40">
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="text-sm font-medium text-ink">{t.agent}</span>
                    {t.source && <div className="mono-num mt-0.5 text-2xs text-ink-faint">{t.source}</div>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-signal">{t.action}</td>
                  <td className="max-w-[220px] px-4 py-3 text-xs text-ink-muted">{t.input}</td>
                  <td className="max-w-[260px] px-4 py-3 text-xs text-ink-muted">{t.output}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <span className="mono-num text-xs text-ink">{t.durationMs.toLocaleString()}</span>
                    <span className="text-2xs text-ink-faint"> ms</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <span className="mono-num text-xs text-ink-muted">{t.tokenEstimate ? t.tokenEstimate.toLocaleString() : "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[t.status]}>{t.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

export default function TracePage() {
  return (
    <AppShell
      product="orchestra"
      nav={ORCHESTRA_NAV}
      title="Trace"
      right={<Badge tone="signal">fixture dataset</Badge>}
    >
      <Suspense fallback={<div className="p-8 text-sm text-ink-faint">Loading trace…</div>}>
        <TraceInner />
      </Suspense>
    </AppShell>
  );
}
