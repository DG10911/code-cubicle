import Link from "next/link";
import type { Asset, Observation, Project } from "@/lib/impactos/types";
import { cn } from "@/lib/utils";
import {
  MapPin,
  GitBranch,
  Images,
  Eye,
  ArrowLeftToLine,
  ArrowRightToLine,
  FileText,
  FolderTree,
} from "lucide-react";

type Node = {
  key: string;
  label: string;
  value: string;
  icon: React.ReactNode;
  href?: string;
  tone?: "neutral" | "impact" | "info" | "warn";
};

/**
 * AI Evidence Graph — a hierarchical view of everything anchored to a project.
 * PROJECT → LOCATION / TIMELINE / ASSETS / OBSERVATIONS / BEFORE / AFTER / REPORT.
 * Cloudinary assets sit at the centre; observations hang off them; reports and
 * comparisons are derived views. Purely structural — no causal language.
 */
export function EvidenceGraph({
  project,
  assets,
  observations,
}: {
  project: Project;
  assets: Asset[];
  observations: Observation[];
}) {
  const aiCount = observations.filter((o) => o.origin === "ai_observation").length;
  const claimCount = observations.filter((o) => o.origin === "project_claim").length;
  const baseline = project.phases[0];
  const final = project.phases[project.phases.length - 1];

  const nodes: Node[] = [
    { key: "location", label: "Location", value: project.location.place, icon: <MapPin size={15} /> },
    {
      key: "timeline",
      label: "Timeline",
      value: `${project.phases.length} phases`,
      icon: <GitBranch size={15} />,
      href: "/impactos/timeline",
      tone: "info",
    },
    { key: "assets", label: "Assets", value: `${assets.length} media`, icon: <Images size={15} />, tone: "impact" },
    {
      key: "observations",
      label: "Observations",
      value: `${aiCount} AI · ${claimCount} claim`,
      icon: <Eye size={15} />,
      tone: "impact",
    },
    {
      key: "before",
      label: "Before",
      value: baseline?.label ?? "—",
      icon: <ArrowLeftToLine size={15} />,
      href: "/impactos/before-after",
    },
    {
      key: "after",
      label: "After",
      value: final?.label ?? "—",
      icon: <ArrowRightToLine size={15} />,
      href: "/impactos/before-after",
    },
    { key: "report", label: "Report", value: "Impact", icon: <FileText size={15} />, href: "/impactos/report", tone: "warn" },
  ];

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        {/* Root */}
        <div className="flex justify-center">
          <div className="panel-inset flex items-center gap-3 border-impact/30 bg-impact/5 px-4 py-3">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-impact text-base-0">
              <FolderTree size={16} />
            </span>
            <div>
              <div className="text-sm font-semibold text-ink">{project.name}</div>
              <div className="mono-num text-2xs text-ink-faint">{project.code}</div>
            </div>
          </div>
        </div>

        {/* Trunk + branch rail */}
        <div className="flex justify-center">
          <div className="h-5 w-px bg-line-strong" />
        </div>
        <div className="mx-auto h-px w-[86%] bg-line-strong" />

        {/* Children */}
        <div className="grid grid-cols-7 gap-2 pt-0">
          {nodes.map((n) => {
            const inner = (
              <div
                className={cn(
                  "panel-inset flex h-full flex-col items-center gap-1.5 px-2 py-3 text-center transition-colors",
                  n.href && "hover:border-line-strong hover:bg-base-100",
                )}
              >
                <span
                  className={cn(
                    "grid h-7 w-7 place-items-center rounded-md border",
                    n.tone === "impact" && "border-impact/30 bg-impact/10 text-impact",
                    n.tone === "info" && "border-info/30 bg-info/10 text-info",
                    n.tone === "warn" && "border-warn/30 bg-warn/10 text-warn",
                    (!n.tone || n.tone === "neutral") && "border-line bg-base-200 text-ink-muted",
                  )}
                >
                  {n.icon}
                </span>
                <span className="text-2xs font-semibold uppercase tracking-wide text-ink">{n.label}</span>
                <span className="text-2xs leading-tight text-ink-faint">{n.value}</span>
              </div>
            );
            return (
              <div key={n.key} className="flex flex-col items-center">
                <div className="h-4 w-px bg-line-strong" />
                {n.href ? (
                  <Link href={n.href} className="w-full">
                    {inner}
                  </Link>
                ) : (
                  <div className="w-full">{inner}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
