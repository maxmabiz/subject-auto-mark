import { useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { EnrichedTransaction, SubjectPath } from "@/domain/types";
import { buildSubjectDictionary, subjectTree } from "@/domain/subjects";
import { formatMoney } from "@/lib/format";
import { formatSubject as formatSubjectPath } from "@/domain/matching";
import { useAppStore } from "@/store/AppStore";

export function ManualMarkDialog({
  record,
  open,
  onOpenChange,
}: {
  record: EnrichedTransaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { rules, approvalRules, markManual } = useAppStore();
  const subjects = useMemo(() => buildSubjectDictionary(rules, approvalRules), [rules, approvalRules]);
  const tree = useMemo(() => subjectTree(subjects), [subjects]);
  const [level1, setLevel1] = useState(record?.final.subject?.level1 ?? "");
  const [level2, setLevel2] = useState(record?.final.subject?.level2 ?? "");
  const [level3, setLevel3] = useState(record?.final.subject?.level3 ?? "");
  const [reason, setReason] = useState("");

  const level2Options = tree.level2By1.get(level1) ?? [];
  const level3Options = tree.level3By2.get(`${level1}||${level2}`) ?? [];

  const canSubmit = Boolean(level1 && reason.trim());

  const submit = () => {
    if (!record || !canSubmit) return;
    const subject: SubjectPath = { level1, level2, level3: level3 || null };
    markManual(record.transaction.id, { subject, reason: reason.trim() });
    onOpenChange(false);
    setReason("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next && record) {
          setLevel1(record.final.subject?.level1 ?? "");
          setLevel2(record.final.subject?.level2 ?? "");
          setLevel3(record.final.subject?.level3 ?? "");
          setReason("");
        }
      }}
    >
      <DialogContent title="人工标记科目">
        {record ? (
          <div className="space-y-4 px-5 py-4">
            <div className="rounded-md bg-slate-50 p-3 text-sm">
              <div>交易号 {record.transaction.transactionId || record.transaction.transactionNo}</div>
              <div className="mt-1 text-muted">
                {record.transaction.entityName || "—"} · {record.transaction.platform} · {record.transaction.account || "—"} · {formatMoney(record.transaction.amount, record.transaction.currency)}
              </div>
              <div className="mt-1">当前科目：{formatSubjectPath(record.final.subject)}</div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>一级科目</Label>
                <Select
                  value={level1 || undefined}
                  onValueChange={(value) => {
                    setLevel1(value);
                    setLevel2("");
                    setLevel3("");
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                  <SelectContent>
                    {tree.level1.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>二级科目（可空）</Label>
                <Select
                  value={level2 || "__empty"}
                  onValueChange={(value) => {
                    setLevel2(value === "__empty" ? "" : value);
                    setLevel3("");
                  }}
                  disabled={!level1}
                >
                  <SelectTrigger><SelectValue placeholder="可空" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty">无</SelectItem>
                    {level2Options.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>三级科目（可空）</Label>
                <Select value={level3 || "__empty"} onValueChange={(value) => setLevel3(value === "__empty" ? "" : value)} disabled={!level1}>
                  <SelectTrigger><SelectValue placeholder="可空" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty">无</SelectItem>
                    {level3Options.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>修改原因（必填）</Label>
              <Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="请填写人工调整原因，便于后续追溯" />
              <p className="text-xs text-muted">保存后该科目为最高优先级，飞书审批和平台规则不会覆盖。</p>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" onClick={() => onOpenChange(false)}>取消</Button>
              <Button disabled={!canSubmit} onClick={submit}>确认标记</Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
