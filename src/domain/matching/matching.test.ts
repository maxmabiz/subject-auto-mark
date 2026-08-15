import { describe, expect, it } from "vitest";
import type { FeishuApprovalResult, ManualMark, Rule, Transaction } from "../types";
import { decideFinalResult } from "./decide";
import { matchChannelRules } from "./channel";
import { normalizeText } from "./normalize";

function tx(partial: Partial<Transaction> & Pick<Transaction, "id">): Transaction {
  return {
    transactionNo: partial.transactionNo ?? `NO-${partial.id}`,
    platform: "Payoneer",
    account: "Payoneer-HQY",
    transactionTime: "2026-08-01T10:00:00.000Z",
    amount: 100,
    currency: "USD",
    direction: "in",
    transactionDescription: "",
    note: "",
    businessType: "",
    codeType: "",
    payeeName: "",
    paymentGateway: "",
    transactionType: "",
    feishuApprovalId: "",
    ...partial,
  };
}

function rule(partial: Partial<Rule> & Pick<Rule, "id" | "keyword" | "searchField" | "subject">): Rule {
  return {
    excelRow: 2,
    platform: "Payoneer",
    account: "所有账户",
    matchMode: partial.searchField === "交易描述" || partial.searchField === "备注" ? "contains" : "exact",
    explicitPriority: 1,
    validationStatus: "valid",
    errors: [],
    warnings: [],
    version: "V1.0.0",
    ...partial,
  };
}

const transferSubject = { level1: "资金转账", level2: "资金转账-货币兑换", level3: null };
const ecommerceSubject = { level1: "电商业务", level2: "电商业务-收款", level3: null };
const interestSubject = { level1: "公司收入", level2: "公司收入-利息收入", level3: null };
const restrictedSubject = { level1: "受限资金", level2: "受限资金", level3: null };

describe("matching engine", () => {
  it("忽略英文大小写", () => {
    const result = matchChannelRules(
      tx({ id: "1", transactionDescription: "TRANSFER BETWEEN BALANCES" }),
      [
        rule({
          id: "R002",
          searchField: "交易描述",
          keyword: "Transfer between balances",
          subject: transferSubject,
        }),
      ],
    );
    expect(result.status).toBe("matched");
    expect(result.subject).toEqual(transferSubject);
  });

  it("去除首尾空格并合并连续空格", () => {
    expect(normalizeText("  Transfer   between    balances  ")).toBe("transfer between balances");
    const result = matchChannelRules(
      tx({ id: "2", transactionDescription: "  Transfer   between    balances  " }),
      [
        rule({
          id: "R002",
          searchField: "交易描述",
          keyword: "Transfer between balances",
          subject: transferSubject,
        }),
      ],
    );
    expect(result.status).toBe("matched");
  });

  it("交易描述使用包含匹配", () => {
    const result = matchChannelRules(
      tx({ id: "3", transactionDescription: "shopify payout from store" }),
      [
        rule({
          id: "R003",
          searchField: "交易描述",
          keyword: "shopify",
          subject: ecommerceSubject,
        }),
      ],
    );
    expect(result.status).toBe("matched");
    expect(result.matchedKeyword).toBe("shopify");
  });

  it("code 类型使用完全匹配", () => {
    const freeze = rule({
      id: "R023",
      platform: "Paypal",
      account: "PAYPAL-HQY-44414@qq.com",
      searchField: "code 类型",
      keyword: "准备金冻结",
      subject: restrictedSubject,
    });
    const miss = matchChannelRules(
      tx({
        id: "4",
        platform: "Paypal",
        account: "PAYPAL-HQY-44414@qq.com",
        codeType: "准备金冻结-额外说明",
      }),
      [freeze],
    );
    const hit = matchChannelRules(
      tx({
        id: "5",
        platform: "Paypal",
        account: "PAYPAL-HQY-44414@qq.com",
        codeType: "准备金冻结",
      }),
      [freeze],
    );
    expect(miss.status).toBe("unmatched");
    expect(hit.status).toBe("matched");
    expect(hit.subject).toEqual(restrictedSubject);
  });

  it("具体账号优先于所有账户", () => {
    const result = matchChannelRules(
      tx({
        id: "6",
        platform: "Worldfirst",
        account: "Worldfirst-muxue",
        transactionDescription: "Fund collection from shopify",
      }),
      [
        rule({
          id: "R-ALL",
          platform: "Worldfirst",
          account: "所有账户",
          searchField: "交易描述",
          keyword: "Fund collection",
          subject: { level1: "资金转账", level2: "资金转账-付款", level3: null },
        }),
        rule({
          id: "R059",
          platform: "Worldfirst",
          account: "Worldfirst-muxue",
          searchField: "交易描述",
          keyword: "Fund collection",
          subject: { level1: "资金转账", level2: "资金转账-收款", level3: null },
        }),
      ],
    );
    expect(result.status).toBe("matched");
    expect(result.matchedRuleId).toBe("R059");
    expect(result.subject?.level2).toBe("资金转账-收款");
  });

  it("长关键词优先于短关键词", () => {
    const result = matchChannelRules(
      tx({
        id: "7",
        platform: "PingPong",
        account: "PingPong-BESTTECH-B2C",
        businessType: "实时换汇转账-入账",
      }),
      [
        rule({
          id: "R047",
          platform: "PingPong",
          account: "PingPong-BESTTECH-B2C",
          searchField: "业务类型",
          keyword: "入账",
          subject: ecommerceSubject,
        }),
        rule({
          id: "R050",
          platform: "PingPong",
          account: "PingPong-BESTTECH-B2C",
          searchField: "业务类型",
          keyword: "实时换汇转账-入账",
          subject: transferSubject,
        }),
      ],
    );
    expect(result.status).toBe("matched");
    expect(result.matchedRuleId).toBe("R050");
    expect(result.subject).toEqual(transferSubject);
  });

  it("同优先级不同科目返回冲突", () => {
    const result = matchChannelRules(
      tx({
        id: "8",
        transactionDescription: "Transfer between balances Payment from BESTADS LIMITED",
      }),
      [
        rule({
          id: "R002",
          excelRow: 2,
          searchField: "交易描述",
          keyword: "Transfer between balances",
          subject: transferSubject,
        }),
        rule({
          id: "R013",
          excelRow: 13,
          searchField: "交易描述",
          keyword: "Payment from BESTADS LIMITED",
          subject: { level1: "资金转账", level2: "资金转账-收款", level3: null },
        }),
      ],
    );
    expect(result.status).toBe("conflict");
    expect(result.subject).toBeNull();
    expect(result.candidates.length).toBeGreaterThanOrEqual(2);
  });

  it("人工结果优先于飞书和渠道规则", () => {
    const channel = matchChannelRules(tx({ id: "9", transactionDescription: "shopify" }), [
      rule({ id: "R003", searchField: "交易描述", keyword: "shopify", subject: ecommerceSubject }),
    ]);
    const feishu: FeishuApprovalResult = {
      approvalId: "FS-1",
      approvalType: "广告投放",
      transactionNo: "NO-9",
      subject: { level1: "广告业务", level2: "广告业务-付款", level3: null },
      matchedAt: "2026-08-02T10:00:00.000Z",
    };
    const manual: ManualMark = {
      subject: { level1: "公司费用", level2: "公司费用-信息化费用", level3: null },
      reason: "财务确认",
      locked: true,
      operator: "财务管理员",
      markedAt: "2026-08-03T10:00:00.000Z",
    };
    const final = decideFinalResult({
      transaction: tx({ id: "9" }),
      manual,
      feishu,
      channel,
      ruleVersion: "V1.0.0",
      updatedAt: "2026-08-03T10:00:00.000Z",
    });
    expect(final.source).toBe("manual");
    expect(final.locked).toBe(true);
    expect(final.subject?.level1).toBe("公司费用");
  });

  it("飞书结果优先于渠道规则", () => {
    const channel = matchChannelRules(tx({ id: "10", transactionDescription: "shopify" }), [
      rule({ id: "R003", searchField: "交易描述", keyword: "shopify", subject: ecommerceSubject }),
    ]);
    const feishu: FeishuApprovalResult = {
      approvalId: "FS-2",
      approvalType: "软件及信息服务费",
      transactionNo: "NO-10",
      subject: { level1: "公司费用", level2: "公司费用-信息化费用", level3: null },
      matchedAt: "2026-08-02T10:00:00.000Z",
    };
    const final = decideFinalResult({
      transaction: tx({ id: "10" }),
      manual: null,
      feishu,
      channel,
      ruleVersion: "V1.0.0",
      updatedAt: "2026-08-02T10:00:00.000Z",
    });
    expect(final.source).toBe("feishu");
    expect(final.subject?.level2).toBe("公司费用-信息化费用");
    expect(final.matchedField).toBe("流水号");
    expect(final.matchedRawValue).toBe("NO-10");
    expect(channel.status).toBe("matched");
  });

  it("飞书按流水号关联，流水号不一致则不采用", () => {
    const transaction = tx({ id: "10b", transactionNo: "NO-10B", transactionDescription: "shopify" });
    const channel = matchChannelRules(transaction, [
      rule({ id: "R003", searchField: "交易描述", keyword: "shopify", subject: ecommerceSubject }),
    ]);
    const final = decideFinalResult({
      transaction,
      manual: null,
      feishu: {
        approvalId: "FS-X",
        approvalType: "软件及信息服务费",
        transactionNo: "OTHER-NO",
        subject: { level1: "公司费用", level2: "公司费用-信息化费用", level3: null },
        matchedAt: "2026-08-02T10:00:00.000Z",
      },
      channel,
      ruleVersion: "V1.0.0",
      updatedAt: "2026-08-02T10:00:00.000Z",
    });
    expect(final.source).toBe("channel");
  });

  it("人工锁定结果不会被重新匹配覆盖", () => {
    const before = decideFinalResult({
      transaction: tx({ id: "11", transactionDescription: "shopify" }),
      manual: {
        subject: interestSubject,
        reason: "锁定",
        locked: true,
        operator: "财务管理员",
        markedAt: "2026-08-01T12:00:00.000Z",
      },
      feishu: null,
      channel: matchChannelRules(tx({ id: "11", transactionDescription: "shopify" }), [
        rule({ id: "R003", searchField: "交易描述", keyword: "shopify", subject: ecommerceSubject }),
      ]),
      ruleVersion: "V1.0.0",
      updatedAt: "2026-08-04T10:00:00.000Z",
    });
    expect(before.source).toBe("manual");
    expect(before.subject).toEqual(interestSubject);
  });

  it("解除人工锁定后正确回退", () => {
    const transaction = tx({ id: "12", transactionDescription: "CREDIT INTEREST", platform: "HSBC", account: "HSBC-HK" });
    const channel = matchChannelRules(transaction, [
      rule({
        id: "R021",
        platform: "HSBC",
        searchField: "交易描述",
        keyword: "CREDIT INTEREST",
        subject: interestSubject,
      }),
    ]);
    const feishu: FeishuApprovalResult = {
      approvalId: "FS-3",
      approvalType: "采购付款",
      transactionNo: transaction.transactionNo,
      subject: { level1: "履约业务", level2: "履约业务-采购付款", level3: null },
      matchedAt: "2026-08-02T10:00:00.000Z",
    };
    const unlocked = decideFinalResult({
      transaction,
      manual: {
        subject: ecommerceSubject,
        reason: "临时",
        locked: false,
        operator: "财务管理员",
        markedAt: "2026-08-03T10:00:00.000Z",
      },
      feishu,
      channel,
      ruleVersion: "V1.0.0",
      updatedAt: "2026-08-04T10:00:00.000Z",
    });
    expect(unlocked.source).toBe("feishu");

    const noFeishu = decideFinalResult({
      transaction,
      manual: {
        subject: ecommerceSubject,
        reason: "临时",
        locked: false,
        operator: "财务管理员",
        markedAt: "2026-08-03T10:00:00.000Z",
      },
      feishu: null,
      channel,
      ruleVersion: "V1.0.0",
      updatedAt: "2026-08-04T10:00:00.000Z",
    });
    expect(noFeishu.source).toBe("channel");
    expect(noFeishu.subject).toEqual(interestSubject);
  });

  it("23位数字关键词完整保留并可以匹配", () => {
    const keyword = "12150020237721230477174";
    expect(keyword).toHaveLength(23);
    const result = matchChannelRules(
      tx({
        id: "13",
        platform: "PingPong",
        account: "PingPong-BESTTECH-B2C",
        note: "ref 12150020237721230477174 settlement",
      }),
      [
        rule({
          id: "R042",
          platform: "PingPong",
          account: "PingPong-BESTTECH-B2C",
          searchField: "备注",
          keyword,
          subject: { level1: "垫资业务", level2: "垫资业务-收款", level3: null },
        }),
      ],
    );
    expect(result.status).toBe("matched");
    expect(result.matchedKeyword).toBe(keyword);
    expect(result.matchedKeyword).toHaveLength(23);
  });
});
