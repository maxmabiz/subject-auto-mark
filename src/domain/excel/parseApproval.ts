import * as XLSX from "xlsx";
import type { ApprovalRule } from "../types";
import { mockTemplateId } from "../approval/templateId";
import { cellToString, isBlank } from "../matching/normalize";

const REQUIRED_COLUMNS = ["飞书审批单名称", "付款申请类型", "一级科目"] as const;

function readCellAsString(sheet: XLSX.WorkSheet, cellAddress: string): string {
  const cell = sheet[cellAddress] as XLSX.CellObject | undefined;
  if (!cell) return "";
  if (cell.t === "s" || typeof cell.v === "string") return cellToString(cell.v).trim();
  if (cell.w != null && String(cell.w).trim() !== "") return String(cell.w).trim();
  return cellToString(cell.v).trim();
}

function toRule(input: {
  id: string;
  excelRow: number;
  seq: string;
  approvalName: string;
  templateId: string;
  paymentType: string;
  level1: string;
  level2: string;
  level3: string;
  createdAt?: string;
  updatedAt?: string;
  matchedCountT1?: number;
}): ApprovalRule {
  const errors: string[] = [];
  if (isBlank(input.approvalName)) errors.push("飞书审批单名称为空");
  if (isBlank(input.templateId)) errors.push("模板ID为空");
  if (isBlank(input.paymentType)) errors.push("付款申请类型为空");
  const validationStatus = errors.length ? "error" : input.level1 ? "valid" : "warning";
  if (!input.level1 && !errors.length) errors.push("未配置科目，匹配时回退渠道规则");
  const createdAt = input.createdAt || new Date().toISOString();
  return {
    id: input.id,
    excelRow: input.excelRow,
    seq: input.seq,
    approvalName: input.approvalName,
    templateId: input.templateId,
    paymentType: input.paymentType,
    subject: input.level1 ? { level1: input.level1, level2: input.level2, level3: input.level3 || null } : null,
    validationStatus,
    errors,
    createdAt,
    updatedAt: input.updatedAt || createdAt,
    matchedCountT1: input.matchedCountT1 ?? 0,
  };
}

export function parseApprovalWorkbook(buffer: ArrayBuffer): { rules: ApprovalRule[]; errors: string[] } {
  const workbook = XLSX.read(buffer, { type: "array", raw: true, cellText: true, dense: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { rules: [], errors: ["Excel 中没有工作表"] };
  const sheet = workbook.Sheets[sheetName];
  const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1");
  const headerMap = new Map<string, number>();
  for (let col = range.s.c; col <= range.e.c; col += 1) {
    const header = readCellAsString(sheet, XLSX.utils.encode_cell({ r: range.s.r, c: col }));
    if (header) headerMap.set(header, col);
  }
  const missing = REQUIRED_COLUMNS.filter((name) => !headerMap.has(name));
  if (missing.length > 0) return { rules: [], errors: [`缺少必要列：${missing.join("、")}`] };

  const get = (row: number, name: string) => {
    const col = headerMap.get(name);
    if (col == null) return "";
    return readCellAsString(sheet, XLSX.utils.encode_cell({ r: row, c: col }));
  };

  let lastSeq = "";
  let lastName = "";
  let lastTemplateId = "";
  const nameToId = new Map<string, string>();
  const rules: ApprovalRule[] = [];

  for (let r = range.s.r + 1; r <= range.e.r; r += 1) {
    const seq = get(r, "序号");
    const name = get(r, "飞书审批单名称");
    const templateFromFile = get(r, "飞书审批单模板ID");
    const paymentType = get(r, "付款申请类型");
    const level1 = get(r, "一级科目");
    const level2 = get(r, "二级科目");
    const level3 = get(r, "三级科目");
    if (seq) lastSeq = seq;
    if (name) {
      lastName = name;
      if (!nameToId.has(name)) {
        nameToId.set(name, templateFromFile.length === 32 ? templateFromFile : mockTemplateId(name));
      }
      lastTemplateId = nameToId.get(name)!;
    }
    if (!paymentType && !level1 && !name) continue;
    rules.push(
      toRule({
        id: `AR${String(r + 1).padStart(3, "0")}`,
        excelRow: r + 1,
        seq: lastSeq,
        approvalName: lastName,
        templateId: lastTemplateId,
        paymentType,
        level1,
        level2,
        level3,
      }),
    );
  }

  return { rules, errors: rules.length ? [] : ["没有解析到审批单规则"] };
}

export function buildApprovalRule(input: {
  id?: string;
  excelRow?: number;
  seq?: string;
  approvalName: string;
  templateId: string;
  paymentType: string;
  level1: string;
  level2: string;
  level3: string;
}): ApprovalRule {
  return toRule({
    id: input.id ?? `AR-${Date.now().toString(36)}`,
    excelRow: input.excelRow ?? 0,
    seq: input.seq ?? "",
    approvalName: input.approvalName.trim(),
    templateId: input.templateId.trim(),
    paymentType: input.paymentType.trim(),
    level1: input.level1.trim(),
    level2: input.level2.trim(),
    level3: input.level3.trim(),
  });
}
