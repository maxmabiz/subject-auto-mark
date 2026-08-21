import type {
  ApprovalRule,
  AuditLog,
  BusinessRule,
  ChannelRuleResult,
  EnrichedTransaction,
  FeishuApprovalResult,
  FinalMatchResult,
  ManualMark,
  Rule,
  Transaction,
} from "@/domain/types";
import { decideFinalResult, matchChannelRules } from "@/domain/matching";

export function computeChannel(transaction: Transaction, rules: Rule[]): ChannelRuleResult {
  return matchChannelRules(transaction, rules);
}

export function computeFinal(input: {
  transaction: Transaction;
  manual: ManualMark | null;
  feishu: FeishuApprovalResult | null;
  approvalRules: ApprovalRule[];
  businessRules: BusinessRule[];
  channel: ChannelRuleResult;
  ruleVersion: string | null;
  updatedAt?: string;
}): FinalMatchResult {
  return decideFinalResult({
    ...input,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
  });
}

export function enrichOne(
  transaction: Transaction,
  manual: ManualMark | null,
  feishu: FeishuApprovalResult | null,
  rules: Rule[],
  approvalRules: ApprovalRule[],
  businessRules: BusinessRule[],
  ruleVersion: string,
  existing?: { channel?: ChannelRuleResult; final?: FinalMatchResult },
  recompute = true,
): EnrichedTransaction {
  const channel = recompute || !existing?.channel ? computeChannel(transaction, rules) : existing.channel;
  const final =
    recompute || !existing?.final
      ? computeFinal({
          transaction,
          manual,
          feishu,
          approvalRules,
          businessRules,
          channel,
          ruleVersion,
        })
      : existing.final;
  return { transaction, manual, feishu, channel, final };
}

export function appendLog(
  logs: AuditLog[],
  entry: Omit<AuditLog, "id"> & { id?: string },
): AuditLog[] {
  return [
    {
      id: entry.id ?? `log-${logs.length + 1}-${Date.now()}`,
      ...entry,
    },
    ...logs,
  ];
}

export function isApprovalRuleInUse(records: EnrichedTransaction[], ruleId: string): boolean {
  return records.some((item) => item.final.source === "feishu" && item.final.matchedRuleId === ruleId);
}

export function isBusinessRuleInUse(records: EnrichedTransaction[], ruleId: string): boolean {
  return records.some((item) => item.final.source === "business" && item.final.matchedRuleId === ruleId);
}
