export function mockTemplateId(name: string): string {
  let h = 2166136261;
  for (const char of name) h = Math.imul(h ^ char.charCodeAt(0), 16777619) >>> 0;
  let x = h || 1;
  let out = "";
  for (let i = 0; i < 32; i += 1) {
    x ^= x << 13;
    x >>>= 0;
    x ^= x >> 17;
    x >>>= 0;
    x ^= x << 5;
    x >>>= 0;
    out += (x % 36).toString(36);
  }
  return out;
}
