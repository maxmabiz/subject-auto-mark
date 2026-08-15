import type { FeishuApprovalResult, Transaction } from "../types";

export function matchFeishuByTransactionNo(
  transaction: Transaction,
  feishu: FeishuApprovalResult | null,
): FeishuApprovalResult | null {
  if (!feishu) return null;
  return feishu.transactionNo === transaction.transactionNo ? feishu : null;
}
