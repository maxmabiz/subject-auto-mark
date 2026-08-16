import { Sheet, SheetContent } from "@/components/ui/sheet";
import { CHANNEL_LOG_ACTION_LABEL } from "@/domain/channel/log";
import { displayPlatform } from "@/domain/constants";
import type { ApprovalRuleChange, ChannelRuleLog, Rule } from "@/domain/types";
import { formatDateTime } from "@/lib/format";
import { useAppStore } from "@/store/AppStore";

export function ChannelRuleLogDrawer({
  rule,
  open,
  onOpenChange,
}: {
  rule: Rule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { channelLogsFor } = useAppStore();
  const logs = rule ? channelLogsFor(rule.id) : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[420px]" title="变更记录">
        {rule ? (
          <div className="flex-1 overflow-auto px-5 py-4">
            <div className="mb-4 text-sm leading-6 text-slate-500">
              {displayPlatform(rule.platform)} · {rule.account} · {rule.searchField}
            </div>
            {logs.length ? (
              <ol className="space-y-4 border-l border-slate-200 pl-4">
                {logs.map((log) => (
                  <li key={log.id} className="relative">
                    <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-600 ring-1 ring-slate-200" />
                    <div className="text-sm font-medium">{CHANNEL_LOG_ACTION_LABEL[log.action]}</div>
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

function LogDetail({ log }: { log: ChannelRuleLog }) {
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

function visibleChanges(log: ChannelRuleLog): ApprovalRuleChange[] {
  if (log.action === "create" || log.action === "import") {
    const created = log.changes.every((item) => item.from === "—");
    if (created) return log.changes.filter((item) => item.field === "科目" || item.field === "检索关键词");
  }
  return log.changes;
}
