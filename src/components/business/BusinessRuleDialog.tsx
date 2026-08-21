import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildSubjectDictionary, subjectTree } from "@/domain/subjects";
import type { BusinessRule } from "@/domain/types";
import { uid } from "@/lib/utils";
import { useAppStore } from "@/store/AppStore";

export function BusinessRuleDialog({
  open,
  rule,
  onOpenChange,
}: {
  open: boolean;
  rule: BusinessRule | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { rules, approvalRules, businessRules, saveBusinessRule } = useAppStore();
  const subjects = useMemo(() => {
    const dict = buildSubjectDictionary(rules, approvalRules);
    return [...dict, ...businessRules.map((item) => item.subject)];
  }, [approvalRules, businessRules, rules]);
  const tree = useMemo(() => subjectTree(subjects), [subjects]);
  const claims = useMemo(() => [...new Set(businessRules.map((item) => item.claimBusiness).filter(Boolean))], [businessRules]);

  const [claimBusiness, setClaimBusiness] = useState("");
  const [level1, setLevel1] = useState("");
  const [level2, setLevel2] = useState("");
  const [level3, setLevel3] = useState("");

  useEffect(() => {
    if (!open) return;
    setClaimBusiness(rule?.claimBusiness ?? "");
    setLevel1(rule?.subject.level1 ?? "");
    setLevel2(rule?.subject.level2 ?? "");
    setLevel3(rule?.subject.level3 ?? "");
  }, [open, rule]);

  const isEdit = Boolean(rule);
  const level2Options = tree.level2By1.get(level1) ?? [];
  const level3Options = tree.level3By2.get(`${level1}||${level2}`) ?? [];
  const canSubmit = Boolean(claimBusiness.trim() && level1.trim());

  const submit = () => {
    if (!canSubmit) return;
    const result = saveBusinessRule({
      id: rule?.id ?? uid("BR"),
      claimBusiness: rule?.claimBusiness ?? claimBusiness,
      subject: { level1: level1.trim(), level2: level2.trim(), level3: level3.trim() || null },
      createdAt: rule?.createdAt ?? "",
      updatedAt: rule?.updatedAt ?? "",
    });
    if (result.ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={rule ? "编辑业务规则" : "新增业务规则"}>
        <div className="space-y-4 px-5 py-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="space-y-1.5 col-span-2">
              <Label>认领业务 <span className="text-red-500">*</span></Label>
              <Input
                required
                disabled={isEdit}
                value={claimBusiness}
                list="business-claims"
                onChange={(event) => setClaimBusiness(event.target.value)}
                className="disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="如 履约、广告"
              />
              <datalist id="business-claims">
                {claims.map((item) => <option key={item} value={item} />)}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label>一级科目 <span className="text-red-500">*</span></Label>
              <Input required value={level1} onChange={(event) => { setLevel1(event.target.value); setLevel2(""); setLevel3(""); }} placeholder="请输入" list="business-l1" />
              <datalist id="business-l1">{tree.level1.map((item) => <option key={item} value={item} />)}</datalist>
            </div>
            <div className="space-y-1.5">
              <Label>二级科目</Label>
              <Input value={level2} onChange={(event) => { setLevel2(event.target.value); setLevel3(""); }} placeholder="可空" list="business-l2" />
              <datalist id="business-l2">{level2Options.map((item) => <option key={item} value={item} />)}</datalist>
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>三级科目</Label>
              <Input value={level3} onChange={(event) => setLevel3(event.target.value)} placeholder="可空" list="business-l3" />
              <datalist id="business-l3">{level3Options.map((item) => <option key={item} value={item} />)}</datalist>
            </div>
          </div>
          <p className="text-xs text-muted">匹配键为认领业务，同一认领业务只能配置一条规则。</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>取消</Button>
            <Button disabled={!canSubmit} onClick={submit}>保存</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
