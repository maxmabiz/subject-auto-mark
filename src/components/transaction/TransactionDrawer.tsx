import { SourceBadge, StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { displayPlatform } from "@/domain/constants";
import { formatSubject } from "@/domain/matching";
import type { EnrichedTransaction } from "@/domain/types";
import { dash, formatAmount, formatDateTime, formatMoney } from "@/lib/format";
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
  const logs = record ? logsFor(record.transaction.id) : [];
  const tx = record?.transaction;
  const infoRows = tx ? transactionRows(record) : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[480px]" title="流水详情">
        {record && tx ? (
          <div className="flex-1 overflow-auto px-5 py-4">
            <div className="text-sm font-medium text-ink">{tx.transactionId || tx.transactionNo}</div>
            <div className="mt-1 text-sm text-slate-500">
              {displayPlatform(tx.platform)} · {formatMoney(tx.amount, tx.currency)}
            </div>

            <section className="mt-6">
              <h4 className="mb-3 text-sm font-semibold">科目</h4>
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
                <div className="mt-3 text-xs leading-5 text-slate-500">{matchReason(record)}</div>
              </div>
            </section>

            <section className="mt-6">
              <h4 className="mb-3 text-sm font-semibold">流水信息</h4>
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 px-4">
                {infoRows.map((item) => (
                  <Row key={item.label} label={item.label} value={item.value} />
                ))}
              </div>
            </section>

            <section className="mt-6">
              <h4 className="mb-3 text-sm font-semibold">变更记录</h4>
              {logs.length ? (
                <ol className="space-y-5 border-l border-slate-200 pl-4">
                  {logs.map((log) => (
                    <li key={log.id} className="relative">
                      <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-600 ring-1 ring-slate-200" />
                      <div className="text-sm font-medium">{log.action === "流水进入系统" ? "流水创建时间" : log.action}</div>
                      <div className="text-xs text-muted">{formatDateTime(log.time)} · {log.actor}</div>
                      {log.fromSubject || log.toSubject ? (
                        <div className="mt-1 text-xs text-slate-600">
                          {formatSubject(log.fromSubject)} → {formatSubject(log.toSubject)}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="text-sm text-muted">暂无变更记录</div>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <div className="shrink-0 text-xs text-slate-400">{label}</div>
      <div className="min-w-0 break-all text-right text-sm text-ink">{value}</div>
    </div>
  );
}

function transactionRows(record: EnrichedTransaction): { label: string; value: string }[] {
  const tx = record.transaction;
  const rows = [
    { label: "交易号", value: dash(tx.transactionId) },
    { label: "主体名称", value: dash(tx.entityName) },
    { label: "账户号", value: dash(tx.account) },
    { label: "账户名", value: dash(tx.accountName) },
    { label: "收款机构", value: displayPlatform(tx.platform) },
    { label: "交易时间", value: formatDateTime(tx.transactionTime) },
    { label: "币种", value: dash(tx.currency) },
    { label: "金额", value: formatMoney(tx.amount, tx.currency) },
    { label: "可用余额", value: tx.availableBalance == null ? "" : formatAmount(tx.availableBalance) },
    { label: "手续费", value: tx.fee ? formatAmount(tx.fee) : "" },
    { label: "付款方账号", value: tx.counterpartyAccount.trim() },
    { label: "付款方姓名", value: tx.payeeName.trim() },
    { label: "交易信息", value: dash(tx.transactionDescription) },
    { label: "备注", value: tx.note.trim() },
    { label: "业务类型", value: tx.businessType.trim() },
    { label: "code 类型", value: tx.codeType.trim() },
    { label: "支付网关", value: tx.paymentGateway.trim() },
    { label: "交易类型", value: tx.transactionType.trim() },
    { label: "飞书审批单号", value: tx.feishuApprovalId.trim() },
  ];
  return rows.filter((item) => item.value);
}

function matchReason(record: EnrichedTransaction): string {
  const { final, manual, feishu, channel } = record;
  if (final.source === "manual" && manual) return manual.reason;
  if (final.source === "feishu" && feishu) return `${feishu.approvalName} / ${feishu.paymentType}`;
  if (final.source === "channel" && final.matchedField && final.matchedKeyword) {
    return `${final.matchedField}「${final.matchedKeyword}」`;
  }
  if (final.status === "rule_conflict") {
    const subjects = [...new Set(channel.candidates.slice(0, 3).map((item) => formatSubject(item.subject)))];
    return subjects.length ? `规则冲突：${subjects.join("；")}` : "多条规则命中不同科目";
  }
  if (final.status === "data_error") return channel.errors[0] || "缺少匹配所需字段";
  if (!final.subject) return "未命中规则";
  return "";
}
