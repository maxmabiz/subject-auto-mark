import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SUBJECT_LOG_ACTION_LABEL } from "@/domain/subject/log";
import type { ApprovalRuleChange, LedgerSubject, SubjectLog } from "@/domain/types";
import { formatDateTime } from "@/lib/format";
import { useAppStore } from "@/store/AppStore";

export function SubjectLogDrawer({
  subject,
  open,
  onOpenChange,
}: {
  subject: LedgerSubject | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { subjectLogsFor } = useAppStore();
  const logs = subject ? subjectLogsFor(subject.id) : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[420px]" title="变更记录">
        {subject ? (
          <div className="flex-1 overflow-auto px-5 py-4">
            <div className="mb-5 text-sm text-slate-500">
              {subject.code} {subject.name}
            </div>
            {logs.length ? (
              <ol className="space-y-5 border-l border-slate-200 pl-4">
                {logs.map((log) => (
                  <li key={log.id} className="relative">
                    <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-600 ring-1 ring-slate-200" />
                    <div className="text-sm font-medium">{SUBJECT_LOG_ACTION_LABEL[log.action]}</div>
                    <div className="text-xs text-muted">{formatDateTime(log.time)} · {log.actor}</div>
                    <LogDetail log={log} />
                  </li>
                ))}
              </ol>
            ) : (
              <div className="text-sm text-muted">暂无变更记录</div>
            )}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function LogDetail({ log }: { log: SubjectLog }) {
  if (log.action === "delete") {
    return <div className="mt-1 text-xs text-slate-600">{log.summary}</div>;
  }
  const lines = visibleChanges(log);
  if (!lines.length) return null;
  return (
    <div className="mt-1 space-y-0.5 text-xs leading-5 text-slate-600">
      {lines.map((change) => (
        <div key={`${log.id}-${change.field}`}>
          {change.from === "—" ? (
            <>{change.field} {change.to}</>
          ) : (
            <>{change.field} {change.from} → {change.to}</>
          )}
        </div>
      ))}
    </div>
  );
}

function visibleChanges(log: SubjectLog): ApprovalRuleChange[] {
  if (log.action === "create") return log.changes;
  return log.changes;
}
