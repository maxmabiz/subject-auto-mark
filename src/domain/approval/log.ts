import type { ApprovalRule, ApprovalRuleChange, ApprovalRuleLog, ApprovalRuleLogAction } from "../types";
import { formatSubject } from "../matching/normalize";

export const APPROVAL_LOG_ACTION_LABEL: Record<ApprovalRuleLogAction, string> = {
  create: "新增规则",
  update: "编辑规则",
  delete: "删除规则",
  import: "Excel 导入",
};

function dash(value: string | null | undefined): string {
  const text = (value ?? "").trim();
  return text || "—";
}

export function approvalRuleFieldValues(rule: ApprovalRule): { field: string; value: string }[] {
  return [
    { field: "审批单名称", value: dash(rule.approvalName) },
    { field: "付款申请类型", value: dash(rule.paymentType) },
    { field: "其它维度", value: dash(rule.otherDimension) },
    { field: "科目", value: dash(formatSubject(rule.subject)) },
  ];
}

export function diffApprovalRule(before: ApprovalRule | null, after: ApprovalRule | null): ApprovalRuleChange[] {
  const from = before ? approvalRuleFieldValues(before) : [];
  const to = after ? approvalRuleFieldValues(after) : [];
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

export function buildApprovalRuleLog(input: {
  id?: string;
  ruleId: string;
  time?: string;
  actor: string;
  action: ApprovalRuleLogAction;
  before?: ApprovalRule | null;
  after?: ApprovalRule | null;
  summary?: string;
}): ApprovalRuleLog {
  const changes = diffApprovalRule(input.before ?? null, input.after ?? null);
  const summary = input.summary ?? defaultSummary(input.action, input.after ?? input.before ?? null, changes);
  return {
    id: input.id ?? `arlog-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    ruleId: input.ruleId,
    time: input.time ?? new Date().toISOString(),
    actor: input.actor,
    action: input.action,
    summary,
    changes,
  };
}

function defaultSummary(action: ApprovalRuleLogAction, rule: ApprovalRule | null, changes: ApprovalRuleChange[]): string {
  if (action === "create") return "新增规则";
  if (action === "delete") return `当时已匹配 ${rule?.matchedCountT1 ?? 0} 条`;
  if (action === "import") return "Excel 导入";
  if (changes.length === 0) return "字段无变化";
  return changes.map((item) => item.field).join("、");
}
