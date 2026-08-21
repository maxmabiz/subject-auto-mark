import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { ManualMarkDialog } from "@/components/transaction/ManualMarkDialog";
import { TransactionDrawer } from "@/components/transaction/TransactionDrawer";
import { displayPlatform } from "@/domain/constants";
import type { EnrichedTransaction } from "@/domain/types";
import { dash, formatDateTime, formatMoney } from "@/lib/format";
import { useAppStore } from "@/store/AppStore";

export function ExceptionsPage() {
  const { loading, error, records } = useAppStore();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "unmatchable" || params.get("tab") === "error" ? "unmatchable" : "unmatched";
  const [detailId, setDetailId] = useState<string | null>(null);
  const [manualId, setManualId] = useState<string | null>(null);

  const groups = useMemo(() => ({
    unmatched: records.filter((item) => item.final.status === "unmatched" || item.final.status === "rule_conflict"),
    unmatchable: records.filter((item) => item.final.status === "data_error"),
  }), [records]);

  const detail = records.find((item) => item.transaction.id === detailId) ?? null;
  const manual = records.find((item) => item.transaction.id === manualId) ?? null;

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">异常待处理</h1>
        <p className="mt-1 text-sm text-muted">只展示未匹配和无法匹配流水，需财务人工确认。规则冲突并入未匹配，候选规则可在详情中查看。</p>
      </div>
      <Tabs value={tab} onValueChange={(value) => setParams({ tab: value })}>
        <TabsList>
          <TabsTrigger value="unmatched">未匹配（{groups.unmatched.length}）</TabsTrigger>
          <TabsTrigger value="unmatchable">无法匹配（{groups.unmatchable.length}）</TabsTrigger>
        </TabsList>
        <TabsContent value="unmatched">
          <ExceptionTable
            records={groups.unmatched}
            empty="当前没有未匹配流水"
            onView={setDetailId}
            onManual={setManualId}
            extra={(record) =>
              record.final.status === "rule_conflict"
                ? record.channel.explanation
                : dash(record.transaction.transactionDescription || record.transaction.note || record.transaction.businessType || record.transaction.codeType)
            }
          />
        </TabsContent>
        <TabsContent value="unmatchable">
          <ExceptionTable
            records={groups.unmatchable}
            empty="当前没有无法匹配流水"
            onView={setDetailId}
            onManual={setManualId}
            extra={(record) => record.channel.errors.join("、") || record.channel.explanation}
          />
        </TabsContent>
      </Tabs>
      <TransactionDrawer
        record={detail}
        open={Boolean(detail)}
        onOpenChange={(open) => { if (!open) setDetailId(null); }}
        onManual={() => { if (detail) setManualId(detail.transaction.id); }}
      />
      <ManualMarkDialog record={manual} open={Boolean(manual)} onOpenChange={(open) => { if (!open) setManualId(null); }} />
    </div>
  );
}

function ExceptionTable({
  records,
  empty,
  onView,
  onManual,
  extra,
}: {
  records: EnrichedTransaction[];
  empty: string;
  onView: (id: string) => void;
  onManual: (id: string) => void;
  extra: (record: EnrichedTransaction) => string;
}) {
  if (!records.length) return <EmptyState title={empty} description="可返回收付流水查看已标记结果。" />;
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-sm text-slate-600">
          <tr>
            <th className="px-3 py-3">交易号</th>
            <th>时间</th>
            <th>收款机构 / 账号</th>
            <th>金额</th>
            <th>关键字段 / 原因</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.transaction.id} className="border-t border-slate-100">
              <td className="px-3 py-2.5">{record.transaction.transactionId || record.transaction.transactionNo}</td>
              <td>{formatDateTime(record.transaction.transactionTime)}</td>
              <td>{displayPlatform(record.transaction.platform)} / {dash(record.transaction.account)}</td>
              <td>{formatMoney(record.transaction.amount, record.transaction.currency)}</td>
              <td>{extra(record)}</td>
              <td><StatusBadge status={record.final.status} /></td>
              <td>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => onView(record.transaction.id)}>查看</Button>
                  <Button size="sm" variant="ghost" onClick={() => onManual(record.transaction.id)}>人工标记</Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </Card>
  );
}
