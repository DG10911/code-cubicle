"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Radio, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/shell";
import { Badge, Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ORCHESTRA_NAV, DEFAULT_QUERY } from "@/components/orchestra/nav";
import { PlanView } from "@/components/orchestra/plan-view";
import { LiveExecution } from "@/components/orchestra/live-execution";

function RunInner() {
  const params = useSearchParams();
  const initialQuery = (params.get("q") || DEFAULT_QUERY).trim();
  const [phase, setPhase] = useState<"plan" | "exec">("plan");
  const [execQuery, setExecQuery] = useState(initialQuery);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Phase indicator */}
      <div className="flex items-center gap-2">
        {(["plan", "exec"] as const).map((ph, i) => (
          <div key={ph} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => ph === "plan" && setPhase("plan")}
              disabled={ph === "exec"}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-2xs font-semibold uppercase tracking-wider transition-colors",
                phase === ph
                  ? "border-signal/40 bg-signal/10 text-signal"
                  : "border-line bg-base-100 text-ink-faint",
                ph === "plan" && phase === "exec" && "cursor-pointer hover:text-ink",
              )}
            >
              <span className="mono-num">{i + 1}</span>
              {ph === "plan" ? "Plan" : "Live Execution"}
            </button>
            {i === 0 && <span className="text-ink-ghost">→</span>}
          </div>
        ))}
      </div>

      {phase === "plan" ? (
        <PlanView
          initialQuery={initialQuery}
          onExecute={(q) => {
            setExecQuery(q);
            setPhase("exec");
          }}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-base-100/60 px-4 py-2.5">
            <div className="flex items-center gap-2 truncate text-xs text-ink-muted">
              <Radio size={13} className="shrink-0 text-signal" />
              <span className="truncate" title={execQuery}>
                {execQuery}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setPhase("plan")} className="shrink-0">
              <ChevronLeft size={14} /> Back to plan
            </Button>
          </div>
          <LiveExecution query={execQuery} />
        </div>
      )}
    </div>
  );
}

export default function RunPage() {
  return (
    <AppShell
      product="orchestra"
      nav={ORCHESTRA_NAV}
      title="Run"
      right={
        <Link href="/orchestra">
          <Badge tone="neutral">command center</Badge>
        </Link>
      }
    >
      <Suspense fallback={<div className="p-8 text-sm text-ink-faint">Loading run…</div>}>
        <RunInner />
      </Suspense>
    </AppShell>
  );
}
