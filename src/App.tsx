import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { OverviewPage } from "@/pages/OverviewPage";
import { TransactionsPage } from "@/pages/TransactionsPage";
import { ExceptionsPage } from "@/pages/ExceptionsPage";
import { RulesPage } from "@/pages/RulesPage";
import { AppStoreProvider } from "@/store/AppStore";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function App() {
  return (
    <AppStoreProvider>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<OverviewPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/exceptions" element={<ExceptionsPage />} />
              <Route path="/rules" element={<RulesPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </TooltipProvider>
    </AppStoreProvider>
  );
}
