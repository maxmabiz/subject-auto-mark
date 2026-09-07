import type { Rule, RuleCondition } from "../types";
import { conditionMatchMode, isSearchFieldSupported } from "../matching/fieldMap";
import { isBlank } from "../matching/normalize";
import { ruleConditionKeys, ruleConditions } from "./match";

const INIT_TIME = "2026-08-01T02:00:00.000Z";
const MAX_CONDITIONS = 8;

export function mockChannelMatchedCount(rule: Pick<Rule, "excelRow" | "keyword">): number {
  const keyword = rule.keyword.toLowerCase();
  if (keyword.includes("shopify")) return 14;
  if (keyword.includes("conversion")) return 9;
  if (keyword.includes("准备金")) return 6;
  if (keyword.includes("interest")) return 3;
  if (keyword === "入账") return 11;
  if (rule.excelRow % 11 === 0) return 2;
  return 0;
}

export function hydrateChannelRule(rule: Rule): Rule {
  const conditions = ruleConditions(rule);
  const first = conditions[0] ?? { searchField: rule.searchField ?? "", keyword: rule.keyword ?? "" };
  return {
    ...rule,
    searchField: first.searchField,
    keyword: first.keyword,
    conditions,
    matchMode: first.searchField ? conditionMatchMode(first) : rule.matchMode ?? null,
    createdAt: rule.createdAt || INIT_TIME,
    updatedAt: rule.updatedAt || rule.createdAt || INIT_TIME,
    matchedCountT1: rule.createdAt ? (rule.matchedCountT1 ?? 0) : mockChannelMatchedCount({ ...rule, keyword: first.keyword }),
  };
}

export function buildChannelRule(input: {
  id?: string;
  excelRow?: number;
  platform: string;
  account: string;
  searchField?: string;
  keyword?: string;
  conditions?: RuleCondition[];
  level1: string;
  level2: string;
  level3: string;
  createdAt?: string;
  updatedAt?: string;
  matchedCountT1?: number;
}): Rule {
  const platform = input.platform.trim();
  const account = input.account.trim();
  const level1 = input.level1.trim();
  const level2 = input.level2.trim();
  const level3 = input.level3.trim();
  const rawConditions = (input.conditions?.length
    ? input.conditions
    : [{ searchField: input.searchField ?? "", keyword: input.keyword ?? "" }]
  ).map((item) => {
    const next: RuleCondition = { searchField: item.searchField.trim(), keyword: item.keyword.trim() };
    if (typeof item.fuzzy === "boolean") next.fuzzy = item.fuzzy;
    return next;
  });
  const conditions = rawConditions.filter((item) => item.searchField || item.keyword);
  const first = conditions[0] ?? { searchField: "", keyword: "" };
  const errors: string[] = [];
  if (isBlank(platform)) errors.push("平台为空");
  if (isBlank(account)) errors.push("账号为空");
  if (!conditions.length) errors.push("至少需要一组检索字段和关键词");
  if (conditions.length > MAX_CONDITIONS) errors.push(`检索条件最多 ${MAX_CONDITIONS} 组`);
  const keys = ruleConditionKeys({ platform, account, searchField: first.searchField, keyword: first.keyword, conditions });
  if (new Set(keys).size !== keys.length) errors.push("同一规则内检索字段与关键词不能重复");
  for (const item of conditions) {
    if (isBlank(item.searchField)) errors.push("检索字段为空");
    if (isBlank(item.keyword)) errors.push("关键词为空");
    if (item.searchField && !isSearchFieldSupported(item.searchField)) errors.push(`检索字段不在支持字段列表中：${item.searchField}`);
  }
  if (isBlank(level1) || isBlank(level2)) errors.push("一级或二级科目为空");
  const createdAt = input.createdAt || new Date().toISOString();
  return {
    id: input.id ?? `R-${Date.now().toString(36)}`,
    excelRow: input.excelRow ?? 0,
    platform,
    account,
    searchField: first.searchField,
    keyword: first.keyword,
    conditions,
    subject: { level1, level2, level3: level3 || null },
    matchMode: first.searchField ? conditionMatchMode(first) : null,
    explicitPriority: 0,
    validationStatus: errors.length ? "error" : "valid",
    errors: [...new Set(errors)],
    warnings: [],
    version: "",
    createdAt,
    updatedAt: input.updatedAt || createdAt,
    matchedCountT1: input.matchedCountT1 ?? 0,
  };
}

export { MAX_CONDITIONS };

