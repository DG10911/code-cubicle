"use client";

import * as React from "react";
import Link from "next/link";
import type { Asset, Observation, Project } from "@/lib/impactos/types";
import { Panel, PanelHeader, Button, Stat } from "@/components/ui";
import { EvidenceGraph } from "@/components/impactos/evidence-graph";
import { AssetCard } from "@/components/impactos/asset-card";
import { AssetDetail } from "@/components/impactos/asset-detail";
import { ObservationRow } from "@/components/impactos/observation-row";
import { MapPin, Search, Columns2, GitBranch, FileText, Network, Images } from "lucide-react";

export function ProjectDetailClient({
  project,
  assets,
  observations,
}: {
  project: Project;
  assets: Asset[];
  observations: Observation[];
}) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const selected = assets.find((a) => a.id === selectedId) ?? null;
  const selectedObs = selected ? observations.filter((o) => o.assetId === selected.id) : [];

  const aiObs = observations.filter((o) => o.origin === "ai_observation");
  const claims = observations.filter((o) => o.origin === "project_claim");

  return (
    <div className="space-y-6">
      {/* Header */}
      <Panel className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="chip">{project.code}</span>
              <span className="flex items-center gap-1 text-2xs text-ink-faint">
                <MapPin size={12} /> {project.region}
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">{project.name}</h2>
            <p className="mt-1 text-sm text-ink-muted">{project.org}</p>
            <p className="mt-3 text-sm leading-relaxed text-ink-faint">{project.summary}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/impactos/search">
              <Button variant="outline" size="sm" accent="impact">
                <Search size={14} /> Search
              </Button>
            </Link>
            <Link href="/impactos/timeline">
              <Button variant="outline" size="sm" accent="impact">
                <GitBranch size={14} /> Timeline
              </Button>
            </Link>
            <Link href="/impactos/before-after">
              <Button variant="outline" size="sm" accent="impact">
                <Columns2 size={14} /> Before / After
              </Button>
            </Link>
            <Link href="/impactos/report">
              <Button variant="primary" size="sm" accent="impact">
                <FileText size={14} /> Impact Report
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Assets" value={assets.length} accent="impact" />
          <Stat label="AI observations" value={aiObs.length} accent="impact" />
          <Stat label="Project claims" value={claims.length} />
          <Stat label="Phases" value={project.phases.length} />
        </div>
      </Panel>

      {/* Evidence graph */}
      <Panel>
        <PanelHeader
          title="AI Evidence Graph"
          subtitle="Everything anchored to this project — Cloudinary assets at the centre, observations derived, reports and comparisons as views."
          icon={<Network size={16} />}
        />
        <div className="p-5">
          <EvidenceGraph project={project} assets={assets} observations={observations} />
        </div>
      </Panel>

      {/* Gallery + drawer */}
      <Panel>
        <PanelHeader
          title="Media evidence"
          subtitle="Field photos and videos delivered through Cloudinary. Select any asset to inspect metadata, provenance and observations."
          icon={<Images size={16} />}
          right={<span className="text-2xs text-ink-faint">{assets.length} assets</span>}
        />
        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((a) => (
            <AssetCard key={a.id} asset={a} onSelect={(x) => setSelectedId(x.id)} active={selectedId === a.id} />
          ))}
        </div>
      </Panel>

      {/* All observations */}
      <Panel>
        <PanelHeader
          title="All observations"
          subtitle="AI observations describe visual conditions only. Project claims are program-reported and clearly separated."
          icon={<FileText size={16} />}
        />
        <div className="grid gap-2 p-5 md:grid-cols-2">
          {observations.map((o) => (
            <ObservationRow key={o.id} observation={o} />
          ))}
        </div>
      </Panel>

      {/* Slide-over drawer */}
      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-base-0/60 backdrop-blur-sm"
            onClick={() => setSelectedId(null)}
          />
          <div className="relative z-10 h-full w-full max-w-xl overflow-y-auto border-l border-line bg-base-100 shadow-pop animate-fade-up">
            <AssetDetail asset={selected} observations={selectedObs} onClose={() => setSelectedId(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
