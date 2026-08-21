import type { ApprovalRuleChange, BusinessRule, BusinessRuleLog } from "../types";
import type { ApprovalRuleLogAction } from "../types";
import { formatSubject } from "../matching/normalize";

export const BUSINESS_LOG_ACTION_LABEL: Record<ApprovalRuleLogAction, string> = {
  create: "新增规则",
  update: "编辑规则",
  delete: "删除规则",
  import: "Excel 导入",
};

function dash(value: string | null | undefined): string {
  const text = (value ?? "").trim();
  return text || "—";
}

export function businessRuleFieldValues(rule: BusinessRule): { field: string; value: string }[] {
  return [
    { field: "认领业务", value: dash(rule.claimBusiness) },
    { field: "科目", value: dash(formatSubject(rule.subject)) },
  ];
}

export function diffBusinessRule(before: BusinessRule | null, after: BusinessRule | null): ApprovalRuleChange[] {
  const from = before ? businessRuleFieldValues(before) : [];
  const to = after ? businessRuleFieldValues(after) : [];
  const fields = [...new Set([...from, ...to].map((item) => item.field))];
  const fromMap = new Map(from.map((item) => [item.field, item.value]));
  const toMap = new Map(to.map((item) => [item.field, item.value]));
  return fields.flatMap((field) => {
    const prev = fromMap.get(field) ?? "—";
    const next = toMap.get(field) ?? "—";
    if (prev === next) return [];
    return [{ field, from: prev, to: next }];
  });
}

export function buildBusinessRuleLog(input: {
  id?: string;
  ruleId: string;
  time?: string;
  actor: string;
  action: ApprovalRuleLogAction;
  before?: BusinessRule | null;
  after?: BusinessRule | null;
  summary?: string;
}): BusinessRuleLog {
  const changes = diffBusinessRule(input.before ?? null, input.after ?? null);
  return {
    id: input.id ?? `brlog-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    ruleId: input.ruleId,
    time: input.time ?? new Date().toISOString(),
    actor: input.actor,
    action: input.action,
    summary: input.summary ?? defaultSummary(input.action, changes),
    changes,
  };
}

function defaultSummary(action: ApprovalRuleLogAction, changes: ApprovalRuleChange[]): string {
  if (action === "create") return "新增规则";
  if (action === "delete") return "删除规则";
  if (action === "import") return "Excel 导入";
  if (changes.length === 0) return "字段无变化";
  return changes.map((item) => item.field).join("、");
}
