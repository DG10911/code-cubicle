import type { Observation } from "@/lib/impactos/types";
import { Badge, ConfidenceMeter } from "@/components/ui";
import { cn, formatRelative } from "@/lib/utils";
import { Eye, FileCheck2 } from "lucide-react";

/**
 * CRITICAL CREDIBILITY RULE — an AI observation is never a causal claim.
 * ai_observation renders in impact (green) tone, project_claim in info tone,
 * and the two are always visibly distinguished.
 */
export function OriginBadge({ origin }: { origin: Observation["origin"] }) {
  if (origin === "ai_observation") {
    return (
      <Badge tone="impact">
        <Eye size={11} /> AI Observation
      </Badge>
    );
  }
  return (
    <Badge tone="info">
      <FileCheck2 size={11} /> Project Claim
    </Badge>
  );
}

const CATEGORY_LABEL: Record<Observation["category"], string> = {
  infrastructure: "Infrastructure",
  environment: "Environment",
  activity: "Activity",
  condition: "Condition",
};

export function ObservationRow({
  observation,
  className,
}: {
  observation: Observation;
  className?: string;
}) {
  const isAi = observation.origin === "ai_observation";
  return (
    <div
      className={cn(
        "panel-inset flex flex-col gap-2 px-4 py-3",
        isAi ? "border-l-2 border-l-impact/50" : "border-l-2 border-l-info/50",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <OriginBadge origin={observation.origin} />
        <span className="text-2xs uppercase tracking-wider text-ink-faint">
          {CATEGORY_LABEL[observation.category]}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-ink">
        {isAi ? <span className="text-ink-faint">Observed: </span> : null}
        {observation.statement}
      </p>
      <div className="flex items-center justify-between gap-3">
        <ConfidenceMeter value={observation.confidence} />
        <span className="mono-num text-2xs text-ink-faint">
          {observation.assetId} · {formatRelative(observation.observedAt)}
        </span>
      </div>
    </div>
  );
}
