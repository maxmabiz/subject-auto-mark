import type { ApprovalRule, Rule, SubjectPath } from "./types";
import { subjectKey } from "./matching/normalize";

export function buildSubjectDictionary(rules: Rule[], approvalRules: ApprovalRule[] = []): SubjectPath[] {
  const map = new Map<string, SubjectPath>();
  for (const rule of rules) {
    if (rule.validationStatus === "error") continue;
    map.set(subjectKey(rule.subject), rule.subject);
  }
  for (const rule of approvalRules) {
    if (!rule.subject) continue;
    map.set(subjectKey(rule.subject), rule.subject);
  }
  return [...map.values()].sort((a, b) => subjectKey(a).localeCompare(subjectKey(b), "zh-CN"));
}

export function subjectTree(subjects: SubjectPath[]) {
  const level1 = [...new Set(subjects.map((item) => item.level1).filter(Boolean))];
  const level2By1 = new Map<string, string[]>();
  const level3By2 = new Map<string, string[]>();
  for (const subject of subjects) {
    const l2 = level2By1.get(subject.level1) ?? [];
    if (subject.level2 && !l2.includes(subject.level2)) l2.push(subject.level2);
    level2By1.set(subject.level1, l2);
    if (subject.level3) {
      const key = `${subject.level1}||${subject.level2}`;
      const l3 = level3By2.get(key) ?? [];
      if (!l3.includes(subject.level3)) l3.push(subject.level3);
      level3By2.set(key, l3);
    }
  }
  return { level1, level2By1, level3By2 };
}
