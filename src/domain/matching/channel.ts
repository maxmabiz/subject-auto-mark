import type {
  ChannelCandidate,
  ChannelRuleResult,
  Rule,
  SubjectPath,
  Transaction,
} from "../types";
import { ALL_ACCOUNT_LABEL, getMatchMode, getTransactionFieldValue } from "./fieldMap";
import { isBlank, normalizeText, sameSubject } from "./normalize";

function matchesKeyword(rawValue: string, keyword: string, mode: "contains" | "exact"): boolean {
  const value = normalizeText(rawValue);
  const needle = normalizeText(keyword);
  if (!needle) return false;
  if (mode === "exact") return value === needle;
  return value.includes(needle);
}

function candidateRank(rule: Rule, transaction: Transaction): ChannelCandidate | null {
  const mode = rule.matchMode ?? getMatchMode(rule.searchField);
  if (!mode) return null;
  const rawValue = getTransactionFieldValue(transaction, rule.searchField);
  if (rawValue == null) return null;
  if (!matchesKeyword(rawValue, rule.keyword, mode)) return null;

  return {
    ruleId: rule.id,
    excelRow: rule.excelRow,
    platform: rule.platform,
    account: rule.account,
    searchField: rule.searchField,
    keyword: rule.keyword,
    matchMode: mode,
    subject: rule.subject,
    rankScore: {
      accountSpecific: normalizeText(rule.account) === normalizeText(ALL_ACCOUNT_LABEL) ? 0 : 1,
      exactMatch: mode === "exact" ? 1 : 0,
      keywordLength: normalizeText(rule.keyword).length,
      explicitPriority: rule.explicitPriority,
    },
  };
}

function keywordsRelated(a: ChannelCandidate, b: ChannelCandidate): boolean {
  const left = normalizeText(a.keyword);
  const right = normalizeText(b.keyword);
  return Boolean(left && right && (left.includes(right) || right.includes(left)));
}

function compareCandidates(a: ChannelCandidate, b: ChannelCandidate): number {
  if (a.rankScore.accountSpecific !== b.rankScore.accountSpecific) {
    return b.rankScore.accountSpecific - a.rankScore.accountSpecific;
  }
  if (a.rankScore.exactMatch !== b.rankScore.exactMatch) {
    return b.rankScore.exactMatch - a.rankScore.exactMatch;
  }
  if (keywordsRelated(a, b) && a.rankScore.keywordLength !== b.rankScore.keywordLength) {
    return b.rankScore.keywordLength - a.rankScore.keywordLength;
  }
  if (a.rankScore.explicitPriority !== b.rankScore.explicitPriority) {
    return b.rankScore.explicitPriority - a.rankScore.explicitPriority;
  }
  return a.excelRow - b.excelRow;
}

function isSameRank(a: ChannelCandidate, b: ChannelCandidate): boolean {
  if (
    a.rankScore.accountSpecific !== b.rankScore.accountSpecific ||
    a.rankScore.exactMatch !== b.rankScore.exactMatch ||
    a.rankScore.explicitPriority !== b.rankScore.explicitPriority
  ) {
    return false;
  }
  if (keywordsRelated(a, b)) {
    return a.rankScore.keywordLength === b.rankScore.keywordLength;
  }
  return true;
}

function emptyResult(
  status: ChannelRuleResult["status"],
  explanation: string,
  errors: string[] = [],
  candidates: ChannelCandidate[] = [],
): ChannelRuleResult {
  return {
    status,
    subject: null,
    matchedRuleId: null,
    matchedField: null,
    matchedKeyword: null,
    matchedRawValue: null,
    candidates,
    explanation,
    errors,
  };
}

function matchedResult(candidate: ChannelCandidate, transaction: Transaction): ChannelRuleResult {
  const rawValue = getTransactionFieldValue(transaction, candidate.searchField) ?? "";
  return {
    status: "matched",
    subject: candidate.subject,
    matchedRuleId: candidate.ruleId,
    matchedField: candidate.searchField,
    matchedKeyword: candidate.keyword,
    matchedRawValue: rawValue,
    candidates: [candidate],
    explanation: `命中规则 ${candidate.ruleId}：${candidate.searchField}「${candidate.keyword}」${candidate.matchMode === "exact" ? "完全匹配" : "包含匹配"}。`,
    errors: [],
  };
}

export function matchChannelRules(
  transaction: Transaction,
  rules: Rule[],
): ChannelRuleResult {
  const errors: string[] = [];
  if (isBlank(transaction.platform)) errors.push("缺少平台");
  if (isBlank(transaction.account)) errors.push("缺少账号");

  const platformRules = rules.filter(
    (rule) =>
      rule.validationStatus !== "error" &&
      normalizeText(rule.platform) === normalizeText(transaction.platform),
  );

  const requiredFields = new Set(
    platformRules
      .filter(
        (rule) =>
          normalizeText(rule.account) === normalizeText(ALL_ACCOUNT_LABEL) ||
          normalizeText(rule.account) === normalizeText(transaction.account),
      )
      .map((rule) => rule.searchField),
  );

  for (const field of requiredFields) {
    const value = getTransactionFieldValue(transaction, field);
    if (value == null) {
      errors.push(`检索字段「${field}」不受支持`);
    }
  }

  if (errors.length > 0) {
    return emptyResult("data_error", `无法匹配：${errors.join("、")}`, errors);
  }

  const scopedRules = platformRules.filter(
    (rule) =>
      normalizeText(rule.account) === normalizeText(ALL_ACCOUNT_LABEL) ||
      normalizeText(rule.account) === normalizeText(transaction.account),
  );

  const missingFieldErrors: string[] = [];
  const fieldHasValue = (field: string) => !isBlank(getTransactionFieldValue(transaction, field) ?? "");
  const applicableFields = [...new Set(scopedRules.map((rule) => rule.searchField))];
  const emptyRequired = applicableFields.filter((field) => !fieldHasValue(field));
  if (scopedRules.length > 0 && applicableFields.every((field) => !fieldHasValue(field))) {
    missingFieldErrors.push(`缺少规则所需字段：${emptyRequired.join("、")}`);
    return emptyResult("data_error", `无法匹配：${missingFieldErrors.join("、")}`, missingFieldErrors);
  }

  const candidates = scopedRules
    .map((rule) => candidateRank(rule, transaction))
    .filter((item): item is ChannelCandidate => item != null)
    .sort(compareCandidates);

  if (candidates.length === 0) {
    return emptyResult("unmatched", "当前生效规则未命中该流水。");
  }

  const top = candidates[0];
  const topGroup = candidates.filter((item) => isSameRank(item, top));
  const uniqueSubjects = topGroup.reduce<SubjectPath[]>((acc, item) => {
    if (!acc.some((subject) => sameSubject(subject, item.subject))) acc.push(item.subject);
    return acc;
  }, []);

  if (uniqueSubjects.length > 1) {
    return {
      status: "conflict",
      subject: null,
      matchedRuleId: null,
      matchedField: null,
      matchedKeyword: null,
      matchedRawValue: null,
      candidates: topGroup,
      explanation: `最高优先级候选规则指向不同科目，系统未自动选择。冲突规则：${topGroup.map((item) => item.ruleId).join("、")}。`,
      errors: [],
    };
  }

  const result = matchedResult(top, transaction);
  result.candidates = candidates;
  if (topGroup.length > 1) {
    result.explanation += ` 其余同优先级规则指向相同科目，已正常标记。`;
  }
  return result;
}
