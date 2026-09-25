"use client";

import { Brain, ListChecks, Database, ShieldOff, ShieldAlert, Eye } from "lucide-react";
import { Panel, PanelHeader } from "@/components/ui";
import type { DataRecord, ResearchPlan } from "@/lib/orchestra/types";

export function AIExplanation({ plan, records }: { plan: ResearchPlan; records: DataRecord[] }) {
  const publishable = records.filter((r) => r.status === "publishable").length;
  const unverified = records.filter((r) => r.status === "unverified").length;
  const needsReview = records.filter((r) => r.status === "needs_review").length;
  const duplicates = records.filter((r) => r.status === "duplicate").length;
  const conflicts = records.reduce((a, r) => a + r.conflicts.length, 0);
  const missing = records.reduce((a, r) => a + r.missingFields.length, 0);

  const sections: { icon: React.ReactNode; title: string; tone: string; body: React.ReactNode }[] = [
    {
      icon: <Brain size={14} />,
      title: "What I understood",
      tone: "text-signal",
      body: plan.intent,
    },
    {
      icon: <ListChecks size={14} />,
      title: "Plan",
      tone: "text-ink-muted",
      body: `Ran ${plan.steps.length} steps across ${new Set(plan.steps.map((s) => s.agent)).size} agents to populate a ${plan.schema.length}-field schema.`,
    },
    {
      icon: <Database size={14} />,
      title: "Found",
      tone: "text-impact",
      body: `${records.length} records extracted with source-bound evidence — ${publishable} publishable right now.`,
    },
    {
      icon: <ShieldOff size={14} />,
      title: "Could not verify",
      tone: "text-danger",
      body:
        unverified || missing
          ? `${unverified} record${unverified === 1 ? "" : "s"} unverified and ${missing} field${missing === 1 ? "" : "s"} left blank — no sufficiently reliable public evidence. Left honest, not guessed.`
          : "Every field found sufficiently reliable evidence.",
    },
    {
      icon: <ShieldAlert size={14} />,
      title: "Conflicts",
      tone: "text-warn",
      body: conflicts
        ? `${conflicts} field-level conflict${conflicts === 1 ? "" : "s"} where sources disagree — surfaced for human resolution, not silently merged.`
        : "No source conflicts detected.",
    },
    {
      icon: <Eye size={14} />,
      title: "Should be reviewed",
      tone: "text-info",
      body: `${needsReview} need review · ${duplicates} duplicate${duplicates === 1 ? "" : "s"} flagged. Review flags travel with the export.`,
    },
  ];

  return (
    <Panel>
      <PanelHeader
        title="AI explanation"
        subtitle="An honest account of this run — derived from the data, not asserted"
        icon={<Brain size={16} />}
      />
      <div className="grid gap-px bg-line sm:grid-cols-2">
        {sections.map((s) => (
          <div key={s.title} className="bg-base-100 p-4">
            <div className={`flex items-center gap-2 text-2xs font-semibold uppercase tracking-wider ${s.tone}`}>
              {s.icon}
              {s.title}
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{s.body}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}
