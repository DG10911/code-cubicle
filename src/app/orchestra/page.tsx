import Link from "next/link";
import { Database, ShieldCheck, GitBranch, Activity } from "lucide-react";
import { AppShell } from "@/components/shell";
import { Panel, PanelHeader, Badge, Stat, Button } from "@/components/ui";
import { ORCHESTRA_NAV } from "@/components/orchestra/nav";
import { CommandBox } from "@/components/orchestra/command-box";
import { TaskList } from "@/components/orchestra/task-list";
import { TASK_HISTORY } from "@/lib/orchestra/fixtures";

export default function CommandCenter() {
  const totalRecords = TASK_HISTORY.reduce((a, t) => a + t.recordCount, 0);
  const totalPublishable = TASK_HISTORY.reduce((a, t) => a + t.publishableCount, 0);
  const totalConflicts = TASK_HISTORY.reduce((a, t) => a + t.conflictCount, 0);

  return (
    <AppShell
      product="orchestra"
      nav={ORCHESTRA_NAV}
      title="Command Center"
      right={<Badge tone="signal">fixture dataset</Badge>}
    >
      <div className="mx-auto max-w-5xl space-y-10 py-4">
        <div className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-line bg-base-100 px-3 py-1 text-2xs text-ink-faint">
            <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse-soft" />
            Data Intelligence OS · event-driven multi-agent research
          </div>
          <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink">
            From one sentence to a{" "}
            <span className="bg-gradient-to-r from-signal to-info bg-clip-text text-transparent">verified dataset</span>.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-pretty text-sm leading-relaxed text-ink-muted">
            Every field links back to its source evidence, confidence, and conflicts. Ask in plain language — watch the
            plan generate, the agents run live, and the dataset assemble.
          </p>
        </div>

        <CommandBox />

        <div className="grid gap-3 sm:grid-cols-4">
          <Stat label="Tasks run" value={TASK_HISTORY.length} accent="signal" />
          <Stat label="Records assembled" value={totalRecords.toLocaleString()} />
          <Stat label="Publishable" value={totalPublishable.toLocaleString()} accent="impact" />
          <Stat label="Conflicts flagged" value={totalConflicts} hint="honest uncertainty" />
        </div>

        <Panel>
          <PanelHeader
            title="Active / Recent Tasks"
            subtitle="Click a completed task to open its evidence-backed dataset"
            icon={<Database size={16} />}
            right={
              <Link href="/orchestra/history">
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </Link>
            }
          />
          <TaskList tasks={TASK_HISTORY} />
        </Panel>

        <div className="grid gap-3 sm:grid-cols-3">
          <Principle icon={<ShieldCheck size={15} />} title="Provenance by default" body="Every non-null field is bound to a source snippet, type, reliability, and retrieval time." />
          <Principle icon={<Activity size={15} />} title="Live, real events" body="Progress derives from the actual event stream — sources, records, conflicts — never a fake timer." />
          <Principle icon={<GitBranch size={15} />} title="Honest uncertainty" body="Conflicts and unverifiable fields are surfaced, not hidden. Review flags travel with the data." />
        </div>
      </div>
    </AppShell>
  );
}

function Principle({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="panel-inset p-4">
      <div className="flex items-center gap-2 text-ink">
        <span className="text-signal">{icon}</span>
        <span className="text-sm font-medium">{title}</span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-ink-faint">{body}</p>
    </div>
  );
}
