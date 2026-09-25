"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, Link2 } from "lucide-react";
import { Panel, Badge, ConfidenceMeter, EmptyState } from "@/components/ui";
import { cn } from "@/lib/utils";
import { EvidenceDrawer, STATUS_META } from "@/components/orchestra/evidence-drawer";
import type { DataRecord, RecordStatus, ResearchPlan } from "@/lib/orchestra/types";

type StatusFilter = "all" | RecordStatus;
const STATUS_FILTERS: StatusFilter[] = ["all", "publishable", "needs_review", "unverified", "duplicate"];

export function DataGrid({ plan, records }: { plan: ResearchPlan; records: DataRecord[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [minConf, setMinConf] = useState(0);
  const [hasConflicts, setHasConflicts] = useState(false);
  const [missingData, setMissingData] = useState(false);
  const [evidenceOnly, setEvidenceOnly] = useState(false);
  const [selected, setSelected] = useState<DataRecord | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (r.overallConfidence < minConf) return false;
      if (hasConflicts && r.conflicts.length === 0) return false;
      if (missingData && r.missingFields.length === 0) return false;
      if (evidenceOnly && !Object.values(r.evidence).some((e) => e.length > 0)) return false;
      if (q) {
        const hay = Object.values(r.fields).join(" ").toLowerCase() + " " + r.id.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [records, search, status, minConf, hasConflicts, missingData, evidenceOnly]);

  return (
    <>
      <Panel className="overflow-hidden">
        {/* Toolbar */}
        <div className="space-y-3 border-b border-line p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search organizations, fields, values…"
                className="w-full rounded-lg border border-line bg-base-50 py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-ghost focus:border-signal/40 focus:outline-none focus:ring-2 focus:ring-signal/20"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-2xs font-semibold uppercase tracking-wide transition-colors",
                    status === s
                      ? "border-signal/40 bg-signal/10 text-signal"
                      : "border-line bg-base-200 text-ink-faint hover:text-ink",
                  )}
                >
                  {s === "all" ? "all" : STATUS_META[s].label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={13} className="text-ink-faint" />
              <span className="text-2xs uppercase tracking-wider text-ink-faint">min confidence</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={minConf}
                onChange={(e) => setMinConf(Number(e.target.value))}
                className="h-1 w-32 cursor-pointer accent-signal"
              />
              <span className="mono-num text-2xs text-ink-muted">{minConf.toFixed(2)}</span>
            </div>
            <Toggle label="has conflicts" active={hasConflicts} onClick={() => setHasConflicts((v) => !v)} />
            <Toggle label="missing data" active={missingData} onClick={() => setMissingData((v) => !v)} />
            <Toggle label="evidence-only" active={evidenceOnly} onClick={() => setEvidenceOnly((v) => !v)} />
            <span className="ml-auto text-2xs text-ink-faint">
              <span className="mono-num text-ink-muted">{filtered.length}</span> / {records.length} records
            </span>
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <EmptyState icon={<Search size={22} />} title="No records match" description="Loosen the filters or clear the search to see more of the dataset." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-2xs uppercase tracking-wider text-ink-faint">
                  <th className="px-4 py-2.5 font-medium">#</th>
                  {plan.schema.map((f) => (
                    <th key={f.key} className="whitespace-nowrap px-4 py-2.5 font-medium">
                      {f.label}
                    </th>
                  ))}
                  <th className="px-4 py-2.5 font-medium">Confidence</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className="cursor-pointer border-b border-line transition-colors last:border-0 hover:bg-base-200/50"
                  >
                    <td className="px-4 py-2.5 align-top">
                      <span className="mono-num text-2xs text-ink-ghost">{String(i + 1).padStart(2, "0")}</span>
                    </td>
                    {plan.schema.map((f) => {
                      const v = r.fields[f.key];
                      const isConflict = r.conflicts.some((c) => c.field === f.key);
                      return (
                        <td key={f.key} className="max-w-[220px] truncate px-4 py-2.5 align-top">
                          {v == null ? (
                            <span className="text-2xs uppercase text-danger/80">unverified</span>
                          ) : f.type === "url" ? (
                            <span className="inline-flex items-center gap-1 truncate font-mono text-xs text-info">
                              <Link2 size={11} className="shrink-0" />
                              {v.replace(/^https?:\/\//, "")}
                            </span>
                          ) : (
                            <span className={cn("font-mono text-xs text-ink", isConflict && "text-warn")}>{v}</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-2.5 align-top">
                      <ConfidenceMeter value={r.overallConfidence} />
                    </td>
                    <td className="px-4 py-2.5 align-top">
                      <Badge tone={STATUS_META[r.status].tone}>{STATUS_META[r.status].label}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <EvidenceDrawer record={selected} plan={plan} onClose={() => setSelected(null)} />
    </>
  );
}

function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md border px-2.5 py-1 text-2xs font-medium transition-colors",
        active ? "border-signal/40 bg-signal/10 text-signal" : "border-line bg-base-200 text-ink-faint hover:text-ink",
      )}
    >
      {label}
    </button>
  );
}
