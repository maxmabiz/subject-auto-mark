import { independentStationDimension } from "@/domain/approval/dimension";
import { mockTemplateId } from "@/domain/approval/templateId";
import { buildApprovalRuleLog } from "@/domain/approval/log";
import type { ApprovalRule, ApprovalRuleLog } from "@/domain/types";

export const APPROVAL_TEMPLATE_IDS = {
  "广告付款申请": mockTemplateId("广告付款申请"),
  "物流费付款申请": mockTemplateId("物流费付款申请"),
  "日常付款、报销申请": mockTemplateId("日常付款、报销申请"),
  "代发业务付款申请": mockTemplateId("代发业务付款申请"),
  "垫资业务付款申请": mockTemplateId("垫资业务付款申请"),
  "电商业务付款申请": mockTemplateId("电商业务付款申请"),
  "支付业务付款申请": mockTemplateId("支付业务付款申请"),
  "日常付款、报销申请（有发票）": mockTemplateId("日常付款、报销申请（有发票）"),
  "知识产权事务申请": mockTemplateId("知识产权事务申请"),
  "内部资金调拨流程": mockTemplateId("内部资金调拨流程"),
  "【线下】采购合同及付款申请 （一次付款/首款/中期款/尾款）": mockTemplateId("【线下】采购合同及付款申请 （一次付款/首款/中期款/尾款）"),
} as const;

function tid(name: keyof typeof APPROVAL_TEMPLATE_IDS): string {
  return APPROVAL_TEMPLATE_IDS[name];
}

function rule(
  partial: Omit<ApprovalRule, "validationStatus" | "errors" | "subject" | "createdAt" | "updatedAt" | "otherDimension"> & {
    otherDimension?: string;
    level1: string;
    level2: string;
    level3: string;
  },
): ApprovalRule {
  const subject = partial.level1
    ? { level1: partial.level1, level2: partial.level2, level3: partial.level3 || null }
    : null;
  const errors: string[] = [];
  if (!partial.approvalName) errors.push("飞书审批单名称为空");
  if (!partial.templateId) errors.push("模板ID为空");
  if (!partial.paymentType) errors.push("付款申请类型为空");
  const validationStatus = errors.length ? "error" : partial.level1 ? "valid" : "warning";
  if (!partial.level1 && !errors.length) errors.push("未配置科目，匹配时回退渠道规则");
  return {
    id: partial.id,
    excelRow: partial.excelRow,
    seq: partial.seq,
    approvalName: partial.approvalName,
    templateId: partial.templateId,
    paymentType: partial.paymentType,
    otherDimension: partial.otherDimension ?? "",
    subject,
    validationStatus,
    errors,
    createdAt: "2026-08-01T02:00:00.000Z",
    updatedAt: "2026-08-01T02:00:00.000Z",
    matchedCountT1: partial.matchedCountT1,
  };
}

const OFFLINE_PURCHASE_NAME = "【线下】采购合同及付款申请 （一次付款/首款/中期款/尾款）" as const;

function offlinePurchaseRules(): ApprovalRule[] {
  const rows: Array<[string, "是" | "否", string, string, number]> = [
    ["商品采购（有合同）", "是", "电商业务", "电商业务-采购付款", 3],
    ["商品采购（无合同）【金额一万以下】", "是", "电商业务", "电商业务-采购付款", 2],
    ["样品费", "是", "电商业务", "电商业务-采购付款", 1],
    ["商品运费", "是", "电商业务", "电商业务-其他费用", 2],
    ["证书费用", "是", "电商业务", "电商业务-采购付款", 1],
    ["拍摄费用", "是", "电商业务", "电商业务-其他费用", 1],
    ["其他费用", "是", "电商业务", "电商业务-其他费用", 2],
    ["客户相关费用", "是", "电商业务", "电商业务-其他费用", 1],
    ["备用金付款（采购专用）", "是", "电商业务", "电商业务-采购付款", 1],
    ["备用金冲销（采购专用）", "是", "电商业务", "电商业务-采购付款", 1],
    ["商品采购（有合同）", "否", "履约业务", "履约业务-采购付款", 2],
    ["商品采购（无合同）【金额一万以下】", "否", "履约业务", "履约业务-采购付款", 1],
    ["样品费", "否", "履约业务", "履约业务-采购付款", 1],
    ["商品运费", "否", "履约业务", "履约业务-采购付款", 1],
    ["证书费用", "否", "履约业务", "履约业务-采购付款", 1],
    ["其他费用", "否", "履约业务", "履约业务-其他费用", 1],
    ["客户相关费用", "否", "履约业务", "履约业务-其他费用", 1],
    ["备用金付款（采购专用）", "否", "履约业务", "履约业务-采购付款", 1],
    ["备用金冲销（采购专用）", "否", "履约业务", "履约业务-采购付款", 1],
  ];
  return rows.map(([paymentType, station, level1, level3, matchedCountT1], index) =>
    rule({
      id: `AR${String(71 + index).padStart(3, "0")}`,
      excelRow: 71 + index,
      seq: "3",
      approvalName: OFFLINE_PURCHASE_NAME,
      templateId: tid(OFFLINE_PURCHASE_NAME),
      paymentType,
      otherDimension: independentStationDimension(station),
      level1,
      level2: "",
      level3,
      matchedCountT1,
    }),
  );
}

export const FALLBACK_APPROVAL_RULES: ApprovalRule[] = [
  rule({ id: "AR002", excelRow: 2, seq: "1", approvalName: "广告付款申请", templateId: tid("广告付款申请"), paymentType: "退款", level1: "广告业务", level2: "", level3: "广告业务-付款-客户退款", matchedCountT1: 6 }),
  rule({ id: "AR003", excelRow: 3, seq: "1", approvalName: "广告付款申请", templateId: tid("广告付款申请"), paymentType: "佣金", level1: "广告业务", level2: "", level3: "广告业务-付款-支付佣金", matchedCountT1: 11 }),
  rule({ id: "AR004", excelRow: 4, seq: "1", approvalName: "广告付款申请", templateId: tid("广告付款申请"), paymentType: "充值", level1: "广告业务", level2: "", level3: "广告业务-付款-付代理商", matchedCountT1: 18 }),
  rule({ id: "AR007", excelRow: 7, seq: "2", approvalName: "物流费付款申请", templateId: tid("物流费付款申请"), paymentType: "国际物流费用", level1: "履约业务", level2: "", level3: "履约业务-付物流商", matchedCountT1: 9 }),
  rule({ id: "AR009", excelRow: 9, seq: "2", approvalName: "物流费付款申请", templateId: tid("物流费付款申请"), paymentType: "国内物流费用", level1: "履约业务", level2: "", level3: "履约业务-付物流商", matchedCountT1: 4 }),
  rule({ id: "AR015", excelRow: 15, seq: "4", approvalName: "日常付款、报销申请", templateId: tid("日常付款、报销申请"), paymentType: "预支", level1: "", level2: "", level3: "", matchedCountT1: 0 }),
  rule({ id: "AR018", excelRow: 18, seq: "4", approvalName: "日常付款、报销申请", templateId: tid("日常付款、报销申请"), paymentType: "办公费用（无发票）", level1: "公司费用", level2: "", level3: "公司费用-办公费", matchedCountT1: 3 }),
  rule({ id: "AR023", excelRow: 23, seq: "4", approvalName: "日常付款、报销申请", templateId: tid("日常付款、报销申请"), paymentType: "公司福利（无发票）", level1: "公司费用", level2: "", level3: "公司费用-职工福利", matchedCountT1: 7 }),
  rule({ id: "AR026", excelRow: 26, seq: "4", approvalName: "日常付款、报销申请", templateId: tid("日常付款、报销申请"), paymentType: "信息化费用（无发票）", level1: "公司费用", level2: "", level3: "公司费用-信息化费用", matchedCountT1: 12 }),
  rule({ id: "AR031", excelRow: 31, seq: "5", approvalName: "代发业务付款申请", templateId: tid("代发业务付款申请"), paymentType: "佣金", level1: "履约业务", level2: "", level3: "履约业务-代发业务-支付佣金", matchedCountT1: 5 }),
  rule({ id: "AR037", excelRow: 37, seq: "6", approvalName: "垫资业务付款申请", templateId: tid("垫资业务付款申请"), paymentType: "垫资结算", level1: "垫资业务", level2: "", level3: "垫资业务-付款-垫资结算", matchedCountT1: 2 }),
  rule({ id: "AR038", excelRow: 38, seq: "6", approvalName: "垫资业务付款申请", templateId: tid("垫资业务付款申请"), paymentType: "佣金", level1: "", level2: "", level3: "", matchedCountT1: 0 }),
  rule({ id: "AR042", excelRow: 42, seq: "7", approvalName: "电商业务付款申请", templateId: tid("电商业务付款申请"), paymentType: "电商", level1: "电商业务", level2: "", level3: "电商业务-其他费用", matchedCountT1: 8 }),
  rule({ id: "AR061", excelRow: 61, seq: "13", approvalName: "内部资金调拨流程", templateId: tid("内部资金调拨流程"), paymentType: "资金调拨", level1: "资金转账", level2: "", level3: "", matchedCountT1: 1 }),
  ...offlinePurchaseRules(),
];

function byId(id: string): ApprovalRule {
  return FALLBACK_APPROVAL_RULES.find((item) => item.id === id)!;
}

function withSubject(rule: ApprovalRule, level1: string, level2: string, level3: string): ApprovalRule {
  return {
    ...rule,
    subject: level1 ? { level1, level2, level3: level3 || null } : null,
  };
}

function touch(rule: ApprovalRule, time: string) {
  if (time > rule.updatedAt) rule.updatedAt = time;
}

const adsRefund = byId("AR002");
const adsCommission = byId("AR003");
const adsRecharge = byId("AR004");
const logisticsIntl = byId("AR007");
const logisticsDomestic = byId("AR009");
const office = byId("AR018");
const welfare = byId("AR023");
const itRule = byId("AR026");
const dropship = byId("AR031");
const advance = byId("AR037");
const ecommerce = byId("AR042");
const transfer = byId("AR061");

export const FALLBACK_APPROVAL_RULE_LOGS: ApprovalRuleLog[] = [
  ...FALLBACK_APPROVAL_RULES.map((item) =>
    buildApprovalRuleLog({
      id: `arlog-${item.id}-create`,
      ruleId: item.id,
      time: item.createdAt,
      actor: "系统",
      action: "create",
      after: item,
    }),
  ),
  buildApprovalRuleLog({
    id: "arlog-AR002-import",
    ruleId: "AR002",
    time: "2026-08-05T10:18:00.000Z",
    actor: "李晓雯",
    action: "import",
    before: withSubject(adsRefund, "广告业务", "", "广告业务-付款-其他费用"),
    after: adsRefund,
  }),
  buildApprovalRuleLog({
    id: "arlog-AR002-update",
    ruleId: "AR002",
    time: "2026-08-14T11:05:00.000Z",
    actor: "张敏",
    action: "update",
    before: withSubject(adsRefund, "广告业务", "", "广告业务-付款-退款"),
    after: adsRefund,
  }),
  buildApprovalRuleLog({
    id: "arlog-AR003-update",
    ruleId: "AR003",
    time: "2026-08-07T15:40:00.000Z",
    actor: "张敏",
    action: "update",
    before: withSubject(adsCommission, "广告业务", "", "广告业务-付款-其他费用"),
    after: adsCommission,
  }),
  buildApprovalRuleLog({
    id: "arlog-AR004-import",
    ruleId: "AR004",
    time: "2026-08-05T10:18:00.000Z",
    actor: "李晓雯",
    action: "import",
    before: withSubject(adsRecharge, "广告业务", "", "广告业务-付款-其他费用"),
    after: withSubject(adsRecharge, "广告业务", "", "广告业务-付款-充值"),
  }),
  buildApprovalRuleLog({
    id: "arlog-AR004-update",
    ruleId: "AR004",
    time: "2026-08-10T09:20:00.000Z",
    actor: "财务管理员",
    action: "update",
    before: withSubject(adsRecharge, "广告业务", "", "广告业务-付款-充值"),
    after: adsRecharge,
  }),
  buildApprovalRuleLog({
    id: "arlog-AR007-update",
    ruleId: "AR007",
    time: "2026-08-08T16:12:00.000Z",
    actor: "王磊",
    action: "update",
    before: withSubject(logisticsIntl, "履约业务", "", "履约业务-其他费用"),
    after: logisticsIntl,
  }),
  buildApprovalRuleLog({
    id: "arlog-AR009-import",
    ruleId: "AR009",
    time: "2026-08-05T10:18:00.000Z",
    actor: "李晓雯",
    action: "import",
    before: withSubject(logisticsDomestic, "履约业务", "", ""),
    after: logisticsDomestic,
  }),
  buildApprovalRuleLog({
    id: "arlog-AR018-update",
    ruleId: "AR018",
    time: "2026-08-09T09:46:00.000Z",
    actor: "李晓雯",
    action: "update",
    before: withSubject(office, "公司费用", "", "公司费用-其他"),
    after: office,
  }),
  buildApprovalRuleLog({
    id: "arlog-AR023-import",
    ruleId: "AR023",
    time: "2026-08-05T10:18:00.000Z",
    actor: "李晓雯",
    action: "import",
    before: withSubject(welfare, "公司费用", "", "公司费用-职工薪酬"),
    after: withSubject(welfare, "公司费用", "", "公司费用-职工薪酬"),
  }),
  buildApprovalRuleLog({
    id: "arlog-AR023-update",
    ruleId: "AR023",
    time: "2026-08-13T14:22:00.000Z",
    actor: "张敏",
    action: "update",
    before: withSubject(welfare, "公司费用", "", "公司费用-职工薪酬"),
    after: welfare,
  }),
  buildApprovalRuleLog({
    id: "arlog-AR026-import",
    ruleId: "AR026",
    time: "2026-08-05T10:18:00.000Z",
    actor: "李晓雯",
    action: "import",
    before: withSubject(itRule, "公司费用", "", "公司费用-办公费"),
    after: withSubject(itRule, "公司费用", "", "公司费用-办公费"),
  }),
  buildApprovalRuleLog({
    id: "arlog-AR026-update",
    ruleId: "AR026",
    time: "2026-08-12T14:08:00.000Z",
    actor: "财务管理员",
    action: "update",
    before: withSubject(itRule, "公司费用", "", "公司费用-办公费"),
    after: itRule,
  }),
  buildApprovalRuleLog({
    id: "arlog-AR031-update",
    ruleId: "AR031",
    time: "2026-08-11T10:33:00.000Z",
    actor: "王磊",
    action: "update",
    before: withSubject(dropship, "履约业务", "", "履约业务-代发业务-其他"),
    after: dropship,
  }),
  buildApprovalRuleLog({
    id: "arlog-AR037-update",
    ruleId: "AR037",
    time: "2026-08-09T17:05:00.000Z",
    actor: "张敏",
    action: "update",
    before: withSubject(advance, "垫资业务", "", "垫资业务-付款-其他"),
    after: advance,
  }),
  buildApprovalRuleLog({
    id: "arlog-AR042-import",
    ruleId: "AR042",
    time: "2026-08-05T10:18:00.000Z",
    actor: "李晓雯",
    action: "import",
    before: withSubject(ecommerce, "电商业务", "", "电商业务-收款"),
    after: withSubject(ecommerce, "电商业务", "", "电商业务-收款"),
  }),
  buildApprovalRuleLog({
    id: "arlog-AR042-update",
    ruleId: "AR042",
    time: "2026-08-14T16:40:00.000Z",
    actor: "王磊",
    action: "update",
    before: withSubject(ecommerce, "电商业务", "", "电商业务-收款"),
    after: ecommerce,
  }),
  buildApprovalRuleLog({
    id: "arlog-AR061-update",
    ruleId: "AR061",
    time: "2026-08-13T09:15:00.000Z",
    actor: "财务管理员",
    action: "update",
    before: withSubject(transfer, "资金转账", "", "资金转账-调拨"),
    after: transfer,
  }),
];

touch(adsRefund, "2026-08-14T11:05:00.000Z");
touch(adsCommission, "2026-08-07T15:40:00.000Z");
touch(adsRecharge, "2026-08-10T09:20:00.000Z");
touch(logisticsIntl, "2026-08-08T16:12:00.000Z");
touch(logisticsDomestic, "2026-08-05T10:18:00.000Z");
touch(office, "2026-08-09T09:46:00.000Z");
touch(welfare, "2026-08-13T14:22:00.000Z");
touch(itRule, "2026-08-12T14:08:00.000Z");
touch(dropship, "2026-08-11T10:33:00.000Z");
touch(advance, "2026-08-09T17:05:00.000Z");
touch(ecommerce, "2026-08-14T16:40:00.000Z");
touch(transfer, "2026-08-13T09:15:00.000Z");
