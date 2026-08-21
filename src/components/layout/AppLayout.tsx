import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { BookOpen, Briefcase, ChevronDown, ClipboardList, FileSpreadsheet, Layers, ListChecks, Settings2 } from "lucide-react";
import { APP_VERSION, PRODUCT_NAME } from "@/domain/constants";
import { cn } from "@/lib/utils";

const groupClass = "flex w-full items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-left text-[15px] font-medium leading-5 text-white/90 hover:bg-white/10";
const itemClass = "ml-4 flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-left text-[15px] font-medium leading-5 text-white/80 hover:bg-white/10";
const itemActiveClass = "bg-white/15 text-white";

export function AppLayout() {
  const location = useLocation();
  const companyActive = location.pathname === "/transactions" || location.pathname === "/";
  const rulesActive = location.pathname === "/rules" || location.pathname === "/approval-rules" || location.pathname === "/subjects" || location.pathname === "/business-rules";
  const [companyOpen, setCompanyOpen] = useState(true);
  const [rulesOpen, setRulesOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-[#f5f7fb]">
      <aside className="sticky top-0 flex h-screen w-[260px] shrink-0 flex-col bg-[#16356b] text-white">
        <div className="border-b border-white/10 px-5 py-4">
          <div className="whitespace-nowrap text-[16px] font-semibold leading-5 tracking-wide">{PRODUCT_NAME}</div>
          <div className="mt-1 whitespace-nowrap text-[12px] leading-4 text-white/70">资金后台 · 科目标记</div>
        </div>
        <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3">
          <button
            type="button"
            className={cn(groupClass, companyActive && "bg-white/10 text-white")}
            onClick={() => setCompanyOpen((open) => !open)}
          >
            <Briefcase className="h-4 w-4 shrink-0" />
            <span className="flex-1">公司业务</span>
            <ChevronDown className={cn("h-4 w-4 shrink-0 transition", companyOpen ? "rotate-0" : "-rotate-90")} />
          </button>
          {companyOpen ? (
            <NavLink
              to="/transactions"
              end
              className={({ isActive }) => cn(itemClass, isActive && itemActiveClass)}
            >
              <ListChecks className="h-4 w-4 shrink-0" />
              收付流水
            </NavLink>
          ) : null}
          <button
            type="button"
            className={cn(groupClass, rulesActive && "bg-white/10 text-white")}
            onClick={() => setRulesOpen((open) => !open)}
          >
            <BookOpen className="h-4 w-4 shrink-0" />
            <span className="flex-1">科目匹配规则</span>
            <ChevronDown className={cn("h-4 w-4 shrink-0 transition", rulesOpen ? "rotate-0" : "-rotate-90")} />
          </button>
          {rulesOpen ? (
            <>
              <NavLink
                to="/business-rules"
                className={({ isActive }) => cn(itemClass, isActive && itemActiveClass)}
              >
                <ClipboardList className="h-4 w-4 shrink-0" />
                业务规则
              </NavLink>
              <NavLink
                to="/approval-rules"
                className={({ isActive }) => cn(itemClass, isActive && itemActiveClass)}
              >
                <FileSpreadsheet className="h-4 w-4 shrink-0" />
                审批单规则
              </NavLink>
              <NavLink
                to="/rules"
                className={({ isActive }) => cn(itemClass, isActive && itemActiveClass)}
              >
                <Settings2 className="h-4 w-4 shrink-0" />
                平台规则
              </NavLink>
              <NavLink
                to="/subjects"
                className={({ isActive }) => cn(itemClass, isActive && itemActiveClass)}
              >
                <Layers className="h-4 w-4 shrink-0" />
                科目维护
              </NavLink>
            </>
          ) : null}
        </nav>
        <div className="border-t border-white/10 px-5 py-3 text-[12px] leading-4 text-white/50">
          v{APP_VERSION}
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="min-w-0 flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
