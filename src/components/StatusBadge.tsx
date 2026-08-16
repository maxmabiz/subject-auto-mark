import type { MatchSource, MatchStatus } from "@/domain/types";
import { DISPLAY_STATUS_LABEL, SOURCE_LABEL, toDisplayStatus } from "@/domain/constants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_CLASS: Record<ReturnType<typeof toDisplayStatus>, string> = {
  matched: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  unmatched: "bg-slate-100 text-slate-600 border border-slate-200",
  unmatchable: "bg-red-50 text-red-700 border border-red-200",
};

const SOURCE_CLASS: Record<Exclude<MatchSource, "none">, string> = {
  channel: "bg-blue-50 text-blue-700 border border-blue-200",
  feishu: "bg-teal-50 text-teal-700 border border-teal-200",
  manual: "bg-violet-50 text-violet-700 border border-violet-200",
};

export function StatusBadge({ status }: { status: MatchStatus; locked?: boolean }) {
  const display = toDisplayStatus(status);
  return (
    <Badge className={cn(STATUS_CLASS[display])}>
      {DISPLAY_STATUS_LABEL[display]}
    </Badge>
  );
}

export function SourceBadge({ source }: { source: MatchSource; locked?: boolean }) {
  if (source === "none") return <span className="text-slate-400">—</span>;
  return (
    <Badge className={cn(SOURCE_CLASS[source])}>
      {SOURCE_LABEL[source]}
    </Badge>
  );
}
