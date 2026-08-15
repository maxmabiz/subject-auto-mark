import { useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { SourceBadge, StatusBadge } from "@/components/StatusBadge";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { ManualMarkDialog } from "@/components/transaction/ManualMarkDialog";
import { TransactionDrawer } from "@/components/transaction/TransactionDrawer";
import { DIRECTION_LABEL, SOURCE_LABEL, STATUS_LABEL, displayPlatform } from "@/domain/constants";
import { buildSubjectDictionary, subjectTree } from "@/domain/subjects";
import type { EnrichedTransaction } from "@/domain/types";
import { dash, formatDateTime, formatMoney } from "@/lib/format";
import { useAppStore } from "@/store/AppStore";

const helper = createColumnHelper<EnrichedTransaction>();

export function TransactionsPage() {
  const { loading, error, records, rules, unlockManual } = useAppStore();
  const subjects = useMemo(() => buildSubjectDictionary(rules), [rules]);
  const tree = useMemo(() => subjectTree(subjects), [subjects]);
  const [draft, setDraft] = useState({
    dateFrom: "",
    dateTo: "",
    platform: "all",
    account: "all",
    direction: "all",
    status: "all",
    source: "all",
    level1: "all",
    level2: "all",
    level3: "all",
    keyword: "",
  });
  const [applied, setApplied] = useState(draft);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [manualId, setManualId] = useState<string | null>(null);
  const [unlockId, setUnlockId] = useState<string | null>(null);

  const accounts = useMemo(
    () => [...new Set(records.map((item) => item.transaction.account).filter(Boolean))],
    [records],
  );
  const platforms = useMemo(
    () => [...new Set(records.map((item) => item.transaction.platform).filter(Boolean))],
    [records],
  );

  const filtered = useMemo(() => {
    const keyword = applied.keyword.trim().toLowerCase();
    return records.filter((item) => {
      const tx = item.transaction;
      const day = tx.transactionTime.slice(0, 10);
      if (applied.dateFrom && day < applied.dateFrom) return false;
      if (applied.dateTo && day > applied.dateTo) return false;
      if (applied.platform !== "all" && tx.platform !== applied.platform) return false;
      if (applied.account !== "all" && tx.account !== applied.account) return false;
      if (applied.direction !== "all" && tx.direction !== applied.direction) return false;
      if (applied.status !== "all" && item.final.status !== applied.status) return false;
      if (applied.source !== "all" && item.final.source !== applied.source) return false;
      if (applied.level1 !== "all" && item.final.subject?.level1 !== applied.level1) return false;
      if (applied.level2 !== "all" && item.final.subject?.level2 !== applied.level2) return false;
      if (applied.level3 !== "all" && item.final.subject?.level3 !== applied.level3) return false;
      if (keyword) {
        const hay = [tx.transactionNo, tx.transactionDescription, tx.note, tx.account, tx.platform, tx.codeType, tx.businessType].join(" ").toLowerCase();
        if (!hay.includes(keyword)) return false;
      }
      return true;
    });
  }, [applied, records]);

  const columns = useMemo(
    () => [
      helper.accessor((row) => row.transaction.transactionTime, {
        id: "time",
        header: "流水时间",
        cell: (info) => formatDateTime(info.getValue()),
      }),
      helper.accessor((row) => row.transaction.transactionNo, { id: "no", header: "流水号" }),
      helper.accessor((row) => row.transaction.platform, {
        id: "platform",
        header: "平台",
        cell: (info) => displayPlatform(info.getValue()),
      }),
      helper.accessor((row) => row.transaction.account, {
        id: "account",
        header: "账号",
        cell: (info) => <span className="block max-w-40 truncate">{dash(info.getValue())}</span>,
      }),
      helper.accessor((row) => row.final.matchedRawValue || row.transaction.transactionDescription, {
        id: "desc",
        header: "交易描述 / 匹配字段",
        cell: (info) => (
          <Tooltip content={info.getValue()}>
            <span className="block max-w-52 truncate">{dash(info.getValue())}</span>
          </Tooltip>
        ),
      }),
      helper.accessor((row) => row.transaction.direction, {
        id: "direction",
        header: "收支",
        cell: (info) => (
          <span className={info.getValue() === "in" ? "text-emerald-700" : "text-slate-700"}>
            {DIRECTION_LABEL[info.getValue()]}
          </span>
        ),
      }),
      helper.accessor((row) => row.transaction, {
        id: "amount",
        header: "金额",
        cell: (info) => {
          const tx = info.getValue();
          return (
            <span className={tx.direction === "in" ? "text-emerald-700" : "text-slate-800"}>
              {tx.direction === "in" ? "+" : "-"}
              {formatMoney(tx.amount, tx.currency)}
            </span>
          );
        },
      }),
      helper.accessor((row) => row.final.subject?.level1, { id: "l1", header: "一级科目", cell: (info) => dash(info.getValue()) }),
      helper.accessor((row) => row.final.subject?.level2, {
        id: "l2",
        header: "二级科目",
        cell: (info) => <span className="block max-w-36 truncate">{dash(info.getValue())}</span>,
      }),
      helper.accessor((row) => row.final.subject?.level3, { id: "l3", header: "三级科目", cell: (info) => dash(info.getValue()) }),
      helper.accessor((row) => row.final.status, {
        id: "status",
        header: "匹配状态",
        cell: (info) => <StatusBadge status={info.getValue()} locked={info.row.original.final.locked} />,
      }),
      helper.accessor((row) => row.final.source, {
        id: "source",
        header: "标记来源",
        cell: (info) => <SourceBadge source={info.getValue()} locked={info.row.original.final.locked} />,
      }),
      helper.display({
        id: "actions",
        header: "操作",
        cell: ({ row }) => {
          const record = row.original;
          return (
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setDetailId(record.transaction.id)}>查看</Button>
              <Button size="sm" variant="ghost" onClick={() => setManualId(record.transaction.id)}>人工标记</Button>
              {record.final.locked ? (
                <Button size="sm" variant="ghost" onClick={() => setUnlockId(record.transaction.id)}>解除锁定</Button>
              ) : null}
            </div>
          );
        },
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 12 } },
  });

  const detail = records.find((item) => item.transaction.id === detailId) ?? null;
  const manual = records.find((item) => item.transaction.id === manualId) ?? null;
  const level2Options = draft.level1 === "all" ? [] : (tree.level2By1.get(draft.level1) ?? []);
  const level3Options =
    draft.level1 === "all" || draft.level2 === "all"
      ? []
      : (tree.level3By2.get(`${draft.level1}||${draft.level2}`) ?? []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">流水列表</h1>
            <p className="mt-1 text-sm text-muted">共 {filtered.length} 条。本期不对历史流水发起重新匹配。</p>
          </div>
        </div>
        <Card className="p-4">
          <div className="grid grid-cols-5 gap-3">
            <div className="space-y-1.5">
              <Label>开始日期</Label>
              <Input type="date" value={draft.dateFrom} onChange={(e) => setDraft({ ...draft, dateFrom: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>结束日期</Label>
              <Input type="date" value={draft.dateTo} onChange={(e) => setDraft({ ...draft, dateTo: e.target.value })} />
            </div>
            <FilterSelect label="平台" value={draft.platform} onChange={(platform) => setDraft({ ...draft, platform })} options={platforms.map((item) => ({ value: item, label: displayPlatform(item) }))} />
            <FilterSelect label="账号" value={draft.account} onChange={(account) => setDraft({ ...draft, account })} options={accounts.map((item) => ({ value: item, label: item }))} />
            <FilterSelect label="收支方向" value={draft.direction} onChange={(direction) => setDraft({ ...draft, direction })} options={[{ value: "in", label: "收入" }, { value: "out", label: "支出" }]} />
            <FilterSelect label="匹配状态" value={draft.status} onChange={(status) => setDraft({ ...draft, status })} options={Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))} />
            <FilterSelect label="标记来源" value={draft.source} onChange={(source) => setDraft({ ...draft, source })} options={Object.entries(SOURCE_LABEL).map(([value, label]) => ({ value, label }))} />
            <FilterSelect label="一级科目" value={draft.level1} onChange={(level1) => setDraft({ ...draft, level1, level2: "all", level3: "all" })} options={tree.level1.map((item) => ({ value: item, label: item }))} />
            <FilterSelect label="二级科目" value={draft.level2} onChange={(level2) => setDraft({ ...draft, level2, level3: "all" })} options={level2Options.map((item) => ({ value: item, label: item }))} />
            <FilterSelect label="三级科目" value={draft.level3} onChange={(level3) => setDraft({ ...draft, level3 })} options={level3Options.map((item) => ({ value: item, label: item }))} />
            <div className="col-span-3 space-y-1.5">
              <Label>流水号或关键词</Label>
              <Input value={draft.keyword} placeholder="搜索流水号、描述、备注、账号" onChange={(e) => setDraft({ ...draft, keyword: e.target.value })} />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={() => { setApplied(draft); table.setPageIndex(0); }}>查询</Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const reset = { dateFrom: "", dateTo: "", platform: "all", account: "all", direction: "all", status: "all", source: "all", level1: "all", level2: "all", level3: "all", keyword: "" };
                  setDraft(reset);
                  setApplied(reset);
                  table.setPageIndex(0);
                }}
              >
                重置筛选
              </Button>
            </div>
          </div>
        </Card>
        <Card className="overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-6"><EmptyState title="没有符合条件的流水" description="请调整筛选条件后重新查询。" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1400px] w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-600">
                  {table.getHeaderGroups().map((group) => (
                    <tr key={group.id}>
                      {group.headers.map((header) => (
                        <th key={header.id} className="whitespace-nowrap px-3 py-3 font-medium">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="whitespace-nowrap px-3 py-2.5 align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm">
            <span className="text-muted">第 {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1} 页</span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>上一页</Button>
              <Button size="sm" variant="secondary" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>下一页</Button>
            </div>
          </div>
        </Card>
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
    </TooltipProvider>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder="全部" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部</SelectItem>
          {options.map((item) => (
            <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
