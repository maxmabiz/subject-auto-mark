import type { MatchMode, SearchFieldName, Transaction } from "../types";

export const SEARCH_FIELD_MAP: Record<SearchFieldName, keyof Transaction> = {
  交易描述: "transactionDescription",
  备注: "note",
  业务类型: "businessType",
  "code 类型": "codeType",
  收款人姓名: "payeeName",
  "电商平台/支付网关": "paymentGateway",
  交易类型: "transactionType",
};

export const SUPPORTED_SEARCH_FIELDS = Object.keys(SEARCH_FIELD_MAP) as SearchFieldName[];

export const CONTAINS_FIELDS: SearchFieldName[] = ["交易描述", "备注"];

export const EXACT_FIELDS: SearchFieldName[] = [
  "code 类型",
  "业务类型",
  "交易类型",
  "收款人姓名",
  "电商平台/支付网关",
];

export const ALL_ACCOUNT_LABEL = "所有账户";

export function getMatchMode(searchField: string): MatchMode | null {
  if ((CONTAINS_FIELDS as string[]).includes(searchField)) return "contains";
  if ((EXACT_FIELDS as string[]).includes(searchField)) return "exact";
  return null;
}

export function getTransactionFieldValue(
  transaction: Transaction,
  searchField: string,
): string | null {
  const key = SEARCH_FIELD_MAP[searchField as SearchFieldName];
  if (!key) return null;
  const value = transaction[key];
  return typeof value === "string" ? value : String(value ?? "");
}

export function isSearchFieldSupported(searchField: string): searchField is SearchFieldName {
  return searchField in SEARCH_FIELD_MAP;
}
