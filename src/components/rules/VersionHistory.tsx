import { useState } from "react";
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { formatDateTime } from "@/lib/format";
import { useAppStore } from "@/store/AppStore";
import type { RuleVersion } from "@/domain/types";

export function VersionHistory({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { versions, rollbackVersion } = useAppStore();
  const [detail, setDetail] = useState<RuleVersion | null>(null);
  const [rollbackId, setRollbackId] = useState<string | null>(null);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title="规则版本历史">
        <div className="flex-1 overflow-auto px-5 py-4">
          <div className="space-y-3">
            {versions.map((version) => (
              <div key={version.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{version.version} · {version.status === "active" ? "生效中" : "未生效"}</div>
                    <div className="mt-1 text-sm text-muted">{formatDateTime(version.publishedAt)} · {version.publisher}</div>
                    <p className="mt-2 text-sm">{version.description}</p>
                    <div className="mt-2 text-xs text-muted">
                      总 {version.totalRules} / 有效 {version.validRules} / 错误 {version.errorRules} · 新增 {version.added} · 修改 {version.modified} · 停用 {version.disabled}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setDetail(version)}>查看详情</Button>
                    {version.status !== "active" ? (
                      <Button size="sm" variant="outline" onClick={() => setRollbackId(version.id)}>回滚</Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {detail ? (
            <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm">
              <div className="font-medium">{detail.version} 详情</div>
              <p className="mt-2 leading-6">{detail.description}</p>
              <p className="mt-2 text-muted">覆盖平台：{detail.platforms.join("、") || "—"}</p>
              <p className="mt-1 text-muted">有效规则 {detail.validRules} 条，错误 {detail.errorRules} 条。</p>
            </div>
          ) : null}
        </div>
        <AlertDialog open={Boolean(rollbackId)} onOpenChange={(next) => { if (!next) setRollbackId(null); }}>
          <AlertDialogContent
            title="确认回滚规则版本？"
            description="回滚只改变当前生效规则版本，不删除历史匹配记录，也不覆盖人工标记。本期不回刷历史流水，新流水将按回滚后的版本匹配。"
            confirmText="确认回滚"
            onConfirm={() => {
              if (rollbackId) rollbackVersion(rollbackId);
              setRollbackId(null);
            }}
          />
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}
