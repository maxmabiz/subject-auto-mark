import { describe, expect, it } from "vitest";
import { matchesDisplayStatus, toDisplayStatus } from "./constants";

describe("display match status", () => {
  it("maps rule conflict to unmatched and data error to unmatchable", () => {
    expect(toDisplayStatus("rule_conflict")).toBe("unmatched");
    expect(toDisplayStatus("data_error")).toBe("unmatchable");
    expect(toDisplayStatus("unmatched")).toBe("unmatched");
    expect(toDisplayStatus("auto_matched")).toBe("auto_matched");
  });

  it("filters unmatched to include rule conflict but not data error", () => {
    expect(matchesDisplayStatus("unmatched", "unmatched")).toBe(true);
    expect(matchesDisplayStatus("rule_conflict", "unmatched")).toBe(true);
    expect(matchesDisplayStatus("data_error", "unmatched")).toBe(false);
    expect(matchesDisplayStatus("data_error", "unmatchable")).toBe(true);
    expect(matchesDisplayStatus("rule_conflict", "all")).toBe(true);
  });
});
