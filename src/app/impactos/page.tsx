import { AppShell } from "@/components/shell";
import { IMPACTOS_NAV } from "@/components/impactos/nav";
import { CloudinaryIndicator } from "@/components/impactos/cloudinary-indicator";
import { ProjectCard } from "@/components/impactos/project-card";
import { Panel, Stat } from "@/components/ui";
import { PROJECTS, ASSETS, OBSERVATIONS, assetsByProject } from "@/lib/impactos/fixtures";
import { cloudinaryConfigured } from "@/lib/impactos/cloudinary";
import { Layers } from "lucide-react";

export default function ImpactosDashboard() {
  const configured = cloudinaryConfigured();
  const coverage = ASSETS.filter((a) => a.observationIds.length > 0).length / ASSETS.length;

  // Bihar is the hero; render it first and featured.
  const hero = PROJECTS.find((p) => p.id === "prj-bihar-flood");
  const rest = PROJECTS.filter((p) => p.id !== "prj-bihar-flood");
  const ordered = hero ? [hero, ...rest] : PROJECTS;

  return (
    <AppShell
      product="impactos"
      nav={IMPACTOS_NAV}
      title="Projects"
      right={<CloudinaryIndicator configured={configured} />}
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-ink">Evidence portfolio</h2>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">
            Turn field media into evidence of impact. Every asset is anchored in Cloudinary as the system of
            record; observations are strictly visual and never causal.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Projects" value={PROJECTS.length} accent="impact" hint="Field programs tracked" />
          <Stat label="Media assets" value={ASSETS.length} accent="impact" hint="Photos + videos" />
          <Stat label="Observations" value={OBSERVATIONS.length} hint="AI + project claims" />
          <Stat
            label="Evidence coverage"
            value={`${Math.round(coverage * 100)}%`}
            accent="impact"
            hint="Assets with observations"
          />
        </div>

        <Panel className="flex items-center gap-3 px-5 py-3">
          <Layers size={16} className="text-impact" />
          <p className="text-xs text-ink-muted">
            The flow: <span className="text-ink">Media → Understand → Organize → Search → Compare → Impact.</span>{" "}
            Start with the Bihar Flood Resilience hero project.
          </p>
        </Panel>

        <div className="grid gap-5 md:grid-cols-2">
          {ordered.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              heroAsset={assetsByProject(p.id)[0]}
              featured={p.id === "prj-bihar-flood"}
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
