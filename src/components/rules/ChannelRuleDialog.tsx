import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PLATFORMS } from "@/domain/constants";
import { buildChannelRule } from "@/domain/channel/rule";
import { SUPPORTED_SEARCH_FIELDS, getMatchMode } from "@/domain/matching/fieldMap";
import { buildSubjectDictionary, subjectTree } from "@/domain/subjects";
import type { Rule } from "@/domain/types";
import { uid } from "@/lib/utils";
import { useAppStore } from "@/store/AppStore";

export function ChannelRuleDialog({
  open,
  rule,
  onOpenChange,
}: {
  open: boolean;
  rule: Rule | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { rules, approvalRules, saveChannelRule } = useAppStore();
  const subjects = useMemo(() => buildSubjectDictionary(rules, approvalRules), [rules, approvalRules]);
  const tree = useMemo(() => subjectTree(subjects), [subjects]);
  const accounts = useMemo(() => [...new Set(rules.map((item) => item.account).filter(Boolean))], [rules]);

  const [platform, setPlatform] = useState("");
  const [account, setAccount] = useState("");
  const [searchField, setSearchField] = useState("");
  const [keyword, setKeyword] = useState("");
  const [level1, setLevel1] = useState("");
  const [level2, setLevel2] = useState("");
  const [level3, setLevel3] = useState("");

  useEffect(() => {
    if (!open) return;
    setPlatform(rule?.platform ?? "");
    setAccount(rule?.account ?? "所有账户");
    setSearchField(rule?.searchField ?? "");
    setKeyword(rule?.keyword ?? "");
    setLevel1(rule?.subject.level1 ?? "");
    setLevel2(rule?.subject.level2 ?? "");
    setLevel3(rule?.subject.level3 ?? "");
  }, [open, rule]);

  const isEdit = Boolean(rule);
  const matchMode = getMatchMode(searchField);
  const level2Options = tree.level2By1.get(level1) ?? [];
  const level3Options = tree.level3By2.get(`${level1}||${level2}`) ?? [];
  const canSubmit = Boolean(platform.trim() && account.trim() && searchField.trim() && keyword.trim() && level1.trim() && level2.trim() && matchMode);

  const submit = () => {
    if (!canSubmit) return;
    const saved = buildChannelRule({
      id: rule?.id ?? uid("R"),
      excelRow: rule?.excelRow ?? 0,
      platform: rule?.platform ?? platform,
      account: rule?.account ?? account,
      searchField: rule?.searchField ?? searchField,
      keyword: rule?.keyword ?? keyword,
      level1,
      level2,
      level3,
      createdAt: rule?.createdAt,
      matchedCountT1: rule?.matchedCountT1,
    });
    const result = saveChannelRule(saved);
    if (result.ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(720px,calc(100%-32px))]" title={rule ? "编辑平台规则" : "新增平台规则"}>
        <div className="space-y-4 px-5 py-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="space-y-1.5">
              <Label>平台 <span className="text-red-500">*</span></Label>
              <Select value={platform || undefined} onValueChange={setPlatform} disabled={isEdit}>
                <SelectTrigger className="disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"><SelectValue placeholder="请选择" /></SelectTrigger>
                <SelectContent>
                  {[...new Set([...PLATFORMS, platform].filter(Boolean))].map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>账号 <span className="text-red-500">*</span></Label>
              <Input
                required
                disabled={isEdit}
                value={account}
                list="channel-accounts"
                onChange={(event) => setAccount(event.target.value)}
                className="disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="请输入，可用「所有账户」"
              />
              <datalist id="channel-accounts">
                {accounts.map((item) => <option key={item} value={item} />)}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label>检索字段 <span className="text-red-500">*</span></Label>
              <Select value={searchField || undefined} onValueChange={setSearchField} disabled={isEdit}>
                <SelectTrigger className="disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"><SelectValue placeholder="请选择" /></SelectTrigger>
                <SelectContent>
                  {SUPPORTED_SEARCH_FIELDS.map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>检索关键词 <span className="text-red-500">*</span></Label>
              <Input
                required
                disabled={isEdit}
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className="disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="请输入"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-x-4 gap-y-3">
            <div className="space-y-1.5">
              <Label>一级科目 <span className="text-red-500">*</span></Label>
              <Input required value={level1} onChange={(event) => setLevel1(event.target.value)} placeholder="请输入" list="channel-l1" />
              <datalist id="channel-l1">{tree.level1.map((item) => <option key={item} value={item} />)}</datalist>
            </div>
            <div className="space-y-1.5">
              <Label>二级科目 <span className="text-red-500">*</span></Label>
              <Input required value={level2} onChange={(event) => setLevel2(event.target.value)} placeholder="请输入" list="channel-l2" />
              <datalist id="channel-l2">{level2Options.map((item) => <option key={item} value={item} />)}</datalist>
            </div>
            <div className="space-y-1.5">
              <Label>三级科目</Label>
              <Input value={level3} onChange={(event) => setLevel3(event.target.value)} placeholder="可空" list="channel-l3" />
              <datalist id="channel-l3">{level3Options.map((item) => <option key={item} value={item} />)}</datalist>
            </div>
          </div>
          <p className="rounded-md bg-slate-50 px-3 py-2 text-xs leading-5 text-muted">
            匹配键为平台 + 账号 + 检索字段 + 检索关键词。交易描述、备注为包含匹配，其余检索字段为完全匹配。
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>取消</Button>
          <Button disabled={!canSubmit} onClick={submit}>保存</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
