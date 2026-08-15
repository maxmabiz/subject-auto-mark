import type { AuditLog, FeishuApprovalResult, ManualMark, Transaction } from "@/domain/types";
import { FEISHU_APPROVAL_TYPES } from "@/domain/constants";

type SeedRecord = {
  transaction: Transaction;
  manual: ManualMark | null;
  feishu: Omit<FeishuApprovalResult, "transactionNo"> | null;
  logs: Omit<AuditLog, "id">[];
};

function at(day: number, hour: number, minute = 0): string {
  const date = new Date(Date.UTC(2026, 7, day, hour - 8, minute, 0));
  return date.toISOString();
}

function base(partial: Partial<Transaction> & Pick<Transaction, "id" | "transactionNo" | "platform" | "account">): Transaction {
  const filled: Transaction = {
    transactionTime: at(10, 10),
    amount: 1280,
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
    entityName: "",
    transactionId: "",
    billNo: "",
    channelStatus: "",
    accountingType: "",
    ...partial,
  };
  return {
    ...filled,
    entityName: filled.entityName || inferEntityName(filled.account, filled.platform),
    transactionId: filled.transactionId || filled.transactionNo,
    billNo: filled.billNo,
    channelStatus: filled.channelStatus || inferChannelStatus(filled),
    accountingType: filled.accountingType || "交易",
  };
}

function inferEntityName(account: string, platform: string): string {
  const text = `${account} ${platform}`.toLowerCase();
  if (text.includes("muxue")) return "Muxue";
  if (text.includes("besttech") || text.includes("bst")) return "Besttech";
  if (text.includes("luzhennan")) return "Luzhennan";
  if (text.includes("bywise")) return "Bywise";
  if (text.includes("hqy") || text.includes("fleck") || text.includes("nksea") || text.includes("44414")) return "HQY";
  return platform ? "HQY" : "";
}

function inferChannelStatus(tx: Transaction): string {
  if (tx.codeType) return tx.codeType;
  if (tx.businessType) return tx.businessType;
  if (tx.transactionType) return tx.transactionType;
  const platform = tx.platform.toLowerCase();
  if (platform.includes("airwallex") && tx.direction === "in") return "DC_CREDIT";
  if (tx.direction === "in") return "DEPOSIT";
  return "TRANSFER";
}

const software = FEISHU_APPROVAL_TYPES[0];
const salary = FEISHU_APPROVAL_TYPES[1];
const purchase = FEISHU_APPROVAL_TYPES[2];
const ads = FEISHU_APPROVAL_TYPES[3];

export function createSeedRecords(): {
  transaction: Transaction;
  manual: ManualMark | null;
  feishu: FeishuApprovalResult | null;
  logs: Omit<AuditLog, "id">[];
}[] {
  const records: SeedRecord[] = [
    {
      transaction: base({
        id: "tx-001",
        transactionNo: "PO-20260810-001",
        platform: "Payoneer",
        account: "Payoneer-HQY",
        transactionTime: at(10, 9, 12),
        amount: 3200.5,
        transactionDescription: "Transfer between balances - USD to EUR",
      }),
      manual: null,
      feishu: null,
      logs: [
        { transactionId: "tx-001", time: at(10, 9, 20), actor: "系统", action: "流水进入系统", fromSubject: null, toSubject: null, fromSource: null, toSource: "none", reason: "渠道流水同步" },
        { transactionId: "tx-001", time: at(10, 9, 21), actor: "系统", action: "渠道规则自动命中", fromSubject: null, toSubject: { level1: "资金转账", level2: "资金转账-货币兑换", level3: null }, fromSource: "none", toSource: "channel", reason: "命中 Transfer between balances" },
      ],
    },
    {
      transaction: base({
        id: "tx-002",
        transactionNo: "PO-20260811-002",
        platform: "Payoneer",
        account: "Payoneer-HQY",
        transactionTime: at(11, 11, 8),
        amount: 18660,
        transactionDescription: "shopify payout weekly settlement",
      }),
      manual: null,
      feishu: null,
      logs: [],
    },
    {
      transaction: base({
        id: "tx-003",
        transactionNo: "HSBC-20260812-003",
        platform: "HSBC",
        account: "HSBC-HK-001",
        transactionTime: at(12, 8, 1),
        currency: "HKD",
        amount: 452.18,
        transactionDescription: "CREDIT INTEREST AUG 2026",
      }),
      manual: null,
      feishu: null,
      logs: [],
    },
    {
      transaction: base({
        id: "tx-004",
        transactionNo: "PP-20260809-004",
        platform: "Paypal",
        account: "PAYPAL-HQY-44414@qq.com",
        transactionTime: at(9, 16, 40),
        amount: 5000,
        direction: "out",
        transactionDescription: "Reserve hold",
        codeType: "准备金冻结",
      }),
      manual: null,
      feishu: null,
      logs: [],
    },
    {
      transaction: base({
        id: "tx-005",
        transactionNo: "PG-20260813-005",
        platform: "PingPong",
        account: "PingPong-BESTTECH-B2C",
        transactionTime: at(13, 14, 22),
        amount: 9800,
        businessType: "实时换汇转账-入账",
        transactionDescription: "FX transfer in",
      }),
      manual: null,
      feishu: null,
      logs: [],
    },
    {
      transaction: base({
        id: "tx-006",
        transactionNo: "WF-20260808-006",
        platform: "Worldfirst",
        account: "Worldfirst-muxue",
        transactionTime: at(8, 10, 5),
        amount: 22100,
        transactionDescription: "Fund collection from marketplace",
      }),
      manual: null,
      feishu: null,
      logs: [],
    },
    {
      transaction: base({
        id: "tx-007",
        transactionNo: "WF-20260808-007",
        platform: "Worldfirst",
        account: "Worldfirst-Besttech01",
        transactionTime: at(8, 10, 18),
        amount: 15400,
        direction: "out",
        transactionDescription: "Fund collection to vendor",
      }),
      manual: null,
      feishu: null,
      logs: [],
    },
    {
      transaction: base({
        id: "tx-008",
        transactionNo: "WF-20260814-008",
        platform: "Worldfirst",
        account: "Worldfirst-muxue02",
        transactionTime: at(14, 19, 33),
        amount: 86.4,
        transactionType: "CARD_REFUND",
        transactionDescription: "Card refund",
      }),
      manual: null,
      feishu: null,
      logs: [],
    },
    {
      transaction: base({
        id: "tx-009",
        transactionNo: "PO-20260807-009",
        platform: "Payoneer",
        account: "Payoneer-HQY",
        transactionTime: at(7, 15, 12),
        amount: 2600,
        direction: "out",
        transactionDescription: "shopify card charge monthly",
        feishuApprovalId: "FS-SOFT-009",
      }),
      manual: {
        subject: { level1: "公司费用", level2: "公司费用-信息化费用", level3: null },
        reason: "财务核对后确认为软件订阅，锁定人工结果",
        locked: true,
        operator: "财务管理员",
        markedAt: at(8, 9, 40),
      },
      feishu: {
        approvalId: "FS-SOFT-009",
        approvalType: software.approvalType,
        subject: software.subject,
        matchedAt: at(7, 18, 0),
      },
      logs: [
        { transactionId: "tx-009", time: at(7, 15, 20), actor: "系统", action: "流水进入系统", fromSubject: null, toSubject: null, fromSource: null, toSource: "none", reason: "渠道流水同步" },
        { transactionId: "tx-009", time: at(7, 15, 21), actor: "系统", action: "渠道规则自动命中", fromSubject: null, toSubject: { level1: "电商业务", level2: "电商业务-收款", level3: null }, fromSource: "none", toSource: "channel", reason: "命中 shopify" },
        { transactionId: "tx-009", time: at(7, 18, 0), actor: "系统", action: "后续关联飞书审批并覆盖", fromSubject: { level1: "电商业务", level2: "电商业务-收款", level3: null }, toSubject: software.subject, fromSource: "channel", toSource: "feishu", reason: "按流水号 PO-20260807-009 关联审批单 FS-SOFT-009" },
        { transactionId: "tx-009", time: at(8, 9, 40), actor: "财务管理员", action: "财务人工修改并锁定", fromSubject: software.subject, toSubject: { level1: "公司费用", level2: "公司费用-信息化费用", level3: null }, fromSource: "feishu", toSource: "manual", reason: "财务核对后确认为软件订阅，锁定人工结果" },
      ],
    },
    {
      transaction: base({
        id: "tx-010",
        transactionNo: "PO-20260809-010",
        platform: "Payoneer",
        account: "Payoneer-HQY",
        transactionTime: at(9, 13, 44),
        amount: 8800,
        direction: "out",
        transactionDescription: "Payment to BESTTECH LIMITED invoice 8821",
        feishuApprovalId: "FS-PUR-010",
      }),
      manual: null,
      feishu: {
        approvalId: "FS-PUR-010",
        approvalType: purchase.approvalType,
        subject: purchase.subject,
        matchedAt: at(9, 16, 10),
      },
      logs: [
        { transactionId: "tx-010", time: at(9, 13, 50), actor: "系统", action: "流水进入系统", fromSubject: null, toSubject: null, fromSource: null, toSource: "none", reason: "渠道流水同步" },
        { transactionId: "tx-010", time: at(9, 13, 51), actor: "系统", action: "渠道规则自动命中", fromSubject: null, toSubject: { level1: "资金转账", level2: "资金转账-付款", level3: null }, fromSource: "none", toSource: "channel", reason: "命中 Payment to BESTTECH LIMITED" },
        { transactionId: "tx-010", time: at(9, 16, 10), actor: "系统", action: "后续关联飞书审批并覆盖", fromSubject: { level1: "资金转账", level2: "资金转账-付款", level3: null }, toSubject: purchase.subject, fromSource: "channel", toSource: "feishu", reason: "按流水号 PO-20260809-010 关联审批单 FS-PUR-010" },
      ],
    },
    {
      transaction: base({
        id: "tx-011",
        transactionNo: "PO-20260812-011",
        platform: "Payoneer",
        account: "Payoneer-HQY",
        transactionTime: at(12, 17, 5),
        amount: 430,
        transactionDescription: "monthly platform adjustment",
      }),
      manual: null,
      feishu: null,
      logs: [],
    },
    {
      transaction: base({
        id: "tx-012",
        transactionNo: "PO-20260813-012",
        platform: "Payoneer",
        account: "Payoneer-HQY",
        transactionTime: at(13, 11, 26),
        amount: 9100,
        transactionDescription: "Transfer between balances Payment from BESTADS LIMITED",
      }),
      manual: null,
      feishu: null,
      logs: [],
    },
    {
      transaction: base({
        id: "tx-013",
        transactionNo: "PP-20260811-013",
        platform: "Paypal",
        account: "PAYPAL-HQY-nksea@163.com",
        transactionTime: at(11, 9, 9),
        amount: 0,
        transactionDescription: "missing code",
      }),
      manual: null,
      feishu: null,
      logs: [],
    },
    {
      transaction: base({
        id: "tx-014",
        transactionNo: "UNK-20260810-014",
        platform: "",
        account: "UNKNOWN",
        transactionTime: at(10, 12, 0),
        amount: 300,
        transactionDescription: "unknown platform inflow",
      }),
      manual: null,
      feishu: null,
      logs: [],
    },
    {
      transaction: base({
        id: "tx-015",
        transactionNo: "WF-20260806-015",
        platform: "Worldfirst",
        account: "Worldfirst-muxue",
        transactionTime: at(6, 10, 40),
        amount: 12600,
        direction: "out",
        transactionDescription: "Vendor settlement",
        note: "D26 payroll batch",
        feishuApprovalId: "FS-PAY-015",
      }),
      manual: {
        subject: salary.subject,
        reason: "工资批次已人工核对",
        locked: true,
        operator: "财务管理员",
        markedAt: at(7, 11, 0),
      },
      feishu: {
        approvalId: "FS-PAY-015",
        approvalType: salary.approvalType,
        subject: salary.subject,
        matchedAt: at(6, 14, 0),
      },
      logs: [
        { transactionId: "tx-015", time: at(6, 10, 45), actor: "系统", action: "流水进入系统", fromSubject: null, toSubject: null, fromSource: null, toSource: "none", reason: "渠道流水同步" },
        { transactionId: "tx-015", time: at(6, 10, 46), actor: "系统", action: "渠道规则自动命中", fromSubject: null, toSubject: salary.subject, fromSource: "none", toSource: "channel", reason: "命中备注 D26" },
        { transactionId: "tx-015", time: at(6, 14, 0), actor: "系统", action: "后续关联飞书审批并覆盖", fromSubject: salary.subject, toSubject: salary.subject, fromSource: "channel", toSource: "feishu", reason: "按流水号 WF-20260806-015 关联审批单 FS-PAY-015" },
        { transactionId: "tx-015", time: at(7, 11, 0), actor: "财务管理员", action: "财务人工修改并锁定", fromSubject: salary.subject, toSubject: salary.subject, fromSource: "feishu", toSource: "manual", reason: "工资批次已人工核对" },
      ],
    },
  ];

  const extras: SeedRecord[] = [
    ["tx-016", "PO-20260809-016", "Payoneer", "Payoneer-HQY", "Payment to HUACHAO TRADING LIMITED", 4200, "out", at(9, 10)],
    ["tx-017", "PO-20260810-017", "Payoneer", "Payoneer-HQY", "Payment to Muxue office", 1800, "out", at(10, 11)],
    ["tx-018", "PO-20260810-018", "Payoneer", "Payoneer-HQY", "Payment to MUXUE TRADE LIMITED", 7600, "out", at(10, 15)],
    ["tx-019", "PO-20260811-019", "Payoneer", "Payoneer-HQY", "Payment from zhennan lu", 5400, "in", at(11, 8)],
    ["tx-020", "PO-20260811-020", "Payoneer", "Payoneer-HQY", "Payment from Guangzhou HaoQianYi Trading Co   LTD", 9900, "in", at(11, 12)],
    ["tx-021", "PO-20260812-021", "Payoneer", "Payoneer-HQY", "Payment from HUACHAO TRADING LIMITED", 3100, "in", at(12, 9)],
    ["tx-022", "PO-20260812-022", "Payoneer", "Payoneer-HQY", "Payment from MUXUE TRADE LIMITED", 2700, "in", at(12, 13)],
    ["tx-023", "PO-20260813-023", "Payoneer", "Payoneer-HQY", "Payment from BESTTECH  LIMITED", 6400, "in", at(13, 16)],
    ["tx-024", "PO-20260814-024", "Payoneer", "Payoneer-HQY", "Debit from Payoneer service fee", 18.5, "out", at(14, 7)],
    ["tx-025", "PO-20260814-025", "Payoneer", "Payoneer-HQY", "card charge visa 8821", 12.9, "out", at(14, 8)],
    ["tx-026", "PO-20260815-026", "Payoneer", "Payoneer-HQY", "TIANJIAO GONG personal transfer", 2000, "out", at(15, 9)],
    ["tx-027", "PO-20260815-027", "Payoneer", "Payoneer-HQY", "RUI CHEN reimbursement", 860, "out", at(15, 10)],
    ["tx-028", "AW-20260809-028", "Airwallex", "Airwallex-HQY", "Aggregated from store collection", 13200, "in", at(9, 11)],
    ["tx-029", "AW-20260813-029", "Airwallex", "Airwallex-HQY", "Aggregated from PayPal topup", 880, "in", at(13, 18)],
    ["tx-030", "AW-20260814-030", "Airwallex", "Airwallex-HQY", "FX conversion internal", 5000, "out", at(14, 12)],
    ["tx-031", "DS-20260810-031", "DAHSING", "DAHSING-HK", "INTEREST DEPOSIT 2026-08", 226.4, "in", at(10, 6)],
    ["tx-032", "DS-20260814-032", "DAHSING", "DAHSING-HK", "LOCAL CHARGES", 40, "out", at(14, 6)],
    ["tx-033", "HSBC-20260811-033", "HSBC", "HSBC-HK-001", "ACCOUNT MAINTENANCE FEE", 200, "out", at(11, 7)],
    ["tx-034", "PP-20260808-034", "Paypal", "PAYPAL-HQY-44414@qq.com", "Preapproved payment", 99, "out", at(8, 12)],
    ["tx-035", "PP-20260809-035", "Paypal", "PAYPAL-HQY-44414@qq.com", "Reserve release", 5000, "in", at(9, 12)],
    ["tx-036", "PP-20260810-036", "Paypal", "PAYPAL-HQY-44414@qq.com", "General withdrawal T", 3000, "out", at(10, 18)],
    ["tx-037", "PP-20260811-037", "Paypal", "PAYPAL-HQY-fleck@outlook.com", "Reserve hold fleck", 1200, "out", at(11, 14)],
    ["tx-038", "PP-20260812-038", "Paypal", "PAYPAL-HQY-fleck@outlook.com", "Reserve release fleck", 1200, "in", at(12, 14)],
    ["tx-039", "PP-20260812-039", "Paypal", "PAYPAL-HQY-fleck@outlook.com", "Payment review hold", 760, "out", at(12, 15)],
    ["tx-040", "PP-20260813-040", "Paypal", "PAYPAL-HQY-fleck@outlook.com", "Payment review release", 760, "in", at(13, 15)],
    ["tx-041", "PP-20260808-041", "Paypal", "PAYPAL-HQY-nksea@163.com", "Reserve hold nksea", 2100, "out", at(8, 16)],
    ["tx-042", "PP-20260809-042", "Paypal", "PAYPAL-HQY-nksea@163.com", "User initiated payment", 450, "out", at(9, 16)],
    ["tx-043", "PP-20260810-043", "Paypal", "PAYPAL-HQY-nksea@163.com", "Chargeback fee", 20, "out", at(10, 16)],
    ["tx-044", "PP-20260811-044", "Paypal", "PAYPAL-HQY-nksea@163.com", "Chargeback", 180, "out", at(11, 16)],
    ["tx-045", "PP-20260812-045", "Paypal", "PAYPAL-HQY-nksea@163.com", "Currency conversion", 640, "out", at(12, 16)],
    ["tx-046", "PG-20260809-046", "PingPong", "PingPong-BESTTECH-B2C", "Store settlement", 15400, "in", at(9, 8)],
    ["tx-047", "PG-20260810-047", "PingPong", "PingPong-BESTTECH-B2C", "Store refund clawback", 320, "out", at(10, 8)],
    ["tx-048", "PG-20260811-048", "PingPong", "PingPong-BESTTECH-B2C", "FX transfer out", 8700, "out", at(11, 8)],
    ["tx-049", "PG-20260812-049", "PingPong", "PingPong-BESTTECH-B2C", "Alipay recharge", 5000, "out", at(12, 8)],
    ["tx-050", "PG-20260814-050", "PingPong", "PingPong-BESTTECH-B2C", "Unclassified pingpong", 77, "in", at(14, 8)],
    ["tx-051", "WF-20260809-051", "Worldfirst", "Worldfirst-besttech", "1688 purchase", 2300, "out", at(9, 19)],
    ["tx-052", "WF-20260810-052", "Worldfirst", "Worldfirst-besttech", "WorldFirst payout", 1100, "out", at(10, 19)],
    ["tx-053", "WF-20260811-053", "Worldfirst", "Worldfirst-besttech", "Conversion USD CNY", 8000, "out", at(11, 19)],
    ["tx-054", "WF-20260812-054", "Worldfirst", "Worldfirst-muxuehk01", "1688 restock", 1760, "out", at(12, 19)],
    ["tx-055", "WF-20260813-055", "Worldfirst", "Worldfirst-muxuehk01", "Conversion weekend", 4200, "out", at(13, 19)],
    ["tx-056", "WF-20260809-056", "Worldfirst", "Worldfirst-muxue", "Conversion muxue", 3600, "out", at(9, 20)],
    ["tx-057", "WF-20260810-057", "Worldfirst", "Worldfirst-muxue", "Paypal collection", 9400, "in", at(10, 20)],
    ["tx-058", "WF-20260811-058", "Worldfirst", "Worldfirst-Besttech01", "Transfer-BST01 internal", 2500, "out", at(11, 20)],
    ["tx-059", "WF-20260812-059", "Worldfirst", "Worldfirst-Besttech01", "Transfer-jayden01", 1800, "out", at(12, 20)],
    ["tx-060", "WF-20260813-060", "Worldfirst", "Worldfirst-Besttech01", "Conversion bst01", 6700, "out", at(13, 20)],
    ["tx-061", "WF-20260814-061", "Worldfirst", "Worldfirst-Besttech01", "shopify payment inbound", 11200, "in", at(14, 20)],
    ["tx-062", "WF-20260808-062", "Worldfirst", "Worldfirst-BST", "Collection-Besttech01", 4300, "in", at(8, 21)],
    ["tx-063", "WF-20260809-063", "Worldfirst", "Worldfirst-BYWISE", "Paypal inbound", 2100, "in", at(9, 21)],
    ["tx-064", "WF-20260810-064", "Worldfirst", "Worldfirst-muxue02", "Card spend", 96, "out", at(10, 21)],
    ["tx-065", "WF-20260811-065", "Worldfirst", "Worldfirst-muxue02", "Cash back reward", 12, "in", at(11, 21)],
    ["tx-066", "WF-20260812-066", "Worldfirst", "WorldFirst-LUZHENNAN", "PayPal collection luz", 5600, "in", at(12, 21)],
    ["tx-067", "WF-20260813-067", "Worldfirst", "WorldFirst-LUZHENNAN", "shopify payment luz", 7800, "in", at(13, 21)],
    ["tx-068", "WF-20260814-068", "Worldfirst", "WorldFirst-LUZHENNAN", "Shopline Payment luz", 3900, "in", at(14, 21)],
    ["tx-069", "WF-20260815-069", "Worldfirst", "WorldFirst-LUZHENNAN", "Collection-Besttech01 luz", 2500, "in", at(15, 8)],
    ["tx-070", "PO-20260815-070", "Payoneer", "Payoneer-HQY", "office snack reimbursement", 56, "out", at(15, 11)],
    ["tx-071", "PP-20260815-071", "Paypal", "PAYPAL-HQY-nksea@163.com", "Dispute reversal", 180, "in", at(15, 12)],
    ["tx-072", "WF-20260815-072", "Worldfirst", "Worldfirst-Besttech01", "T26 bonus note", 8800, "out", at(15, 13)],
  ].map(([id, transactionNo, platform, account, desc, amount, direction, time]) => ({
    transaction: base({
      id: String(id),
      transactionNo: String(transactionNo),
      platform: String(platform),
      account: String(account),
      transactionDescription: String(desc),
      amount: Number(amount),
      direction: direction as "in" | "out",
      transactionTime: String(time),
      currency: platform === "HSBC" || platform === "DAHSING" ? "HKD" : "USD",
    }),
    manual: null,
    feishu: null,
    logs: [],
  }));

  const fieldMap: Record<string, Partial<Transaction>> = {
    "tx-034": { codeType: "预先批准付款账单用户付款" },
    "tx-035": { codeType: "准备金放款" },
    "tx-036": { codeType: "T" },
    "tx-037": { codeType: "准备金冻结" },
    "tx-038": { codeType: "准备金放款" },
    "tx-039": { codeType: "付款审查冻结" },
    "tx-040": { codeType: "付款审查放款" },
    "tx-041": { codeType: "准备金冻结" },
    "tx-042": { codeType: "用户发起的收款" },
    "tx-043": { codeType: "争议费" },
    "tx-044": { codeType: "退单" },
    "tx-045": { codeType: "普通币种兑换" },
    "tx-046": { businessType: "入账" },
    "tx-047": { businessType: "入账回退" },
    "tx-048": { businessType: "实时换汇转账-出款" },
    "tx-049": { businessType: "网商银行跨境通充值" },
    "tx-050": { businessType: "其他" },
    "tx-051": { payeeName: "1688.COM" },
    "tx-052": { payeeName: "WorldFirst" },
    "tx-053": { transactionDescription: "Conversion USD CNY" },
    "tx-054": { payeeName: "1688.COM" },
    "tx-055": { transactionDescription: "Conversion weekend" },
    "tx-057": { paymentGateway: "Paypal" },
    "tx-061": { paymentGateway: "shopify payment" },
    "tx-063": { paymentGateway: "Paypal" },
    "tx-064": { transactionType: "CARD_PAYMENT" },
    "tx-065": { transactionType: "CASH_BACK" },
    "tx-066": { paymentGateway: "PayPal" },
    "tx-067": { paymentGateway: "shopify payment" },
    "tx-068": { paymentGateway: "Shopline Payment" },
    "tx-071": { codeType: "费用撤销" },
    "tx-072": { note: "T26", direction: "out" },
  };

  for (const record of extras) {
    const extra = fieldMap[record.transaction.id];
    if (extra) Object.assign(record.transaction, extra);
  }

  extras.push({
    transaction: base({
      id: "tx-073",
      transactionNo: "PO-20260814-073",
      platform: "Payoneer",
      account: "Payoneer-HQY",
      transactionTime: at(14, 15, 8),
      amount: 4300,
      note: "D26XX July payroll",
      transactionDescription: "payroll payout",
      feishuApprovalId: "FS-PAY-073",
    }),
    manual: null,
    feishu: {
      approvalId: "FS-PAY-073",
      approvalType: salary.approvalType,
      subject: salary.subject,
      matchedAt: at(14, 16, 0),
    },
    logs: [],
  });

  extras.push({
    transaction: base({
      id: "tx-074",
      transactionNo: "AW-20260815-074",
      platform: "Airwallex",
      account: "",
      transactionTime: at(15, 9, 40),
      amount: 1900,
      transactionDescription: "Aggregated from missing account",
    }),
    manual: null,
    feishu: null,
    logs: [],
  });

  extras.push({
    transaction: base({
      id: "tx-075",
      transactionNo: "WF-20260815-075",
      platform: "Worldfirst",
      account: "Worldfirst-muxue",
      transactionTime: at(15, 14, 12),
      amount: 2400,
      direction: "out",
      transactionDescription: "ads media buy",
      feishuApprovalId: "FS-ADS-075",
    }),
    manual: null,
    feishu: {
      approvalId: "FS-ADS-075",
      approvalType: ads.approvalType,
      subject: ads.subject,
      matchedAt: at(15, 14, 40),
    },
    logs: [],
  });

  extras.push({
    transaction: base({
      id: "tx-076",
      transactionNo: "PP-20260813-076",
      platform: "Paypal",
      account: "PAYPAL-HQY-nksea@163.com",
      transactionTime: at(13, 9, 30),
      amount: 90,
      codeType: "普通冻结",
      transactionDescription: "General hold",
    }),
    manual: null,
    feishu: null,
    logs: [],
  });

  extras.push({
    transaction: base({
      id: "tx-077",
      transactionNo: "PP-20260814-077",
      platform: "Paypal",
      account: "PAYPAL-HQY-nksea@163.com",
      transactionTime: at(14, 9, 30),
      amount: 90,
      codeType: "普通冻结放款",
      transactionDescription: "General hold release",
    }),
    manual: null,
    feishu: null,
    logs: [],
  });

  extras.push({
    transaction: base({
      id: "tx-078",
      transactionNo: "PP-20260815-078",
      platform: "Paypal",
      account: "PAYPAL-HQY-nksea@163.com",
      transactionTime: at(15, 9, 30),
      amount: 2100,
      codeType: "付款审查冻结",
      transactionDescription: "Payment review freeze",
    }),
    manual: null,
    feishu: null,
    logs: [],
  });

  extras.push({
    transaction: base({
      id: "tx-079",
      transactionNo: "WF-20260814-079",
      platform: "Worldfirst",
      account: "Worldfirst-Besttech01",
      transactionTime: at(14, 11, 11),
      amount: 6400,
      paymentGateway: "Paypal",
      transactionDescription: "Paypal collection bst01",
    }),
    manual: null,
    feishu: null,
    logs: [],
  });

  extras.push({
    transaction: base({
      id: "tx-080",
      transactionNo: "PO-20260815-080",
      platform: "Payoneer",
      account: "Payoneer-HQY",
      transactionTime: at(15, 16, 20),
      amount: 1500,
      transactionDescription: "unlocked demo after manual",
      feishuApprovalId: "FS-SOFT-080",
    }),
    manual: {
      subject: { level1: "个人收支", level2: "个人收支", level3: null },
      reason: "演示解除锁定后回退到飞书",
      locked: false,
      operator: "财务管理员",
      markedAt: at(15, 16, 40),
    },
    feishu: {
      approvalId: "FS-SOFT-080",
      approvalType: software.approvalType,
      subject: software.subject,
      matchedAt: at(15, 16, 30),
    },
    logs: [
      { transactionId: "tx-080", time: at(15, 16, 25), actor: "系统", action: "流水进入系统", fromSubject: null, toSubject: null, fromSource: null, toSource: "none", reason: "渠道流水同步" },
      { transactionId: "tx-080", time: at(15, 16, 40), actor: "财务管理员", action: "财务人工修改并锁定", fromSubject: null, toSubject: { level1: "个人收支", level2: "个人收支", level3: null }, fromSource: "none", toSource: "manual", reason: "演示解除锁定后回退到飞书" },
      { transactionId: "tx-080", time: at(15, 17, 10), actor: "财务管理员", action: "解除人工锁定并回退", fromSubject: { level1: "个人收支", level2: "个人收支", level3: null }, toSubject: software.subject, fromSource: "manual", toSource: "feishu", reason: "解除人工锁定，回退至飞书审批结果" },
    ],
  });

  return [...records, ...extras].map((record) => ({
    ...record,
    transaction: {
      ...record.transaction,
      billNo: record.transaction.billNo || record.transaction.feishuApprovalId,
    },
    feishu: record.feishu
      ? { ...record.feishu, transactionNo: record.transaction.transactionNo }
      : null,
  }));
}
