import { SourceBadge, StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { DIRECTION_LABEL } from "@/domain/constants";
import { formatSubject } from "@/domain/matching";
import type { EnrichedTransaction } from "@/domain/types";
import { dash, formatDateTime, formatMoney } from "@/lib/format";
import { useAppStore } from "@/store/AppStore";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 break-all text-sm text-ink">{value}</div>
    </div>
  );
}

export function TransactionDrawer({
  record,
  open,
  onOpenChange,
  onManual,
  onUnlock,
}: {
  record: EnrichedTransaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onManual: () => void;
  onUnlock: () => void;
}) {
  const { logsFor } = useAppStore();
  const logs = record ? logsFor(record.transaction.id) : [];
  const tx = record?.transaction;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title={tx ? `流水详情 ${tx.transactionNo}` : "流水详情"}>
        {record && tx ? (
          <div className="flex-1 space-y-5 overflow-auto px-5 py-4">
            <section>
              <h4 className="mb-3 text-sm font-semibold">原始流水信息</h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border border-slate-200 p-4">
                <Field label="主体名称" value={dash(tx.entityName)} />
                <Field label="账户号" value={dash(tx.account)} />
                <Field label="平台" value={dash(tx.platform)} />
                <Field label="发生日期" value={formatDateTime(tx.transactionTime)} />
                <Field label="交易ID" value={dash(tx.transactionId)} />
                <Field label="账单号" value={dash(tx.billNo)} />
                <Field label="流水号" value={dash(tx.transactionNo)} />
                <Field label="状态" value={dash(tx.channelStatus)} />
                <Field label="记账类型" value={dash(tx.accountingType)} />
                <Field label="收支方向" value={DIRECTION_LABEL[tx.direction]} />
                <Field label="金额和币种" value={formatMoney(tx.amount, tx.currency)} />
                <Field label="交易信息" value={dash(tx.transactionDescription)} />
                <Field label="备注" value={dash(tx.note)} />
                <Field label="业务类型" value={dash(tx.businessType)} />
                <Field label="code 类型" value={dash(tx.codeType)} />
                <Field label="收款人姓名" value={dash(tx.payeeName)} />
                <Field label="电商平台/支付网关" value={dash(tx.paymentGateway)} />
                <Field label="交易类型" value={dash(tx.transactionType)} />
                <Field label="飞书审批单号" value={dash(tx.feishuApprovalId)} />
                <Field label="飞书关联字段" value="流水号" />
              </div>
            </section>
            <section>
              <h4 className="mb-3 text-sm font-semibold">当前最终科目</h4>
              <div className="rounded-lg border border-slate-200 p-4">
                <div className="text-base font-medium">{formatSubject(record.final.subject)}</div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusBadge status={record.final.status} locked={record.final.locked} />
                  <SourceBadge source={record.final.source} locked={record.final.locked} />
                  <span className="text-xs text-muted">更新时间 {formatDateTime(record.final.updatedAt)}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{record.final.explanation}</p>
              </div>
            </section>
            <section>
              <h4 className="mb-3 text-sm font-semibold">来源判断</h4>
              <div className="grid grid-cols-3 gap-3">
                {[{
                  title: "人工标记",
                  adopted: record.final.source === "manual",
                  body: record.manual
                    ? `${formatSubject(record.manual.subject)}\n${record.manual.locked ? "已锁定" : "未锁定"} · ${record.manual.reason}`
                    : "无人工标记",
                }, {
                  title: "飞书审批",
                  adopted: record.final.source === "feishu",
                  body: record.feishu
                    ? `${formatSubject(record.feishu.subject)}\n按流水号 ${record.feishu.transactionNo} 关联 · ${record.feishu.approvalType} · ${record.feishu.approvalId}`
                    : "无飞书审批结果",
                }, {
                  title: "渠道规则",
                  adopted: record.final.source === "channel",
                  body: record.channel.subject
                    ? `${formatSubject(record.channel.subject)}\n${record.channel.explanation}`
                    : record.channel.explanation,
                }].map((item) => (
                  <div key={item.title} className={cn("rounded-lg border p-3", item.adopted ? "border-brand-300 bg-brand-50" : "border-slate-200 bg-white")}>
                    <div className="mb-2 flex items-center justify-between text-sm font-medium">
                      {item.title}
                      {item.adopted ? <CheckCircle2 className="h-4 w-4 text-brand-700" /> : null}
                    </div>
                    <div className="whitespace-pre-line text-xs leading-5 text-slate-600">{item.body}</div>
                    {item.title === "渠道规则" && record.channel.candidates.length > 1 ? (
                      <div className="mt-2 space-y-1 text-xs text-muted">
                        {record.channel.candidates.slice(0, 4).map((candidate) => (
                          <div key={candidate.ruleId}>
                            {candidate.ruleId} · {candidate.keyword} → {formatSubject(candidate.subject)}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h4 className="mb-3 text-sm font-semibold">操作记录</h4>
              <ol className="space-y-3 border-l border-slate-200 pl-4">
                {logs.length ? logs.map((log) => (
                  <li key={log.id}>
                    <div className="text-sm font-medium">{log.action}</div>
                    <div className="text-xs text-muted">{formatDateTime(log.time)} · {log.actor}</div>
                    <div className="mt-1 text-xs text-slate-600">
                      {formatSubject(log.fromSubject)} → {formatSubject(log.toSubject)}
                    </div>
                    <div className="text-xs text-muted">{log.reason}</div>
                  </li>
                )) : <div className="text-sm text-muted">暂无操作记录</div>}
              </ol>
            </section>
          </div>
        ) : null}
        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
          {record?.final.locked ? (
            <Button variant="secondary" onClick={onUnlock}>解除锁定</Button>
          ) : null}
          <Button onClick={onManual}>人工标记</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
