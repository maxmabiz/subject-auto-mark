import type { ApprovalRule, FeishuApprovalResult, SubjectPath, Transaction } from "../types";
import { formatSubject, isBlank, normalizeText, subjectKey } from "../matching/normalize";

export function approvalMatchKey(templateId: string, paymentType: string, otherDimension = ""): string {
  return `${normalizeText(templateId)}|${normalizeText(paymentType)}|${normalizeText(otherDimension)}`;
}

export function resolveFeishuMatch(
  transaction: Transaction,
  feishu: FeishuApprovalResult | null,
  rules: ApprovalRule[],
): {
  hit: boolean;
  subject: SubjectPath | null;
  rule: ApprovalRule | null;
  explanation: string;
} {
  if (!feishu || feishu.transactionNo !== transaction.transactionNo) {
    return { hit: false, subject: null, rule: null, explanation: "无飞书审批结果" };
  }

  const dimLabel = feishu.otherDimension?.trim() ? ` / ${feishu.otherDimension.trim()}` : "";
  const label = `「${feishu.approvalName} / ${feishu.paymentType}${dimLabel}」`;
  const key = approvalMatchKey(feishu.templateId, feishu.paymentType, feishu.otherDimension ?? "");
  const candidates = rules.filter((rule) => approvalMatchKey(rule.templateId, rule.paymentType, rule.otherDimension ?? "") === key);
  const usable = candidates.filter((rule) => rule.subject && !isBlank(rule.subject.level1) && rule.validationStatus !== "error");

  if (usable.length === 0) {
    return {
      hit: false,
      subject: null,
      rule: candidates[0] ?? null,
      explanation: `已按流水号 ${transaction.transactionNo} 关联飞书审批${label}，但审批单规则未配置有效科目，继续使用渠道规则。`,
    };
  }

  const subjects = new Set(usable.map((rule) => subjectKey(rule.subject!)));
  if (subjects.size > 1) {
    return {
      hit: false,
      subject: null,
      rule: null,
      explanation: `已关联飞书审批${label}，但模板ID、付款申请类型与其它维度对应多条不同科目，未自动采用，继续使用渠道规则。`,
    };
  }

  const matched = usable[0];
  return {
    hit: true,
    subject: matched.subject,
    rule: matched,
    explanation: `按流水号 ${transaction.transactionNo} 关联飞书审批${label}，匹配模板ID ${feishu.templateId}。渠道规则候选已保留但未生效。`,
  };
}

export function formatFeishuLink(feishu: FeishuApprovalResult | null, matchExplanation?: string): string {
  if (!feishu) return "无飞书审批结果";
  const subject = matchExplanation ?? "";
  return [
    [feishu.approvalName, feishu.paymentType, feishu.otherDimension?.trim()].filter(Boolean).join(" / "),
    `模板ID ${feishu.templateId}`,
    `审批单号 ${feishu.approvalId}`,
    subject,
  ].filter(Boolean).join("\n");
}

export function formatApprovalSubject(rule: ApprovalRule): string {
  return formatSubject(rule.subject);
}
