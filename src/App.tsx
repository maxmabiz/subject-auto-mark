import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { TransactionsPage } from "@/pages/TransactionsPage";
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
              <Route path="/" element={<Navigate to="/transactions" replace />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/exceptions" element={<Navigate to="/transactions" replace />} />
              <Route path="/rules" element={<RulesPage />} />
              <Route path="*" element={<Navigate to="/transactions" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </TooltipProvider>
    </AppStoreProvider>
  );
}
