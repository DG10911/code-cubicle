import type { Asset } from "@/lib/impactos/types";
import { deliveryUrl } from "@/lib/impactos/cloudinary";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Play, ImageIcon, CheckCircle2, Clock } from "lucide-react";

const PHASE_LABEL: Record<Asset["structuredMetadata"]["phase"], string> = {
  baseline: "Baseline",
  construction: "Construction",
  implementation: "Implementation",
  post_project: "Post-project",
};

const PHASE_TONE: Record<Asset["structuredMetadata"]["phase"], "neutral" | "warn" | "info" | "impact"> = {
  baseline: "neutral",
  construction: "warn",
  implementation: "info",
  post_project: "impact",
};

export function phaseLabel(phase: Asset["structuredMetadata"]["phase"]) {
  return PHASE_LABEL[phase];
}

function fmtDate(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

function fmtDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Media thumbnail card for the project gallery + search-adjacent surfaces. */
export function AssetCard({
  asset,
  onSelect,
  active = false,
  className,
}: {
  asset: Asset;
  onSelect?: (asset: Asset) => void;
  active?: boolean;
  className?: string;
}) {
  const phase = asset.structuredMetadata.phase;
  const body = (
    <>
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <img
          src={deliveryUrl(asset.originalAssetId, { w: 600, h: 450, crop: "fill", gravity: "auto" })}
          alt={asset.aiCaption}
          width={600}
          height={450}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-base-0/80 via-transparent to-transparent" />
        <div className="absolute left-2 top-2">
          <Badge tone={PHASE_TONE[phase]}>{PHASE_LABEL[phase]}</Badge>
        </div>
        <div className="absolute right-2 top-2 flex items-center gap-1">
          {asset.structuredMetadata.verified && (
            <span className="grid h-6 w-6 place-items-center rounded-md border border-impact/30 bg-base-0/70 text-impact backdrop-blur">
              <CheckCircle2 size={13} />
            </span>
          )}
          <span className="grid h-6 w-6 place-items-center rounded-md border border-line bg-base-0/70 text-ink-muted backdrop-blur">
            {asset.kind === "video" ? <Play size={12} /> : <ImageIcon size={12} />}
          </span>
        </div>
        {asset.kind === "video" && (
          <div className="absolute inset-0 grid place-items-center">
            <span className="grid h-11 w-11 place-items-center rounded-full border border-white/30 bg-base-0/50 text-ink backdrop-blur transition-transform group-hover:scale-110">
              <Play size={18} className="translate-x-0.5" fill="currentColor" />
            </span>
          </div>
        )}
        {asset.kind === "video" && asset.durationSec != null && (
          <span className="mono-num absolute bottom-2 right-2 rounded bg-base-0/80 px-1.5 py-0.5 text-2xs text-ink backdrop-blur">
            {fmtDuration(asset.durationSec)}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1 p-3 text-left">
        <p className="line-clamp-2 text-xs leading-relaxed text-ink-muted">{asset.aiCaption}</p>
        <div className="mt-1 flex items-center justify-between text-2xs text-ink-faint">
          <span className="mono-num">{asset.id}</span>
          <span className="mono-num flex items-center gap-1">
            <Clock size={10} /> {fmtDate(asset.capturedAt)}
          </span>
        </div>
      </div>
    </>
  );

  const shell = cn(
    "group panel flex flex-col overflow-hidden text-left transition-all hover:border-line-strong",
    active && "border-impact/50 ring-1 ring-impact/30",
    className,
  );

  if (onSelect) {
    return (
      <button type="button" onClick={() => onSelect(asset)} className={shell}>
        {body}
      </button>
    );
  }
  return <div className={shell}>{body}</div>;
}
