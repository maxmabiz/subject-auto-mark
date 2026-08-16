import type {
  ApprovalRule,
  ChannelRuleResult,
  FeishuApprovalResult,
  FinalMatchResult,
  ManualMark,
  MatchSource,
  MatchStatus,
  Transaction,
} from "../types";
import { resolveFeishuMatch } from "../approval/match";
import { formatSubject } from "./normalize";

export function decideFinalResult(input: {
  transaction: Transaction;
  manual: ManualMark | null;
  feishu: FeishuApprovalResult | null;
  approvalRules: ApprovalRule[];
  channel: ChannelRuleResult;
  ruleVersion: string | null;
  updatedAt: string;
}): FinalMatchResult {
  const { transaction, manual, feishu, approvalRules, channel, ruleVersion, updatedAt } = input;

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
      explanation: `已人工标记，飞书审批及渠道规则不得覆盖。最终科目：${formatSubject(manual.subject)}。`,
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
      explanation: feishuMatch.explanation,
    };
  }

  const feishuMiss = feishu && feishu.transactionNo === transaction.transactionNo ? feishuMatch.explanation : "";

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
      explanation: feishuMiss ? `${feishuMiss}${channel.explanation}` : channel.explanation,
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
    explanation: feishuMiss ? `${feishuMiss}${channel.explanation}` : channel.explanation,
  };
}

export function rematchTransaction(input: Parameters<typeof decideFinalResult>[0]): FinalMatchResult {
  return decideFinalResult(input);
}
