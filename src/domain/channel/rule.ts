import type { Rule } from "../types";
import { getMatchMode, isSearchFieldSupported } from "../matching/fieldMap";
import { isBlank } from "../matching/normalize";

const INIT_TIME = "2026-08-01T02:00:00.000Z";

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
  return {
    ...rule,
    createdAt: rule.createdAt || INIT_TIME,
    updatedAt: rule.updatedAt || rule.createdAt || INIT_TIME,
    matchedCountT1: rule.createdAt ? (rule.matchedCountT1 ?? 0) : mockChannelMatchedCount(rule),
  };
}

export function buildChannelRule(input: {
  id?: string;
  excelRow?: number;
  platform: string;
  account: string;
  searchField: string;
  keyword: string;
  level1: string;
  level2: string;
  level3: string;
  createdAt?: string;
  updatedAt?: string;
  matchedCountT1?: number;
}): Rule {
  const platform = input.platform.trim();
  const account = input.account.trim();
  const searchField = input.searchField.trim();
  const keyword = input.keyword.trim();
  const level1 = input.level1.trim();
  const level2 = input.level2.trim();
  const level3 = input.level3.trim();
  const errors: string[] = [];
  if (isBlank(platform)) errors.push("平台为空");
  if (isBlank(account)) errors.push("账号为空");
  if (isBlank(searchField)) errors.push("检索字段为空");
  if (isBlank(keyword)) errors.push("关键词为空");
  if (isBlank(level1) || isBlank(level2)) errors.push("一级或二级科目为空");
  if (searchField && !isSearchFieldSupported(searchField)) errors.push(`检索字段不在支持字段列表中：${searchField}`);
  const createdAt = input.createdAt || new Date().toISOString();
  return {
    id: input.id ?? `R-${Date.now().toString(36)}`,
    excelRow: input.excelRow ?? 0,
    platform,
    account,
    searchField,
    keyword,
    subject: { level1, level2, level3: level3 || null },
    matchMode: searchField ? getMatchMode(searchField) : null,
    explicitPriority: 0,
    validationStatus: errors.length ? "error" : "valid",
    errors,
    warnings: [],
    version: "",
    createdAt,
    updatedAt: input.updatedAt || createdAt,
    matchedCountT1: input.matchedCountT1 ?? 0,
  };
}
