import type { Asset, Observation } from "@/lib/impactos/types";
import { deliveryUrl } from "@/lib/impactos/cloudinary";
import { Badge } from "@/components/ui";
import { ObservationRow } from "@/components/impactos/observation-row";
import { phaseLabel } from "@/components/impactos/asset-card";
import { X, Fingerprint, MapPin, Clock, Film, Sparkles } from "lucide-react";

/** Full asset inspector: media, caption, structured metadata, provenance, observations. */
export function AssetDetail({
  asset,
  observations,
  onClose,
}: {
  asset: Asset;
  observations: Observation[];
  onClose?: () => void;
}) {
  const meta = asset.structuredMetadata;
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div className="flex items-center gap-3">
          <Badge tone="impact">{phaseLabel(meta.phase)}</Badge>
          <span className="mono-num text-sm font-semibold text-ink">{asset.id}</span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-faint hover:bg-base-200 hover:text-ink"
            aria-label="Close asset detail"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="p-5">
        <div className="relative overflow-hidden rounded-xl border border-line">
          <img
            src={deliveryUrl(asset.originalAssetId, { w: 1200, h: 800, crop: "fill", gravity: "auto", enhance: true })}
            alt={asset.aiCaption}
            width={1200}
            height={800}
            className="w-full object-cover"
          />
          {asset.kind === "video" && (
            <span className="mono-num absolute bottom-3 right-3 flex items-center gap-1.5 rounded-md border border-line bg-base-0/80 px-2 py-1 text-2xs text-ink backdrop-blur">
              <Film size={12} /> {asset.durationSec}s clip
            </span>
          )}
        </div>

        {/* AI caption */}
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-line bg-base-50 px-4 py-3">
          <Sparkles size={14} className="mt-0.5 shrink-0 text-impact" />
          <div>
            <div className="text-2xs uppercase tracking-wider text-ink-faint">AI caption</div>
            <p className="mt-0.5 text-sm leading-relaxed text-ink">{asset.aiCaption}</p>
          </div>
        </div>

        {/* Video segments */}
        {asset.segments && asset.segments.length > 0 && (
          <div className="mt-4">
            <div className="text-2xs uppercase tracking-wider text-ink-faint">Timestamped analysis</div>
            <div className="mt-2 space-y-1.5">
              {asset.segments.map((s) => (
                <div key={s.t} className="flex items-center gap-3 rounded-md border border-line bg-base-50 px-3 py-2">
                  <span className="mono-num rounded bg-base-200 px-1.5 py-0.5 text-2xs text-impact">
                    {String(Math.floor(s.t / 60)).padStart(2, "0")}:{String(s.t % 60).padStart(2, "0")}
                  </span>
                  <span className="text-xs text-ink-muted">{s.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Structured metadata + provenance */}
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <MetaRow label="Project code" value={meta.project_code} mono />
          <MetaRow label="Phase" value={phaseLabel(meta.phase)} />
          <MetaRow label="Activity" value={meta.activity} />
          <MetaRow label="Verified" value={meta.verified ? "Yes" : "No"} tone={meta.verified ? "impact" : undefined} />
          <MetaRow
            label="Captured"
            value={new Date(asset.capturedAt).toISOString().replace("T", " ").slice(0, 16) + "Z"}
            mono
            icon={<Clock size={11} />}
          />
          <MetaRow label="Location" value={asset.location.place} icon={<MapPin size={11} />} />
        </div>

        {/* Cloudinary provenance anchor */}
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-impact/25 bg-impact/5 px-4 py-3">
          <Fingerprint size={14} className="mt-0.5 shrink-0 text-impact" />
          <div className="min-w-0">
            <div className="text-2xs uppercase tracking-wider text-ink-faint">
              originalAssetId · Cloudinary public_id (provenance anchor)
            </div>
            <p className="mono-num mt-0.5 break-all text-xs text-impact">{asset.originalAssetId}</p>
            <p className="mt-1 text-2xs text-ink-faint">Preserved through every derivative transformation.</p>
          </div>
        </div>

        {/* Observations */}
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-ink">Observations</h4>
            <span className="text-2xs text-ink-faint">Observed conditions — never causal claims</span>
          </div>
          {observations.length > 0 ? (
            <div className="space-y-2">
              {observations.map((o) => (
                <ObservationRow key={o.id} observation={o} />
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-line bg-base-50 px-4 py-3 text-xs text-ink-faint">
              No observations attached to this asset.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function MetaRow({
  label,
  value,
  mono,
  tone,
  icon,
}: {
  label: string;
  value: string;
  mono?: boolean;
  tone?: "impact";
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-line bg-base-50 px-3 py-2">
      <div className="text-2xs uppercase tracking-wider text-ink-faint">{label}</div>
      <div
        className={[
          "mt-0.5 flex items-center gap-1 text-xs",
          mono ? "mono-num" : "",
          tone === "impact" ? "text-impact" : "text-ink",
        ].join(" ")}
      >
        {icon}
        {value}
      </div>
    </div>
  );
}
