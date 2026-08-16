import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mockTemplateId } from "@/domain/approval/templateId";
import { buildApprovalRule } from "@/domain/excel/parseApproval";
import { buildSubjectDictionary, subjectTree } from "@/domain/subjects";
import type { ApprovalRule } from "@/domain/types";
import { uid } from "@/lib/utils";
import { useAppStore } from "@/store/AppStore";

export function ApprovalRuleDialog({
  open,
  rule,
  onOpenChange,
}: {
  open: boolean;
  rule: ApprovalRule | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { rules, approvalRules, saveApprovalRule } = useAppStore();
  const subjects = useMemo(() => buildSubjectDictionary(rules, approvalRules), [rules, approvalRules]);
  const tree = useMemo(() => subjectTree(subjects), [subjects]);
  const names = useMemo(() => [...new Set(approvalRules.map((item) => item.approvalName).filter(Boolean))], [approvalRules]);

  const [approvalName, setApprovalName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [level1, setLevel1] = useState("");
  const [level2, setLevel2] = useState("");
  const [level3, setLevel3] = useState("");

  useEffect(() => {
    if (!open) return;
    setApprovalName(rule?.approvalName ?? "");
    setTemplateId(rule?.templateId ?? "");
    setPaymentType(rule?.paymentType ?? "");
    setLevel1(rule?.subject?.level1 ?? "");
    setLevel2(rule?.subject?.level2 ?? "");
    setLevel3(rule?.subject?.level3 ?? "");
  }, [open, rule]);

  const isEdit = Boolean(rule);
  const level2Options = tree.level2By1.get(level1) ?? [];
  const level3Options = tree.level3By2.get(`${level1}||${level2}`) ?? [];
  const canSubmit = Boolean(approvalName.trim() && templateId.trim() && paymentType.trim() && level1.trim());

  const applyName = (name: string) => {
    setApprovalName(name);
    if (isEdit) return;
    const existing = approvalRules.find((item) => item.approvalName === name);
    setTemplateId(existing?.templateId ?? mockTemplateId(name));
  };

  const submit = () => {
    if (!canSubmit) return;
    const saved = buildApprovalRule({
      id: rule?.id ?? uid("AR"),
      excelRow: rule?.excelRow ?? 0,
      seq: rule?.seq ?? "",
      approvalName,
      templateId: rule?.templateId ?? templateId,
      paymentType: rule?.paymentType ?? paymentType,
      level1,
      level2,
      level3,
    });
    const result = saveApprovalRule(saved);
    if (result.ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={rule ? "编辑审批单规则" : "新增审批单规则"}>
        <div className="space-y-4 px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>飞书审批单名称 <span className="text-red-500">*</span></Label>
              <Input
                required
                value={approvalName}
                list="approval-names"
                onChange={(event) => applyName(event.target.value)}
                placeholder="请输入"
              />
              <datalist id="approval-names">
                {names.map((item) => <option key={item} value={item} />)}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label>模板ID <span className="text-red-500">*</span></Label>
              <Input
                required
                disabled={isEdit}
                value={templateId}
                onChange={(event) => setTemplateId(event.target.value)}
                className="font-mono text-xs disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="请输入"
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>付款申请类型 <span className="text-red-500">*</span></Label>
              <Input
                required
                disabled={isEdit}
                value={paymentType}
                onChange={(event) => setPaymentType(event.target.value)}
                className="disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="请输入"
              />
            </div>
            <div className="space-y-1.5">
              <Label>一级科目 <span className="text-red-500">*</span></Label>
              <Input required value={level1} onChange={(event) => setLevel1(event.target.value)} placeholder="请输入" list="approval-l1" />
              <datalist id="approval-l1">{tree.level1.map((item) => <option key={item} value={item} />)}</datalist>
            </div>
            <div className="space-y-1.5">
              <Label>二级科目</Label>
              <Input value={level2} onChange={(event) => setLevel2(event.target.value)} placeholder="可空" list="approval-l2" />
              <datalist id="approval-l2">{level2Options.map((item) => <option key={item} value={item} />)}</datalist>
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>三级科目</Label>
              <Input value={level3} onChange={(event) => setLevel3(event.target.value)} placeholder="可空" list="approval-l3" />
              <datalist id="approval-l3">{level3Options.map((item) => <option key={item} value={item} />)}</datalist>
            </div>
          </div>
          <p className="text-xs text-muted">匹配键为模板ID + 付款申请类型。</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>取消</Button>
            <Button disabled={!canSubmit} onClick={submit}>保存</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
