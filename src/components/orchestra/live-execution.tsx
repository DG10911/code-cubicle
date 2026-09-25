"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Radio,
  Boxes,
  ScrollText,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ArrowRight,
  RotateCw,
} from "lucide-react";
import { Panel, PanelHeader, Badge, BlockMeter, Chip, Button, Stat } from "@/components/ui";
import { cn } from "@/lib/utils";
import { streamRun } from "@/components/orchestra/sse";
import { STAGES, STATE_ORDER } from "@/lib/orchestra/types";
import type { OrchestraEvent, Stage, WorkflowState } from "@/lib/orchestra/types";

type LogTone = "neutral" | "info" | "signal" | "warn" | "danger" | "impact";
interface LogEntry {
  seq: number;
  label: string;
  text: string;
  tone: LogTone;
}

const num = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);
const str = (v: unknown) => (v == null ? "" : String(v));

export function LiveExecution({ query }: { query: string }) {
  const [status, setStatus] = useState<"running" | "done" | "error">("running");
  const [state, setState] = useState<WorkflowState>("CREATED");
  const [stages, setStages] = useState<Record<Stage, number>>({
    DISCOVERY: 0,
    EXTRACTION: 0,
    VALIDATION: 0,
    DEDUPLICATION: 0,
    EVIDENCE: 0,
  });
  const [sources, setSources] = useState<string[]>([]);
  const [extracted, setExtracted] = useState({ index: 0, total: 0 });
  const [validated, setValidated] = useState(0);
  const [conflicts, setConflicts] = useState(0);
  const [duplicates, setDuplicates] = useState(0);
  const [evidence, setEvidence] = useState(0);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [nonce, setNonce] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);

  const push = (e: LogEntry) => setLog((l) => [...l, e]);

  useEffect(() => {
    const controller = new AbortController();
    // reset for re-runs
    setStatus("running");
    setState("CREATED");
    setStages({ DISCOVERY: 0, EXTRACTION: 0, VALIDATION: 0, DEDUPLICATION: 0, EVIDENCE: 0 });
    setSources([]);
    setExtracted({ index: 0, total: 0 });
    setValidated(0);
    setConflicts(0);
    setDuplicates(0);
    setEvidence(0);
    setLog([]);

    streamRun(query, 0.5, {
      signal: controller.signal,
      onEvent: (ev: OrchestraEvent) => handle(ev),
      onDone: () => {
        setStatus("done");
        setState("COMPLETED");
      },
      onError: () => setStatus("error"),
    });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, nonce]);

  function handle(ev: OrchestraEvent) {
    const p = ev.payload;
    switch (ev.type) {
      case "TASK_CREATED":
        push({ seq: ev.seq, label: "TASK", text: "Task created", tone: "info" });
        break;
      case "STATE_CHANGED": {
        const to = str(p.to) as WorkflowState;
        setState(to);
        push({ seq: ev.seq, label: "STATE", text: `Workflow → ${to}`, tone: "info" });
        break;
      }
      case "PLAN_GENERATED":
        push({ seq: ev.seq, label: "PLAN", text: `Plan generated · ${num(p.fields)} fields · ${num(p.steps)} steps`, tone: "signal" });
        break;
      case "SOURCE_DISCOVERED": {
        const s = str(p.source);
        setSources((prev) => (prev.includes(s) ? prev : [...prev, s]));
        push({ seq: ev.seq, label: "SOURCE", text: `Discovered ${s} (${num(p.index)}/${num(p.total)})`, tone: "neutral" });
        break;
      }
      case "STAGE_PROGRESS":
        setStages((prev) => ({ ...prev, [str(p.stage) as Stage]: num(p.value) }));
        break;
      case "RECORD_EXTRACTED":
        setExtracted({ index: num(p.index), total: num(p.total) });
        push({ seq: ev.seq, label: "EXTRACT", text: `${str(p.name)} · ${str(p.id)}`, tone: "neutral" });
        break;
      case "RECORD_VALIDATED": {
        setValidated((v) => v + 1);
        const st = str(p.status);
        if (st !== "publishable" && st !== "duplicate")
          push({ seq: ev.seq, label: "VALIDATE", text: `${str(p.id)} → ${st}`, tone: st === "unverified" ? "danger" : "warn" });
        break;
      }
      case "DUPLICATE_FOUND":
        setDuplicates((d) => d + 1);
        push({ seq: ev.seq, label: "DEDUPE", text: `${str(p.id)} duplicates ${str(p.duplicateOf)}`, tone: "warn" });
        break;
      case "CONFLICT_DETECTED": {
        setConflicts((c) => c + 1);
        const vals = Array.isArray(p.values) ? (p.values as { value: string }[]).map((v) => v.value).join(" vs ") : "";
        push({ seq: ev.seq, label: "CONFLICT", text: `${str(p.id)} · ${str(p.field)} — ${vals}`, tone: "danger" });
        break;
      }
      case "EVIDENCE_ATTACHED":
        setEvidence(num(p.progress));
        break;
      case "TASK_COMPLETED":
        push({ seq: ev.seq, label: "DONE", text: `Task completed · ${num(p.records)} records`, tone: "impact" });
        break;
    }
  }

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  const stateIdx = STATE_ORDER.indexOf(state);

  return (
    <div className="space-y-5">
      {/* Workflow state machine */}
      <Panel>
        <PanelHeader
          title="Workflow state"
          subtitle="Advances on real STATE_CHANGED events"
          icon={<Radio size={16} className={status === "running" ? "text-signal animate-pulse-soft" : ""} />}
          right={
            status === "running" ? (
              <Badge tone="signal">running</Badge>
            ) : status === "done" ? (
              <Badge tone="impact">completed</Badge>
            ) : (
              <Badge tone="danger">stream error</Badge>
            )
          }
        />
        <div className="flex flex-wrap items-center gap-1.5 p-5">
          {STATE_ORDER.map((s, i) => {
            const active = i === stateIdx && status === "running";
            const done = i < stateIdx || status === "done";
            return (
              <div key={s} className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-2xs font-semibold uppercase tracking-wide transition-colors",
                    active && "border-signal/40 bg-signal/10 text-signal",
                    done && !active && "border-impact/30 bg-impact/10 text-impact",
                    !done && !active && "border-line bg-base-200 text-ink-faint",
                  )}
                >
                  {s}
                </span>
                {i < STATE_ORDER.length - 1 && <ArrowRight size={12} className="text-ink-ghost" />}
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Stage meters */}
      <Panel>
        <PanelHeader title="Pipeline stages" subtitle="Progress derived from STAGE_PROGRESS events — never a local timer" icon={<Boxes size={16} />} />
        <div className="space-y-2.5 p-5">
          {STAGES.map((stg) => (
            <div key={stg} className="flex items-center gap-4">
              <span className="w-28 shrink-0 text-2xs font-semibold uppercase tracking-wider text-ink-muted">{stg}</span>
              <BlockMeter value={stages[stg]} width={28} />
              <span className="mono-num ml-auto w-10 text-right text-xs text-ink-faint">{stages[stg]}%</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* Counters */}
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Sources" value={sources.length} accent="signal" />
        <Stat label="Records" value={extracted.total ? `${extracted.index}/${extracted.total}` : extracted.index} />
        <Stat label="Conflicts" value={conflicts} hint="needs review" />
        <Stat label="Duplicates" value={duplicates} hint="merged" />
      </div>

      {/* Sources */}
      {sources.length > 0 && (
        <Panel>
          <PanelHeader title="Sources discovered" icon={<Copy size={16} />} />
          <div className="flex flex-wrap gap-2 p-5">
            {sources.map((s) => (
              <Chip key={s} className="animate-fade-up border-signal/20 text-signal">
                {s}
              </Chip>
            ))}
          </div>
        </Panel>
      )}

      {/* Event log */}
      <Panel>
        <PanelHeader
          title="Live event log"
          subtitle="The actual ordered event stream from the execution engine"
          icon={<ScrollText size={16} />}
          right={<span className="mono-num text-2xs text-ink-faint">evidence {evidence}% · {validated} validated</span>}
        />
        <div ref={logRef} className="max-h-80 overflow-y-auto p-3 font-mono text-xs">
          {log.length === 0 ? (
            <div className="px-2 py-6 text-center text-ink-faint">Waiting for events…</div>
          ) : (
            log.map((e) => (
              <div key={e.seq} className="row-enter flex items-start gap-3 px-2 py-1">
                <span className="mono-num w-8 shrink-0 text-right text-ink-ghost">{String(e.seq).padStart(2, "0")}</span>
                <span
                  className={cn(
                    "w-20 shrink-0 font-semibold uppercase",
                    e.tone === "danger" && "text-danger",
                    e.tone === "warn" && "text-warn",
                    e.tone === "signal" && "text-signal",
                    e.tone === "impact" && "text-impact",
                    e.tone === "info" && "text-info",
                    e.tone === "neutral" && "text-ink-faint",
                  )}
                >
                  {e.label}
                </span>
                <span className={cn("min-w-0 flex-1 break-words", e.tone === "danger" ? "text-danger" : "text-ink-muted")}>
                  {e.text}
                </span>
              </div>
            ))
          )}
        </div>
      </Panel>

      {/* Terminal actions */}
      {status === "error" && (
        <Panel className="border-danger/30">
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <div className="flex items-center gap-2 text-sm text-danger">
              <AlertTriangle size={15} />
              The live stream was interrupted. The deterministic dataset is still available.
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setNonce((n) => n + 1)}>
                <RotateCw size={14} /> Retry stream
              </Button>
              <Link href={`/orchestra/dataset?q=${encodeURIComponent(query)}`}>
                <Button variant="primary" accent="signal">
                  View dataset <ArrowRight size={15} />
                </Button>
              </Link>
            </div>
          </div>
        </Panel>
      )}

      {status === "done" && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-impact/30 bg-impact/[0.06] px-5 py-4">
          <div className="flex items-center gap-2 text-sm text-ink">
            <CheckCircle2 size={16} className="text-impact" />
            Run complete — every field is bound to source evidence and scored.
          </div>
          <Link href={`/orchestra/dataset?q=${encodeURIComponent(query)}`}>
            <Button variant="primary" accent="signal" size="lg" className="tracking-wide">
              View dataset <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
