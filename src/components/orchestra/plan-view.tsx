"use client";

import { useEffect, useRef, useState } from "react";
import {
  Brain,
  ListChecks,
  Play,
  RefreshCw,
  ChevronDown,
  AlertTriangle,
  Table2,
  Wand2,
} from "lucide-react";
import { Panel, PanelHeader, Chip, Badge, Button, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { ResearchPlan, AgentName } from "@/lib/orchestra/types";

const AGENT_ORDER: AgentName[] = [
  "SourceDiscovery",
  "Extraction",
  "Validation",
  "EntityResolution",
  "Evidence",
  "Quality",
  "Export",
  "Planner",
];

const FIELD_TYPE_TONE: Record<string, React.ComponentProps<typeof Badge>["tone"]> = {
  string: "neutral",
  url: "info",
  date: "signal",
  money: "impact",
  enum: "warn",
  list: "neutral",
};

export function PlanView({
  initialQuery,
  onExecute,
}: {
  initialQuery: string;
  onExecute: (query: string) => void;
}) {
  const [committed, setCommitted] = useState(initialQuery);
  const [draft, setDraft] = useState(initialQuery);
  const [plan, setPlan] = useState<ResearchPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flagged, setFlagged] = useState(false);
  const [flash, setFlash] = useState(false);
  const [newKeys, setNewKeys] = useState<Set<string>>(new Set());
  const [newSteps, setNewSteps] = useState<Set<string>>(new Set());
  const [openField, setOpenField] = useState<string | null>(null);
  const planRef = useRef<ResearchPlan | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchPlan(query: string, isUpdate: boolean) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/orchestra/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) throw new Error(`plan failed: ${res.status}`);
      const data = (await res.json()) as { plan: ResearchPlan; injectionFlagged: boolean };
      const prev = planRef.current;
      if (isUpdate && prev) {
        const prevKeys = new Set(prev.schema.map((s) => s.key));
        const prevSteps = new Set(prev.steps.map((s) => s.id));
        setNewKeys(new Set(data.plan.schema.filter((s) => !prevKeys.has(s.key)).map((s) => s.key)));
        setNewSteps(new Set(data.plan.steps.filter((s) => !prevSteps.has(s.id)).map((s) => s.id)));
        setFlash(true);
        if (flashTimer.current) clearTimeout(flashTimer.current);
        flashTimer.current = setTimeout(() => setFlash(false), 2600);
      } else {
        setNewKeys(new Set());
        setNewSteps(new Set());
      }
      planRef.current = data.plan;
      setPlan(data.plan);
      setFlagged(data.injectionFlagged);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPlan(initialQuery, false);
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const update = () => {
    const q = draft.trim();
    if (!q || q === committed) return;
    setCommitted(q);
    fetchPlan(q, true);
  };

  const stepNumber = new Map<string, number>();
  plan?.steps.forEach((s, i) => stepNumber.set(s.id, i + 1));
  const agents = AGENT_ORDER.filter((a) => plan?.steps.some((s) => s.agent === a));

  return (
    <div className="space-y-5">
      {/* Editable query — the WOW moment */}
      <Panel className="overflow-hidden">
        <PanelHeader
          title="Research request"
          subtitle="Edit the request and re-plan — the schema and steps adapt to what you ask for"
          icon={<Wand2 size={16} />}
          right={flash ? <Badge tone="signal">plan updated</Badge> : undefined}
        />
        <div className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && update()}
              spellCheck={false}
              className="min-w-0 flex-1 rounded-xl border border-line bg-base-50 px-4 py-2.5 text-sm text-ink placeholder:text-ink-ghost focus:border-signal/40 focus:outline-none focus:ring-2 focus:ring-signal/20"
              placeholder="Describe the dataset you need…"
            />
            <Button variant="outline" onClick={update} disabled={loading || draft.trim() === committed} className="shrink-0">
              <RefreshCw size={14} className={loading ? "animate-spin-slow" : ""} />
              Update plan
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-2xs text-ink-faint">
            <span>Append a signal to expand the plan:</span>
            {["+ founders", "+ recent activity", "+ linkedin", "+ location"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setDraft((d) => `${d.trim()} ${s.replace("+ ", "and ")}`)}
                className="kbd transition-colors hover:text-signal"
              >
                {s}
              </button>
            ))}
          </div>
          {flagged && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-2xs text-warn">
              <AlertTriangle size={13} />
              Prompt-injection pattern detected in the request — treated strictly as data, never as instructions.
            </div>
          )}
        </div>
      </Panel>

      {error && (
        <Panel className="border-danger/30">
          <div className="flex items-center gap-2 px-5 py-4 text-sm text-danger">
            <AlertTriangle size={15} /> Could not generate a plan: {error}
          </div>
        </Panel>
      )}

      {/* What I understood */}
      <Panel>
        <PanelHeader title="What I understood" subtitle="Intent, entities, and constraints parsed from the request" icon={<Brain size={16} />} />
        <div className="space-y-4 p-5">
          {loading && !plan ? (
            <Skeleton className="h-16 w-full" />
          ) : plan ? (
            <>
              <p className="text-[15px] leading-relaxed text-ink">{plan.intent}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-2xs uppercase tracking-wider text-ink-faint">Entities</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {plan.entities.map((e) => (
                      <Chip key={e}>{e}</Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-2xs uppercase tracking-wider text-ink-faint">Constraints</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {plan.constraints.length ? (
                      plan.constraints.map((c) => (
                        <Badge key={c.key} tone="signal" title={`${c.key} ${c.op} ${c.value}`}>
                          {c.label}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-ink-faint">No hard constraints — broad discovery.</span>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </Panel>

      {/* Schema */}
      <Panel>
        <PanelHeader
          title="Dataset schema"
          subtitle="Fields the planner chose — click any field for its rationale"
          icon={<Table2 size={16} />}
          right={plan ? <span className="mono-num text-2xs text-ink-faint">{plan.schema.length} fields</span> : undefined}
        />
        <div className="divide-y divide-line">
          {loading && !plan
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="m-4 h-6" />)
            : plan?.schema.map((f) => {
                const isNew = newKeys.has(f.key);
                const open = openField === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setOpenField(open ? null : f.key)}
                    className={cn(
                      "flex w-full flex-col gap-1 px-5 py-3 text-left transition-colors hover:bg-base-200/40",
                      isNew && "bg-signal/[0.06] animate-fade-up",
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="mono-num text-sm text-ink">{f.key}</span>
                      <Badge tone={FIELD_TYPE_TONE[f.type]}>{f.type}</Badge>
                      {f.required && <span className="text-2xs text-ink-faint">required</span>}
                      {isNew && <Badge tone="signal">new</Badge>}
                      <ChevronDown
                        size={13}
                        className={cn("ml-auto text-ink-ghost transition-transform", open && "rotate-180")}
                      />
                    </div>
                    {open && <p className="pr-6 text-xs leading-relaxed text-ink-faint">{f.rationale}</p>}
                  </button>
                );
              })}
        </div>
      </Panel>

      {/* Plan steps grouped by agent */}
      <Panel>
        <PanelHeader
          title="Execution plan"
          subtitle="Ordered steps, grouped by the agent that owns them"
          icon={<ListChecks size={16} />}
          right={plan ? <span className="mono-num text-2xs text-ink-faint">{plan.steps.length} steps</span> : undefined}
        />
        <div className="space-y-4 p-5">
          {loading && !plan
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)
            : agents.map((agent) => (
                <div key={agent}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-signal" />
                    <span className="text-2xs font-semibold uppercase tracking-wider text-ink-muted">{agent}</span>
                  </div>
                  <div className="space-y-1.5 border-l border-line pl-4">
                    {plan?.steps
                      .filter((s) => s.agent === agent)
                      .map((s) => {
                        const isNew = newSteps.has(s.id);
                        return (
                          <div
                            key={s.id}
                            className={cn(
                              "rounded-lg border px-3 py-2 transition-colors",
                              isNew ? "border-signal/40 bg-signal/[0.06] animate-fade-up" : "border-line bg-base-50",
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <span className="mono-num text-2xs text-ink-faint">
                                {String(stepNumber.get(s.id)).padStart(2, "0")}
                              </span>
                              <span className="text-sm text-ink">{s.title}</span>
                              {isNew && <Badge tone="signal">new</Badge>}
                            </div>
                            <p className="mt-0.5 pl-6 text-xs leading-relaxed text-ink-faint">{s.detail}</p>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
        </div>
      </Panel>

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-base-100/60 px-5 py-4">
        <div className="text-xs text-ink-faint">
          Plan looks right? Execute the event-driven run — every step emits real events you can watch.
        </div>
        <Button
          variant="primary"
          accent="signal"
          size="lg"
          onClick={() => onExecute(committed)}
          disabled={loading || !plan}
          className="shrink-0 tracking-wide"
        >
          <Play size={16} />
          Execute
        </Button>
      </div>
    </div>
  );
}
