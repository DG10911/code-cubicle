import type { ChangeObservation, ImpactReport } from "@/lib/impactos/types";
import { deliveryUrl } from "@/lib/impactos/cloudinary";
import { getAsset } from "@/lib/impactos/fixtures";
import { Stat, Badge, ConfidenceMeter, ProgressBar } from "@/components/ui";
import { OriginBadge } from "@/components/impactos/observation-row";
import { CloudinaryIndicator } from "@/components/impactos/cloudinary-indicator";
import {
  MapPin,
  Building2,
  CalendarClock,
  Eye,
  FileCheck2,
  Fingerprint,
  ShieldAlert,
  Info,
} from "lucide-react";

function Section({
  n,
  title,
  hint,
  children,
}: {
  n: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-line px-6 py-6 first:border-t-0">
      <div className="mb-4 flex items-baseline gap-3">
        <span className="mono-num text-2xs text-impact">{n}</span>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ink">{title}</h3>
          {hint && <p className="mt-0.5 text-2xs text-ink-faint">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function ChangeItem({ change }: { change: ChangeObservation }) {
  return (
    <div className="panel-inset border-l-2 border-l-impact/50 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <Badge tone="impact">
          <Eye size={11} /> {change.category}
        </Badge>
        <ConfidenceMeter value={change.confidence} />
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink">
        <span className="text-ink-faint">Observed: </span>
        {change.statement}
      </p>
      <div className="mono-num mt-2 flex flex-wrap items-center gap-2 text-2xs text-ink-faint">
        <span className="rounded bg-base-200 px-1.5 py-0.5">before · {change.before}</span>
        <span>→</span>
        <span className="rounded bg-base-200 px-1.5 py-0.5">after · {change.after}</span>
      </div>
    </div>
  );
}

export function ReportDocument({
  report,
  cloudinaryConfigured,
}: {
  report: ImpactReport;
  cloudinaryConfigured: boolean;
}) {
  const { project } = report;
  const first = project.phases[0];
  const last = project.phases[project.phases.length - 1];
  const beforeAsset = getAsset(report.observedChanges[0]?.before ?? "");
  const afterAsset = getAsset(report.observedChanges[0]?.after ?? "");

  return (
    <article className="panel overflow-hidden">
      {/* Masthead */}
      <header className="border-b border-line bg-base-50 px-6 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-2xs font-semibold uppercase tracking-[0.2em] text-impact">
              IMPACTOS · Impact Evidence Report
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">{project.name}</h2>
            <div className="mono-num mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-2xs text-ink-faint">
              <span className="flex items-center gap-1">
                <Building2 size={12} /> {project.org}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={12} /> {project.region}
              </span>
              <span className="flex items-center gap-1">
                <CalendarClock size={12} /> Generated {new Date(report.generatedAt).toISOString().slice(0, 10)}
              </span>
              <span>{project.code}</span>
            </div>
          </div>
          <CloudinaryIndicator configured={cloudinaryConfigured} />
        </div>
      </header>

      {/* 01 Executive summary */}
      <Section n="01" title="Executive Summary">
        <p className="text-sm leading-relaxed text-ink-muted">{report.executiveSummary}</p>
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-info/25 bg-info/5 px-4 py-2.5 text-xs text-ink-muted">
          <Info size={14} className="mt-0.5 shrink-0 text-info" />
          All AI statements describe observed visual conditions only — they are not causal claims.
        </div>
      </Section>

      {/* 02 Project overview */}
      <Section n="02" title="Project Overview">
        <p className="text-sm leading-relaxed text-ink-muted">{project.summary}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {project.phases.map((p) => (
            <div key={p.phase} className="panel-inset px-3 py-2">
              <div className="text-2xs font-semibold uppercase tracking-wide text-ink">{p.label}</div>
              <div className="mono-num text-2xs text-ink-faint">{p.date}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* 03 Evidence gallery */}
      <Section n="03" title="Evidence Gallery" hint={`${report.evidenceAssets.length} source assets delivered via Cloudinary`}>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {report.evidenceAssets.map((id) => {
            const a = getAsset(id);
            if (!a) return null;
            return (
              <div key={id} className="overflow-hidden rounded-lg border border-line">
                <img
                  src={deliveryUrl(a.originalAssetId, { w: 300, h: 300, crop: "fill", gravity: "auto" })}
                  alt={a.aiCaption}
                  width={300}
                  height={300}
                  className="aspect-square w-full object-cover"
                />
                <div className="mono-num truncate px-1.5 py-1 text-2xs text-ink-faint">{a.id}</div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 04 Before / After */}
      {beforeAsset && afterAsset && (
        <Section n="04" title="Before / After" hint={`${first.label} → ${last.label}`}>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { a: beforeAsset, label: "Before", tone: "neutral" as const, gray: true },
              { a: afterAsset, label: "After", tone: "impact" as const, gray: false },
            ].map(({ a, label, tone, gray }) => (
              <div key={label} className="overflow-hidden rounded-xl border border-line">
                <div className="relative">
                  <img
                    src={deliveryUrl(a.originalAssetId, { w: 700, h: 450, crop: "fill", gravity: "auto", grayscale: gray })}
                    alt={a.aiCaption}
                    width={700}
                    height={450}
                    className="aspect-[16/10] w-full object-cover"
                  />
                  <div className="absolute left-2 top-2">
                    <Badge tone={tone}>{label}</Badge>
                  </div>
                </div>
                <p className="px-3 py-2 text-2xs text-ink-faint">{a.aiCaption}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-2xs text-ink-faint">Observed visual change — not a causal claim.</p>
        </Section>
      )}

      {/* 05 Observed changes */}
      <Section
        n="05"
        title="Observed Changes (AI)"
        hint="Machine observations of visual conditions. Never causal."
      >
        {report.observedChanges.length > 0 ? (
          <div className="grid gap-2 md:grid-cols-2">
            {report.observedChanges.map((c, i) => (
              <ChangeItem key={`${c.statement}-${i}`} change={c} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-ink-faint">No observed changes for this pair.</p>
        )}
      </Section>

      {/* 06 Project claims */}
      <Section n="06" title="Project Claims (program-reported)" hint="Stated by the program — distinct from AI observations.">
        {report.projectClaims.length > 0 ? (
          <div className="space-y-2">
            {report.projectClaims.map((c) => (
              <div key={c.id} className="panel-inset border-l-2 border-l-info/50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <OriginBadge origin={c.origin} />
                  <span className="text-2xs uppercase tracking-wider text-ink-faint">{c.category}</span>
                </div>
                <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed text-ink">
                  <FileCheck2 size={14} className="mt-0.5 shrink-0 text-info" />
                  {c.statement}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-ink-faint">No project claims recorded.</p>
        )}
      </Section>

      {/* 07 Evidence confidence */}
      <Section n="07" title="Evidence Confidence">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="panel-inset px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-2xs uppercase tracking-wider text-ink-faint">Evidence coverage</span>
              <span className="mono-num text-sm font-semibold text-impact">
                {Math.round(report.confidence.evidenceCoverage * 100)}%
              </span>
            </div>
            <ProgressBar className="mt-2" value={report.confidence.evidenceCoverage * 100} accent="impact" />
            <p className="mt-1.5 text-2xs text-ink-faint">Share of assets carrying at least one observation.</p>
          </div>
          <div className="panel-inset px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-2xs uppercase tracking-wider text-ink-faint">Mean AI confidence</span>
              <span className="mono-num text-sm font-semibold text-impact">
                {report.confidence.meanConfidence.toFixed(2)}
              </span>
            </div>
            <ProgressBar className="mt-2" value={report.confidence.meanConfidence * 100} accent="impact" />
            <p className="mt-1.5 text-2xs text-ink-faint">Average confidence across AI observations.</p>
          </div>
        </div>
      </Section>

      {/* 08 Source assets */}
      <Section n="08" title="Source Assets" hint="Each anchored to a Cloudinary public_id preserved across transforms.">
        <div className="overflow-hidden rounded-lg border border-line">
          <table className="w-full text-left text-xs">
            <thead className="bg-base-50 text-2xs uppercase tracking-wider text-ink-faint">
              <tr>
                <th className="px-3 py-2 font-medium">Asset</th>
                <th className="px-3 py-2 font-medium">Phase</th>
                <th className="px-3 py-2 font-medium">originalAssetId</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {report.evidenceAssets.map((id) => {
                const a = getAsset(id);
                if (!a) return null;
                return (
                  <tr key={id}>
                    <td className="mono-num px-3 py-2 text-ink">{a.id}</td>
                    <td className="px-3 py-2 text-ink-muted">{a.structuredMetadata.phase}</td>
                    <td className="mono-num px-3 py-2 text-impact">
                      <span className="flex items-center gap-1.5">
                        <Fingerprint size={11} /> {a.originalAssetId}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 09 Methodology */}
      <Section n="09" title="Methodology">
        <p className="text-sm leading-relaxed text-ink-muted">{report.methodology}</p>
      </Section>

      {/* 10 Limitations */}
      <Section n="10" title="Limitations">
        <ul className="space-y-2">
          {report.limitations.map((l, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-ink-muted">
              <ShieldAlert size={14} className="mt-0.5 shrink-0 text-warn" />
              {l}
            </li>
          ))}
        </ul>
      </Section>
    </article>
  );
}
