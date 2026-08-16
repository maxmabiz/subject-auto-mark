import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { CURRENT_USER, FALLBACK_EXCEL_ROWS, STORAGE_KEY, TEMPLATE_PATH } from "@/domain/constants";
import { parseRuleWorkbook } from "@/domain/excel/parse";
import { validateParsedRules } from "@/domain/excel/validate";
import { FALLBACK_APPROVAL_RULES, FALLBACK_APPROVAL_RULE_LOGS } from "@/data/approvalRules.seed";
import { seedChannelRuleLogs } from "@/data/channelRules.seed";
import type {
  ApprovalRule,
  ApprovalRuleLog,
  AuditLog,
  ChannelRuleLog,
  EnrichedTransaction,
  ManualMark,
  ParsedExcelRow,
  Rule,
  RuleVersion,
  SubjectPath,
} from "@/domain/types";
import { createSeedRecords } from "@/data/seed";
import { appendLog, enrichOne } from "./compute";
import { approvalMatchKey } from "@/domain/approval/match";
import { buildApprovalRuleLog } from "@/domain/approval/log";
import { channelMatchKey } from "@/domain/channel/match";
import { buildChannelRuleLog } from "@/domain/channel/log";
import { hydrateChannelRule } from "@/domain/channel/rule";

type PersistShape = {
  versions?: RuleVersion[];
  currentVersionId?: string;
  channelRules: Rule[];
  channelRuleLogs: ChannelRuleLog[];
  approvalRules: ApprovalRule[];
  approvalRuleLogs: ApprovalRuleLog[];
  records: EnrichedTransaction[];
  auditLogs: AuditLog[];
  updatedAt: string;
};

type AppStoreValue = {
  loading: boolean;
  error: string | null;
  records: EnrichedTransaction[];
  auditLogs: AuditLog[];
  updatedAt: string;
  rules: Rule[];
  approvalRules: ApprovalRule[];
  approvalLogsFor: (ruleId: string) => ApprovalRuleLog[];
  channelLogsFor: (ruleId: string) => ChannelRuleLog[];
  getRecord: (id: string) => EnrichedTransaction | undefined;
  logsFor: (transactionId: string) => AuditLog[];
  markManual: (id: string, payload: { subject: SubjectPath; reason: string }) => void;
  revokeManual: (id: string) => void;
  saveApprovalRule: (rule: ApprovalRule) => { ok: boolean; message: string };
  deleteApprovalRule: (id: string) => { ok: boolean; message: string };
  importApprovalRules: (rules: ApprovalRule[]) => { ok: boolean; message: string };
  saveChannelRule: (rule: Rule) => { ok: boolean; message: string };
  deleteChannelRule: (id: string) => { ok: boolean; message: string };
  importChannelRules: (rules: Rule[]) => { ok: boolean; message: string };
};

const AppStoreContext = createContext<AppStoreValue | null>(null);

async function loadExcelRows(): Promise<ParsedExcelRow[]> {
  try {
    const response = await fetch(TEMPLATE_PATH);
    if (!response.ok) throw new Error("template missing");
    const buffer = await response.arrayBuffer();
    const parsed = parseRuleWorkbook(buffer, {
      fileName: "科目匹配规则-原始配置.xlsx",
      fileSize: buffer.byteLength,
      uploadedAt: new Date().toISOString(),
    });
    if (parsed.errors.length || parsed.rows.length === 0) throw new Error(parsed.errors.join("；") || "empty");
    return parsed.rows;
  } catch {
    return FALLBACK_EXCEL_ROWS;
  }
}

function bootstrapState(rows: ParsedExcelRow[]): PersistShape {
  const validated = validateParsedRules(rows, "");
  const channelRules = validated.rules
    .filter((rule) => rule.validationStatus !== "error")
    .map((rule) => hydrateChannelRule(rule));
  const channelRuleLogs = seedChannelRuleLogs(channelRules);
  const seed = createSeedRecords();
  const records = seed.map((item) =>
    enrichOne(item.transaction, item.manual, item.feishu, channelRules, FALLBACK_APPROVAL_RULES, ""),
  );
  const auditLogs: AuditLog[] = seed.flatMap((item, index) =>
    (item.logs.length
      ? item.logs
      : [
          {
            transactionId: item.transaction.id,
            time: item.transaction.transactionTime,
            actor: "系统",
            action: "流水创建时间",
            fromSubject: null,
            toSubject: null,
            fromSource: null,
            toSource: "none" as const,
            reason: "渠道流水同步",
          },
        ]
    ).map((log, logIndex) => ({ ...log, id: `seed-${index}-${logIndex}` })),
  );
  return {
    channelRules,
    channelRuleLogs,
    approvalRules: FALLBACK_APPROVAL_RULES,
    approvalRuleLogs: FALLBACK_APPROVAL_RULE_LOGS,
    records,
    auditLogs,
    updatedAt: new Date().toISOString(),
  };
}

function readPersist(): PersistShape | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistShape;
    if (!Array.isArray(parsed.approvalRules)) parsed.approvalRules = FALLBACK_APPROVAL_RULES;
    parsed.approvalRules = parsed.approvalRules.map((item) => ({
      ...item,
      createdAt: item.createdAt || "2026-08-01T02:00:00.000Z",
      updatedAt: item.updatedAt || item.createdAt || "2026-08-01T02:00:00.000Z",
      matchedCountT1: item.matchedCountT1 ?? 0,
    }));
    if (!Array.isArray(parsed.approvalRuleLogs)) {
      parsed.approvalRuleLogs = parsed.approvalRules.map((item) =>
        buildApprovalRuleLog({
          id: `arlog-${item.id}-create`,
          ruleId: item.id,
          time: item.createdAt,
          actor: "系统",
          action: "create",
          after: item,
        }),
      );
    }
    if (!Array.isArray(parsed.channelRules)) {
      const versions = parsed.versions ?? [];
      const current = versions.find((item) => item.id === parsed.currentVersionId) ?? versions[0];
      parsed.channelRules = (current?.rules ?? []).filter((item) => item.validationStatus !== "error");
    }
    parsed.channelRules = parsed.channelRules.map(hydrateChannelRule);
    if (!Array.isArray(parsed.channelRuleLogs)) {
      parsed.channelRuleLogs = parsed.channelRules.map((item) =>
        buildChannelRuleLog({
          id: `crlog-${item.id}-create`,
          ruleId: item.id,
          time: item.createdAt,
          actor: "系统",
          action: "create",
          after: item,
        }),
      );
    }
    return parsed;
  } catch {
    return null;
  }
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistShape | null>(readPersist);
  const [loading, setLoading] = useState(!state);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (state) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  useEffect(() => {
    if (state) return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await loadExcelRows();
        if (cancelled) return;
        setState(bootstrapState(rows));
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "初始化失败");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state]);

  const persist = useCallback((updater: (prev: PersistShape) => PersistShape) => {
    setState((prev) => {
      if (!prev) return prev;
      return { ...updater(prev), updatedAt: new Date().toISOString() };
    });
  }, []);

  const value = useMemo<AppStoreValue>(() => {
    const records = state?.records ?? [];
    const auditLogs = state?.auditLogs ?? [];
    const rules = state?.channelRules ?? [];
    const approvalRules = state?.approvalRules ?? [];
    const approvalRuleLogs = state?.approvalRuleLogs ?? [];
    const channelRuleLogs = state?.channelRuleLogs ?? [];

    return {
      loading,
      error,
      records,
      auditLogs,
      updatedAt: state?.updatedAt ?? "",
      rules,
      approvalRules,
      approvalLogsFor: (ruleId) =>
        approvalRuleLogs
          .filter((item) => item.ruleId === ruleId)
          .sort((a, b) => b.time.localeCompare(a.time)),
      channelLogsFor: (ruleId) =>
        channelRuleLogs
          .filter((item) => item.ruleId === ruleId)
          .sort((a, b) => b.time.localeCompare(a.time)),
      getRecord: (id) => records.find((item) => item.transaction.id === id),
      logsFor: (transactionId) =>
        auditLogs
          .filter((item) => item.transactionId === transactionId)
          .sort((a, b) => b.time.localeCompare(a.time)),
      markManual: (id, payload) => {
        persist((prev) => {
          const recordsNext = prev.records.map((record) => {
            if (record.transaction.id !== id) return record;
            const manual: ManualMark = {
              subject: payload.subject,
              reason: payload.reason,
              locked: true,
              operator: CURRENT_USER,
              markedAt: new Date().toISOString(),
            };
            const next = enrichOne(record.transaction, manual, record.feishu, prev.channelRules ?? [], prev.approvalRules ?? [], "", record, true);
            return next;
          });
          const before = prev.records.find((item) => item.transaction.id === id);
          const after = recordsNext.find((item) => item.transaction.id === id);
          return {
            ...prev,
            records: recordsNext,
            auditLogs: appendLog(prev.auditLogs, {
              transactionId: id,
              time: new Date().toISOString(),
              actor: CURRENT_USER,
              action: "财务人工修改",
              fromSubject: before?.final.subject ?? null,
              toSubject: after?.final.subject ?? payload.subject,
              fromSource: before?.final.source ?? null,
              toSource: "manual",
              reason: payload.reason,
            }),
          };
        });
        toast.success("人工标记已保存");
      },
      revokeManual: (id) => {
        persist((prev) => {
          const recordsNext = prev.records.map((record) => {
            if (record.transaction.id !== id || !record.manual) return record;
            return enrichOne(record.transaction, null, record.feishu, prev.channelRules ?? [], prev.approvalRules ?? [], "", record, true);
          });
          const before = prev.records.find((item) => item.transaction.id === id);
          const after = recordsNext.find((item) => item.transaction.id === id);
          return {
            ...prev,
            records: recordsNext,
            auditLogs: appendLog(prev.auditLogs, {
              transactionId: id,
              time: new Date().toISOString(),
              actor: CURRENT_USER,
              action: "撤销人工标记并回退",
              fromSubject: before?.final.subject ?? null,
              toSubject: after?.final.subject ?? null,
              fromSource: before?.final.source ?? null,
              toSource: after?.final.source ?? null,
              reason: `撤销人工标记后回退为${after?.final.source === "feishu" ? "飞书审批" : after?.final.source === "channel" ? "平台规则" : "待处理"}结果`,
            }),
          };
        });
        toast.success("已撤销人工标记并重新计算");
      },
      saveChannelRule: (rule) => {
        if (!rule.platform.trim() || !rule.account.trim() || !rule.searchField.trim() || !rule.keyword.trim() || !rule.subject.level1.trim() || !rule.subject.level2.trim()) {
          const message = "平台、账号、检索字段、关键词、一级科目和二级科目必填";
          toast.error(message);
          return { ok: false, message };
        }
        if (rule.validationStatus === "error") {
          const message = rule.errors[0] || "规则不完整，无法保存";
          toast.error(message);
          return { ok: false, message };
        }
        const key = channelMatchKey(rule.platform, rule.account, rule.searchField, rule.keyword);
        const dup = (state?.channelRules ?? []).find((item) => item.id !== rule.id && channelMatchKey(item.platform, item.account, item.searchField, item.keyword) === key);
        if (dup) {
          const message = "平台、账号、检索字段与关键词已存在，无法保存";
          toast.error(message);
          return { ok: false, message };
        }
        persist((prev) => {
          const exists = prev.channelRules.find((item) => item.id === rule.id);
          const now = new Date().toISOString();
          const next = {
            ...rule,
            createdAt: exists?.createdAt ?? rule.createdAt ?? now,
            updatedAt: now,
            matchedCountT1: exists?.matchedCountT1 ?? rule.matchedCountT1 ?? 0,
          };
          const log = buildChannelRuleLog({
            ruleId: next.id,
            time: now,
            actor: CURRENT_USER,
            action: exists ? "update" : "create",
            before: exists ?? null,
            after: next,
          });
          return {
            ...prev,
            channelRules: exists
              ? prev.channelRules.map((item) => (item.id === rule.id ? next : item))
              : [...prev.channelRules, next],
            channelRuleLogs: !exists || log.changes.length > 0 ? [log, ...(prev.channelRuleLogs ?? [])] : prev.channelRuleLogs,
          };
        });
        toast.success("已保存平台规则");
        return { ok: true, message: "已保存平台规则" };
      },
      deleteChannelRule: (id) => {
        persist((prev) => {
          const target = prev.channelRules.find((item) => item.id === id);
          if (!target) return prev;
          const now = new Date().toISOString();
          const log = buildChannelRuleLog({
            ruleId: id,
            time: now,
            actor: CURRENT_USER,
            action: "delete",
            before: target,
            after: null,
          });
          return {
            ...prev,
            channelRules: prev.channelRules.filter((item) => item.id !== id),
            channelRuleLogs: [log, ...(prev.channelRuleLogs ?? [])],
          };
        });
        toast.success("已删除平台规则");
        return { ok: true, message: "已删除" };
      },
      importChannelRules: (incoming) => {
        const records = state?.records ?? [];
        const inUseIds = new Set(records.filter((item) => item.final.source === "channel" && item.final.matchedRuleId).map((item) => item.final.matchedRuleId!));
        persist((prev) => {
          const now = new Date().toISOString();
          const byKey = new Map(prev.channelRules.map((item) => [channelMatchKey(item.platform, item.account, item.searchField, item.keyword), item]));
          const merged = incoming.map((rule) => {
            const existing = byKey.get(channelMatchKey(rule.platform, rule.account, rule.searchField, rule.keyword));
            return hydrateChannelRule({
              ...rule,
              id: existing?.id ?? rule.id,
              createdAt: existing?.createdAt ?? now,
              updatedAt: now,
              matchedCountT1: existing?.matchedCountT1 ?? rule.matchedCountT1 ?? 0,
            });
          });
          const kept = prev.channelRules.filter((item) => inUseIds.has(item.id) && !incoming.some((next) => next.id === item.id || channelMatchKey(next.platform, next.account, next.searchField, next.keyword) === channelMatchKey(item.platform, item.account, item.searchField, item.keyword)));
          for (const item of kept) merged.push(item);
          const logs = merged.flatMap((rule) => {
            const existing = byKey.get(channelMatchKey(rule.platform, rule.account, rule.searchField, rule.keyword));
            if (existing && existing.keyword === rule.keyword && JSON.stringify(existing.subject) === JSON.stringify(rule.subject) && existing.platform === rule.platform && existing.account === rule.account && existing.searchField === rule.searchField) {
              return [];
            }
            return [
              buildChannelRuleLog({
                ruleId: rule.id,
                time: now,
                actor: CURRENT_USER,
                action: "import",
                before: existing ?? null,
                after: rule,
              }),
            ];
          });
          return { ...prev, channelRules: merged, channelRuleLogs: [...logs, ...(prev.channelRuleLogs ?? [])] };
        });
        toast.success(`已导入 ${incoming.length} 条平台规则`);
        return { ok: true, message: "已导入" };
      },
      saveApprovalRule: (rule) => {
        if (!rule.approvalName.trim() || !rule.templateId.trim() || !rule.paymentType.trim() || !rule.subject?.level1.trim()) {
          const message = "审批单名称、模板ID、付款申请类型和一级科目必填";
          toast.error(message);
          return { ok: false, message };
        }
        const key = approvalMatchKey(rule.templateId, rule.paymentType);
        const dup = (state?.approvalRules ?? []).find((item) => item.id !== rule.id && approvalMatchKey(item.templateId, item.paymentType) === key);
        if (dup) {
          const message = "模板ID与付款申请类型已存在，无法保存";
          toast.error(message);
          return { ok: false, message };
        }
        persist((prev) => {
          const exists = prev.approvalRules.find((item) => item.id === rule.id);
          const now = new Date().toISOString();
          const next = {
            ...rule,
            createdAt: exists?.createdAt ?? rule.createdAt ?? now,
            updatedAt: now,
            matchedCountT1: exists?.matchedCountT1 ?? rule.matchedCountT1 ?? 0,
          };
          const log = buildApprovalRuleLog({
            ruleId: next.id,
            time: now,
            actor: CURRENT_USER,
            action: exists ? "update" : "create",
            before: exists ?? null,
            after: next,
          });
          return {
            ...prev,
            approvalRules: exists
              ? prev.approvalRules.map((item) => (item.id === rule.id ? next : item))
              : [...prev.approvalRules, next],
            approvalRuleLogs: !exists || log.changes.length > 0 ? [log, ...(prev.approvalRuleLogs ?? [])] : prev.approvalRuleLogs,
          };
        });
        toast.success("已保存审批单规则");
        return { ok: true, message: "已保存审批单规则" };
      },
      deleteApprovalRule: (id) => {
        persist((prev) => {
          const target = prev.approvalRules.find((item) => item.id === id);
          if (!target) return prev;
          const now = new Date().toISOString();
          const log = buildApprovalRuleLog({
            ruleId: id,
            time: now,
            actor: CURRENT_USER,
            action: "delete",
            before: target,
            after: null,
          });
          return {
            ...prev,
            approvalRules: prev.approvalRules.filter((item) => item.id !== id),
            approvalRuleLogs: [log, ...(prev.approvalRuleLogs ?? [])],
          };
        });
        toast.success("已删除审批单规则");
        return { ok: true, message: "已删除" };
      },
      importApprovalRules: (rules) => {
        const records = state?.records ?? [];
        const inUseIds = new Set(records.filter((item) => item.final.source === "feishu" && item.final.matchedRuleId).map((item) => item.final.matchedRuleId!));
        persist((prev) => {
          const now = new Date().toISOString();
          const byKey = new Map(prev.approvalRules.map((item) => [approvalMatchKey(item.templateId, item.paymentType), item]));
          const merged = rules.map((rule) => {
            const existing = byKey.get(approvalMatchKey(rule.templateId, rule.paymentType));
            return {
              ...rule,
              id: existing?.id ?? rule.id,
              createdAt: existing?.createdAt ?? now,
              updatedAt: now,
              matchedCountT1: existing?.matchedCountT1 ?? rule.matchedCountT1 ?? 0,
            };
          });
          const kept = prev.approvalRules.filter((item) => inUseIds.has(item.id) && !rules.some((next) => next.id === item.id || approvalMatchKey(next.templateId, next.paymentType) === approvalMatchKey(item.templateId, item.paymentType)));
          for (const item of kept) merged.push(item);
          const logs = merged.flatMap((rule) => {
            const existing = byKey.get(approvalMatchKey(rule.templateId, rule.paymentType));
            if (existing && existing.approvalName === rule.approvalName && JSON.stringify(existing.subject) === JSON.stringify(rule.subject)) {
              return [];
            }
            return [
              buildApprovalRuleLog({
                ruleId: rule.id,
                time: now,
                actor: CURRENT_USER,
                action: "import",
                before: existing ?? null,
                after: rule,
              }),
            ];
          });
          return { ...prev, approvalRules: merged, approvalRuleLogs: [...logs, ...(prev.approvalRuleLogs ?? [])] };
        });
        toast.success(`已导入 ${rules.length} 条审批单规则`);
        return { ok: true, message: "已导入" };
      },
    };
  }, [error, loading, persist, state]);

  return createElement(AppStoreContext.Provider, { value }, children);
}

export function useAppStore() {
  const value = useContext(AppStoreContext);
  if (!value) throw new Error("useAppStore must be used within AppStoreProvider");
  return value;
}
