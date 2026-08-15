import type { ParsedExcelRow } from "./types";

export const CURRENT_USER = "财务管理员";
export const PRODUCT_NAME = "流水科目自动标记";
export const STORAGE_KEY = "subject-auto-mark-v2";
export const TEMPLATE_PATH = "/templates/科目匹配规则-原始配置.xlsx";

export const PLATFORMS = [
  "Payoneer",
  "PayPal",
  "Worldfirst",
  "PingPong",
  "Airwallex",
  "DAHSING",
  "HSBC",
] as const;

export const PLATFORM_ALIASES: Record<string, string> = {
  paypal: "PayPal",
  payoneer: "Payoneer",
  worldfirst: "Worldfirst",
  pingpong: "PingPong",
  airwallex: "Airwallex",
  dahsing: "DAHSING",
  hsbc: "HSBC",
};

export function displayPlatform(platform: string): string {
  return PLATFORM_ALIASES[platform.trim().toLowerCase()] ?? platform;
}

export const FEISHU_APPROVAL_TYPES = [
  {
    approvalType: "软件及信息服务费",
    subject: { level1: "公司费用", level2: "公司费用-信息化费用", level3: null },
  },
  {
    approvalType: "工资奖金",
    subject: {
      level1: "公司费用",
      level2: "公司费用-职工薪酬",
      level3: "公司费用-职工薪酬-工资奖金",
    },
  },
  {
    approvalType: "采购付款",
    subject: { level1: "履约业务", level2: "履约业务-采购付款", level3: null },
  },
  {
    approvalType: "广告投放",
    subject: { level1: "广告业务", level2: "广告业务-付款", level3: null },
  },
] as const;

export const EXTRA_SUBJECTS = FEISHU_APPROVAL_TYPES.map((item) => item.subject);

export const STATUS_LABEL: Record<string, string> = {
  auto_matched: "自动匹配",
  feishu_matched: "飞书审批",
  manual_marked: "人工标记",
  unmatched: "未匹配",
  rule_conflict: "规则冲突",
  data_error: "数据异常",
};

export const SOURCE_LABEL: Record<string, string> = {
  manual: "人工标记",
  feishu: "飞书审批",
  channel: "渠道规则",
  none: "无结果",
};

export const DIRECTION_LABEL: Record<string, string> = {
  in: "收入",
  out: "支出",
};

export const FALLBACK_EXCEL_ROWS: ParsedExcelRow[] = [
  { excelRow: 2, platform: "Payoneer", account: "所有账户", searchField: "交易描述", keyword: "Transfer between balances", level1: "资金转账", level2: "资金转账-货币兑换", level3: "" },
  { excelRow: 3, platform: "Payoneer", account: "所有账户", searchField: "交易描述", keyword: "shopify", level1: "电商业务", level2: "电商业务-收款", level3: "" },
  { excelRow: 4, platform: "Payoneer", account: "所有账户", searchField: "交易描述", keyword: "TIANJIAO GONG", level1: "个人收支", level2: "个人收支", level3: "" },
  { excelRow: 5, platform: "Payoneer", account: "所有账户", searchField: "交易描述", keyword: "RUI CHEN", level1: "个人收支", level2: "个人收支", level3: "" },
  { excelRow: 6, platform: "Payoneer", account: "所有账户", searchField: "交易描述", keyword: "Payment to BESTTECH LIMITED", level1: "资金转账", level2: "资金转账-付款", level3: "" },
  { excelRow: 7, platform: "Payoneer", account: "所有账户", searchField: "交易描述", keyword: "Payment to HUACHAO TRADING LIMITED", level1: "资金转账", level2: "资金转账-付款", level3: "" },
  { excelRow: 8, platform: "Payoneer", account: "所有账户", searchField: "交易描述", keyword: "Payment to Muxue", level1: "资金转账", level2: "资金转账-付款", level3: "" },
  { excelRow: 9, platform: "Payoneer", account: "所有账户", searchField: "交易描述", keyword: "Payment to MUXUE TRADE LIMITED", level1: "资金转账", level2: "资金转账-付款", level3: "" },
  { excelRow: 10, platform: "Payoneer", account: "所有账户", searchField: "交易描述", keyword: "Payment from zhennan lu", level1: "资金转账", level2: "资金转账-收款", level3: "" },
  { excelRow: 11, platform: "Payoneer", account: "所有账户", searchField: "交易描述", keyword: "Payment from Guangzhou HaoQianYi Trading Co   LTD", level1: "资金转账", level2: "资金转账-收款", level3: "" },
  { excelRow: 12, platform: "Payoneer", account: "所有账户", searchField: "交易描述", keyword: "Payment from HUACHAO TRADING LIMITED", level1: "资金转账", level2: "资金转账-收款", level3: "" },
  { excelRow: 13, platform: "Payoneer", account: "所有账户", searchField: "交易描述", keyword: "Payment from BESTADS LIMITED", level1: "资金转账", level2: "资金转账-收款", level3: "" },
  { excelRow: 14, platform: "Payoneer", account: "所有账户", searchField: "交易描述", keyword: "Payment from MUXUE TRADE LIMITED", level1: "资金转账", level2: "资金转账-收款", level3: "" },
  { excelRow: 15, platform: "Payoneer", account: "所有账户", searchField: "交易描述", keyword: "Payment from BESTTECH  LIMITED", level1: "资金转账", level2: "资金转账-收款", level3: "" },
  { excelRow: 16, platform: "Payoneer", account: "所有账户", searchField: "交易描述", keyword: "card charge", level1: "公司费用", level2: "公司费用-信息化费用", level3: "" },
  { excelRow: 17, platform: "Payoneer", account: "所有账户", searchField: "备注", keyword: "D26XX", level1: "公司费用", level2: "公司费用-职工薪酬", level3: "公司费用-职工薪酬-工资奖金" },
  { excelRow: 18, platform: "Payoneer", account: "所有账户", searchField: "交易描述", keyword: "Debit from Payoneer", level1: "公司费用", level2: "公司费用-平台手续费", level3: "" },
  { excelRow: 19, platform: "Airwallex", account: "所有账户", searchField: "交易描述", keyword: "Aggregated from", level1: "资金转账", level2: "资金转账-收款", level3: "" },
  { excelRow: 20, platform: "DAHSING", account: "所有账户", searchField: "交易描述", keyword: "INTEREST DEPOSIT", level1: "公司收入", level2: "公司收入-利息收入", level3: "" },
  { excelRow: 21, platform: "HSBC", account: "所有账户", searchField: "交易描述", keyword: "CREDIT INTEREST", level1: "公司收入", level2: "公司收入-利息收入", level3: "" },
  { excelRow: 22, platform: "Paypal", account: "PAYPAL-HQY-44414@qq.com", searchField: "code 类型", keyword: "预先批准付款账单用户付款", level1: "公司费用", level2: "公司费用-信息化费用", level3: "" },
  { excelRow: 23, platform: "Paypal", account: "PAYPAL-HQY-44414@qq.com", searchField: "code 类型", keyword: "准备金冻结", level1: "受限资金", level2: "受限资金", level3: "" },
  { excelRow: 24, platform: "Paypal", account: "PAYPAL-HQY-44414@qq.com", searchField: "code 类型", keyword: "准备金放款", level1: "受限资金", level2: "受限资金", level3: "" },
  { excelRow: 25, platform: "Paypal", account: "PAYPAL-HQY-44414@qq.com", searchField: "code 类型", keyword: "T", level1: "资金转账", level2: "资金转账-付款", level3: "" },
  { excelRow: 26, platform: "Paypal", account: "PAYPAL-HQY-fleck@outlook.com", searchField: "code 类型", keyword: "准备金冻结", level1: "受限资金", level2: "受限资金", level3: "" },
  { excelRow: 27, platform: "Paypal", account: "PAYPAL-HQY-fleck@outlook.com", searchField: "code 类型", keyword: "准备金放款", level1: "受限资金", level2: "受限资金", level3: "" },
  { excelRow: 28, platform: "Paypal", account: "PAYPAL-HQY-fleck@outlook.com", searchField: "code 类型", keyword: "付款审查冻结", level1: "受限资金", level2: "受限资金", level3: "" },
  { excelRow: 29, platform: "Paypal", account: "PAYPAL-HQY-fleck@outlook.com", searchField: "code 类型", keyword: "付款审查放款", level1: "受限资金", level2: "受限资金", level3: "" },
  { excelRow: 30, platform: "Paypal", account: "PAYPAL-HQY-nksea@163.com", searchField: "code 类型", keyword: "准备金冻结", level1: "受限资金", level2: "受限资金", level3: "" },
  { excelRow: 31, platform: "Paypal", account: "PAYPAL-HQY-nksea@163.com", searchField: "code 类型", keyword: "准备金放款", level1: "受限资金", level2: "受限资金", level3: "" },
  { excelRow: 32, platform: "Paypal", account: "PAYPAL-HQY-nksea@163.com", searchField: "code 类型", keyword: "普通冻结", level1: "受限资金", level2: "受限资金", level3: "" },
  { excelRow: 33, platform: "Paypal", account: "PAYPAL-HQY-nksea@163.com", searchField: "code 类型", keyword: "普通冻结放款", level1: "受限资金", level2: "受限资金", level3: "" },
  { excelRow: 34, platform: "Paypal", account: "PAYPAL-HQY-nksea@163.com", searchField: "code 类型", keyword: "用户发起的收款", level1: "资金转账", level2: "资金转账-付款", level3: "" },
  { excelRow: 35, platform: "Paypal", account: "PAYPAL-HQY-nksea@163.com", searchField: "code 类型", keyword: "争议费", level1: "广告业务", level2: "广告业务-付款", level3: "广告业务-付款-客户退款" },
  { excelRow: 36, platform: "Paypal", account: "PAYPAL-HQY-nksea@163.com", searchField: "code 类型", keyword: "费用撤销", level1: "广告业务", level2: "广告业务-付款", level3: "广告业务-付款-客户退款" },
  { excelRow: 37, platform: "Paypal", account: "PAYPAL-HQY-nksea@163.com", searchField: "code 类型", keyword: "退单撤销", level1: "广告业务", level2: "广告业务-付款", level3: "广告业务-付款-客户退款" },
  { excelRow: 38, platform: "Paypal", account: "PAYPAL-HQY-nksea@163.com", searchField: "code 类型", keyword: "退单", level1: "广告业务", level2: "广告业务-付款", level3: "广告业务-付款-客户退款" },
  { excelRow: 39, platform: "Paypal", account: "PAYPAL-HQY-nksea@163.com", searchField: "code 类型", keyword: "普通币种兑换", level1: "资金转账", level2: "资金转账-货币兑换", level3: "" },
  { excelRow: 40, platform: "Paypal", account: "PAYPAL-HQY-nksea@163.com", searchField: "code 类型", keyword: "付款审查放款", level1: "受限资金", level2: "受限资金", level3: "" },
  { excelRow: 41, platform: "Paypal", account: "PAYPAL-HQY-nksea@163.com", searchField: "code 类型", keyword: "付款审查冻结", level1: "受限资金", level2: "受限资金", level3: "" },
  { excelRow: 42, platform: "PingPong", account: "PingPong-BESTTECH-B2C", searchField: "", keyword: "12150020237721230477174", level1: "垫资业务", level2: "垫资业务-收款", level3: "" },
  { excelRow: 43, platform: "PingPong", account: "PingPong-BESTTECH-B2C", searchField: "", keyword: "12150020972451156577197", level1: "垫资业务", level2: "垫资业务-收款", level3: "" },
  { excelRow: 44, platform: "PingPong", account: "PingPong-BESTTECH-B2C", searchField: "", keyword: "STRIPE PAYMENTS EUROPE, LIMITED", level1: "电商业务", level2: "电商业务-收款", level3: "" },
  { excelRow: 45, platform: "PingPong", account: "PingPong-BESTTECH-B2C", searchField: "", keyword: "SHOPIFY", level1: "电商业务", level2: "电商业务-收款", level3: "" },
  { excelRow: 46, platform: "PingPong", account: "PingPong-BESTTECH-B2C", searchField: "", keyword: "kovoapex SPFPYM", level1: "电商业务", level2: "电商业务-收款", level3: "" },
  { excelRow: 47, platform: "PingPong", account: "PingPong-BESTTECH-B2C", searchField: "业务类型", keyword: "入账", level1: "电商业务", level2: "电商业务-收款", level3: "" },
  { excelRow: 48, platform: "PingPong", account: "PingPong-BESTTECH-B2C", searchField: "业务类型", keyword: "入账回退", level1: "电商业务", level2: "电商业务-收款", level3: "" },
  { excelRow: 49, platform: "PingPong", account: "PingPong-BESTTECH-B2C", searchField: "业务类型", keyword: "实时换汇转账-出款", level1: "资金转账", level2: "资金转账-货币兑换", level3: "" },
  { excelRow: 50, platform: "PingPong", account: "PingPong-BESTTECH-B2C", searchField: "业务类型", keyword: "实时换汇转账-入账", level1: "资金转账", level2: "资金转账-货币兑换", level3: "" },
  { excelRow: 51, platform: "PingPong", account: "PingPong-BESTTECH-B2C", searchField: "业务类型", keyword: "网商银行跨境通充值", level1: "资金转账", level2: "资金转账-付款", level3: "" },
  { excelRow: 52, platform: "Worldfirst", account: "Worldfirst-besttech", searchField: "收款人姓名", keyword: "1688.COM", level1: "履约业务", level2: "履约业务-采购付款", level3: "" },
  { excelRow: 53, platform: "Worldfirst", account: "Worldfirst-besttech", searchField: "收款人姓名", keyword: "WorldFirst", level1: "履约业务", level2: "履约业务-采购付款", level3: "" },
  { excelRow: 54, platform: "Worldfirst", account: "Worldfirst-besttech", searchField: "交易描述", keyword: "Conversion", level1: "资金转账", level2: "资金转账-货币兑换", level3: "" },
  { excelRow: 55, platform: "Worldfirst", account: "Worldfirst-muxuehk01", searchField: "收款人姓名", keyword: "1688.COM", level1: "履约业务", level2: "履约业务-采购付款", level3: "" },
  { excelRow: 56, platform: "Worldfirst", account: "Worldfirst-muxuehk01", searchField: "收款人姓名", keyword: "WorldFirst", level1: "履约业务", level2: "履约业务-采购付款", level3: "" },
  { excelRow: 57, platform: "Worldfirst", account: "Worldfirst-muxuehk01", searchField: "交易描述", keyword: "Conversion", level1: "资金转账", level2: "资金转账-货币兑换", level3: "" },
  { excelRow: 58, platform: "Worldfirst", account: "Worldfirst-muxue", searchField: "交易描述", keyword: "Conversion", level1: "资金转账", level2: "资金转账-货币兑换", level3: "" },
  { excelRow: 59, platform: "Worldfirst", account: "Worldfirst-muxue", searchField: "交易描述", keyword: "Fund collection", level1: "资金转账", level2: "资金转账-收款", level3: "" },
  { excelRow: 60, platform: "Worldfirst", account: "Worldfirst-muxue", searchField: "备注", keyword: "D26", level1: "公司费用", level2: "公司费用-职工薪酬", level3: "公司费用-职工薪酬-工资奖金" },
  { excelRow: 61, platform: "Worldfirst", account: "Worldfirst-muxue", searchField: "备注", keyword: "T26", level1: "公司费用", level2: "公司费用-职工薪酬", level3: "公司费用-职工薪酬-工资奖金" },
  { excelRow: 62, platform: "Worldfirst", account: "Worldfirst-muxue", searchField: "电商平台/支付网关", keyword: "Paypal", level1: "资金转账", level2: "资金转账-收款", level3: "" },
  { excelRow: 63, platform: "Worldfirst", account: "Worldfirst-Besttech01", searchField: "备注", keyword: "D26", level1: "公司费用", level2: "公司费用-职工薪酬", level3: "公司费用-职工薪酬-工资奖金" },
  { excelRow: 64, platform: "Worldfirst", account: "Worldfirst-Besttech01", searchField: "备注", keyword: "T26", level1: "公司费用", level2: "公司费用-职工薪酬", level3: "公司费用-职工薪酬-工资奖金" },
  { excelRow: 65, platform: "Worldfirst", account: "Worldfirst-Besttech01", searchField: "交易描述", keyword: "Transfer-BST01", level1: "资金转账", level2: "资金转账-付款", level3: "" },
  { excelRow: 66, platform: "Worldfirst", account: "Worldfirst-Besttech01", searchField: "交易描述", keyword: "Transfer-jayden01", level1: "资金转账", level2: "资金转账-付款", level3: "" },
  { excelRow: 67, platform: "Worldfirst", account: "Worldfirst-Besttech01", searchField: "交易描述", keyword: "Conversion", level1: "资金转账", level2: "资金转账-货币兑换", level3: "" },
  { excelRow: 68, platform: "Worldfirst", account: "Worldfirst-Besttech01", searchField: "交易描述", keyword: "Fund collection", level1: "资金转账", level2: "资金转账-付款", level3: "" },
  { excelRow: 69, platform: "Worldfirst", account: "Worldfirst-Besttech01", searchField: "电商平台/支付网关", keyword: "Paypal", level1: "资金转账", level2: "资金转账-收款", level3: "" },
  { excelRow: 70, platform: "Worldfirst", account: "Worldfirst-Besttech01", searchField: "电商平台/支付网关", keyword: "shopify payment", level1: "电商业务", level2: "电商业务-收款", level3: "" },
  { excelRow: 71, platform: "Worldfirst", account: "Worldfirst-BST", searchField: "交易描述", keyword: "Collection-Besttech01", level1: "资金转账", level2: "资金转账-收款", level3: "" },
  { excelRow: 72, platform: "Worldfirst", account: "Worldfirst-BYWISE", searchField: "电商平台/支付网关", keyword: "Paypal", level1: "资金转账", level2: "资金转账-收款", level3: "" },
  { excelRow: 73, platform: "Worldfirst", account: "Worldfirst-muxue02", searchField: "交易类型", keyword: "CARD_PAYMENT", level1: "电商业务", level2: "电商业务-其他费用", level3: "" },
  { excelRow: 74, platform: "Worldfirst", account: "Worldfirst-muxue02", searchField: "交易类型", keyword: "CASH_BACK", level1: "公司收入", level2: "公司收入-其他收入", level3: "" },
  { excelRow: 75, platform: "Worldfirst", account: "Worldfirst-muxue02", searchField: "交易类型", keyword: "CARD_REFUND", level1: "公司收入", level2: "公司收入-其他收入", level3: "" },
  { excelRow: 76, platform: "Worldfirst", account: "WorldFirst-LUZHENNAN", searchField: "电商平台/支付网关", keyword: "PayPal", level1: "资金转账", level2: "资金转账-收款", level3: "" },
  { excelRow: 77, platform: "Worldfirst", account: "WorldFirst-LUZHENNAN", searchField: "电商平台/支付网关", keyword: "shopify payment", level1: "电商业务", level2: "电商业务-收款", level3: "" },
  { excelRow: 78, platform: "Worldfirst", account: "WorldFirst-LUZHENNAN", searchField: "电商平台/支付网关", keyword: "Shopline Payment", level1: "电商业务", level2: "电商业务-收款", level3: "" },
  { excelRow: 79, platform: "Worldfirst", account: "WorldFirst-LUZHENNAN", searchField: "交易描述", keyword: "Collection-Besttech01", level1: "资金转账", level2: "资金转账-收款", level3: "" },
];
