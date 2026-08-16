import { describe, expect, it } from "vitest";
import { FALLBACK_APPROVAL_RULES } from "@/data/approvalRules.seed";
import { buildApprovalRuleLog, diffApprovalRule } from "./log";

const rule = FALLBACK_APPROVAL_RULES.find((item) => item.id === "AR004")!;

describe("approval rule log", () => {
  it("编辑只记录发生变化的字段", () => {
    const before = { ...rule, approvalName: "广告付款申请（旧）" };
    const changes = diffApprovalRule(before, rule);
    expect(changes).toEqual([
      { field: "审批单名称", from: "广告付款申请（旧）", to: "广告付款申请" },
    ]);
  });

  it("删除日志包含当时已匹配条数", () => {
    const log = buildApprovalRuleLog({
      ruleId: rule.id,
      actor: "财务管理员",
      action: "delete",
      before: rule,
    });
    expect(log.summary).toContain("已匹配 18 条");
    expect(log.changes.some((item) => item.field === "付款申请类型" && item.from === "充值")).toBe(true);
  });

  it("科目按一行记录，不拆一二三级", () => {
    const before = { ...rule, subject: { level1: "广告业务", level2: "", level3: "广告业务-付款-其他费用" } };
    expect(diffApprovalRule(before, rule)).toEqual([
      { field: "科目", from: "广告业务 / 广告业务-付款-其他费用", to: "广告业务 / 广告业务-付款-付代理商" },
    ]);
  });

  it("字段无变化时不产生 changes", () => {
    expect(diffApprovalRule(rule, { ...rule })).toEqual([]);
  });
});
