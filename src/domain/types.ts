export type MatchStatus =
  | "auto_matched"
  | "feishu_matched"
  | "manual_marked"
  | "unmatched"
  | "rule_conflict"
  | "data_error";

export type MatchSource = "manual" | "feishu" | "channel" | "none";

export type Direction = "in" | "out";

export type SearchFieldName =
  | "交易描述"
  | "备注"
  | "业务类型"
  | "code 类型"
  | "收款人姓名"
  | "电商平台/支付网关"
  | "交易类型";

export type MatchMode = "contains" | "exact";

export type RuleValidationStatus = "valid" | "error" | "warning";

export interface SubjectPath {
  level1: string;
  level2: string;
  level3: string | null;
}

export interface Transaction {
  id: string;
  transactionNo: string;
  platform: string;
  account: string;
  transactionTime: string;
  amount: number;
  currency: string;
  direction: Direction;
  transactionDescription: string;
  note: string;
  businessType: string;
  codeType: string;
  payeeName: string;
  paymentGateway: string;
  transactionType: string;
  feishuApprovalId: string;
}

export interface Rule {
  id: string;
  excelRow: number;
  platform: string;
  account: string;
  searchField: string;
  keyword: string;
  subject: SubjectPath;
  matchMode: MatchMode | null;
  explicitPriority: number;
  validationStatus: RuleValidationStatus;
  errors: string[];
  warnings: string[];
  version: string;
}

export interface RuleVersion {
  id: string;
  version: string;
  status: "active" | "inactive";
  publishedAt: string;
  publisher: string;
  description: string;
  totalRules: number;
  validRules: number;
  errorRules: number;
  warningRules: number;
  added: number;
  modified: number;
  disabled: number;
  platforms: string[];
  rules: Rule[];
}

export interface FeishuApprovalResult {
  approvalId: string;
  approvalType: string;
  transactionNo: string;
  subject: SubjectPath;
  matchedAt: string;
}

export interface ManualMark {
  subject: SubjectPath;
  reason: string;
  locked: boolean;
  operator: string;
  markedAt: string;
}

export interface ChannelCandidate {
  ruleId: string;
  excelRow: number;
  platform: string;
  account: string;
  searchField: string;
  keyword: string;
  matchMode: MatchMode;
  subject: SubjectPath;
  rankScore: {
    accountSpecific: number;
    exactMatch: number;
    keywordLength: number;
    explicitPriority: number;
  };
}

export interface ChannelRuleResult {
  status: "matched" | "unmatched" | "conflict" | "data_error";
  subject: SubjectPath | null;
  matchedRuleId: string | null;
  matchedField: string | null;
  matchedKeyword: string | null;
  matchedRawValue: string | null;
  candidates: ChannelCandidate[];
  explanation: string;
  errors: string[];
}

export interface FinalMatchResult {
  transactionId: string;
  status: MatchStatus;
  source: MatchSource;
  subject: SubjectPath | null;
  matchedRuleId: string | null;
  ruleVersion: string | null;
  matchedField: string | null;
  matchedKeyword: string | null;
  matchedRawValue: string | null;
  updatedAt: string;
  locked: boolean;
  explanation: string;
}

export interface EnrichedTransaction {
  transaction: Transaction;
  manual: ManualMark | null;
  feishu: FeishuApprovalResult | null;
  channel: ChannelRuleResult;
  final: FinalMatchResult;
}

export interface AuditLog {
  id: string;
  transactionId: string;
  time: string;
  actor: string;
  action: string;
  fromSubject: SubjectPath | null;
  toSubject: SubjectPath | null;
  fromSource: MatchSource | null;
  toSource: MatchSource | null;
  reason: string;
}

export interface ParsedExcelRow {
  excelRow: number;
  platform: string;
  account: string;
  searchField: string;
  keyword: string;
  level1: string;
  level2: string;
  level3: string;
}

export interface ExcelParseResult {
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  rows: ParsedExcelRow[];
  errors: string[];
}

export interface RuleValidationResult {
  rules: Rule[];
  total: number;
  valid: number;
  error: number;
  warning: number;
}

export interface RematchPreview {
  total: number;
  rematchable: number;
  skippedLocked: number;
  newlyMarked: number;
  subjectChanged: number;
  unmatched: number;
  conflict: number;
}
