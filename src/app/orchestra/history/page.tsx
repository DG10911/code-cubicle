import { History as HistoryIcon } from "lucide-react";
import { AppShell } from "@/components/shell";
import { Panel, PanelHeader, Stat, Badge } from "@/components/ui";
import { ORCHESTRA_NAV } from "@/components/orchestra/nav";
import { TaskList } from "@/components/orchestra/task-list";
import { TASK_HISTORY } from "@/lib/orchestra/fixtures";

export default function HistoryPage() {
  const totalRecords = TASK_HISTORY.reduce((a, t) => a + t.recordCount, 0);
  const totalPublishable = TASK_HISTORY.reduce((a, t) => a + t.publishableCount, 0);
  const totalConflicts = TASK_HISTORY.reduce((a, t) => a + t.conflictCount, 0);
  const avgCoverage = Math.round(
    (TASK_HISTORY.reduce((a, t) => a + t.evidenceCoverage, 0) / TASK_HISTORY.length) * 100,
  );

  return (
    <AppShell
      product="orchestra"
      nav={ORCHESTRA_NAV}
      title="History"
      right={<Badge tone="signal">fixture dataset</Badge>}
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="grid gap-3 sm:grid-cols-4">
          <Stat label="Tasks" value={TASK_HISTORY.length} accent="signal" />
          <Stat label="Records" value={totalRecords.toLocaleString()} />
          <Stat label="Publishable" value={totalPublishable.toLocaleString()} accent="impact" />
          <Stat label="Avg evidence" value={`${avgCoverage}%`} hint={`${totalConflicts} conflicts flagged`} />
        </div>

        <Panel>
          <PanelHeader
            title="Task history"
            subtitle="Every run is reproducible from its query — open a completed task to inspect its dataset"
            icon={<HistoryIcon size={16} />}
          />
          <TaskList tasks={TASK_HISTORY} detailed />
        </Panel>
      </div>
    </AppShell>
  );
}
