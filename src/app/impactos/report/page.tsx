"use client";

import * as React from "react";
import { AppShell } from "@/components/shell";
import { IMPACTOS_NAV } from "@/components/impactos/nav";
import { CloudinaryIndicator } from "@/components/impactos/cloudinary-indicator";
import { ReportDocument } from "@/components/impactos/report-document";
import { Panel, Button, EmptyState, Skeleton } from "@/components/ui";
import { PROJECTS } from "@/lib/impactos/fixtures";
import { cloudinaryConfigured } from "@/lib/impactos/cloudinary";
import type { ImpactReport } from "@/lib/impactos/types";
import { cn } from "@/lib/utils";
import { FileText, Printer, Copy, Check, Sparkles } from "lucide-react";

export default function ReportPage() {
  const [projectId, setProjectId] = React.useState("prj-bihar-flood");
  const [report, setReport] = React.useState<ImpactReport | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const configured = cloudinaryConfigured();

  const generate = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/impactos/report?project=${projectId}`);
      const json = (await res.json()) as ImpactReport;
      setReport(json);
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const copyJson = React.useCallback(async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }, [report]);

  return (
    <AppShell
      product="impactos"
      nav={IMPACTOS_NAV}
      title="Impact Report"
      right={<CloudinaryIndicator configured={configured} />}
    >
      {/* Print-friendly: hide app chrome and controls when printing. */}
      <style>{`@media print {
        aside, header { display: none !important; }
        main { padding: 0 !important; }
        .no-print { display: none !important; }
        .panel { box-shadow: none !important; }
      }`}</style>

      <div className="space-y-6">
        <Panel className="no-print flex flex-wrap items-end justify-between gap-4 p-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-ink">Auto impact report</h2>
            <p className="mt-1 max-w-xl text-sm text-ink-muted">
              A traceable evidence document — observed changes separated from project claims, with full
              methodology and limitations.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-2xs uppercase tracking-wider text-ink-faint">Project</span>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className={cn(
                  "h-10 rounded-xl border border-line-strong bg-base-200 px-3 text-sm text-ink outline-none",
                  "focus-visible:ring-2 focus-visible:ring-impact/40",
                )}
              >
                {PROJECTS.map((p) => (
                  <option key={p.id} value={p.id} className="bg-base-200">
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <Button variant="primary" accent="impact" onClick={generate} disabled={loading}>
              <Sparkles size={15} /> {loading ? "Generating…" : "Generate Impact Report"}
            </Button>
            {report && (
              <>
                <Button variant="outline" accent="impact" onClick={() => window.print()}>
                  <Printer size={15} /> Export PDF
                </Button>
                <Button variant="outline" accent="impact" onClick={copyJson}>
                  {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copied" : "Copy JSON"}
                </Button>
              </>
            )}
          </div>
        </Panel>

        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {!loading && report && <ReportDocument report={report} cloudinaryConfigured={configured} />}

        {!loading && !report && (
          <Panel className="no-print">
            <EmptyState
              icon={<FileText size={28} />}
              title="No report generated yet"
              description="Select a project and generate a traceable impact report from its visual evidence."
            />
          </Panel>
        )}
      </div>
    </AppShell>
  );
}
