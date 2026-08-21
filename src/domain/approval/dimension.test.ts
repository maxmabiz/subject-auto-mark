import { describe, expect, it } from "vitest";
import { formatOtherDimension, independentStationDimension } from "./dimension";

describe("other dimension", () => {
  it("把是否独立站转成 独立站=是/否", () => {
    expect(independentStationDimension("是")).toBe("独立站=是");
    expect(independentStationDimension("否")).toBe("独立站=否");
    expect(independentStationDimension("")).toBe("");
  });

  it("已是 维度=值 时原样规范化", () => {
    expect(formatOtherDimension("独立站", "独立站 = 是")).toBe("独立站=是");
  });
});
