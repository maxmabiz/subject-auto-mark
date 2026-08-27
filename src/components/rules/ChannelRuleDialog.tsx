import { useEffect, useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PLATFORMS } from "@/domain/constants";
import { MAX_CONDITIONS, buildChannelRule } from "@/domain/channel/rule";
import { ruleConditions } from "@/domain/channel/match";
import { SUPPORTED_SEARCH_FIELDS, getMatchMode } from "@/domain/matching/fieldMap";
import { buildSubjectDictionary, subjectTree } from "@/domain/subjects";
import type { Rule, RuleCondition } from "@/domain/types";
import { uid } from "@/lib/utils";
import { useAppStore } from "@/store/AppStore";

const emptyCondition = (): RuleCondition => ({ searchField: "", keyword: "" });

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
  const [conditions, setConditions] = useState<RuleCondition[]>([emptyCondition()]);
  const [level1, setLevel1] = useState("");
  const [level2, setLevel2] = useState("");
  const [level3, setLevel3] = useState("");

  useEffect(() => {
    if (!open) return;
    setPlatform(rule?.platform ?? "");
    setAccount(rule?.account ?? "所有账户");
    const next = rule ? ruleConditions(rule) : [];
    setConditions(next.length ? next : [emptyCondition()]);
    setLevel1(rule?.subject.level1 ?? "");
    setLevel2(rule?.subject.level2 ?? "");
    setLevel3(rule?.subject.level3 ?? "");
  }, [open, rule]);

  const isEdit = Boolean(rule);
  const level2Options = tree.level2By1.get(level1) ?? [];
  const level3Options = tree.level3By2.get(`${level1}||${level2}`) ?? [];
  const filled = conditions.map((item) => ({ searchField: item.searchField.trim(), keyword: item.keyword.trim() }));
  const canSubmit = Boolean(
    platform.trim() &&
    account.trim() &&
    level1.trim() &&
    level2.trim() &&
    filled.length > 0 &&
    filled.every((item) => item.searchField && item.keyword && getMatchMode(item.searchField)),
  );

  const updateCondition = (index: number, patch: Partial<RuleCondition>) => {
    setConditions((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const submit = () => {
    if (!canSubmit) return;
    const saved = buildChannelRule({
      id: rule?.id ?? uid("R"),
      excelRow: rule?.excelRow ?? 0,
      platform: rule?.platform ?? platform,
      account: rule?.account ?? account,
      conditions: filled,
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
        <div className="max-h-[min(70vh,640px)] space-y-4 overflow-auto px-5 py-4">
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
          </div>

          <div className="space-y-2">
            <div className="flex items-end justify-between gap-3">
              <Label>检索条件 <span className="text-red-500">*</span></Label>
              <span className="text-xs text-muted">多组为或，任一组命中即命中本规则</span>
            </div>
            {conditions.map((item, index) => (
              <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                <div className="space-y-1.5">
                  {index === 0 ? <Label>检索字段</Label> : null}
                  <Select value={item.searchField || undefined} onValueChange={(searchField) => updateCondition(index, { searchField })}>
                    <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_SEARCH_FIELDS.map((field) => (
                        <SelectItem key={field} value={field}>{field}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  {index === 0 ? <Label>检索关键词</Label> : null}
                  <Input
                    required
                    value={item.keyword}
                    onChange={(event) => updateCondition(index, { keyword: event.target.value })}
                    placeholder="请输入"
                  />
                </div>
                <div className={`flex items-center gap-1 ${index === 0 ? "h-9" : ""}`}>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    disabled={conditions.length <= 1}
                    onClick={() => setConditions((prev) => prev.filter((_, i) => i !== index))}
                    aria-label="删除该组"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  {index === conditions.length - 1 ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      disabled={conditions.length >= MAX_CONDITIONS}
                      onClick={() => setConditions((prev) => [...prev, emptyCondition()])}
                      aria-label="添加一组"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  ) : <span className="inline-block h-9 w-9" />}
                </div>
              </div>
            ))}
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
            匹配键为平台 + 账号 + 每一组检索字段与关键词。多组之间是或：任一组命中即命中本规则。交易描述、备注为包含匹配，其余检索字段为完全匹配。
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
