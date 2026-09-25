"use client";

import { useEffect } from "react";
import { X, ShieldAlert, ShieldOff, ExternalLink, Quote, FileSearch } from "lucide-react";
import { Badge, ConfidenceMeter } from "@/components/ui";
import { cn, formatRelative } from "@/lib/utils";
import type { DataRecord, ResearchPlan, SourceType } from "@/lib/orchestra/types";

const SOURCE_TONE: Record<SourceType, React.ComponentProps<typeof Badge>["tone"]> = {
  official_site: "impact",
  registry: "signal",
  news: "info",
  public_web: "neutral",
  social: "warn",
};

const SOURCE_LABEL: Record<SourceType, string> = {
  official_site: "official site",
  registry: "registry",
  news: "news",
  public_web: "public web",
  social: "social",
};

export function EvidenceDrawer({
  record,
  plan,
  onClose,
}: {
  record: DataRecord | null;
  plan: ResearchPlan;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!record) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [record, onClose]);

  if (!record) return null;

  const name = record.fields.name ?? record.id;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close evidence drawer"
        onClick={onClose}
        className="absolute inset-0 bg-base-0/70 backdrop-blur-sm animate-fade-up"
      />

      {/* Panel */}
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-line-strong bg-base-100 shadow-pop"
        style={{ animation: "fade-up 0.28s cubic-bezier(0.16,1,0.3,1) both" }}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-2xs uppercase tracking-[0.18em] text-signal">
              <FileSearch size={13} /> Why this record?
            </div>
            <h2 className="mt-1 truncate text-lg font-semibold tracking-tight text-ink">{name}</h2>
            <div className="mt-1.5 flex items-center gap-3">
              <span className="mono-num text-2xs text-ink-faint">{record.id}</span>
              <StatusBadge status={record.status} />
              <div className="flex items-center gap-1.5">
                <span className="text-2xs text-ink-faint">overall</span>
                <ConfidenceMeter value={record.overallConfidence} />
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line text-ink-muted transition-colors hover:bg-base-200 hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {record.duplicateOf && (
            <div className="flex items-center gap-2 rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-xs text-warn">
              <ShieldAlert size={14} /> Flagged as a duplicate of{" "}
              <span className="mono-num">{record.duplicateOf}</span> (normalized domain + name similarity).
            </div>
          )}

          {plan.schema.map((field) => {
            const value = record.fields[field.key];
            const evs = record.evidence[field.key] ?? [];
            const conflict = record.conflicts.find((c) => c.field === field.key);
            const conf = record.confidence[field.key] ?? 0;
            const unverified = value == null || evs.length === 0;

            return (
              <div key={field.key} className="rounded-xl border border-line bg-base-50">
                <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="mono-num text-xs text-ink-faint">{field.key}</span>
                    <span className="text-sm font-medium text-ink">{value ?? "—"}</span>
                  </div>
                  {!unverified && !conflict && <ConfidenceMeter value={conf} />}
                </div>

                <div className="space-y-2 px-4 py-3">
                  {conflict ? (
                    <div className="rounded-lg border border-warn/30 bg-warn/10 p-3">
                      <div className="flex items-center gap-2 text-2xs font-semibold uppercase tracking-wider text-warn">
                        <ShieldAlert size={13} /> Conflict detected — needs review
                      </div>
                      <div className="mt-2 space-y-1.5">
                        {conflict.values.map((v, i) => (
                          <div key={i} className="flex items-center justify-between gap-3 text-xs">
                            <span className="text-ink">
                              <span className="mono-num">{v.value}</span>
                            </span>
                            <span className="flex items-center gap-2 text-ink-faint">
                              <Badge tone={SOURCE_TONE[v.sourceType]}>{SOURCE_LABEL[v.sourceType]}</Badge>
                              <a href={v.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-signal">
                                source <ExternalLink size={11} />
                              </a>
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="mt-2 text-2xs text-ink-faint">
                        Source A vs Source B disagree — surfaced honestly rather than silently resolved.
                      </p>
                    </div>
                  ) : unverified ? (
                    <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
                      <ShieldOff size={14} className="mt-0.5 shrink-0" />
                      <span>
                        <span className="font-semibold">UNVERIFIED</span> — no sufficiently reliable public evidence found for
                        this field. Left blank rather than guessed.
                      </span>
                    </div>
                  ) : (
                    evs.map((e, i) => (
                      <div key={i} className="rounded-lg border border-line bg-base-100 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Badge tone={SOURCE_TONE[e.sourceType]}>{SOURCE_LABEL[e.sourceType]}</Badge>
                            <span className="text-2xs text-ink-faint">
                              reliability <span className="mono-num text-ink-muted">{e.sourceReliability.toFixed(2)}</span>
                            </span>
                          </div>
                          <span className="text-2xs text-ink-faint">{formatRelative(e.retrievedAt)}</span>
                        </div>
                        <div className="mt-2 flex items-start gap-2 text-xs text-ink-muted">
                          <Quote size={13} className="mt-0.5 shrink-0 text-ink-ghost" />
                          <span className="italic leading-relaxed">{e.evidenceText}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <a
                            href={e.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 truncate text-2xs text-info hover:text-signal"
                          >
                            <ExternalLink size={11} /> <span className="truncate">{e.sourceUrl}</span>
                          </a>
                          <ConfidenceMeter value={e.confidence} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

function StatusBadge({ status }: { status: DataRecord["status"] }) {
  const map: Record<DataRecord["status"], { tone: React.ComponentProps<typeof Badge>["tone"]; label: string }> = {
    publishable: { tone: "impact", label: "publishable" },
    needs_review: { tone: "warn", label: "needs review" },
    unverified: { tone: "danger", label: "unverified" },
    duplicate: { tone: "neutral", label: "duplicate" },
  };
  const m = map[status];
  return <Badge tone={m.tone}>{m.label}</Badge>;
}

export const STATUS_META: Record<
  DataRecord["status"],
  { tone: React.ComponentProps<typeof Badge>["tone"]; label: string }
> = {
  publishable: { tone: "impact", label: "publishable" },
  needs_review: { tone: "warn", label: "needs review" },
  unverified: { tone: "danger", label: "unverified" },
  duplicate: { tone: "neutral", label: "duplicate" },
};
