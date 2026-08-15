import type { ParsedExcelRow, Rule, RuleValidationResult, SubjectPath } from "../types";
import { ALL_ACCOUNT_LABEL, getMatchMode, isSearchFieldSupported } from "../matching/fieldMap";
import { isBlank, normalizeText, subjectKey } from "../matching/normalize";

function toSubject(row: ParsedExcelRow): SubjectPath {
  return {
    level1: row.level1.trim(),
    level2: row.level2.trim(),
    level3: row.level3.trim() ? row.level3.trim() : null,
  };
}

function scopeKey(row: ParsedExcelRow): string {
  return [normalizeText(row.platform), normalizeText(row.account), normalizeText(row.searchField), normalizeText(row.keyword)].join("|");
}

export function validateParsedRules(rows: ParsedExcelRow[], version: string): RuleValidationResult {
  const blockingByRow = new Map<number, string[]>();
  const warningByRow = new Map<number, string[]>();

  const pushError = (row: number, message: string) => {
    const list = blockingByRow.get(row) ?? [];
    list.push(message);
    blockingByRow.set(row, list);
  };
  const pushWarning = (row: number, message: string) => {
    const list = warningByRow.get(row) ?? [];
    list.push(message);
    warningByRow.set(row, list);
  };

  for (const row of rows) {
    if (isBlank(row.platform)) pushError(row.excelRow, "平台为空");
    if (isBlank(row.account)) pushError(row.excelRow, "账号为空");
    if (isBlank(row.searchField)) pushError(row.excelRow, "检索字段为空");
    if (isBlank(row.keyword)) pushError(row.excelRow, "关键词为空");
    if (isBlank(row.level1) || isBlank(row.level2)) pushError(row.excelRow, "一级或二级科目为空");
    if (!isBlank(row.searchField) && !isSearchFieldSupported(row.searchField.trim())) {
      pushError(row.excelRow, `检索字段不在支持字段列表中：${row.searchField}`);
    }
    if (!isBlank(row.keyword) && row.keyword.trim().length === 1) {
      pushWarning(row.excelRow, "关键词仅有一个字符，误匹配风险较高");
    }
  }

  const groups = new Map<string, ParsedExcelRow[]>();
  for (const row of rows) {
    const key = scopeKey(row);
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }
  for (const group of groups.values()) {
    const subjects = new Set(group.map((item) => subjectKey(toSubject(item))));
    if (subjects.size > 1) {
      for (const item of group) {
        pushError(item.excelRow, "同一作用范围、同一字段、同一关键词配置了不同科目");
      }
    }
  }

  for (const row of rows) {
    for (const other of rows) {
      if (row.excelRow === other.excelRow) continue;
      if (normalizeText(row.platform) !== normalizeText(other.platform)) continue;
      if (normalizeText(row.searchField) !== normalizeText(other.searchField)) continue;
      const a = normalizeText(row.keyword);
      const b = normalizeText(other.keyword);
      if (a && b && a !== b && a.includes(b)) {
        pushWarning(row.excelRow, `关键词「${row.keyword}」包含另一关键词「${other.keyword}」`);
      }
      const rowAll = normalizeText(row.account) === normalizeText(ALL_ACCOUNT_LABEL);
      const otherAll = normalizeText(other.account) === normalizeText(ALL_ACCOUNT_LABEL);
      if (a === b && rowAll !== otherAll) {
        pushWarning(row.excelRow, `「所有账户」规则与具体账号规则重叠：${other.account}`);
      }
      if (
        a === b &&
        normalizeText(row.account) !== normalizeText(other.account) &&
        subjectKey(toSubject(row)) !== subjectKey(toSubject(other))
      ) {
        pushWarning(row.excelRow, `同一关键词在不同账号对应不同科目（对比账号：${other.account}）`);
      }
    }
  }

  const rules: Rule[] = rows.map((row) => {
    const errors = blockingByRow.get(row.excelRow) ?? [];
    const warnings = [...new Set(warningByRow.get(row.excelRow) ?? [])];
    const validationStatus = errors.length > 0 ? "error" : warnings.length > 0 ? "warning" : "valid";
    return {
      id: `R${String(row.excelRow).padStart(3, "0")}`,
      excelRow: row.excelRow,
      platform: row.platform.trim(),
      account: row.account.trim(),
      searchField: row.searchField.trim(),
      keyword: row.keyword,
      subject: toSubject(row),
      matchMode: isBlank(row.searchField) ? null : getMatchMode(row.searchField.trim()),
      explicitPriority: 0,
      validationStatus,
      errors,
      warnings,
      version,
    };
  });

  return {
    rules,
    total: rules.length,
    valid: rules.filter((rule) => rule.validationStatus !== "error").length,
    error: rules.filter((rule) => rule.validationStatus === "error").length,
    warning: rules.filter((rule) => rule.validationStatus === "warning").length,
  };
}

export function diffRuleSets(previous: Rule[], next: Rule[]) {
  const prevMap = new Map(previous.filter((rule) => rule.validationStatus !== "error").map((rule) => [
    `${normalizeText(rule.platform)}|${normalizeText(rule.account)}|${normalizeText(rule.searchField)}|${normalizeText(rule.keyword)}`,
    rule,
  ]));
  const nextValid = next.filter((rule) => rule.validationStatus !== "error");
  const nextKeys = new Set(
    nextValid.map(
      (rule) =>
        `${normalizeText(rule.platform)}|${normalizeText(rule.account)}|${normalizeText(rule.searchField)}|${normalizeText(rule.keyword)}`,
    ),
  );

  let added = 0;
  let modified = 0;
  for (const rule of nextValid) {
    const key = `${normalizeText(rule.platform)}|${normalizeText(rule.account)}|${normalizeText(rule.searchField)}|${normalizeText(rule.keyword)}`;
    const prev = prevMap.get(key);
    if (!prev) added += 1;
    else if (subjectKey(prev.subject) !== subjectKey(rule.subject)) modified += 1;
  }
  let disabled = 0;
  for (const key of prevMap.keys()) {
    if (!nextKeys.has(key)) disabled += 1;
  }
  return { added, modified, disabled };
}
