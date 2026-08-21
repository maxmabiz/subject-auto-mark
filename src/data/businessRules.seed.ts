import { CURRENT_USER } from "@/domain/constants";
import { buildBusinessRuleLog } from "@/domain/business/log";
import type { BusinessRule, BusinessRuleLog } from "@/domain/types";

const INIT = "2026-08-01T02:00:00.000Z";

function rule(id: string, claimBusiness: string, level1: string, level2: string, level3 = ""): BusinessRule {
  return {
    id,
    claimBusiness,
    subject: { level1, level2, level3: level3 || null },
    createdAt: INIT,
    updatedAt: INIT,
  };
}

export const FALLBACK_BUSINESS_RULES: BusinessRule[] = [
  rule("BR001", "履约", "履约业务", "收款"),
  rule("BR002", "广告", "广告业务", "收款"),
];

export const FALLBACK_BUSINESS_RULE_LOGS: BusinessRuleLog[] = FALLBACK_BUSINESS_RULES.flatMap((item) => {
  const create = buildBusinessRuleLog({
    id: `brlog-${item.id}-create`,
    ruleId: item.id,
    time: item.createdAt,
    actor: "系统",
    action: "create",
    after: item,
  });
  if (item.id !== "BR002") return [create];
  const before = { ...item, subject: { level1: "广告业务", level2: "付款", level3: null } };
  item.updatedAt = "2026-08-12T14:20:00.000Z";
  return [
    buildBusinessRuleLog({
      id: "brlog-BR002-update",
      ruleId: item.id,
      time: item.updatedAt,
      actor: CURRENT_USER,
      action: "update",
      before,
      after: item,
    }),
    create,
  ];
});
