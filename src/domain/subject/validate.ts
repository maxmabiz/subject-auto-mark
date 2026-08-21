import type { LedgerSubject, SubjectLevel } from "../types";
import { isBlank, normalizeText } from "../matching/normalize";
import { codeFollowsParent, isValidSubjectCode } from "./code";

export type SubjectDraft = {
  id?: string;
  code: string;
  name: string;
  level: SubjectLevel;
  parentId: string | null;
};

export function subjectChildren(subjects: LedgerSubject[], parentId: string): LedgerSubject[] {
  return subjects.filter((item) => item.parentId === parentId);
}

export function findSubject(subjects: LedgerSubject[], id: string | null | undefined): LedgerSubject | undefined {
  if (!id) return undefined;
  return subjects.find((item) => item.id === id);
}

export function validateSubjectDraft(draft: SubjectDraft, subjects: LedgerSubject[]): { ok: true; subject: Omit<LedgerSubject, "createdBy" | "createdAt" | "updatedAt"> } | { ok: false; message: string } {
  const code = draft.code.trim();
  const name = draft.name.trim();
  const existing = draft.id ? findSubject(subjects, draft.id) : undefined;

  if (isBlank(code)) return { ok: false, message: "科目编码必填" };
  if (isBlank(name)) return { ok: false, message: "科目名称必填" };
  if (!isValidSubjectCode(code)) return { ok: false, message: "科目编码仅允许字母和数字" };

  const level = existing?.level ?? draft.level;
  const parentId = existing ? existing.parentId : draft.parentId;

  if (existing && (draft.level !== existing.level || draft.parentId !== existing.parentId)) {
    return { ok: false, message: "级别和上级科目不可修改" };
  }

  if (level === 1 && parentId) return { ok: false, message: "一级科目不能有上级" };
  if (level !== 1 && !parentId) return { ok: false, message: "二级、三级科目必须选择上级" };

  const parent = findSubject(subjects, parentId);
  if (level === 2) {
    if (!parent || parent.level !== 1) return { ok: false, message: "二级科目必须归属一个一级科目" };
    if (!codeFollowsParent(code, parent.code)) return { ok: false, message: `二级编码必须以所属一级编码 ${parent.code} 为前缀` };
  }
  if (level === 3) {
    if (!parent || parent.level !== 2) return { ok: false, message: "三级科目必须归属一个二级科目" };
    if (!codeFollowsParent(code, parent.code)) return { ok: false, message: `三级编码必须以所属二级编码 ${parent.code} 为前缀` };
  }

  const dupCode = subjects.find((item) => item.id !== draft.id && normalizeText(item.code) === normalizeText(code));
  if (dupCode) return { ok: false, message: "科目编码已存在" };

  const dupName = subjects.find((item) => item.id !== draft.id && item.level === level && normalizeText(item.name) === normalizeText(name));
  if (dupName) return { ok: false, message: "同一级别科目名称不可重复" };

  return {
    ok: true,
    subject: {
      id: existing?.id ?? draft.id ?? "",
      code,
      name,
      level,
      parentId,
    },
  };
}

export function canDeleteSubject(subjects: LedgerSubject[], id: string): { ok: true } | { ok: false; message: string } {
  if (subjectChildren(subjects, id).length > 0) {
    return { ok: false, message: "存在下级科目，无法删除" };
  }
  return { ok: true };
}

export function sortSubjectsByCode(subjects: LedgerSubject[]): LedgerSubject[] {
  return [...subjects].sort((a, b) => a.code.localeCompare(b.code, "en"));
}

export const LEVEL_LABEL: Record<SubjectLevel, string> = {
  1: "一级",
  2: "二级",
  3: "三级",
};
