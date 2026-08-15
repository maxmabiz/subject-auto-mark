import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { CURRENT_USER, FALLBACK_EXCEL_ROWS, STORAGE_KEY, TEMPLATE_PATH } from "@/domain/constants";
import { parseRuleWorkbook } from "@/domain/excel/parse";
import { diffRuleSets, validateParsedRules } from "@/domain/excel/validate";
import type {
  AuditLog,
  EnrichedTransaction,
  ManualMark,
  ParsedExcelRow,
  Rule,
  RuleVersion,
  SubjectPath,
} from "@/domain/types";
import { createSeedRecords } from "@/data/seed";
import { nextVersion, uid } from "@/lib/utils";
import { appendLog, enrichOne } from "./compute";

type PersistShape = {
  versions: RuleVersion[];
  currentVersionId: string;
  records: EnrichedTransaction[];
  auditLogs: AuditLog[];
  updatedAt: string;
};

type AppStoreValue = {
  loading: boolean;
  error: string | null;
  versions: RuleVersion[];
  currentVersion: RuleVersion | null;
  records: EnrichedTransaction[];
  auditLogs: AuditLog[];
  updatedAt: string;
  rules: Rule[];
  getRecord: (id: string) => EnrichedTransaction | undefined;
  logsFor: (transactionId: string) => AuditLog[];
  markManual: (id: string, payload: { subject: SubjectPath; reason: string; locked: boolean }) => void;
  unlockManual: (id: string) => void;
  publishRules: (input: {
    rows: ParsedExcelRow[];
    description: string;
    onlyValid: boolean;
    fileName: string;
  }) => RuleVersion;
  rollbackVersion: (versionId: string) => void;
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
  const versionNo = "V1.0.0";
  const validated = validateParsedRules(rows, versionNo);
  const version: RuleVersion = {
    id: "ver-1",
    version: versionNo,
    status: "active",
    publishedAt: "2026-08-01T02:00:00.000Z",
    publisher: CURRENT_USER,
    description: "导入业务方《科目匹配规则-原始配置》作为初始生效版本",
    totalRules: validated.total,
    validRules: validated.valid,
    errorRules: validated.error,
    warningRules: validated.warning,
    added: validated.valid,
    modified: 0,
    disabled: 0,
    platforms: [...new Set(validated.rules.filter((rule) => rule.validationStatus !== "error").map((rule) => rule.platform))],
    rules: validated.rules,
  };
  const seed = createSeedRecords();
  const records = seed.map((item) =>
    enrichOne(item.transaction, item.manual, item.feishu, version.rules, version.version),
  );
  const auditLogs: AuditLog[] = seed.flatMap((item, index) =>
    (item.logs.length
      ? item.logs
      : [
          {
            transactionId: item.transaction.id,
            time: item.transaction.transactionTime,
            actor: "系统",
            action: "流水进入系统",
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
    versions: [version],
    currentVersionId: version.id,
    records,
    auditLogs,
    updatedAt: new Date().toISOString(),
  };
}

function readPersist(): PersistShape | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistShape;
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
    const versions = state?.versions ?? [];
    const currentVersion = versions.find((item) => item.id === state?.currentVersionId) ?? versions[0] ?? null;
    const records = state?.records ?? [];
    const auditLogs = state?.auditLogs ?? [];
    const rules = currentVersion?.rules ?? [];

    return {
      loading,
      error,
      versions,
      currentVersion,
      records,
      auditLogs,
      updatedAt: state?.updatedAt ?? "",
      rules,
      getRecord: (id) => records.find((item) => item.transaction.id === id),
      logsFor: (transactionId) =>
        auditLogs
          .filter((item) => item.transactionId === transactionId)
          .sort((a, b) => b.time.localeCompare(a.time)),
      markManual: (id, payload) => {
        persist((prev) => {
          const version = prev.versions.find((item) => item.id === prev.currentVersionId);
          const recordsNext = prev.records.map((record) => {
            if (record.transaction.id !== id) return record;
            const manual: ManualMark = {
              subject: payload.subject,
              reason: payload.reason,
              locked: payload.locked,
              operator: CURRENT_USER,
              markedAt: new Date().toISOString(),
            };
            const next = enrichOne(record.transaction, manual, record.feishu, version?.rules ?? [], version?.version ?? "", record, true);
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
              action: payload.locked ? "财务人工修改并锁定" : "财务人工修改",
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
      unlockManual: (id) => {
        persist((prev) => {
          const version = prev.versions.find((item) => item.id === prev.currentVersionId);
          const recordsNext = prev.records.map((record) => {
            if (record.transaction.id !== id || !record.manual) return record;
            const manual = { ...record.manual, locked: false };
            return enrichOne(record.transaction, manual, record.feishu, version?.rules ?? [], version?.version ?? "", record, true);
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
              action: "解除人工锁定并回退",
              fromSubject: before?.final.subject ?? null,
              toSubject: after?.final.subject ?? null,
              fromSource: before?.final.source ?? null,
              toSource: after?.final.source ?? null,
              reason: `解除人工锁定后回退为${after?.final.source === "feishu" ? "飞书审批" : after?.final.source === "channel" ? "渠道规则" : "待处理"}结果`,
            }),
          };
        });
        toast.success("已解除人工锁定并重新计算");
      },
      publishRules: ({ rows, description, onlyValid, fileName }) => {
        let published!: RuleVersion;
        persist((prev) => {
          const current = prev.versions.find((item) => item.id === prev.currentVersionId);
          const versionNo = nextVersion(current?.version ?? "V1.0.0");
          const validated = validateParsedRules(rows, versionNo);
          const rulesToPublish = onlyValid
            ? validated.rules.map((rule) =>
                rule.validationStatus === "error" ? rule : { ...rule, version: versionNo },
              )
            : validated.rules.map((rule) => ({ ...rule, version: versionNo }));
          const diff = diffRuleSets(current?.rules ?? [], rulesToPublish);
          published = {
            id: uid("ver"),
            version: versionNo,
            status: "active",
            publishedAt: new Date().toISOString(),
            publisher: CURRENT_USER,
            description: description || `上传 ${fileName} 发布`,
            totalRules: validated.total,
            validRules: validated.valid,
            errorRules: validated.error,
            warningRules: validated.warning,
            added: diff.added,
            modified: diff.modified,
            disabled: diff.disabled,
            platforms: [...new Set(rulesToPublish.filter((rule) => rule.validationStatus !== "error").map((rule) => rule.platform))],
            rules: rulesToPublish,
          };
          const versions = prev.versions.map((item) => ({ ...item, status: "inactive" as const }));
          toast.success(`已发布 ${published.version}`);
          return {
            ...prev,
            versions: [published, ...versions],
            currentVersionId: published.id,
          };
        });
        return published;
      },
      rollbackVersion: (versionId) => {
        persist((prev) => {
          const target = prev.versions.find((item) => item.id === versionId);
          if (!target) return prev;
          toast.success(`已回滚到 ${target.version}`);
          return {
            ...prev,
            currentVersionId: target.id,
            versions: prev.versions.map((item) => ({
              ...item,
              status: item.id === target.id ? "active" : "inactive",
            })),
          };
        });
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
