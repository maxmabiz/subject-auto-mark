import { describe, expect, it } from "vitest";
import { FALLBACK_EXCEL_ROWS } from "../constants";
import { validateParsedRules } from "./validate";

describe("excel rule validation", () => {
  it("识别全部78条规则，并将第42-46行标为无效", () => {
    const result = validateParsedRules(FALLBACK_EXCEL_ROWS, "V1.0.0");
    expect(result.total).toBe(78);
    expect(result.error).toBe(5);
    const invalidRows = result.rules.filter((rule) => rule.validationStatus === "error").map((rule) => rule.excelRow);
    expect(invalidRows).toEqual([42, 43, 44, 45, 46]);
    for (const rule of result.rules.filter((item) => item.excelRow >= 42 && item.excelRow <= 46)) {
      expect(rule.errors.some((message) => message.includes("检索字段为空"))).toBe(true);
    }
    expect(result.rules.find((rule) => rule.excelRow === 42)?.keyword).toBe("12150020237721230477174");
    expect(result.rules.find((rule) => rule.excelRow === 42)?.keyword).toHaveLength(23);
  });
});
