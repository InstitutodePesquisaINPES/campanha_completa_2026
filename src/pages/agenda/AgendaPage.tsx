import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CalendarDays } from "lucide-react";
import { AgendaList } from "@/components/agenda/AgendaList";
import { AgendaDetail } from "@/components/agenda/AgendaDetail";

export default function AgendaPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-primary" />
          Agenda Operacional
        </h1>
        {selectedId ? (
          <AgendaDetail agendaId={selectedId} onBack={() => setSelectedId(null)} />
        ) : (
          <AgendaList onSelect={setSelectedId} />
        )}
      </div>
    </AppLayout>
  );
}
