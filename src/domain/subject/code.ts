const CODE_PATTERN = /^[A-Za-z0-9]+$/;

export function isValidSubjectCode(code: string): boolean {
  return CODE_PATTERN.test(code.trim());
}

export function codeFollowsParent(code: string, parentCode: string): boolean {
  const child = code.trim();
  const parent = parentCode.trim();
  return Boolean(parent) && child.startsWith(parent) && child.length > parent.length;
}
