import { describe, expect, it } from "vitest";
import type { LedgerSubject } from "../types";
import { canDeleteSubject, validateSubjectDraft } from "./validate";

function subject(partial: Partial<LedgerSubject> & Pick<LedgerSubject, "id" | "code" | "name" | "level">): LedgerSubject {
  return {
    parentId: null,
    createdBy: "系统",
    createdAt: "2026-08-01T02:00:00.000Z",
    updatedAt: "2026-08-01T02:00:00.000Z",
    ...partial,
  };
}

const l1 = subject({ id: "s1", code: "1001", name: "资金转账", level: 1 });
const l2 = subject({ id: "s2", code: "100101", name: "资金转账-收款", level: 2, parentId: "s1" });
const list = [l1, l2];

describe("validateSubjectDraft", () => {
  it("rejects blank code or name", () => {
    expect(validateSubjectDraft({ code: "", name: "资金转账", level: 1, parentId: null }, []).ok).toBe(false);
    expect(validateSubjectDraft({ code: "1001", name: "  ", level: 1, parentId: null }, []).ok).toBe(false);
  });

  it("rejects non alphanumeric codes", () => {
    expect(validateSubjectDraft({ code: "10-01", name: "资金转账", level: 1, parentId: null }, []).ok).toBe(false);
  });

  it("rejects duplicate code and same-level name", () => {
    expect(validateSubjectDraft({ code: "1001", name: "其他", level: 1, parentId: null }, list).ok).toBe(false);
    expect(validateSubjectDraft({ code: "2001", name: "资金转账", level: 1, parentId: null }, list).ok).toBe(false);
    expect(validateSubjectDraft({ code: "100102", name: "资金转账-收款", level: 2, parentId: "s1" }, list).ok).toBe(false);
  });

  it("allows same name on a different level", () => {
    const result = validateSubjectDraft({ code: "100199", name: "资金转账", level: 2, parentId: "s1" }, list);
    expect(result.ok).toBe(true);
  });

  it("requires child code to start with parent code", () => {
    expect(validateSubjectDraft({ code: "200101", name: "资金转账-付款", level: 2, parentId: "s1" }, list).ok).toBe(false);
    expect(validateSubjectDraft({ code: "100102", name: "资金转账-付款", level: 2, parentId: "s1" }, list).ok).toBe(true);
  });

  it("forbids changing parent or level on edit", () => {
    const result = validateSubjectDraft({ id: "s2", code: "100101", name: "资金转账-收款", level: 1, parentId: null }, list);
    expect(result.ok).toBe(false);
  });
});

describe("canDeleteSubject", () => {
  it("blocks delete when children exist", () => {
    expect(canDeleteSubject(list, "s1").ok).toBe(false);
    expect(canDeleteSubject(list, "s2").ok).toBe(true);
  });
});
