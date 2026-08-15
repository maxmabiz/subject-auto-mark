export function normalizeText(value: string | null | undefined): string {
  if (value == null) return "";
  return String(value).trim().toLowerCase().replace(/\s+/g, " ");
}

export function cellToString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "";
    if (Number.isInteger(value) && Math.abs(value) >= 1e15) {
      return BigInt(value).toString();
    }
    return String(value);
  }
  return String(value);
}

export function isBlank(value: string | null | undefined): boolean {
  return normalizeText(value) === "";
}

export function subjectKey(subject: {
  level1: string;
  level2: string;
  level3: string | null;
}): string {
  return [subject.level1, subject.level2, subject.level3 ?? ""].join(" / ");
}

export function formatSubject(subject: {
  level1: string;
  level2: string;
  level3: string | null;
} | null): string {
  if (!subject) return "—";
  return [subject.level1, subject.level2, subject.level3]
    .filter((part) => part && part.trim())
    .join(" / ");
}

export function sameSubject(
  a: { level1: string; level2: string; level3: string | null } | null,
  b: { level1: string; level2: string; level3: string | null } | null,
): boolean {
  if (!a || !b) return false;
  return subjectKey(a) === subjectKey(b);
}
