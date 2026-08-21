import type { ApprovalRuleChange, LedgerSubject, SubjectLog, SubjectLogAction } from "../types";

export const SUBJECT_LOG_ACTION_LABEL: Record<SubjectLogAction, string> = {
  create: "新增科目",
  update: "编辑科目",
  delete: "删除科目",
};

function dash(value: string | null | undefined): string {
  const text = (value ?? "").trim();
  return text || "—";
}

export function subjectFieldValues(subject: LedgerSubject): { field: string; value: string }[] {
  return [
    { field: "科目编码", value: dash(subject.code) },
    { field: "科目名称", value: dash(subject.name) },
  ];
}

export function diffSubject(before: LedgerSubject | null, after: LedgerSubject | null): ApprovalRuleChange[] {
  const from = before ? subjectFieldValues(before) : [];
  const to = after ? subjectFieldValues(after) : [];
  const fields = [...new Set([...from, ...to].map((item) => item.field))];
  const fromMap = new Map(from.map((item) => [item.field, item.value]));
  const toMap = new Map(to.map((item) => [item.field, item.value]));
  return fields.flatMap((field) => {
    const prev = fromMap.get(field) ?? "—";
    const next = toMap.get(field) ?? "—";
    if (prev === next) return [];
    return [{ field, from: prev, to: next }];
  });
}

export function buildSubjectLog(input: {
  id?: string;
  subjectId: string;
  time?: string;
  actor: string;
  action: SubjectLogAction;
  before?: LedgerSubject | null;
  after?: LedgerSubject | null;
  summary?: string;
}): SubjectLog {
  const changes = diffSubject(input.before ?? null, input.after ?? null);
  return {
    id: input.id ?? `slog-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    subjectId: input.subjectId,
    time: input.time ?? new Date().toISOString(),
    actor: input.actor,
    action: input.action,
    summary: input.summary ?? defaultSummary(input.action, input.after ?? input.before ?? null, changes),
    changes,
  };
}

function defaultSummary(action: SubjectLogAction, subject: LedgerSubject | null, changes: ApprovalRuleChange[]): string {
  if (action === "create") return `新增 ${subject?.code ?? ""} ${subject?.name ?? ""}`.trim();
  if (action === "delete") return `删除 ${subject?.code ?? ""} ${subject?.name ?? ""}`.trim();
  if (changes.length === 0) return "字段无变化";
  return changes.map((item) => item.field).join("、");
}
