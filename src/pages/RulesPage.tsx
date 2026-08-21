import { useMemo, useRef, useState, type ReactNode } from "react";
import { FileSpreadsheet, Plus } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { ChannelRuleDialog } from "@/components/rules/ChannelRuleDialog";
import { ChannelRuleLogDrawer } from "@/components/rules/ChannelRuleLogDrawer";
import { TEMPLATE_PATH, displayPlatform } from "@/domain/constants";
import { parseRuleWorkbook } from "@/domain/excel/parse";
import { validateParsedRules } from "@/domain/excel/validate";
import { formatSubject } from "@/domain/matching";
import { hydrateChannelRule } from "@/domain/channel/rule";
import type { Rule } from "@/domain/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/AppStore";

const emptyFilters = { platform: "all", account: "all", field: "all", keyword: "", subject: "", createdFrom: "", createdTo: "" };

export function RulesPage() {
  const { loading, error, rules, deleteChannelRule, importChannelRules } = useAppStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<Rule | null | "new">(null);
  const [logRule, setLogRule] = useState<Rule | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyFilters);
  const [applied, setApplied] = useState(emptyFilters);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const platforms = useMemo(() => [...new Set(rules.map((item) => item.platform).filter(Boolean))], [rules]);
  const accounts = useMemo(() => [...new Set(rules.map((item) => item.account).filter(Boolean))], [rules]);
  const fields = useMemo(() => [...new Set(rules.map((item) => item.searchField).filter(Boolean))], [rules]);

  const filtered = useMemo(() => {
    const keyword = applied.keyword.trim().toLowerCase();
    const subject = applied.subject.trim();
    return rules.filter((rule) => {
      if (applied.platform !== "all" && rule.platform !== applied.platform) return false;
      if (applied.account !== "all" && rule.account !== applied.account) return false;
      if (applied.field !== "all" && rule.searchField !== applied.field) return false;
      if (keyword && !rule.keyword.toLowerCase().includes(keyword)) return false;
      if (subject && !formatSubject(rule.subject).includes(subject)) return false;
      const createdDay = formatDate(rule.createdAt);
      if (applied.createdFrom && createdDay !== "—" && createdDay < applied.createdFrom) return false;
      if (applied.createdTo && createdDay !== "—" && createdDay > applied.createdTo) return false;
      return true;
    });
  }, [rules, applied]);

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
    const parsed = parseRuleWorkbook(buffer, {
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
    });
    if (parsed.errors.length) {
      toast.error(parsed.errors.join("；"));
      return;
    }
    const validated = validateParsedRules(parsed.rows, "");
    const valid = validated.rules.filter((item) => item.validationStatus !== "error").map(hydrateChannelRule);
    if (!valid.length) {
      toast.error("没有可导入的完整规则");
      return;
    }
    importChannelRules(valid);
    if (validated.error) toast.message(`已跳过 ${validated.error} 条不完整规则`);
    setPageIndex(0);
  };

  const deletingRule = rules.find((item) => item.id === deleteId) ?? null;
  const usedCount = deletingRule?.matchedCountT1 ?? 0;
  const deletingInUse = usedCount > 0;

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm text-muted">Fund / 科目匹配规则 / 平台规则</div>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight">平台规则</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <a href={TEMPLATE_PATH} download>
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

      <div className="rounded-md border border-slate-200 bg-white px-5 py-4">
        <div className="grid grid-cols-4 gap-x-5 gap-y-3">
          <FilterField label="平台">
            <Select value={draft.platform} onValueChange={(platform) => setDraft({ ...draft, platform })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                {platforms.map((item) => <SelectItem key={item} value={item}>{displayPlatform(item)}</SelectItem>)}
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="账号">
            <Select value={draft.account} onValueChange={(account) => setDraft({ ...draft, account })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                {accounts.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="检索字段">
            <Select value={draft.field} onValueChange={(field) => setDraft({ ...draft, field })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                {fields.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="关键词">
            <Input
              value={draft.keyword}
              placeholder="请输入"
              onChange={(e) => setDraft({ ...draft, keyword: e.target.value })}
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
          <div className="flex items-end justify-end gap-2">
            <Button onClick={search}>查询</Button>
            <Button variant="secondary" onClick={reset}>重置</Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        {filtered.length === 0 ? (
          <div className="p-8"><EmptyState title="没有符合条件的平台规则" description="请调整筛选条件后重新查询，或新增规则、导入 Excel。" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-sm leading-5">
              <thead>
                <tr className="border-b border-slate-200 bg-[#fafafa] text-sm text-slate-500">
                  <th className="whitespace-nowrap px-3 py-2.5 font-medium">平台</th>
                  <th className="whitespace-nowrap px-3 py-2.5 font-medium">账号</th>
                  <th className="whitespace-nowrap px-3 py-2.5 font-medium">检索字段</th>
                  <th className="whitespace-nowrap px-3 py-2.5 font-medium">检索关键词</th>
                  <th className="whitespace-nowrap px-3 py-2.5 font-medium">一级科目</th>
                  <th className="whitespace-nowrap px-3 py-2.5 font-medium">二级科目</th>
                  <th className="whitespace-nowrap px-3 py-2.5 font-medium">三级科目</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-center font-medium" title="已匹配条数（T-1）">已匹配（T-1）</th>
                  <th className="whitespace-nowrap px-3 py-2.5 font-medium">创建时间</th>
                  <th className="whitespace-nowrap px-3 py-2.5 font-medium">最后修改</th>
                  <th className="whitespace-nowrap px-3 py-2.5 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((rule) => (
                  <tr key={rule.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-3 py-2 align-middle font-medium text-ink">{displayPlatform(rule.platform)}</td>
                    <td className="px-3 py-2 align-middle text-slate-700">{rule.account}</td>
                    <td className="px-3 py-2 align-middle text-slate-700">{rule.searchField || "—"}</td>
                    <td className="px-3 py-2 align-middle text-slate-700">{rule.keyword}</td>
                    <td className="px-3 py-2 align-middle">
                      <SubjectCell value={rule.subject.level1} />
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <SubjectCell value={rule.subject.level2} />
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <SubjectCell value={rule.subject.level3} />
                    </td>
                    <td className="px-3 py-2 text-center align-middle tabular-nums">
                      <span className={rule.matchedCountT1 ? "text-ink" : "text-slate-400"}>{rule.matchedCountT1 ?? 0}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 align-middle tabular-nums text-slate-500">{formatDate(rule.createdAt)}</td>
                    <td className="whitespace-nowrap px-3 py-2 align-middle tabular-nums text-slate-500">{formatDate(rule.updatedAt)}</td>
                    <td className="whitespace-nowrap px-3 py-2 align-middle">
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
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 text-sm text-slate-500">
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

      <ChannelRuleDialog
        open={editing !== null}
        rule={editing === "new" ? null : editing}
        onOpenChange={(open) => { if (!open) setEditing(null); }}
      />
      <ChannelRuleLogDrawer
        rule={logRule}
        open={logRule !== null}
        onOpenChange={(open) => { if (!open) setLogRule(null); }}
      />
      <AlertDialog open={Boolean(deleteId)} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent
          title={deletingInUse ? "该规则正在被流水使用，确认删除？" : "确认删除该平台规则？"}
          description={
            deletingInUse
              ? `当前有 ${usedCount} 条流水正在使用该规则。删除后新流水将不再匹配这条规则，已匹配流水会保留当前科目。可选择继续删除或取消。`
              : "删除后，新流水将不再使用这条规则。"
          }
          confirmText={deletingInUse ? "继续删除" : "删除"}
          cancelText="取消"
          danger
          onConfirm={() => {
            if (deleteId) deleteChannelRule(deleteId);
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
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function SubjectCell({ value }: { value: string | null | undefined }) {
  const text = value?.trim();
  if (!text) return <span className="text-slate-400">—</span>;
  return (
    <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 align-middle text-sm leading-5 text-slate-700" title={text}>
      {text}
    </span>
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
