import { useMemo, useState, type ReactNode } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SourceBadge, StatusBadge } from "@/components/StatusBadge";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { ManualMarkDialog } from "@/components/transaction/ManualMarkDialog";
import { TransactionDrawer } from "@/components/transaction/TransactionDrawer";
import { DISPLAY_STATUS_LABEL, DISPLAY_STATUS_OPTIONS, SOURCE_LABEL, displayPlatform, matchesDisplayStatus, toDisplayStatus } from "@/domain/constants";
import { formatSubject } from "@/domain/matching";
import type { EnrichedTransaction } from "@/domain/types";
import { dash, formatAmount, formatDateTime } from "@/lib/format";
import { useAppStore } from "@/store/AppStore";
import { cn } from "@/lib/utils";

const helper = createColumnHelper<EnrichedTransaction>();

const emptyFilters = {
  entityName: "all",
  account: "all",
  platform: "all",
  dateFrom: "",
  dateTo: "",
  transactionId: "",
  billNo: "",
  status: "all",
  source: "all",
  subject: "",
};

export function TransactionsPage() {
  const { loading, error, records } = useAppStore();
  const [draft, setDraft] = useState(emptyFilters);
  const [applied, setApplied] = useState(emptyFilters);
  const [expanded, setExpanded] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [manualId, setManualId] = useState<string | null>(null);

  const entities = useMemo(
    () => [...new Set(records.map((item) => item.transaction.entityName).filter(Boolean))],
    [records],
  );
  const accounts = useMemo(
    () => [...new Set(records.map((item) => item.transaction.account).filter(Boolean))],
    [records],
  );
  const platforms = useMemo(
    () => [...new Set(records.map((item) => item.transaction.platform).filter(Boolean))],
    [records],
  );

  const filtered = useMemo(() => {
    const transactionId = applied.transactionId.trim().toLowerCase();
    const billNo = applied.billNo.trim().toLowerCase();
    const subject = applied.subject.trim();
    return records.filter((item) => {
      const tx = item.transaction;
      const day = tx.transactionTime.slice(0, 10);
      if (applied.entityName !== "all" && tx.entityName !== applied.entityName) return false;
      if (applied.account !== "all" && tx.account !== applied.account) return false;
      if (applied.platform !== "all" && tx.platform !== applied.platform) return false;
      if (applied.dateFrom && day < applied.dateFrom) return false;
      if (applied.dateTo && day > applied.dateTo) return false;
      if (transactionId && !tx.transactionId.toLowerCase().includes(transactionId) && !tx.transactionNo.toLowerCase().includes(transactionId)) return false;
      if (billNo && !tx.billNo.toLowerCase().includes(billNo)) return false;
      if (applied.status !== "all" && !matchesDisplayStatus(item.final.status, applied.status)) return false;
      if (applied.source !== "all" && item.final.source !== applied.source) return false;
      if (subject && !formatSubject(item.final.subject).includes(subject)) return false;
      return true;
    });
  }, [applied, records]);

  const columns = useMemo(
    () => [
      helper.accessor((row) => row.transaction.entityName, {
        id: "entity",
        header: "主体名称",
        cell: (info) => <TextCell value={info.getValue()} />,
      }),
      helper.accessor((row) => row.transaction.account, {
        id: "account",
        header: "账户号",
        cell: (info) => <TextCell value={info.getValue()} />,
      }),
      helper.accessor((row) => row.transaction.accountName, {
        id: "accountName",
        header: "账户名",
        cell: (info) => <TextCell value={info.getValue()} />,
      }),
      helper.accessor((row) => row.transaction.platform, {
        id: "platform",
        header: "收款机构",
        cell: (info) => displayPlatform(info.getValue()),
      }),
      helper.accessor((row) => row.transaction.transactionId, {
        id: "transactionId",
        header: "交易号",
        cell: (info) => <TextCell value={info.getValue()} />,
      }),
      helper.accessor((row) => row.transaction.counterpartyAccount, {
        id: "counterpartyAccount",
        header: "付款方账号",
        cell: (info) => <TextCell value={info.getValue()} />,
      }),
      helper.accessor((row) => row.transaction.payeeName, {
        id: "counterpartyName",
        header: "付款方姓名",
        cell: (info) => <TextCell value={info.getValue()} />,
      }),
      helper.accessor((row) => row.transaction.transactionTime, {
        id: "time",
        header: "交易时间",
        cell: (info) => formatDateTime(info.getValue()),
      }),
      helper.accessor((row) => row.transaction.currency, { id: "currency", header: "币种" }),
      helper.accessor((row) => row.transaction, {
        id: "amount",
        header: "金额",
        cell: (info) => {
          const tx = info.getValue();
          return (
            <span className={tx.direction === "in" ? "font-medium text-emerald-600" : "font-medium text-slate-800"}>
              {formatAmount(tx.amount)}
            </span>
          );
        },
      }),
      helper.accessor((row) => row.transaction.availableBalance, {
        id: "balance",
        header: "可用余额",
        cell: (info) => {
          const value = info.getValue();
          return <span className="tabular-nums text-slate-700">{value == null ? "—" : formatAmount(value)}</span>;
        },
      }),
      helper.accessor((row) => row.transaction.fee, {
        id: "fee",
        header: "手续费",
        cell: (info) => <span className="tabular-nums text-slate-700">{formatAmount(info.getValue() ?? 0)}</span>,
      }),
      helper.accessor((row) => row.transaction.businessType, {
        id: "businessType",
        header: "业务类型",
        cell: (info) => <TextCell value={info.getValue()} />,
      }),
      helper.accessor((row) => row.transaction.transactionDescription, {
        id: "info",
        header: "交易信息",
        cell: (info) => <TextCell value={info.getValue()} />,
      }),
      helper.accessor((row) => row.transaction.note, {
        id: "note",
        header: "备注",
        cell: (info) => <TextCell value={info.getValue()} />,
      }),
      helper.accessor((row) => row.final.subject?.level1, {
        id: "l1",
        header: "一级科目",
        cell: (info) => {
          const value = info.getValue();
          return (
            <button
              type="button"
              title={value || "查看匹配详情"}
              className="text-left text-brand-700 hover:underline"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setDetailId(info.row.original.transaction.id);
              }}
            >
              {value?.trim() || "—"}
            </button>
          );
        },
      }),
      helper.accessor((row) => row.final.subject?.level2, {
        id: "l2",
        header: "二级科目",
        cell: (info) => <SubjectCell value={info.getValue()} />,
      }),
      helper.accessor((row) => row.final.subject?.level3, {
        id: "l3",
        header: "三级科目",
        cell: (info) => <SubjectCell value={info.getValue()} />,
      }),
      helper.accessor((row) => row.final.status, {
        id: "matchStatus",
        header: "匹配状态",
        cell: (info) => <StatusBadge status={info.getValue()} />,
      }),
      helper.accessor((row) => row.final.source, {
        id: "matchSource",
        header: "匹配来源",
        cell: (info) => <SourceBadge source={info.getValue()} />,
      }),
      helper.display({
        id: "actions",
        header: "操作",
        cell: ({ row }) => (
          <div className="flex items-center gap-3 text-sm">
            <button className="text-brand-700 hover:underline" onClick={() => setManualId(row.original.transaction.id)}>
              标记
            </button>
          </div>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  const detail = records.find((item) => item.transaction.id === detailId) ?? null;
  const manual = records.find((item) => item.transaction.id === manualId) ?? null;

  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount() || 1;
  const pageSize = table.getState().pagination.pageSize;
  const pages = visiblePages(pageIndex, pageCount);

  const search = () => {
    setApplied(draft);
    table.setPageIndex(0);
  };

  const reset = () => {
    setDraft(emptyFilters);
    setApplied(emptyFilters);
    table.setPageIndex(0);
  };

  const exportCsv = () => {
    const header = [
      "主体名称", "账户号", "账户名", "收款机构", "交易号",
      "付款方账号", "付款方姓名", "交易时间", "币种", "金额", "可用余额", "手续费", "业务类型",
      "交易信息", "备注", "一级科目", "二级科目", "三级科目", "匹配状态", "匹配来源",
    ];
    const lines = filtered.map((item) => [
      item.transaction.entityName,
      item.transaction.account,
      item.transaction.accountName,
      displayPlatform(item.transaction.platform),
      item.transaction.transactionId,
      item.transaction.counterpartyAccount,
      item.transaction.payeeName,
      formatDateTime(item.transaction.transactionTime),
      item.transaction.currency,
      formatAmount(item.transaction.amount),
      item.transaction.availableBalance == null ? "" : formatAmount(item.transaction.availableBalance),
      formatAmount(item.transaction.fee ?? 0),
      item.transaction.businessType,
      item.transaction.transactionDescription,
      item.transaction.note,
      item.final.subject?.level1 ?? "",
      item.final.subject?.level2 ?? "",
      item.final.subject?.level3 ?? "",
      DISPLAY_STATUS_LABEL[toDisplayStatus(item.final.status)],
      SOURCE_LABEL[item.final.source],
    ].map(csvCell).join(","));
    const blob = new Blob(["\uFEFF" + [header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `收付流水-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`已导出 ${filtered.length} 条流水`);
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-3">
        <div className="text-sm text-muted">Fund / 公司业务 / 收付流水</div>
        <div className="border-b border-slate-200">
          <div className="inline-flex border-b-2 border-brand-700 px-1 pb-2 text-sm font-medium text-brand-800">收付流水</div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-4">
          <div className="flex items-end gap-6">
            <div className="grid min-w-0 flex-1 grid-cols-3 gap-x-6">
              <FilterSelect label="主体名称" value={draft.entityName} onChange={(entityName) => setDraft({ ...draft, entityName })} options={entities.map((item) => ({ value: item, label: item }))} />
              <FilterSelect label="账户号" value={draft.account} onChange={(account) => setDraft({ ...draft, account })} options={accounts.map((item) => ({ value: item, label: item }))} />
              <FilterSelect label="收款机构" value={draft.platform} onChange={(platform) => setDraft({ ...draft, platform })} options={platforms.map((item) => ({ value: item, label: displayPlatform(item) }))} />
            </div>
            <div className="flex shrink-0 items-center gap-4 pb-0.5">
              <Button onClick={search}>查询</Button>
              <button className="text-sm text-slate-600 hover:text-ink" onClick={reset}>重置</button>
              <Button variant="secondary" onClick={exportCsv}>导出</Button>
              <button className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-ink" onClick={() => setExpanded((value) => !value)}>
                {expanded ? "收起" : "展开"}
                {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
          {expanded ? (
            <div className="mt-3 grid grid-cols-3 gap-x-6 gap-y-3">
              <div className="space-y-1.5">
                <Label>交易时间</Label>
                <div className="flex items-center gap-2">
                  <Input type="date" value={draft.dateFrom} onChange={(e) => setDraft({ ...draft, dateFrom: e.target.value })} />
                  <span className="text-slate-400">→</span>
                  <Input type="date" value={draft.dateTo} onChange={(e) => setDraft({ ...draft, dateTo: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>交易号</Label>
                <Input value={draft.transactionId} placeholder="请输入" onChange={(e) => setDraft({ ...draft, transactionId: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>账单号</Label>
                <Input value={draft.billNo} placeholder="请输入" onChange={(e) => setDraft({ ...draft, billNo: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>科目</Label>
                <Input
                  value={draft.subject}
                  placeholder="请输入"
                  onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                  onKeyDown={(e) => { if (e.key === "Enter") search(); }}
                />
              </div>
              <FilterSelect label="匹配状态" value={draft.status} onChange={(status) => setDraft({ ...draft, status })} options={DISPLAY_STATUS_OPTIONS} />
              <FilterSelect label="匹配来源" value={draft.source} onChange={(source) => setDraft({ ...draft, source })} options={Object.entries(SOURCE_LABEL).map(([value, label]) => ({ value, label }))} />
            </div>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
          {filtered.length === 0 ? (
            <div className="p-6"><EmptyState title="没有符合条件的流水" description="请调整筛选条件后重新查询。" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[2800px] w-full text-left text-sm">
                <thead className="bg-[#fafafa] text-sm text-slate-600">
                  {table.getHeaderGroups().map((group) => (
                    <tr key={group.id}>
                      {group.headers.map((header) => (
                        <th key={header.id} className="whitespace-nowrap border-b border-slate-200 px-3 py-3 font-medium">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="whitespace-nowrap border-b border-slate-100 px-3 py-3 align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex items-center justify-end gap-4 px-4 py-3 text-sm text-slate-600">
            <span>共 {filtered.length} 条记录</span>
            <Select value={String(pageSize)} onValueChange={(value) => table.setPageSize(Number(value))}>
              <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[10, 20, 50].map((size) => (
                  <SelectItem key={size} value={String(size)}>{size}条/页</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <PageBtn disabled={pageIndex === 0} onClick={() => table.setPageIndex(0)}>«</PageBtn>
              <PageBtn disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>‹</PageBtn>
              {pages.map((page) => (
                <PageBtn key={page} active={page === pageIndex} onClick={() => table.setPageIndex(page)}>
                  {page + 1}
                </PageBtn>
              ))}
              <PageBtn disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>›</PageBtn>
              <PageBtn disabled={pageIndex >= pageCount - 1} onClick={() => table.setPageIndex(pageCount - 1)}>»</PageBtn>
            </div>
          </div>
        </div>

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

function SubjectCell({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-slate-400">-</span>;
  return <span className="inline-flex rounded bg-slate-100 px-1.5 py-0.5 text-sm text-slate-700">{value}</span>;
}

function TextCell({ value }: { value: string | null | undefined }) {
  const text = dash(value);
  return <span title={text === "—" ? undefined : text}>{text}</span>;
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
        <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
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

function PageBtn({
  children,
  onClick,
  disabled,
  active,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-8 min-w-8 rounded border px-2 text-sm disabled:cursor-not-allowed disabled:opacity-40",
        active ? "border-brand-600 bg-brand-50 text-brand-800" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
      )}
    >
      {children}
    </button>
  );
}

function visiblePages(current: number, total: number): number[] {
  const start = Math.max(0, Math.min(current - 2, total - 5));
  const end = Math.min(total, start + 5);
  return Array.from({ length: Math.max(end - start, 1) }, (_, index) => start + index);
}

function csvCell(value: string): string {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replaceAll("\"", "\"\"")}"`;
  return text;
}
