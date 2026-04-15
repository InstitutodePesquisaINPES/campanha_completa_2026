import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Users } from "lucide-react";
import { PessoasList } from "@/components/crm/PessoasList";
import { PessoaDetail } from "@/components/crm/PessoaDetail";

export default function PessoasPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          CRM — Pessoas
        </h1>

        {selectedId ? (
          <PessoaDetail pessoaId={selectedId} onBack={() => setSelectedId(null)} />
        ) : (
          <PessoasList onSelect={setSelectedId} />
        )}
      </div>
    </AppLayout>
  );
}
