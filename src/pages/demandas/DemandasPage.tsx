import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { FileText } from "lucide-react";
import { DemandasList } from "@/components/demandas/DemandasList";
import { DemandaDetail } from "@/components/demandas/DemandaDetail";

export default function DemandasPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Demandas
        </h1>
        {selectedId ? (
          <DemandaDetail demandaId={selectedId} onBack={() => setSelectedId(null)} />
        ) : (
          <DemandasList onSelect={setSelectedId} />
        )}
      </div>
    </AppLayout>
  );
}
