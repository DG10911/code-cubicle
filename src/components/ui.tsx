import * as React from "react";
import { cn, classifyConfidence } from "@/lib/utils";

/* ------------------------------------------------------------------ Button */
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "danger";
  accent?: "signal" | "impact";
  size?: "sm" | "md" | "lg";
};
export function Button({
  className,
  variant = "outline",
  accent = "signal",
  size = "md",
  ...props
}: ButtonProps) {
  const accentBg =
    accent === "signal"
      ? "bg-signal text-base-0 hover:bg-signal/90"
      : "bg-impact text-base-0 hover:bg-impact/90";
  const accentRing = accent === "signal" ? "focus-visible:ring-signal/50" : "focus-visible:ring-impact/50";
  return (
    <button
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 rounded-xl font-medium transition-all",
        "focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-40",
        accentRing,
        size === "sm" && "h-8 px-3 text-xs",
        size === "md" && "h-10 px-4 text-sm",
        size === "lg" && "h-12 px-6 text-[15px]",
        variant === "primary" && cn(accentBg, "shadow-glow"),
        variant === "outline" && "border border-line-strong bg-base-200 text-ink hover:bg-base-300",
        variant === "ghost" && "text-ink-muted hover:bg-base-200 hover:text-ink",
        variant === "danger" && "border border-danger/40 bg-danger/10 text-danger hover:bg-danger/20",
        className,
      )}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------- Panel */
export function Panel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("panel", className)} {...props} />;
}
export function PanelHeader({
  title,
  subtitle,
  right,
  icon,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
      <div className="flex items-start gap-3">
        {icon && <div className="mt-0.5 text-ink-faint">{icon}</div>}
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-ink">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-ink-faint">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

/* -------------------------------------------------------------------- Chip */
export function Chip({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("chip", className)} {...props} />;
}

/* ------------------------------------------------------------------- Badge */
const badgeTones = {
  neutral: "border-line bg-base-200 text-ink-muted",
  signal: "border-signal/30 bg-signal/10 text-signal",
  impact: "border-impact/30 bg-impact/10 text-impact",
  warn: "border-warn/30 bg-warn/10 text-warn",
  danger: "border-danger/30 bg-danger/10 text-danger",
  info: "border-info/30 bg-info/10 text-info",
} as const;
export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof badgeTones }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide",
        badgeTones[tone],
        className,
      )}
      {...props}
    />
  );
}

/* ------------------------------------------------------------- ProgressBar */
export function ProgressBar({
  value,
  accent = "signal",
  className,
}: {
  value: number;
  accent?: "signal" | "impact" | "warn" | "danger";
  className?: string;
}) {
  const tone = {
    signal: "bg-signal",
    impact: "bg-impact",
    warn: "bg-warn",
    danger: "bg-danger",
  }[accent];
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-base-300", className)}>
      <div
        className={cn("h-full rounded-full transition-[width] duration-500 ease-out", tone)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

/** ASCII-style block meter used in the live execution view. */
export function BlockMeter({ value, width = 16 }: { value: number; width?: number }) {
  const filled = Math.round((Math.max(0, Math.min(100, value)) / 100) * width);
  return (
    <span className="font-mono text-xs tracking-tight text-signal">
      {"█".repeat(filled)}
      <span className="text-base-500">{"░".repeat(width - filled)}</span>
    </span>
  );
}

/* -------------------------------------------------------- ConfidenceMeter */
export function ConfidenceMeter({ value, showLabel = true }: { value: number; showLabel?: boolean }) {
  const band = classifyConfidence(value);
  const tone =
    band === "high" ? "bg-impact text-impact" : band === "medium" ? "bg-warn text-warn" : "bg-danger text-danger";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-base-300">
        <div className={cn("h-full rounded-full", tone.split(" ")[0])} style={{ width: `${value * 100}%` }} />
      </div>
      {showLabel && <span className={cn("mono-num text-2xs font-semibold", tone.split(" ")[1])}>{value.toFixed(2)}</span>}
    </div>
  );
}

/* ------------------------------------------------------------- Skeleton */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-md bg-base-200", className)}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </div>
  );
}

/* --------------------------------------------------------------- Sparkline */
export function Sparkline({
  points,
  className,
  stroke = "currentColor",
}: {
  points: number[];
  className?: string;
  stroke?: string;
}) {
  const w = 100;
  const h = 28;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={className} fill="none">
      <path d={d} stroke={stroke} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/* ------------------------------------------------------------------- Stat */
export function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  accent?: "signal" | "impact";
}) {
  return (
    <div className="panel-inset px-4 py-3">
      <div className="text-2xs uppercase tracking-wider text-ink-faint">{label}</div>
      <div
        className={cn(
          "mono-num mt-1 text-2xl font-semibold tracking-tight",
          accent === "signal" && "text-signal",
          accent === "impact" && "text-impact",
          !accent && "text-ink",
        )}
      >
        {value}
      </div>
      {hint && <div className="mt-0.5 text-2xs text-ink-faint">{hint}</div>}
    </div>
  );
}

/* --------------------------------------------------------------- EmptyState */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {icon && <div className="text-ink-ghost">{icon}</div>}
      <div>
        <h4 className="text-sm font-medium text-ink">{title}</h4>
        {description && <p className="mx-auto mt-1 max-w-sm text-xs text-ink-faint">{description}</p>}
      </div>
      {action}
    </div>
  );
}
