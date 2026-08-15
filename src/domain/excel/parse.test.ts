import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseRuleWorkbook } from "./parse";
import { validateParsedRules } from "./validate";

describe("excel parse", () => {
  it("解析附件中的78条规则并保留23位数字关键词", () => {
    const filePath = path.resolve(process.cwd(), "public/templates/科目匹配规则-原始配置.xlsx");
    const buffer = readFileSync(filePath);
    const parsed = parseRuleWorkbook(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength), {
      fileName: "科目匹配规则-原始配置.xlsx",
      fileSize: buffer.byteLength,
      uploadedAt: "2026-08-15T00:00:00.000Z",
    });
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toHaveLength(78);
    const row42 = parsed.rows.find((row) => row.excelRow === 42);
    expect(row42?.keyword).toBe("12150020237721230477174");
    expect(row42?.keyword).toHaveLength(23);
    expect(row42?.searchField).toBe("");
    const validated = validateParsedRules(parsed.rows, "V1.0.0");
    expect(validated.error).toBe(5);
    expect(validated.rules.filter((rule) => rule.excelRow >= 42 && rule.excelRow <= 46).every((rule) => rule.validationStatus === "error")).toBe(true);
  });
});
