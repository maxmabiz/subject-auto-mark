import { useMemo, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { BusinessRuleDialog } from "@/components/business/BusinessRuleDialog";
import { BusinessRuleLogDrawer } from "@/components/business/BusinessRuleLogDrawer";
import { formatSubject } from "@/domain/matching";
import type { BusinessRule } from "@/domain/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/AppStore";

const emptyFilters = { claim: "all", subject: "" };

export function BusinessRulesPage() {
  const { loading, error, businessRules, deleteBusinessRule } = useAppStore();
  const [editing, setEditing] = useState<BusinessRule | null | "new">(null);
  const [logRule, setLogRule] = useState<BusinessRule | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyFilters);
  const [applied, setApplied] = useState(emptyFilters);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const claims = useMemo(() => [...new Set(businessRules.map((item) => item.claimBusiness).filter(Boolean))], [businessRules]);
  const filtered = useMemo(() => {
    const subject = applied.subject.trim();
    return businessRules.filter((rule) => {
      if (applied.claim !== "all" && rule.claimBusiness !== applied.claim) return false;
      if (subject && !formatSubject(rule.subject).includes(subject)) return false;
      return true;
    });
  }, [applied, businessRules]);

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

  const deleting = businessRules.find((item) => item.id === deleteId) ?? null;

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-muted">Fund / 科目匹配规则 / 业务规则</div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">业务规则</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-4">
          <Button onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" />
            新增规则
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="grid grid-cols-4 gap-x-4 gap-y-3 p-4">
          <FilterField label="认领业务">
            <Select value={draft.claim} onValueChange={(claim) => setDraft({ ...draft, claim })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                {claims.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="科目">
            <Input
              value={draft.subject}
              placeholder="请输入"
              onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
              onKeyDown={(e) => { if (e.key === "Enter") search(); }}
            />
          </FilterField>
          <div className="col-span-2 flex items-end justify-end gap-2">
            <Button onClick={search}>查询</Button>
            <Button variant="secondary" onClick={reset}>重置</Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {filtered.length === 0 ? (
          <div className="p-10"><EmptyState title="没有符合条件的业务规则" description="请调整筛选条件后重新查询，或新增规则。" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="bg-[#f7f8fb] text-sm text-slate-500">
                  <th className="px-3 py-3 font-medium">认领业务</th>
                  <th className="px-3 py-3 font-medium">一级科目</th>
                  <th className="px-3 py-3 font-medium">二级科目</th>
                  <th className="px-3 py-3 font-medium">三级科目</th>
                  <th className="px-3 py-3 font-medium">创建时间</th>
                  <th className="px-3 py-3 font-medium">最后修改</th>
                  <th className="px-3 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((rule) => (
                  <tr key={rule.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                    <td className="px-3 py-3 align-middle font-medium text-ink">{rule.claimBusiness}</td>
                    <td className="px-3 py-3 align-middle text-slate-700">{dashPart(rule.subject.level1)}</td>
                    <td className="px-3 py-3 align-middle text-slate-700">{dashPart(rule.subject.level2)}</td>
                    <td className="px-3 py-3 align-middle text-slate-700">{dashPart(rule.subject.level3)}</td>
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

      <BusinessRuleDialog
        open={editing !== null}
        rule={editing === "new" ? null : editing}
        onOpenChange={(open) => { if (!open) setEditing(null); }}
      />
      <BusinessRuleLogDrawer rule={logRule} open={Boolean(logRule)} onOpenChange={(open) => { if (!open) setLogRule(null); }} />
      <AlertDialog open={Boolean(deleteId)} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent
          title="确认删除该业务规则？"
          description={`删除后，认领业务「${deleting?.claimBusiness ?? ""}」将不再对应科目。`}
          confirmText="删除"
          danger
          onConfirm={() => {
            if (deleteId) deleteBusinessRule(deleteId);
            setDeleteId(null);
          }}
        />
      </AlertDialog>
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
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
