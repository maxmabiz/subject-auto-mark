import { describe, expect, it } from "vitest";
import { matchesDisplayStatus, toDisplayStatus } from "./constants";

describe("display match status", () => {
  it("maps engine statuses to 已匹配 / 未匹配 / 无法匹配", () => {
    expect(toDisplayStatus("auto_matched")).toBe("matched");
    expect(toDisplayStatus("feishu_matched")).toBe("matched");
    expect(toDisplayStatus("manual_marked")).toBe("matched");
    expect(toDisplayStatus("unmatched")).toBe("unmatched");
    expect(toDisplayStatus("rule_conflict")).toBe("unmatched");
    expect(toDisplayStatus("data_error")).toBe("unmatchable");
  });

  it("filters unmatched to include rule conflict but not data error", () => {
    expect(matchesDisplayStatus("unmatched", "unmatched")).toBe(true);
    expect(matchesDisplayStatus("rule_conflict", "unmatched")).toBe(true);
    expect(matchesDisplayStatus("auto_matched", "matched")).toBe(true);
    expect(matchesDisplayStatus("manual_marked", "matched")).toBe(true);
    expect(matchesDisplayStatus("data_error", "unmatched")).toBe(false);
    expect(matchesDisplayStatus("data_error", "unmatchable")).toBe(true);
    expect(matchesDisplayStatus("rule_conflict", "all")).toBe(true);
  });
});
