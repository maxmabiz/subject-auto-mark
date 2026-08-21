import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { findSubject, LEVEL_LABEL } from "@/domain/subject/validate";
import type { LedgerSubject, SubjectLevel } from "@/domain/types";
import { useAppStore } from "@/store/AppStore";

export function SubjectDialog({
  open,
  subject,
  parent,
  level,
  onOpenChange,
}: {
  open: boolean;
  subject: LedgerSubject | null;
  parent: LedgerSubject | null;
  level: SubjectLevel;
  onOpenChange: (open: boolean) => void;
}) {
  const { subjects, saveSubject } = useAppStore();
  const isEdit = Boolean(subject);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  const lockedParent = isEdit ? findSubject(subjects, subject?.parentId) ?? null : parent;
  const lockedLevel = isEdit ? subject!.level : level;

  useEffect(() => {
    if (!open) return;
    setCode(subject?.code ?? (lockedParent && !isEdit ? lockedParent.code : ""));
    setName(subject?.name ?? "");
  }, [open, subject, lockedParent, isEdit]);

  const canSubmit = Boolean(code.trim() && name.trim());
  const title = isEdit ? "编辑科目" : lockedLevel === 1 ? "新增一级科目" : `新增${LEVEL_LABEL[lockedLevel]}科目`;

  const submit = () => {
    const result = saveSubject({
      id: subject?.id,
      code,
      name,
      level: lockedLevel,
      parentId: lockedLevel === 1 ? null : lockedParent?.id ?? null,
    });
    if (result.ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={title}>
        <div className="space-y-4 px-5 py-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {lockedLevel !== 1 ? (
              <div className="space-y-1.5 col-span-2">
                <Label>上级科目</Label>
                <Input
                  disabled
                  value={lockedParent ? `${lockedParent.code} ${lockedParent.name}` : ""}
                  className="disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label>科目编码 <span className="text-red-500">*</span></Label>
              <Input
                required
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className="font-mono"
                placeholder={lockedParent ? `${lockedParent.code}…` : "如 1001"}
              />
            </div>
            <div className="space-y-1.5">
              <Label>科目名称 <span className="text-red-500">*</span></Label>
              <Input required value={name} onChange={(event) => setName(event.target.value)} placeholder="请输入" />
            </div>
          </div>
          <p className="text-xs text-muted">
            {lockedLevel === 1
              ? "一级科目独立维护。编码仅允许字母和数字，全局唯一。"
              : `编码必须以所属上级编码为前缀。同一级别名称不可重复。`}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>取消</Button>
            <Button disabled={!canSubmit} onClick={submit}>保存</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
