import type {
  ApprovalRule,
  BusinessRule,
  ChannelRuleResult,
  FeishuApprovalResult,
  FinalMatchResult,
  ManualMark,
  MatchSource,
  MatchStatus,
  Transaction,
} from "../types";
import { resolveBusinessMatch } from "../business/match";
import { resolveFeishuMatch } from "../approval/match";
import { formatSubject } from "./normalize";

export function decideFinalResult(input: {
  transaction: Transaction;
  manual: ManualMark | null;
  feishu: FeishuApprovalResult | null;
  approvalRules: ApprovalRule[];
  businessRules?: BusinessRule[];
  channel: ChannelRuleResult;
  ruleVersion: string | null;
  updatedAt: string;
}): FinalMatchResult {
  const { transaction, manual, feishu, approvalRules, businessRules = [], channel, ruleVersion, updatedAt } = input;

  if (manual) {
    return {
      transactionId: transaction.id,
      status: "manual_marked",
      source: "manual",
      subject: manual.subject,
      matchedRuleId: null,
      ruleVersion,
      matchedField: null,
      matchedKeyword: null,
      matchedRawValue: null,
      updatedAt: manual.markedAt,
      locked: true,
      explanation: `已人工标记，业务规则、审批单规则及平台规则不得覆盖。最终科目：${formatSubject(manual.subject)}。`,
    };
  }

  const businessMatch = resolveBusinessMatch(transaction, businessRules);
  if (businessMatch.hit && businessMatch.subject) {
    return {
      transactionId: transaction.id,
      status: "business_matched",
      source: "business",
      subject: businessMatch.subject,
      matchedRuleId: businessMatch.rule?.id ?? null,
      ruleVersion,
      matchedField: "认领业务",
      matchedKeyword: (transaction.claimBusiness ?? "").trim(),
      matchedRawValue: (transaction.claimBusiness ?? "").trim(),
      updatedAt,
      locked: false,
      explanation: businessMatch.explanation,
    };
  }

  const feishuMatch = resolveFeishuMatch(transaction, feishu, approvalRules);
  if (feishuMatch.hit && feishuMatch.subject) {
    return {
      transactionId: transaction.id,
      status: "feishu_matched",
      source: "feishu",
      subject: feishuMatch.subject,
      matchedRuleId: feishuMatch.rule?.id ?? null,
      ruleVersion,
      matchedField: "模板ID",
      matchedKeyword: feishu?.paymentType ?? null,
      matchedRawValue: feishu?.templateId ?? null,
      updatedAt: feishu?.matchedAt ?? updatedAt,
      locked: false,
      explanation: prefixMiss(businessMatch.explanation, feishuMatch.explanation),
    };
  }

  const feishuMiss = feishu && feishu.transactionNo === transaction.transactionNo ? feishuMatch.explanation : "";
  const priorMiss = [businessMiss(businessMatch.explanation), feishuMiss].filter(Boolean).join("");

  if (channel.status === "matched" && channel.subject) {
    return {
      transactionId: transaction.id,
      status: "auto_matched",
      source: "channel",
      subject: channel.subject,
      matchedRuleId: channel.matchedRuleId,
      ruleVersion,
      matchedField: channel.matchedField,
      matchedKeyword: channel.matchedKeyword,
      matchedRawValue: channel.matchedRawValue,
      updatedAt,
      locked: false,
      explanation: priorMiss ? `${priorMiss}${channel.explanation}` : channel.explanation,
    };
  }

  let status: MatchStatus = "unmatched";
  if (channel.status === "conflict") status = "rule_conflict";
  if (channel.status === "data_error") status = "data_error";

  return {
    transactionId: transaction.id,
    status,
    source: "none" as MatchSource,
    subject: null,
    matchedRuleId: channel.matchedRuleId,
    ruleVersion,
    matchedField: channel.matchedField,
    matchedKeyword: channel.matchedKeyword,
    matchedRawValue: channel.matchedRawValue,
    updatedAt,
    locked: false,
    explanation: priorMiss ? `${priorMiss}${channel.explanation}` : channel.explanation,
  };
}

export function rematchTransaction(input: Parameters<typeof decideFinalResult>[0]): FinalMatchResult {
  return decideFinalResult(input);
}

function businessMiss(explanation: string): string {
  if (!explanation || explanation === "无认领业务") return "";
  return explanation;
}

function prefixMiss(businessExplanation: string, next: string): string {
  const miss = businessMiss(businessExplanation);
  return miss ? `${miss}${next}` : next;
}
