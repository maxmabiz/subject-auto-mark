import { SourceBadge, StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SOURCE_LABEL, displayPlatform } from "@/domain/constants";
import { formatSubject } from "@/domain/matching";
import type { AuditLog, EnrichedTransaction } from "@/domain/types";
import { dash, formatDateTime, formatMoney } from "@/lib/format";
import { useAppStore } from "@/store/AppStore";

export function TransactionDrawer({
  record,
  open,
  onOpenChange,
  onManual,
}: {
  record: EnrichedTransaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onManual: () => void;
}) {
  const { logsFor } = useAppStore();
  const tx = record?.transaction;
  const basis = record ? matchBasis(record) : [];
  const logs = record
    ? logsFor(record.transaction.id).filter(isMatchLog).sort((a, b) => a.time.localeCompare(b.time))
    : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[420px]" title="匹配详情">
        {record && tx ? (
          <div className="flex-1 overflow-auto px-5 py-4">
            <div className="text-sm font-medium text-ink">{tx.transactionId || tx.transactionNo}</div>
            <div className="mt-1 text-sm text-slate-500">
              {displayPlatform(tx.platform)} · {formatMoney(tx.amount, tx.currency)}
            </div>

            <section className="mt-5">
              <h4 className="mb-3 text-sm font-semibold">匹配结果</h4>
              <div className="rounded-lg border border-slate-200 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={record.final.status} />
                  <SourceBadge source={record.final.source} />
                </div>
                <div className="mt-3 space-y-2">
                  <Row label="一级科目" value={dash(record.final.subject?.level1)} />
                  <Row label="二级科目" value={dash(record.final.subject?.level2)} />
                  <Row label="三级科目" value={dash(record.final.subject?.level3)} />
                </div>
              </div>
            </section>

            <section className="mt-5">
              <h4 className="mb-3 text-sm font-semibold">匹配依据</h4>
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 px-4">
                {basis.length ? basis.map((item) => (
                  <Row key={item.label} label={item.label} value={item.value} />
                )) : (
                  <div className="py-2.5 text-sm text-muted">暂无匹配依据</div>
                )}
              </div>
            </section>

            <section className="mt-5">
              <h4 className="mb-3 text-sm font-semibold">匹配记录</h4>
              {logs.length ? (
                <ol className="space-y-4 border-l border-slate-200 pl-4">
                  {logs.map((log) => (
                    <li key={log.id} className="relative">
                      <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-600 ring-1 ring-slate-200" />
                      <div className="text-sm font-medium">{log.action}</div>
                      <div className="text-xs text-muted">{formatDateTime(log.time)} · {log.actor}</div>
                      <div className="mt-1 text-xs text-slate-600">
                        {sourceLabel(log.fromSource)} → {sourceLabel(log.toSource)}
                      </div>
                      {log.fromSubject || log.toSubject ? (
                        <div className="mt-0.5 text-xs text-slate-600">
                          {formatSubject(log.fromSubject)} → {formatSubject(log.toSubject)}
                        </div>
                      ) : null}
                      {log.reason ? <div className="mt-0.5 text-xs leading-5 text-slate-500">{log.reason}</div> : null}
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="text-sm text-muted">暂无多次匹配记录</div>
              )}
            </section>
          </div>
        ) : null}
        <div className="flex justify-end border-t border-slate-200 px-5 py-3">
          <Button onClick={onManual}>标记</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function sourceLabel(source: string | null): string {
  if (!source) return "—";
  return SOURCE_LABEL[source] ?? source;
}

function isMatchLog(log: AuditLog): boolean {
  if (log.toSource && log.toSource !== "none") return true;
  return log.fromSource === "manual" || log.action.includes("覆盖") || log.action.includes("回退");
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <div className="shrink-0 text-xs text-slate-400">{label}</div>
      <div className="min-w-0 break-all text-right text-sm text-ink">{value}</div>
    </div>
  );
}

function matchBasis(record: EnrichedTransaction): { label: string; value: string }[] {
  const { final, manual, feishu, channel, transaction } = record;
  if (final.source === "manual" && manual) {
    return [
      { label: "修改原因", value: dash(manual.reason) },
      { label: "操作人", value: dash(manual.operator) },
    ];
  }
  if (final.source === "business") {
    return [{ label: "认领业务", value: dash(transaction.claimBusiness) }];
  }
  if (final.source === "feishu" && feishu) {
    return [
      { label: "审批单", value: dash(feishu.approvalName) },
      { label: "付款申请类型", value: dash(feishu.paymentType) },
      ...(feishu.otherDimension?.trim() ? [{ label: "其它维度", value: feishu.otherDimension.trim() }] : []),
    ];
  }
  if (final.source === "channel" && final.matchedField && final.matchedKeyword) {
    return [
      { label: "检索字段", value: dash(final.matchedField) },
      { label: "关键词", value: dash(final.matchedKeyword) },
    ];
  }
  if (final.status === "rule_conflict") {
    const subjects = [...new Set(channel.candidates.slice(0, 3).map((item) => formatSubject(item.subject)))];
    return [{ label: "原因", value: subjects.length ? `规则冲突：${subjects.join("；")}` : "多条规则命中不同科目" }];
  }
  if (final.status === "data_error") {
    return [{ label: "原因", value: channel.errors[0] || "缺少匹配所需字段" }];
  }
  if (!final.subject) {
    return [{ label: "原因", value: "未命中规则" }];
  }
  return [];
}
