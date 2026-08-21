import type { BusinessRule, SubjectPath, Transaction } from "../types";
import { isBlank, normalizeText, subjectKey } from "../matching/normalize";

export function businessMatchKey(claimBusiness: string): string {
  return normalizeText(claimBusiness);
}

export function resolveBusinessMatch(
  transaction: Transaction,
  rules: BusinessRule[],
): {
  hit: boolean;
  subject: SubjectPath | null;
  rule: BusinessRule | null;
  explanation: string;
} {
  const claim = (transaction.claimBusiness ?? "").trim();
  if (!claim) {
    return { hit: false, subject: null, rule: null, explanation: "无认领业务" };
  }

  const key = businessMatchKey(claim);
  const candidates = rules.filter((rule) => businessMatchKey(rule.claimBusiness) === key);
  const usable = candidates.filter((rule) => rule.subject && !isBlank(rule.subject.level1));

  if (usable.length === 0) {
    return {
      hit: false,
      subject: null,
      rule: candidates[0] ?? null,
      explanation: `认领业务「${claim}」未配置有效科目，继续使用后续规则。`,
    };
  }

  const subjects = new Set(usable.map((rule) => subjectKey(rule.subject)));
  if (subjects.size > 1) {
    return {
      hit: false,
      subject: null,
      rule: null,
      explanation: `认领业务「${claim}」对应多条不同科目，未自动采用，继续使用后续规则。`,
    };
  }

  const matched = usable[0];
  return {
    hit: true,
    subject: matched.subject,
    rule: matched,
    explanation: `按认领业务「${claim}」匹配业务规则。审批单规则与平台规则候选已保留但未生效。`,
  };
}
