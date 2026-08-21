import { Sheet, SheetContent } from "@/components/ui/sheet";
import { BUSINESS_LOG_ACTION_LABEL } from "@/domain/business/log";
import type { ApprovalRuleChange, BusinessRule, BusinessRuleLog } from "@/domain/types";
import { formatDateTime } from "@/lib/format";
import { useAppStore } from "@/store/AppStore";

export function BusinessRuleLogDrawer({
  rule,
  open,
  onOpenChange,
}: {
  rule: BusinessRule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { businessLogsFor } = useAppStore();
  const logs = rule ? businessLogsFor(rule.id) : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[420px]" title="变更记录">
        {rule ? (
          <div className="flex-1 overflow-auto px-5 py-4">
            <div className="mb-5 text-sm text-slate-500">{rule.claimBusiness}</div>
            {logs.length ? (
              <ol className="space-y-5 border-l border-slate-200 pl-4">
                {logs.map((log) => (
                  <li key={log.id} className="relative">
                    <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-600 ring-1 ring-slate-200" />
                    <div className="text-sm font-medium">{BUSINESS_LOG_ACTION_LABEL[log.action]}</div>
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

function LogDetail({ log }: { log: BusinessRuleLog }) {
  if (log.action === "delete") {
    return <div className="mt-1 text-xs text-slate-600">{log.summary}</div>;
  }
  const lines = log.changes;
  if (!lines.length) return null;
  return (
    <div className="mt-1 space-y-0.5 text-xs leading-5 text-slate-600">
      {lines.map((change: ApprovalRuleChange) => (
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
