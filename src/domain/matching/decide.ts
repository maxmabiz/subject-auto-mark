import type {
  ChannelRuleResult,
  FeishuApprovalResult,
  FinalMatchResult,
  ManualMark,
  MatchSource,
  MatchStatus,
  Transaction,
} from "../types";
import { matchFeishuByTransactionNo } from "./feishu";
import { formatSubject } from "./normalize";

export function decideFinalResult(input: {
  transaction: Transaction;
  manual: ManualMark | null;
  feishu: FeishuApprovalResult | null;
  channel: ChannelRuleResult;
  ruleVersion: string | null;
  updatedAt: string;
}): FinalMatchResult {
  const { transaction, manual, feishu, channel, ruleVersion, updatedAt } = input;

  if (manual?.locked) {
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
      explanation: `存在人工锁定，因此未采用飞书及渠道规则结果。最终科目：${formatSubject(manual.subject)}。`,
    };
  }

  const linkedFeishu = matchFeishuByTransactionNo(transaction, feishu);
  if (linkedFeishu) {
    return {
      transactionId: transaction.id,
      status: "feishu_matched",
      source: "feishu",
      subject: linkedFeishu.subject,
      matchedRuleId: null,
      ruleVersion,
      matchedField: "流水号",
      matchedKeyword: linkedFeishu.approvalType,
      matchedRawValue: transaction.transactionNo,
      updatedAt: linkedFeishu.matchedAt,
      locked: false,
      explanation: `无人工锁定，按流水号 ${transaction.transactionNo} 关联飞书付款审批「${linkedFeishu.approvalType}」。渠道规则候选已保留但未生效。审批结果不会自动失效，若匹配错误请使用人工标记修正。`,
    };
  }

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
      explanation: channel.explanation,
    };
  }

  let status: MatchStatus = "unmatched";
  if (channel.status === "conflict") status = "rule_conflict";
  if (channel.status === "data_error") status = "data_error";
  const source: MatchSource = "none";

  return {
    transactionId: transaction.id,
    status,
    source,
    subject: null,
    matchedRuleId: channel.matchedRuleId,
    ruleVersion,
    matchedField: channel.matchedField,
    matchedKeyword: channel.matchedKeyword,
    matchedRawValue: channel.matchedRawValue,
    updatedAt,
    locked: false,
    explanation: channel.explanation,
  };
}

export function rematchTransaction(input: {
  transaction: Transaction;
  manual: ManualMark | null;
  feishu: FeishuApprovalResult | null;
  channel: ChannelRuleResult;
  ruleVersion: string | null;
  updatedAt: string;
}): FinalMatchResult {
  if (input.manual?.locked) {
    return decideFinalResult(input);
  }
  return decideFinalResult({
    ...input,
    manual: input.manual ? { ...input.manual, locked: false } : null,
  });
}
