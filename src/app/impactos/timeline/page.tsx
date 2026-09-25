"use client";

import * as React from "react";
import { AppShell } from "@/components/shell";
import { IMPACTOS_NAV } from "@/components/impactos/nav";
import { CloudinaryIndicator } from "@/components/impactos/cloudinary-indicator";
import { Panel, PanelHeader, Badge, EmptyState } from "@/components/ui";
import { AssetCard } from "@/components/impactos/asset-card";
import { PROJECTS, assetsByProject } from "@/lib/impactos/fixtures";
import { cloudinaryConfigured } from "@/lib/impactos/cloudinary";
import { cn } from "@/lib/utils";
import type { Asset } from "@/lib/impactos/types";
import { CalendarClock, ImageOff } from "lucide-react";

export default function TimelinePage() {
  const [projectId, setProjectId] = React.useState("prj-bihar-flood");
  const project = PROJECTS.find((p) => p.id === projectId) ?? PROJECTS[0];
  const assets = assetsByProject(project.id);
  const [activePhase, setActivePhase] = React.useState<Asset["structuredMetadata"]["phase"]>(
    project.phases[0].phase,
  );

  // Reset the active phase when the project changes.
  React.useEffect(() => {
    setActivePhase(project.phases[0].phase);
  }, [project.id, project.phases]);

  const phaseAssets = assets.filter((a) => a.structuredMetadata.phase === activePhase);

  return (
    <AppShell
      product="impactos"
      nav={IMPACTOS_NAV}
      title="Evidence Timeline"
      right={<CloudinaryIndicator configured={cloudinaryConfigured()} />}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-ink">Project timeline</h2>
            <p className="mt-1 max-w-2xl text-sm text-ink-muted">
              Field evidence across program phases. Select a phase node to reveal the media captured in that
              window.
            </p>
          </div>
          <div className="flex gap-1 rounded-lg border border-line bg-base-100 p-1">
            {PROJECTS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProjectId(p.id)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs transition-colors",
                  p.id === projectId ? "bg-base-300 text-impact" : "text-ink-muted hover:text-ink",
                )}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <Panel>
          <PanelHeader title={project.name} subtitle={project.region} icon={<CalendarClock size={16} />} />
          <div className="p-6">
            {/* Timeline rail */}
            <div className="relative">
              <div className="absolute left-0 right-0 top-5 h-px bg-line-strong" />
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: `repeat(${project.phases.length}, minmax(0, 1fr))` }}
              >
                {project.phases.map((ph, i) => {
                  const active = ph.phase === activePhase;
                  const count = assets.filter((a) => a.structuredMetadata.phase === ph.phase).length;
                  return (
                    <button
                      key={ph.phase}
                      type="button"
                      onClick={() => setActivePhase(ph.phase)}
                      className="group relative flex flex-col items-center text-center"
                    >
                      <span
                        className={cn(
                          "relative z-10 grid h-10 w-10 place-items-center rounded-full border text-2xs font-semibold transition-all",
                          active
                            ? "border-impact bg-impact text-base-0 shadow-glow"
                            : "border-line-strong bg-base-200 text-ink-muted group-hover:border-impact/50 group-hover:text-impact",
                        )}
                      >
                        {i + 1}
                      </span>
                      <span
                        className={cn(
                          "mt-3 text-xs font-medium transition-colors",
                          active ? "text-ink" : "text-ink-muted",
                        )}
                      >
                        {ph.label}
                      </span>
                      <span className="mono-num mt-0.5 text-2xs text-ink-faint">{ph.date}</span>
                      <span className="mt-1">
                        <Badge tone={active ? "impact" : "neutral"}>{count} media</Badge>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Phase media */}
            <div className="mt-8 border-t border-line pt-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink">
                  {project.phases.find((p) => p.phase === activePhase)?.label} · evidence
                </h3>
                <span className="text-2xs text-ink-faint">{phaseAssets.length} assets</span>
              </div>
              {phaseAssets.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {phaseAssets.map((a) => (
                    <AssetCard key={a.id} asset={a} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<ImageOff size={26} />}
                  title="No media in this phase"
                  description="No field assets were captured for this phase in the fixture dataset."
                />
              )}
            </div>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
