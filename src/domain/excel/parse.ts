import * as XLSX from "xlsx";
import type { ExcelParseResult, ParsedExcelRow } from "../types";
import { cellToString } from "../matching/normalize";
import { mockAccount } from "../channel/accounts";

const REQUIRED_COLUMNS = [
  "平台",
  "账号",
  "检索字段",
  "检索关键词",
  "一级科目",
  "二级科目",
  "三级科目",
] as const;

function readCellAsString(sheet: XLSX.WorkSheet, cellAddress: string): string {
  const cell = sheet[cellAddress] as XLSX.CellObject | undefined;
  if (!cell) return "";
  if (cell.t === "s" || typeof cell.v === "string") {
    return cellToString(cell.v);
  }
  if (cell.w != null && String(cell.w).trim() !== "") {
    return String(cell.w);
  }
  if (typeof cell.v === "number") {
    const raw = String(cell.v);
    if (raw.includes("e") || raw.includes("E")) {
      return cell.w != null ? String(cell.w) : raw;
    }
    return raw;
  }
  return cellToString(cell.v);
}

export function parseRuleWorkbook(buffer: ArrayBuffer, meta: {
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}): ExcelParseResult {
  const workbook = XLSX.read(buffer, {
    type: "array",
    raw: true,
    cellText: true,
    dense: false,
  });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return {
      ...meta,
      rows: [],
      errors: ["Excel 中没有工作表"],
    };
  }

  const sheet = workbook.Sheets[sheetName];
  const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1");
  const headerMap = new Map<string, number>();

  for (let col = range.s.c; col <= range.e.c; col += 1) {
    const address = XLSX.utils.encode_cell({ r: range.s.r, c: col });
    const header = readCellAsString(sheet, address).trim();
    if (header) headerMap.set(header, col);
  }

  const missing = REQUIRED_COLUMNS.filter((name) => !headerMap.has(name));
  if (missing.length > 0) {
    return {
      ...meta,
      rows: [],
      errors: [`缺少必要列：${missing.join("、")}`],
    };
  }

  const rows: ParsedExcelRow[] = [];
  for (let r = range.s.r + 1; r <= range.e.r; r += 1) {
    const get = (name: (typeof REQUIRED_COLUMNS)[number]) =>
      readCellAsString(sheet, XLSX.utils.encode_cell({ r, c: headerMap.get(name)! }));
    const platform = get("平台");
    const account = get("账号");
    const searchField = get("检索字段");
    const keyword = get("检索关键词");
    const level1 = get("一级科目");
    const level2 = get("二级科目");
    const level3 = get("三级科目");
    if (![platform, account, searchField, keyword, level1, level2, level3].some((value) => value.trim())) {
      continue;
    }
    rows.push({
      excelRow: r + 1,
      platform,
      account: mockAccount(account),
      searchField,
      keyword,
      level1,
      level2,
      level3,
    });
  }

  return { ...meta, rows, errors: [] };
}
