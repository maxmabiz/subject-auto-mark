import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Progress({ value, className }: { value: number } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-slate-100", className)}>
      <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
