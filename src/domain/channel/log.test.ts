import { describe, expect, it } from "vitest";
import { buildChannelRule } from "./rule";
import { diffChannelRule, buildChannelRuleLog } from "./log";

const rule = buildChannelRule({
  id: "R003",
  excelRow: 3,
  platform: "Payoneer",
  account: "所有账户",
  searchField: "交易描述",
  keyword: "shopify",
  level1: "电商业务",
  level2: "电商业务-收款",
  level3: "",
  matchedCountT1: 14,
});

describe("channel rule log", () => {
  it("科目按一行记录", () => {
    const before = { ...rule, subject: { level1: "电商业务", level2: "电商业务-其他费用", level3: null } };
    expect(diffChannelRule(before, rule)).toEqual([
      { field: "科目", from: "电商业务 / 电商业务-其他费用", to: "电商业务 / 电商业务-收款" },
    ]);
  });

  it("删除日志包含当时已匹配条数", () => {
    const log = buildChannelRuleLog({
      ruleId: rule.id,
      actor: "财务管理员",
      action: "delete",
      before: rule,
    });
    expect(log.summary).toContain("已匹配 14 条");
  });
});
