import { AppLayout } from "@/components/layout/AppLayout";
import { Package } from "lucide-react";
import { MateriaisPage } from "@/components/materiais/MateriaisPage";

export default function MateriaisPageRoute() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          Materiais & Estoque
        </h1>
        <MateriaisPage />
      </div>
    </AppLayout>
  );
}
