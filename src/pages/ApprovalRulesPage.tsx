import { useMemo, useRef, useState, type ReactNode } from "react";
import { FileSpreadsheet, Plus } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { ApprovalRuleDialog } from "@/components/approval/ApprovalRuleDialog";
import { ApprovalRuleLogDrawer } from "@/components/approval/ApprovalRuleLogDrawer";
import { APPROVAL_TEMPLATE_PATH } from "@/domain/constants";
import { parseApprovalWorkbook } from "@/domain/excel/parseApproval";
import { formatSubject } from "@/domain/matching";
import type { ApprovalRule } from "@/domain/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/AppStore";

const emptyFilters = { name: "all", templateId: "", paymentType: "", otherDimension: "", subject: "", createdFrom: "", createdTo: "" };

export function ApprovalRulesPage() {
  const { loading, error, approvalRules, deleteApprovalRule, importApprovalRules } = useAppStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<ApprovalRule | null | "new">(null);
  const [logRule, setLogRule] = useState<ApprovalRule | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyFilters);
  const [applied, setApplied] = useState(emptyFilters);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const names = useMemo(() => [...new Set(approvalRules.map((item) => item.approvalName).filter(Boolean))], [approvalRules]);
  const filtered = useMemo(() => {
    const paymentType = applied.paymentType.trim();
    const otherDimension = applied.otherDimension.trim();
    const subject = applied.subject.trim();
    const templateId = applied.templateId.trim().toLowerCase();
    return approvalRules.filter((rule) => {
      if (applied.name !== "all" && rule.approvalName !== applied.name) return false;
      if (templateId && !rule.templateId.toLowerCase().includes(templateId)) return false;
      if (paymentType && !rule.paymentType.includes(paymentType)) return false;
      if (otherDimension && !(rule.otherDimension ?? "").includes(otherDimension)) return false;
      if (subject && !formatSubject(rule.subject).includes(subject)) return false;
      const createdDay = formatDate(rule.createdAt);
      if (applied.createdFrom && createdDay !== "—" && createdDay < applied.createdFrom) return false;
      if (applied.createdTo && createdDay !== "—" && createdDay > applied.createdTo) return false;
      return true;
    });
  }, [approvalRules, applied]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safeIndex = Math.min(pageIndex, pageCount - 1);
  const paged = filtered.slice(safeIndex * pageSize, (safeIndex + 1) * pageSize);
  const pages = visiblePages(safeIndex, pageCount);

  const search = () => {
    setApplied(draft);
    setPageIndex(0);
  };

  const reset = () => {
    setDraft(emptyFilters);
    setApplied(emptyFilters);
    setPageIndex(0);
  };

  const onImport = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const parsed = parseApprovalWorkbook(buffer);
    if (parsed.errors.length) {
      toast.error(parsed.errors.join("；"));
      return;
    }
    importApprovalRules(parsed.rules);
    setPageIndex(0);
  };

  const deletingRule = approvalRules.find((item) => item.id === deleteId) ?? null;
  const usedCount = deletingRule?.matchedCountT1 ?? 0;
  const deletingInUse = usedCount > 0;

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-muted">Fund / 科目匹配规则 / 审批单规则</div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">审批单规则</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-4">
          <a href={APPROVAL_TEMPLATE_PATH} download>
            <Button variant="secondary">下载模板</Button>
          </a>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            <FileSpreadsheet className="h-4 w-4" />
            导入 Excel
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onImport(file);
              event.target.value = "";
            }}
          />
          <Button onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" />
            新增规则
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="grid grid-cols-4 gap-x-4 gap-y-3 p-4">
          <FilterField label="审批单名称">
            <Select value={draft.name} onValueChange={(name) => setDraft({ ...draft, name })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                {names.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="模板ID">
            <Input
              value={draft.templateId}
              placeholder="请输入"
              onChange={(e) => setDraft({ ...draft, templateId: e.target.value })}
              onKeyDown={(e) => { if (e.key === "Enter") search(); }}
            />
          </FilterField>
          <FilterField label="付款申请类型">
            <Input
              value={draft.paymentType}
              placeholder="请输入"
              onChange={(e) => setDraft({ ...draft, paymentType: e.target.value })}
              onKeyDown={(e) => { if (e.key === "Enter") search(); }}
            />
          </FilterField>
          <FilterField label="其它维度">
            <Input
              value={draft.otherDimension}
              placeholder="请输入"
              onChange={(e) => setDraft({ ...draft, otherDimension: e.target.value })}
              onKeyDown={(e) => { if (e.key === "Enter") search(); }}
            />
          </FilterField>
          <FilterField label="科目">
            <Input
              value={draft.subject}
              placeholder="请输入"
              onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
              onKeyDown={(e) => { if (e.key === "Enter") search(); }}
            />
          </FilterField>
          <FilterField label="创建时间" className="col-span-2">
            <div className="flex items-center gap-2">
              <Input type="date" value={draft.createdFrom} onChange={(e) => setDraft({ ...draft, createdFrom: e.target.value })} />
              <span className="shrink-0 text-slate-400">至</span>
              <Input type="date" value={draft.createdTo} onChange={(e) => setDraft({ ...draft, createdTo: e.target.value })} />
            </div>
          </FilterField>
          <div className="col-span-1 flex items-end justify-end gap-2">
            <Button onClick={search}>查询</Button>
            <Button variant="secondary" onClick={reset}>重置</Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {filtered.length === 0 ? (
          <div className="p-10"><EmptyState title="没有符合条件的审批单规则" description="请调整筛选条件后重新查询，或新增规则、导入 Excel。" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1400px] text-left text-sm">
              <thead>
                <tr className="bg-[#f7f8fb] text-sm text-slate-500">
                  <th className="px-3 py-3 font-medium">审批单名称</th>
                  <th className="px-3 py-3 font-medium">模板ID</th>
                  <th className="px-3 py-3 font-medium">付款申请类型</th>
                  <th className="px-3 py-3 font-medium">其它维度</th>
                  <th className="px-3 py-3 font-medium">一级科目</th>
                  <th className="px-3 py-3 font-medium">二级科目</th>
                  <th className="px-3 py-3 font-medium">三级科目</th>
                  <th className="whitespace-nowrap px-1 py-3 text-center font-medium">已匹配条数（T-1）</th>
                  <th className="px-3 py-3 font-medium">创建时间</th>
                  <th className="px-3 py-3 font-medium">最后修改</th>
                  <th className="px-3 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((rule) => (
                  <tr key={rule.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                    <td className="px-3 py-3 align-middle font-medium text-ink">{rule.approvalName}</td>
                    <td className="px-3 py-3 align-middle font-mono text-xs text-slate-500">{rule.templateId}</td>
                    <td className="px-3 py-3 align-middle text-slate-700">{rule.paymentType}</td>
                    <td className="px-3 py-3 align-middle text-slate-700">{dashPart(rule.otherDimension)}</td>
                    <td className="px-3 py-3 align-middle text-slate-700">{dashPart(rule.subject?.level1)}</td>
                    <td className="px-3 py-3 align-middle text-slate-700">{dashPart(rule.subject?.level2)}</td>
                    <td className="px-3 py-3 align-middle text-slate-700">{dashPart(rule.subject?.level3)}</td>
                    <td className="px-1 py-3 text-center align-middle tabular-nums">
                      <span className={rule.matchedCountT1 ? "text-ink" : "text-slate-400"}>{rule.matchedCountT1 ?? 0}</span>
                    </td>
                    <td className="px-3 py-3 align-middle text-slate-500">{formatDate(rule.createdAt)}</td>
                    <td className="px-3 py-3 align-middle text-slate-500">{formatDate(rule.updatedAt)}</td>
                    <td className="whitespace-nowrap px-3 py-3 align-middle">
                      <div className="flex items-center gap-2.5">
                        <button className="text-brand-700 hover:underline" onClick={() => setEditing(rule)}>编辑</button>
                        <button className="text-red-600 hover:underline" onClick={() => setDeleteId(rule.id)}>删除</button>
                        <button className="text-brand-700 hover:underline" onClick={() => setLogRule(rule)}>日志</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
          <span>共 {filtered.length} 条</span>
          <div className="flex items-center gap-3">
            <Select value={String(pageSize)} onValueChange={(value) => { setPageSize(Number(value)); setPageIndex(0); }}>
              <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[10, 20, 50].map((size) => (
                  <SelectItem key={size} value={String(size)}>{size}条/页</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <PageBtn disabled={safeIndex === 0} onClick={() => setPageIndex(0)}>«</PageBtn>
              <PageBtn disabled={safeIndex === 0} onClick={() => setPageIndex(Math.max(0, safeIndex - 1))}>‹</PageBtn>
              {pages.map((page) => (
                <PageBtn key={page} active={page === safeIndex} onClick={() => setPageIndex(page)}>
                  {page + 1}
                </PageBtn>
              ))}
              <PageBtn disabled={safeIndex >= pageCount - 1} onClick={() => setPageIndex(Math.min(pageCount - 1, safeIndex + 1))}>›</PageBtn>
              <PageBtn disabled={safeIndex >= pageCount - 1} onClick={() => setPageIndex(pageCount - 1)}>»</PageBtn>
            </div>
          </div>
        </div>
      </div>

      <ApprovalRuleDialog
        open={editing !== null}
        rule={editing === "new" ? null : editing}
        onOpenChange={(open) => { if (!open) setEditing(null); }}
      />
      <ApprovalRuleLogDrawer
        rule={logRule}
        open={logRule !== null}
        onOpenChange={(open) => { if (!open) setLogRule(null); }}
      />
      <AlertDialog open={Boolean(deleteId)} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent
          title={deletingInUse ? "该规则正在被流水使用，确认删除？" : "确认删除该审批单规则？"}
          description={
            deletingInUse
              ? `当前有 ${usedCount} 条流水正在使用该规则。删除后新流水将不再匹配这条规则，已匹配流水会保留当前科目。可选择继续删除或取消。`
              : "删除后，新流水将不再使用这条规则。"
          }
          confirmText={deletingInUse ? "继续删除" : "删除"}
          cancelText="取消"
          danger
          onConfirm={() => {
            if (deleteId) deleteApprovalRule(deleteId);
            setDeleteId(null);
          }}
        />
      </AlertDialog>
    </div>
  );
}

function FilterField({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-sm font-medium text-slate-500">{label}</Label>
      {children}
    </div>
  );
}

function dashPart(value: string | null | undefined): string {
  const text = value?.trim();
  return text || "—";
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
