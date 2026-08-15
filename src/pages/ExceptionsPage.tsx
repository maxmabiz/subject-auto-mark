import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { ManualMarkDialog } from "@/components/transaction/ManualMarkDialog";
import { TransactionDrawer } from "@/components/transaction/TransactionDrawer";
import { displayPlatform } from "@/domain/constants";
import { formatSubject } from "@/domain/matching";
import type { EnrichedTransaction } from "@/domain/types";
import { dash, formatDateTime, formatMoney } from "@/lib/format";
import { useAppStore } from "@/store/AppStore";

export function ExceptionsPage() {
  const { loading, error, records, unlockManual } = useAppStore();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "conflict" || params.get("tab") === "error" ? params.get("tab")! : "unmatched";
  const [detailId, setDetailId] = useState<string | null>(null);
  const [manualId, setManualId] = useState<string | null>(null);
  const [unlockId, setUnlockId] = useState<string | null>(null);

  const groups = useMemo(() => ({
    unmatched: records.filter((item) => item.final.status === "unmatched"),
    conflict: records.filter((item) => item.final.status === "rule_conflict"),
    error: records.filter((item) => item.final.status === "data_error"),
  }), [records]);

  const detail = records.find((item) => item.transaction.id === detailId) ?? null;
  const manual = records.find((item) => item.transaction.id === manualId) ?? null;

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">异常待处理</h1>
        <p className="mt-1 text-sm text-muted">只展示未匹配、规则冲突和数据异常流水，需财务人工确认。</p>
      </div>
      <Tabs value={tab} onValueChange={(value) => setParams({ tab: value })}>
        <TabsList>
          <TabsTrigger value="unmatched">未匹配（{groups.unmatched.length}）</TabsTrigger>
          <TabsTrigger value="conflict">规则冲突（{groups.conflict.length}）</TabsTrigger>
          <TabsTrigger value="error">数据异常（{groups.error.length}）</TabsTrigger>
        </TabsList>
        <TabsContent value="unmatched">
          <ExceptionTable
            records={groups.unmatched}
            empty="当前没有未匹配流水"
            onView={setDetailId}
            onManual={setManualId}
            extra={(record) => dash(record.transaction.transactionDescription || record.transaction.note || record.transaction.businessType || record.transaction.codeType)}
          />
        </TabsContent>
        <TabsContent value="conflict">
          {groups.conflict.length === 0 ? (
            <EmptyState title="当前没有规则冲突" description="最高优先级候选指向相同科目时会正常标记。" />
          ) : (
            <div className="space-y-3">
              {groups.conflict.map((record) => (
                <Card key={record.transaction.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium">{record.transaction.transactionNo}</div>
                      <div className="mt-1 text-sm text-muted">
                        {displayPlatform(record.transaction.platform)} · {dash(record.transaction.account)} · {formatDateTime(record.transaction.transactionTime)} · {formatMoney(record.transaction.amount, record.transaction.currency)}
                      </div>
                      <p className="mt-2 text-sm">{record.channel.explanation}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setDetailId(record.transaction.id)}>查看</Button>
                      <Button size="sm" onClick={() => setManualId(record.transaction.id)}>人工指定科目</Button>
                    </div>
                  </div>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="text-xs text-muted">
                        <tr>
                          <th className="py-2">规则ID</th>
                          <th>平台 / 账号</th>
                          <th>检索字段</th>
                          <th>关键词</th>
                          <th>匹配方式</th>
                          <th>对应科目</th>
                          <th>优先级</th>
                        </tr>
                      </thead>
                      <tbody>
                        {record.channel.candidates.map((candidate) => (
                          <tr key={candidate.ruleId} className="border-t border-slate-100">
                            <td className="py-2">{candidate.ruleId}</td>
                            <td>{candidate.platform} / {candidate.account}</td>
                            <td>{candidate.searchField}</td>
                            <td>{candidate.keyword}</td>
                            <td>{candidate.matchMode === "exact" ? "完全匹配" : "包含匹配"}</td>
                            <td>{formatSubject(candidate.subject)}</td>
                            <td>账号{candidate.rankScore.accountSpecific ? "具体" : "全部"} / 词长{candidate.rankScore.keywordLength}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="error">
          <ExceptionTable
            records={groups.error}
            empty="当前没有数据异常流水"
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
        onUnlock={() => { if (detail) setUnlockId(detail.transaction.id); }}
      />
      <ManualMarkDialog record={manual} open={Boolean(manual)} onOpenChange={(open) => { if (!open) setManualId(null); }} />
      <AlertDialog open={Boolean(unlockId)} onOpenChange={(open) => { if (!open) setUnlockId(null); }}>
        <AlertDialogContent
          title="确认解除人工锁定？"
            description="解除后将重新按飞书优先、渠道规则其次计算最终科目。飞书审批不会失效；若科目仍不正确，请继续使用人工标记。"
          confirmText="解除锁定"
          onConfirm={() => {
            if (unlockId) unlockManual(unlockId);
            setUnlockId(null);
          }}
        />
      </AlertDialog>
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
  if (!records.length) return <EmptyState title={empty} description="可返回流水列表查看已标记结果。" />;
  return (
    <Card className="overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs text-slate-600">
          <tr>
            <th className="px-3 py-3">流水号</th>
            <th>时间</th>
            <th>平台 / 账号</th>
            <th>金额</th>
            <th>关键字段 / 原因</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.transaction.id} className="border-t border-slate-100">
              <td className="px-3 py-2.5">{record.transaction.transactionNo}</td>
              <td>{formatDateTime(record.transaction.transactionTime)}</td>
              <td>{displayPlatform(record.transaction.platform)} / {dash(record.transaction.account)}</td>
              <td>{formatMoney(record.transaction.amount, record.transaction.currency)}</td>
              <td className="max-w-80">{extra(record)}</td>
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
    </Card>
  );
}
