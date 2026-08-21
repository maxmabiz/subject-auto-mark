import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { SubjectDialog } from "@/components/subject/SubjectDialog";
import { SubjectLogDrawer } from "@/components/subject/SubjectLogDrawer";
import { filterSubjectTree, flattenVisibleTree, parentIdsWithChildren } from "@/domain/subject/tree";
import { canDeleteSubject, findSubject, LEVEL_LABEL, sortSubjectsByCode, subjectChildren } from "@/domain/subject/validate";
import type { LedgerSubject, SubjectLevel } from "@/domain/types";
import { formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/AppStore";

const emptyFilters = { level: "all", code: "", name: "", parentId: "all" };

export function SubjectsPage() {
  const { loading, error, subjects, deleteSubject } = useAppStore();
  const [draft, setDraft] = useState(emptyFilters);
  const [applied, setApplied] = useState(emptyFilters);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<{ subject: LedgerSubject | null; parent: LedgerSubject | null; level: SubjectLevel } | null>(null);
  const [logSubject, setLogSubject] = useState<LedgerSubject | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const expandedReady = useRef(false);

  useEffect(() => {
    if (expandedReady.current || subjects.length === 0) return;
    expandedReady.current = true;
    setExpanded(new Set(parentIdsWithChildren(subjects)));
  }, [subjects]);

  const parents = useMemo(
    () => sortSubjectsByCode(subjects.filter((item) => item.level !== 3)),
    [subjects],
  );

  const keep = useMemo(() => {
    const code = applied.code.trim().toLowerCase();
    const name = applied.name.trim();
    return filterSubjectTree(subjects, (item) => {
      if (applied.level !== "all" && String(item.level) !== applied.level) return false;
      if (code && !item.code.toLowerCase().includes(code)) return false;
      if (name && !item.name.includes(name)) return false;
      if (applied.parentId !== "all" && item.parentId !== applied.parentId) return false;
      return true;
    });
  }, [applied, subjects]);

  const roots = useMemo(
    () => sortSubjectsByCode(subjects.filter((item) => item.level === 1 && keep.has(item.id))),
    [keep, subjects],
  );
  const pageCount = Math.max(1, Math.ceil(roots.length / pageSize));
  const safeIndex = Math.min(pageIndex, pageCount - 1);
  const pageRoots = roots.slice(safeIndex * pageSize, (safeIndex + 1) * pageSize);
  const rows = useMemo(
    () => flattenVisibleTree(subjects, keep, expanded, pageRoots.map((item) => item.id)),
    [expanded, keep, pageRoots, subjects],
  );
  const pages = visiblePages(safeIndex, pageCount);

  const search = () => {
    setApplied(draft);
    setPageIndex(0);
    setExpanded(new Set(parentIdsWithChildren(subjects)));
  };

  const reset = () => {
    setDraft(emptyFilters);
    setApplied(emptyFilters);
    setPageIndex(0);
    setExpanded(new Set(parentIdsWithChildren(subjects)));
  };

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exportCsv = () => {
    const header = ["级别", "科目编码", "科目名称", "上级科目编码", "上级科目名称", "创建人", "创建时间"];
    const lines = sortSubjectsByCode(subjects).map((item) => {
      const parent = findSubject(subjects, item.parentId);
      return [
        LEVEL_LABEL[item.level],
        item.code,
        item.name,
        parent?.code ?? "",
        parent?.name ?? "",
        item.createdBy,
        formatDateTime(item.createdAt),
      ].map(csvCell).join(",");
    });
    const blob = new Blob(["\uFEFF" + [header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `科目维护-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`已导出 ${subjects.length} 条科目`);
  };

  const deleting = findSubject(subjects, deleteId) ?? null;
  const deleteBlocked = deleting ? !canDeleteSubject(subjects, deleting.id).ok : false;

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-muted">Fund / 科目匹配规则 / 科目维护</div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">科目维护</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-4">
          <Button variant="secondary" onClick={exportCsv}>
            <Download className="h-4 w-4" />
            导出全部科目
          </Button>
          <Button onClick={() => setDialog({ subject: null, parent: null, level: 1 })}>
            <Plus className="h-4 w-4" />
            新增一级科目
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="grid grid-cols-4 gap-x-4 gap-y-3 p-4">
          <FilterField label="科目级别">
            <Select value={draft.level} onValueChange={(level) => setDraft({ ...draft, level })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="1">一级</SelectItem>
                <SelectItem value="2">二级</SelectItem>
                <SelectItem value="3">三级</SelectItem>
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="科目编码">
            <Input
              value={draft.code}
              placeholder="请输入"
              onChange={(e) => setDraft({ ...draft, code: e.target.value })}
              onKeyDown={(e) => { if (e.key === "Enter") search(); }}
            />
          </FilterField>
          <FilterField label="科目名称">
            <Input
              value={draft.name}
              placeholder="请输入"
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              onKeyDown={(e) => { if (e.key === "Enter") search(); }}
            />
          </FilterField>
          <FilterField label="上级科目">
            <Select value={draft.parentId} onValueChange={(parentId) => setDraft({ ...draft, parentId })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                {parents.map((item) => (
                  <SelectItem key={item.id} value={item.id}>{item.code} {item.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>
          <div className="col-span-4 flex items-end justify-end gap-2">
            <Button onClick={search}>查询</Button>
            <Button variant="secondary" onClick={reset}>重置</Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {rows.length === 0 ? (
          <div className="p-10"><EmptyState title="没有符合条件的科目" description="请调整筛选条件后重新查询，或新增一级科目。" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1280px] table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[14%]" />
                <col className="w-[20%]" />
                <col className="w-[7%]" />
                <col className="w-[18%]" />
                <col className="w-[9%]" />
                <col className="w-[12%]" />
                <col className="w-[20%]" />
              </colgroup>
              <thead>
                <tr className="bg-[#f7f8fb] text-sm text-slate-500">
                  <th className="px-3 py-3 font-medium">科目编码</th>
                  <th className="px-3 py-3 font-medium">科目名称</th>
                  <th className="px-3 py-3 font-medium">级别</th>
                  <th className="px-3 py-3 font-medium">上级科目</th>
                  <th className="px-3 py-3 font-medium">创建人</th>
                  <th className="px-3 py-3 font-medium">创建时间</th>
                  <th className="px-3 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => {
                  const parent = findSubject(subjects, item.parentId);
                  const childCount = subjectChildren(subjects, item.id).length;
                  const pad = item.level === 1 ? "pl-3" : item.level === 2 ? "pl-8" : "pl-14";
                  return (
                    <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                      <td className="px-3 py-3 align-middle font-mono text-xs text-slate-600">{item.code}</td>
                      <td className={cn("py-3 align-middle", pad)}>
                        <div className="flex min-w-0 items-center gap-1">
                          {item.level < 3 && childCount > 0 ? (
                            <button type="button" className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-100" onClick={() => toggle(item.id)}>
                              {expanded.has(item.id) ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                            </button>
                          ) : (
                            <span className="inline-block w-4 shrink-0" />
                          )}
                          <span className="truncate font-medium text-ink" title={item.name}>{item.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 align-middle text-slate-600">{LEVEL_LABEL[item.level]}</td>
                      <td className="px-3 py-3 align-middle text-slate-600">
                        {parent ? (
                          <span className="block truncate" title={`${parent.code} ${parent.name}`}>{parent.code} {parent.name}</span>
                        ) : "—"}
                      </td>
                      <td className="px-3 py-3 align-middle text-slate-600">{item.createdBy}</td>
                      <td className="px-3 py-3 align-middle text-slate-500">{formatDate(item.createdAt)}</td>
                      <td className="whitespace-nowrap px-3 py-3 align-middle">
                        <div className="flex items-center gap-2.5">
                          {item.level < 3 ? (
                            <button
                              className="text-brand-700 hover:underline"
                              onClick={() => setDialog({ subject: null, parent: item, level: (item.level + 1) as SubjectLevel })}
                            >
                              新增下级
                            </button>
                          ) : null}
                          <button className="text-brand-700 hover:underline" onClick={() => setDialog({ subject: item, parent: parent ?? null, level: item.level })}>编辑</button>
                          <button className="text-red-600 hover:underline" onClick={() => setDeleteId(item.id)}>删除</button>
                          <button className="text-brand-700 hover:underline" onClick={() => setLogSubject(item)}>日志</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
          <span>共 {roots.length} 个一级科目</span>
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

      <SubjectDialog
        open={Boolean(dialog)}
        subject={dialog?.subject ?? null}
        parent={dialog?.parent ?? null}
        level={dialog?.level ?? 1}
        onOpenChange={(open) => { if (!open) setDialog(null); }}
      />
      <SubjectLogDrawer subject={logSubject} open={Boolean(logSubject)} onOpenChange={(open) => { if (!open) setLogSubject(null); }} />
      <AlertDialog open={Boolean(deleteId)} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent
          title={deleteBlocked ? "无法删除" : "确认删除科目"}
          description={
            deleteBlocked
              ? `「${deleting?.code} ${deleting?.name}」存在下级科目，请先删除下级。`
              : `删除后不可恢复。确认删除「${deleting?.code} ${deleting?.name}」？`
          }
          confirmText={deleteBlocked ? "知道了" : "删除"}
          danger={!deleteBlocked}
          onConfirm={() => {
            if (deleting && !deleteBlocked) deleteSubject(deleting.id);
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
