import Link from "next/link";
import type { Asset, Project } from "@/lib/impactos/types";
import { deliveryUrl } from "@/lib/impactos/cloudinary";
import { Badge } from "@/components/ui";
import { ArrowRight, MapPin, Layers, Images, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Project dashboard card. Hero thumbnail is delivered through Cloudinary
 * (the media system of record) from a representative asset's originalAssetId.
 */
export function ProjectCard({
  project,
  heroAsset,
  featured = false,
}: {
  project: Project;
  heroAsset?: Asset;
  featured?: boolean;
}) {
  const publicId = heroAsset?.originalAssetId ?? `impactos/${project.id}/hero`;
  return (
    <Link
      href={`/impactos/project/${project.id}`}
      className={cn(
        "group panel relative flex flex-col overflow-hidden transition-all hover:border-line-strong",
        featured && "md:col-span-2",
      )}
    >
      <div className={cn("relative w-full overflow-hidden", featured ? "aspect-[21/9]" : "aspect-[16/10]")}>
        <img
          src={deliveryUrl(publicId, { w: featured ? 1400 : 800, h: featured ? 600 : 500, crop: "fill", gravity: "auto" })}
          alt={`${project.name} field evidence`}
          width={featured ? 1400 : 800}
          height={featured ? 600 : 500}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-base-0 via-base-0/20 to-transparent" />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <Badge tone="impact">{project.code}</Badge>
          {featured && <Badge tone="neutral">Hero project</Badge>}
        </div>
      </div>

      <div className="relative flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-ink">{project.name}</h3>
            <p className="mt-0.5 text-xs text-ink-muted">{project.org}</p>
          </div>
          <ArrowRight
            size={16}
            className="mt-1 shrink-0 text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-impact"
          />
        </div>

        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-ink-faint">{project.summary}</p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-2xs text-ink-muted">
          <span className="flex items-center gap-1.5">
            <MapPin size={12} className="text-ink-faint" /> {project.region}
          </span>
          <span className="flex items-center gap-1.5">
            <Layers size={12} className="text-ink-faint" /> {project.phases.length} phases
          </span>
          <span className="flex items-center gap-1.5">
            <Images size={12} className="text-ink-faint" /> {project.assetCount} assets
          </span>
          <span className="flex items-center gap-1.5">
            <Eye size={12} className="text-ink-faint" /> {project.observationCount} observations
          </span>
        </div>
      </div>
    </Link>
  );
}
