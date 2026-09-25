"use client";

import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell";
import { IMPACTOS_NAV } from "@/components/impactos/nav";
import { CloudinaryIndicator } from "@/components/impactos/cloudinary-indicator";
import { BeforeAfterSlider } from "@/components/impactos/before-after-slider";
import { Panel, PanelHeader, Badge, Skeleton, EmptyState, ConfidenceMeter } from "@/components/ui";
import { PROJECTS } from "@/lib/impactos/fixtures";
import { deliveryUrl, cloudinaryConfigured } from "@/lib/impactos/cloudinary";
import type { BeforeAfter } from "@/lib/impactos/types";
import { cn } from "@/lib/utils";
import { Columns2, Info, Eye, ArrowRight, AlertTriangle } from "lucide-react";

export default function BeforeAfterPage() {
  const [projectId, setProjectId] = React.useState("prj-bihar-flood");
  const project = PROJECTS.find((p) => p.id === projectId) ?? PROJECTS[0];
  const phases = project.phases;

  const [beforePhase, setBeforePhase] = React.useState(phases[0].phase);
  const [afterPhase, setAfterPhase] = React.useState(phases[phases.length - 1].phase);
  const [data, setData] = React.useState<BeforeAfter | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);

  // Keep phase selections valid when project changes.
  React.useEffect(() => {
    setBeforePhase(project.phases[0].phase);
    setAfterPhase(project.phases[project.phases.length - 1].phase);
  }, [project.id, project.phases]);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await fetch(
          `/api/impactos/before-after?project=${projectId}&before=${beforePhase}&after=${afterPhase}`,
        );
        if (res.status === 404) {
          if (!cancelled) {
            setData(null);
            setNotFound(true);
          }
          return;
        }
        const json = (await res.json()) as BeforeAfter;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [projectId, beforePhase, afterPhase]);

  return (
    <AppShell
      product="impactos"
      nav={IMPACTOS_NAV}
      title="Before / After"
      right={<CloudinaryIndicator configured={cloudinaryConfigured()} />}
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-ink">Before / after comparison</h2>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">
            Synchronized phase comparison. Drag the handle to reveal change between phases. All statements are
            observed visual differences — never causal claims.
          </p>
        </div>

        {/* Controls */}
        <Panel className="flex flex-wrap items-end gap-4 p-4">
          <Selector
            label="Project"
            value={projectId}
            onChange={setProjectId}
            options={PROJECTS.map((p) => ({ value: p.id, label: p.name }))}
          />
          <Selector
            label="Before phase"
            value={beforePhase}
            onChange={(v) => setBeforePhase(v as typeof beforePhase)}
            options={phases.map((p) => ({ value: p.phase, label: p.label }))}
          />
          <div className="pb-2 text-ink-ghost">
            <ArrowRight size={16} />
          </div>
          <Selector
            label="After phase"
            value={afterPhase}
            onChange={(v) => setAfterPhase(v as typeof afterPhase)}
            options={phases.map((p) => ({ value: p.phase, label: p.label }))}
          />
        </Panel>

        {loading && <Skeleton className="aspect-[16/10] w-full rounded-xl" />}

        {!loading && notFound && (
          <Panel>
            <EmptyState
              icon={<Columns2 size={28} />}
              title="No comparison available"
              description="The selected project has no assets for one of these phases. Pick different phases."
            />
          </Panel>
        )}

        {!loading && data && (
          <>
            <Panel className="p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge tone="neutral">Before · {phaseLabelOf(project, data.beforePhase)}</Badge>
                  <ArrowRight size={14} className="text-ink-faint" />
                  <Badge tone="impact">After · {phaseLabelOf(project, data.afterPhase)}</Badge>
                </div>
                <span className="mono-num text-2xs text-ink-faint">
                  {data.before.id} → {data.after.id}
                </span>
              </div>

              <BeforeAfterSlider
                beforeUrl={deliveryUrl(data.before.originalAssetId, { w: 1200, h: 750, crop: "fill", gravity: "auto" })}
                afterUrl={deliveryUrl(data.after.originalAssetId, { w: 1200, h: 750, crop: "fill", gravity: "auto", enhance: true })}
                beforeLabel={phaseLabelOf(project, data.beforePhase)}
                afterLabel={phaseLabelOf(project, data.afterPhase)}
              />

              <div className="mt-3 flex items-start gap-2 rounded-lg border border-warn/25 bg-warn/5 px-4 py-2.5 text-xs text-ink-muted">
                <AlertTriangle size={14} className="mt-0.5 shrink-0 text-warn" />
                Observed visual change — not a causal claim. The comparison shows what the media depicts across
                phases; it does not attribute the change to any intervention.
              </div>
            </Panel>

            {/* Observed changes */}
            <Panel>
              <PanelHeader
                title="Observed changes"
                subtitle="Derived from observations on the after-phase media. Each links back to its source assets."
                icon={<Eye size={16} />}
                right={<span className="text-2xs text-ink-faint">{data.changes.length} observed</span>}
              />
              <div className="grid gap-2 p-5 md:grid-cols-2">
                {data.changes.map((c, i) => (
                  <div key={`${c.statement}-${i}`} className="panel-inset border-l-2 border-l-impact/50 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <Badge tone="impact">
                        <Eye size={11} /> {c.category}
                      </Badge>
                      <ConfidenceMeter value={c.confidence} />
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-ink">
                      <span className="text-ink-faint">Observed: </span>
                      {c.statement}
                    </p>
                    <div className="mono-num mt-2 flex flex-wrap items-center gap-2 text-2xs">
                      <Link href={`/impactos/project/${data.projectId}`} className="rounded bg-base-200 px-1.5 py-0.5 text-ink-muted hover:text-impact">
                        before · {c.before}
                      </Link>
                      <span className="text-ink-faint">→</span>
                      <Link href={`/impactos/project/${data.projectId}`} className="rounded bg-base-200 px-1.5 py-0.5 text-ink-muted hover:text-impact">
                        after · {c.after}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2 border-t border-line px-5 py-3 text-2xs text-ink-faint">
                <Info size={12} className="mt-0.5 shrink-0 text-info" />
                Observations describe visual appearance only. They do not establish that the program caused the
                change.
              </div>
            </Panel>
          </>
        )}
      </div>
    </AppShell>
  );
}

function phaseLabelOf(project: (typeof PROJECTS)[number], phase: string) {
  return project.phases.find((p) => p.phase === phase)?.label ?? phase;
}

function Selector({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-2xs uppercase tracking-wider text-ink-faint">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-10 rounded-xl border border-line-strong bg-base-200 px-3 text-sm text-ink outline-none",
          "focus-visible:ring-2 focus-visible:ring-impact/40",
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-base-200 text-ink">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
