import { Loader2 } from "lucide-react";

export function LoadingState({ text = "正在加载数据…" }: { text?: string }) {
  return (
    <div className="flex h-64 items-center justify-center gap-2 text-sm text-muted">
      <Loader2 className="h-4 w-4 animate-spin" />
      {text}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-center">
      <div className="text-sm font-medium text-ink">{title}</div>
      <div className="mt-1 text-sm text-muted">{description}</div>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}
