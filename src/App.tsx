import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { TransactionsPage } from "@/pages/TransactionsPage";
import { RulesPage } from "@/pages/RulesPage";
import { ApprovalRulesPage } from "@/pages/ApprovalRulesPage";
import { AppStoreProvider } from "@/store/AppStore";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function App() {
  return (
    <AppStoreProvider>
      <TooltipProvider>
        <HashRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/transactions" replace />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/exceptions" element={<Navigate to="/transactions" replace />} />
              <Route path="/rules" element={<RulesPage />} />
              <Route path="/approval-rules" element={<ApprovalRulesPage />} />
              <Route path="*" element={<Navigate to="/transactions" replace />} />
            </Route>
          </Routes>
        </HashRouter>
        <Toaster position="top-right" richColors />
      </TooltipProvider>
    </AppStoreProvider>
  );
}
