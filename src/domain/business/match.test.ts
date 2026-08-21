import { describe, expect, it } from "vitest";
import { businessMatchKey, resolveBusinessMatch } from "./match";
import { diffBusinessRule } from "./log";
import type { BusinessRule, Transaction } from "../types";

const rule: BusinessRule = {
  id: "BR001",
  claimBusiness: "履约",
  subject: { level1: "履约业务", level2: "收款", level3: null },
  createdAt: "2026-08-01T02:00:00.000Z",
  updatedAt: "2026-08-01T02:00:00.000Z",
};

describe("business rule key", () => {
  it("认领业务去空格后作为唯一键", () => {
    expect(businessMatchKey(" 履约 ")).toBe(businessMatchKey("履约"));
  });
});

describe("resolve business match", () => {
  it("按认领业务命中科目", () => {
    const hit = resolveBusinessMatch({ claimBusiness: "履约" } as Transaction, [rule]);
    expect(hit.hit).toBe(true);
    expect(hit.subject).toEqual(rule.subject);
    expect(hit.rule?.id).toBe("BR001");
  });

  it("无认领业务或未配置时不命中", () => {
    expect(resolveBusinessMatch({ claimBusiness: "" } as Transaction, [rule]).hit).toBe(false);
    expect(resolveBusinessMatch({ claimBusiness: "广告" } as Transaction, [rule]).hit).toBe(false);
  });
});

describe("business rule log", () => {
  it("科目按一行记录", () => {
    expect(diffBusinessRule(rule, { ...rule, subject: { level1: "履约业务", level2: "付款", level3: null } })).toEqual([
      { field: "科目", from: "履约业务 / 收款", to: "履约业务 / 付款" },
    ]);
  });
});
