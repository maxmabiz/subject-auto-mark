import type { Rule, RuleCondition } from "../types";
import { conditionMatchMode } from "../matching/fieldMap";
import { normalizeText } from "../matching/normalize";

export function channelMatchKey(platform: string, account: string, searchField: string, keyword: string): string {
  return [normalizeText(platform), normalizeText(account), normalizeText(searchField), normalizeText(keyword)].join("|");
}

function normalizeCondition(item: RuleCondition): RuleCondition {
  const next: RuleCondition = {
    searchField: (item.searchField ?? "").trim(),
    keyword: (item.keyword ?? "").trim(),
  };
  if (typeof item.fuzzy === "boolean") next.fuzzy = item.fuzzy;
  return next;
}

export function ruleConditions(rule: Pick<Rule, "searchField" | "keyword"> & { conditions?: RuleCondition[] | null; matchMode?: Rule["matchMode"] }): RuleCondition[] {
  const listed = (rule.conditions ?? [])
    .map(normalizeCondition)
    .filter((item) => item.searchField || item.keyword);
  if (listed.length) return listed;
  const searchField = (rule.searchField ?? "").trim();
  const keyword = (rule.keyword ?? "").trim();
  if (!searchField && !keyword) return [];
  const fuzzy = rule.matchMode === "contains" ? true : rule.matchMode === "exact" ? false : undefined;
  return [normalizeCondition({ searchField, keyword, fuzzy })];
}

export function ruleConditionKeys(rule: Pick<Rule, "platform" | "account" | "searchField" | "keyword"> & { conditions?: RuleCondition[] | null; matchMode?: Rule["matchMode"] }): string[] {
  return ruleConditions(rule).map((item) => channelMatchKey(rule.platform, rule.account, item.searchField, item.keyword));
}

export function formatRuleCondition(item: RuleCondition): string {
  const mode = conditionMatchMode(item) === "contains" ? "模糊" : "精确";
  return `${item.searchField || "—"}=${item.keyword || "—"}（${mode}）`;
}

export function formatRuleConditions(rule: Pick<Rule, "searchField" | "keyword"> & { conditions?: RuleCondition[] | null; matchMode?: Rule["matchMode"] }): string {
  const items = ruleConditions(rule);
  if (!items.length) return "—";
  return items.map(formatRuleCondition).join(" 或 ");
}
