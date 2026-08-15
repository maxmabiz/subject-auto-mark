import { useMemo, useState } from "react";
import { UploadWizard } from "@/components/rules/UploadWizard";
import { VersionHistory } from "@/components/rules/VersionHistory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { TEMPLATE_PATH, displayPlatform } from "@/domain/constants";
import { formatSubject } from "@/domain/matching";
import { formatDateTime } from "@/lib/format";
import { useAppStore } from "@/store/AppStore";

export function RulesPage() {
  const { loading, error, currentVersion, rules } = useAppStore();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [filters, setFilters] = useState({
    platform: "all",
    account: "all",
    field: "all",
    keyword: "",
    subject: "",
    status: "all",
  });

  const platforms = useMemo(() => [...new Set(rules.map((rule) => rule.platform).filter(Boolean))], [rules]);
  const accounts = useMemo(() => [...new Set(rules.map((rule) => rule.account).filter(Boolean))], [rules]);
  const fields = useMemo(() => [...new Set(rules.map((rule) => rule.searchField).filter(Boolean))], [rules]);

  const filtered = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase();
    const subject = filters.subject.trim();
    return rules.filter((rule) => {
      if (filters.platform !== "all" && rule.platform !== filters.platform) return false;
      if (filters.account !== "all" && rule.account !== filters.account) return false;
      if (filters.field !== "all" && rule.searchField !== filters.field) return false;
      if (filters.status !== "all" && rule.validationStatus !== filters.status) return false;
      if (keyword && !rule.keyword.toLowerCase().includes(keyword)) return false;
      if (subject && !formatSubject(rule.subject).includes(subject)) return false;
      return true;
    });
  }, [filters, rules]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">规则管理</h1>
          <p className="mt-1 text-sm text-muted">第一期仅支持 Excel 上传、校验、发布和版本追溯，不提供逐条编辑。</p>
        </div>
        <div className="flex gap-2">
          <a href={TEMPLATE_PATH} download>
            <Button variant="secondary">下载模板</Button>
          </a>
          <Button variant="secondary" onClick={() => setHistoryOpen(true)}>查看历史版本</Button>
          <Button onClick={() => setUploadOpen(true)}>上传 Excel</Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>当前生效版本</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-4 text-sm">
            <Info label="版本号" value={currentVersion?.version ?? "—"} />
            <Info label="发布状态" value={currentVersion?.status === "active" ? "生效中" : "未生效"} />
            <Info label="发布时间" value={currentVersion ? formatDateTime(currentVersion.publishedAt) : "—"} />
            <Info label="发布人" value={currentVersion?.publisher ?? "—"} />
            <Info label="有效规则数" value={String(currentVersion?.validRules ?? 0)} />
            <Info label="覆盖平台数" value={String(currentVersion?.platforms.length ?? 0)} />
          </div>
        </CardContent>
      </Card>
      <Card className="p-4">
        <div className="grid grid-cols-6 gap-3">
          <Filter label="平台" value={filters.platform} onChange={(platform) => setFilters({ ...filters, platform })} options={platforms.map((item) => ({ value: item, label: displayPlatform(item) }))} />
          <Filter label="账号" value={filters.account} onChange={(account) => setFilters({ ...filters, account })} options={accounts.map((item) => ({ value: item, label: item }))} />
          <Filter label="检索字段" value={filters.field} onChange={(field) => setFilters({ ...filters, field })} options={fields.map((item) => ({ value: item, label: item }))} />
          <Filter label="校验状态" value={filters.status} onChange={(status) => setFilters({ ...filters, status })} options={[{ value: "valid", label: "有效" }, { value: "warning", label: "警告" }, { value: "error", label: "错误" }]} />
          <div className="space-y-1.5">
            <Label>关键词</Label>
            <Input value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>科目</Label>
            <Input value={filters.subject} onChange={(e) => setFilters({ ...filters, subject: e.target.value })} />
          </div>
        </div>
      </Card>
      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-6"><EmptyState title="没有符合条件的规则" description="请调整筛选或重新上传 Excel。" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1280px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600">
                <tr>
                  {["规则ID", "平台", "账号", "检索字段", "检索关键词", "一级科目", "二级科目", "三级科目", "匹配方式", "校验状态", "规则版本"].map((item) => (
                    <th key={item} className="px-3 py-3 font-medium">{item}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((rule) => (
                  <tr key={rule.id} className="border-t border-slate-100">
                    <td className="px-3 py-2.5">{rule.id}</td>
                    <td>{displayPlatform(rule.platform)}</td>
                    <td>{rule.account}</td>
                    <td>{rule.searchField || "—"}</td>
                    <td className="max-w-56 break-all">{rule.keyword}</td>
                    <td>{rule.subject.level1 || "—"}</td>
                    <td>{rule.subject.level2 || "—"}</td>
                    <td>{rule.subject.level3 || "—"}</td>
                    <td>{rule.matchMode === "exact" ? "完全匹配" : rule.matchMode === "contains" ? "包含匹配" : "—"}</td>
                    <td>
                      <Badge className={rule.validationStatus === "error" ? "bg-red-50 text-red-700 border border-red-200" : rule.validationStatus === "warning" ? "bg-orange-50 text-orange-700 border border-orange-200" : "bg-blue-50 text-blue-700 border border-blue-200"}>
                        {rule.validationStatus === "error" ? "错误" : rule.validationStatus === "warning" ? "警告" : "有效"}
                      </Badge>
                      {rule.errors[0] || rule.warnings[0] ? (
                        <div className="mt-1 max-w-56 text-xs text-muted">{rule.errors[0] || rule.warnings[0]}</div>
                      ) : null}
                    </td>
                    <td>{rule.version}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <UploadWizard open={uploadOpen} onOpenChange={setUploadOpen} />
      <VersionHistory open={historyOpen} onOpenChange={setHistoryOpen} />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}

function Filter({
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
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部</SelectItem>
          {options.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
