import { NavLink, Outlet } from "react-router-dom";
import { BookOpen, ListChecks } from "lucide-react";
import { CURRENT_USER, PRODUCT_NAME } from "@/domain/constants";
import { useAppStore } from "@/store/AppStore";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/transactions", label: "流水列表", icon: ListChecks },
  { to: "/rules", label: "规则管理", icon: BookOpen },
];

export function AppLayout() {
  const { currentVersion, updatedAt, loading } = useAppStore();

  return (
    <div className="flex min-h-screen bg-[#f5f7fb]">
      <aside className="sticky top-0 flex h-screen w-[220px] shrink-0 flex-col bg-[#16356b] text-white">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="text-sm font-semibold tracking-wide">{PRODUCT_NAME}</div>
          <div className="mt-1 text-xs text-white/70">资金后台 · 科目标记</div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/transactions"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white/80 hover:bg-white/10",
                  isActive && "bg-white/15 font-medium text-white",
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <span>当前规则版本 {loading ? "加载中" : currentVersion?.version ?? "—"}</span>
            <span className="h-3 w-px bg-slate-200" />
            <span>数据更新 {updatedAt ? formatDateTime(updatedAt) : "—"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800">
              财
            </span>
            <span className="text-ink">{CURRENT_USER}</span>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
