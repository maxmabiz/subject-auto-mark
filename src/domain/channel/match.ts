import type { Rule, RuleCondition } from "../types";
import { normalizeText } from "../matching/normalize";

export function channelMatchKey(platform: string, account: string, searchField: string, keyword: string): string {
  return [normalizeText(platform), normalizeText(account), normalizeText(searchField), normalizeText(keyword)].join("|");
}

export function ruleConditions(rule: Pick<Rule, "searchField" | "keyword"> & { conditions?: RuleCondition[] | null }): RuleCondition[] {
  const listed = (rule.conditions ?? [])
    .map((item) => ({ searchField: item.searchField.trim(), keyword: item.keyword.trim() }))
    .filter((item) => item.searchField || item.keyword);
  if (listed.length) return listed;
  const searchField = (rule.searchField ?? "").trim();
  const keyword = (rule.keyword ?? "").trim();
  if (!searchField && !keyword) return [];
  return [{ searchField, keyword }];
}

export function ruleConditionKeys(rule: Pick<Rule, "platform" | "account" | "searchField" | "keyword"> & { conditions?: RuleCondition[] | null }): string[] {
  return ruleConditions(rule).map((item) => channelMatchKey(rule.platform, rule.account, item.searchField, item.keyword));
}

export function formatRuleConditions(rule: Pick<Rule, "searchField" | "keyword"> & { conditions?: RuleCondition[] | null }): string {
  const items = ruleConditions(rule);
  if (!items.length) return "—";
  return items.map((item) => `${item.searchField || "—"}=${item.keyword || "—"}`).join(" 或 ");
}
