import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Loader2 } from "lucide-react";
import { Badge, ConfidenceMeter } from "@/components/ui";
import { cn, formatRelative } from "@/lib/utils";
import type { TaskSummary, WorkflowState } from "@/lib/orchestra/types";

const STATE_TONE: Record<WorkflowState, React.ComponentProps<typeof Badge>["tone"]> = {
  CREATED: "neutral",
  PLANNING: "info",
  COLLECTING: "info",
  PROCESSING: "info",
  VALIDATING: "warn",
  REVIEW: "warn",
  COMPLETED: "impact",
  FAILED: "danger",
  CANCELLED: "neutral",
};

function TaskRow({ task, detailed }: { task: TaskSummary; detailed?: boolean }) {
  const done = task.state === "COMPLETED" || task.state === "REVIEW";
  const href = `/orchestra/dataset?q=${encodeURIComponent(task.query)}`;

  const body = (
    <div className="flex items-center gap-4 px-4 py-3">
      <div className={cn("shrink-0", done ? "text-impact" : "text-info")}>
        {task.state === "COMPLETED" ? (
          <CheckCircle2 size={16} />
        ) : (
          <Loader2 size={16} className={task.state === "REVIEW" ? "" : "animate-spin-slow"} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="mono-num text-2xs text-ink-faint">{task.id}</span>
          <Badge tone={STATE_TONE[task.state]}>{task.state}</Badge>
        </div>
        <p className="mt-1 truncate text-sm text-ink">{task.query}</p>
        {detailed && (
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-2xs text-ink-faint">
            <span>
              Records <span className="mono-num text-ink-muted">{task.recordCount.toLocaleString()}</span>
            </span>
            <span>
              Publishable <span className="mono-num text-impact">{task.publishableCount.toLocaleString()}</span>
            </span>
            <span>
              Conflicts <span className="mono-num text-warn">{task.conflictCount}</span>
            </span>
          </div>
        )}
      </div>

      <div className="hidden shrink-0 flex-col items-end gap-1.5 sm:flex">
        <div className="flex items-center gap-2">
          <span className="mono-num text-sm text-ink">{task.recordCount.toLocaleString()}</span>
          <span className="text-2xs text-ink-faint">rows</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xs text-ink-faint">evidence</span>
          <ConfidenceMeter value={task.evidenceCoverage} />
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div className="text-2xs text-ink-faint">{formatRelative(task.createdAt)}</div>
        {done && <ArrowUpRight size={14} className="ml-auto mt-1 text-ink-ghost transition-colors group-hover:text-signal" />}
      </div>
    </div>
  );

  if (!done) {
    return <div className="border-b border-line last:border-0 opacity-70">{body}</div>;
  }
  return (
    <Link
      href={href}
      className="group block border-b border-line transition-colors last:border-0 hover:bg-base-200/50"
    >
      {body}
    </Link>
  );
}

export function TaskList({ tasks, detailed }: { tasks: TaskSummary[]; detailed?: boolean }) {
  return (
    <div className="divide-y divide-line">
      {tasks.map((t) => (
        <TaskRow key={t.id} task={t} detailed={detailed} />
      ))}
    </div>
  );
}
