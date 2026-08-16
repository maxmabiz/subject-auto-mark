import { describe, expect, it } from "vitest";
import { APPROVAL_TEMPLATE_IDS } from "@/data/approvalRules.seed";
import { mockTemplateId } from "./templateId";

describe("mockTemplateId", () => {
  it("生成 32 位字母数字，且与种子模板ID保持一致", () => {
    for (const [name, id] of Object.entries(APPROVAL_TEMPLATE_IDS)) {
      expect(id).toHaveLength(32);
      expect(id).toMatch(/^[0-9a-z]{32}$/);
      expect(mockTemplateId(name)).toBe(id);
    }
  });
});
