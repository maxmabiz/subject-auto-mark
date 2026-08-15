import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseRuleWorkbook } from "@/domain/excel/parse";
import { diffRuleSets, validateParsedRules } from "@/domain/excel/validate";
import type { ParsedExcelRow, RuleValidationResult } from "@/domain/types";
import { TEMPLATE_PATH } from "@/domain/constants";
import { useAppStore } from "@/store/AppStore";
import { toast } from "sonner";

type Step = 1 | 2 | 3 | 4;

export function UploadWizard({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { currentVersion, publishRules } = useAppStore();
  const [step, setStep] = useState<Step>(1);
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number; uploadedAt: string } | null>(null);
  const [rows, setRows] = useState<ParsedExcelRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [validation, setValidation] = useState<RuleValidationResult | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "valid" | "warning" | "error">("all");
  const [description, setDescription] = useState("");
  const [onlyValid, setOnlyValid] = useState(true);
  const [dragOver, setDragOver] = useState(false);

  const reset = () => {
    setStep(1);
    setFileMeta(null);
    setRows([]);
    setParseErrors([]);
    setValidation(null);
    setDescription("");
    setOnlyValid(true);
    setStatusFilter("all");
  };

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      toast.error("仅支持 xlsx 文件");
      return;
    }
    const buffer = await file.arrayBuffer();
    const parsed = parseRuleWorkbook(buffer, {
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
    });
    setFileMeta({ name: file.name, size: file.size, uploadedAt: parsed.uploadedAt });
    setParseErrors(parsed.errors);
    setRows(parsed.rows);
    setValidation(parsed.errors.length ? null : validateParsedRules(parsed.rows, currentVersion?.version ?? "V1.0.0"));
  };

  const diff = useMemo(() => {
    if (!validation) return { added: 0, modified: 0, disabled: 0 };
    return diffRuleSets(currentVersion?.rules ?? [], validation.rules);
  }, [currentVersion?.rules, validation]);

  const visibleRules = (validation?.rules ?? []).filter((rule) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "valid") return rule.validationStatus === "valid";
    return rule.validationStatus === statusFilter;
  });

  const nextDisabled =
    (step === 1 && (!fileMeta || parseErrors.length > 0 || rows.length === 0)) ||
    (step === 2 && !validation);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent title="上传并发布规则" className="w-[min(880px,calc(100%-32px))]">
        <div className="px-5 py-4">
          <ol className="mb-4 flex gap-2 text-sm">
            {["上传文件", "解析与校验", "影响预览", "确认发布"].map((label, index) => (
              <li key={label} className={`rounded-md px-3 py-1 ${step === index + 1 ? "bg-brand-50 text-brand-800" : "bg-slate-100 text-slate-500"}`}>
                {index + 1}. {label}
              </li>
            ))}
          </ol>

          {step === 1 ? (
            <div className="space-y-3">
              <div
                className={`flex h-40 flex-col items-center justify-center rounded-lg border border-dashed ${dragOver ? "border-brand-500 bg-brand-50" : "border-slate-300 bg-slate-50"}`}
                onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragOver(false);
                  const file = event.dataTransfer.files[0];
                  if (file) void handleFile(file);
                }}
              >
                <p className="text-sm">拖拽 xlsx 到此处，或选择本地文件</p>
                <label className="mt-3">
                  <input type="file" accept=".xlsx" className="hidden" onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handleFile(file);
                  }} />
                  <span className="inline-flex h-9 cursor-pointer items-center rounded-md bg-brand-700 px-3 text-sm text-white">选择文件</span>
                </label>
                <a className="mt-2 text-xs text-brand-700" href={TEMPLATE_PATH} download>下载标准模板</a>
              </div>
              {fileMeta ? (
                <div className="rounded-md bg-slate-50 p-3 text-sm">
                  <div>文件名：{fileMeta.name}</div>
                  <div>大小：{(fileMeta.size / 1024).toFixed(1)} KB</div>
                  <div>上传时间：{fileMeta.uploadedAt.replace("T", " ").slice(0, 19)}</div>
                  <div>解析行数：{rows.length}</div>
                </div>
              ) : null}
              {parseErrors.map((item) => <div key={item} className="text-sm text-red-600">{item}</div>)}
            </div>
          ) : null}

          {step === 2 && validation ? (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-3">
                <Stat label="总规则数" value={validation.total} />
                <Stat label="有效规则数" value={validation.valid} />
                <Stat label="错误数" value={validation.error} />
                <Stat label="警告数" value={validation.warning} />
              </div>
              <div className="flex gap-2 text-sm">
                {(["all", "valid", "warning", "error"] as const).map((item) => (
                  <button key={item} className={`rounded px-2 py-1 ${statusFilter === item ? "bg-brand-50 text-brand-800" : "bg-slate-100"}`} onClick={() => setStatusFilter(item)}>
                    {item === "all" ? "全部" : item === "valid" ? "有效" : item === "warning" ? "警告" : "错误"}
                  </button>
                ))}
              </div>
              <div className="max-h-72 overflow-auto rounded-md border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-xs">
                    <tr>
                      <th className="px-3 py-2">行号</th>
                      <th>规则ID</th>
                      <th>平台</th>
                      <th>检索字段</th>
                      <th>关键词</th>
                      <th>状态</th>
                      <th>原因</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRules.map((rule) => (
                      <tr key={rule.id} className="border-t border-slate-100">
                        <td className="px-3 py-2">{rule.excelRow}</td>
                        <td>{rule.id}</td>
                        <td>{rule.platform}</td>
                        <td>{rule.searchField || "—"}</td>
                        <td className="max-w-48 break-all">{rule.keyword}</td>
                        <td>{rule.validationStatus === "error" ? "错误" : rule.validationStatus === "warning" ? "警告" : "有效"}</td>
                        <td className="max-w-64 text-xs text-muted">{[...rule.errors, ...rule.warnings].join("；") || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <Stat label="新增规则" value={diff.added} />
                <Stat label="修改规则" value={diff.modified} />
                <Stat label="停用规则" value={diff.disabled} />
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                新版本只对后续新进入系统的流水生效，本期不回刷历史已标记结果。人工锁定结果始终不会被自动覆盖。规则上传与发布由同一财务管理员完成。
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>版本说明</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="例如：同步业务方 8 月规则，排除检索字段为空的 5 条无效规则" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={onlyValid} onCheckedChange={(value) => setOnlyValid(Boolean(value))} />
                仅发布有效规则
              </label>
            </div>
          ) : null}

          <div className="mt-5 flex justify-end gap-2">
            {step > 1 ? <Button variant="secondary" onClick={() => setStep((step - 1) as Step)}>上一步</Button> : null}
            {step < 4 ? (
              <Button disabled={nextDisabled} onClick={() => setStep((step + 1) as Step)}>下一步</Button>
            ) : (
              <Button
                onClick={() => {
                  const published = publishRules({
                    rows,
                    description,
                    onlyValid,
                    fileName: fileMeta?.name ?? "rules.xlsx",
                  });
                  toast.success(`发布成功，当前版本 ${published.version}`);
                  onOpenChange(false);
                  reset();
                }}
              >
                确认发布
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-slate-50 px-3 py-2">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}
