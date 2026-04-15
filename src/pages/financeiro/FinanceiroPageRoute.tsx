import { AppLayout } from "@/components/layout/AppLayout";
import { DollarSign } from "lucide-react";
import { FinanceiroPage } from "@/components/financeiro/FinanceiroPage";

export default function FinanceiroPageRoute() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-primary" />
          Financeiro
        </h1>
        <FinanceiroPage />
      </div>
    </AppLayout>
  );
}
