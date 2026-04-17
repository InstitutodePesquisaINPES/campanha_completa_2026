import { useEffect, useState } from "react";
import { useSystemSettings, useUpdateSystemSetting } from "@/hooks/useSystemSettings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Settings } from "lucide-react";

export function ConfiguracoesTab() {
  const { data: settings, isLoading } = useSystemSettings();
  const update = useUpdateSystemSetting();

  const [org, setOrg] = useState({ nome: "", cor_primaria: "#0ea5e9", logo_url: "" });
  const [sla, setSla] = useState({ urgente_horas: 24, alta_horas: 48, media_dias: 7, baixa_dias: 15 });

  useEffect(() => {
    if (settings?.organization) setOrg({ ...org, ...settings.organization });
    if (settings?.sla_demandas) setSla({ ...sla, ...settings.sla_demandas });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  if (isLoading) {
    return <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />Organização</CardTitle>
          <CardDescription>Identidade que aparece no app.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div><Label>Nome</Label><Input value={org.nome} onChange={(e) => setOrg({ ...org, nome: e.target.value })} /></div>
          <div><Label>Cor primária</Label><Input type="color" value={org.cor_primaria} onChange={(e) => setOrg({ ...org, cor_primaria: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label>URL do logo</Label><Input value={org.logo_url ?? ""} onChange={(e) => setOrg({ ...org, logo_url: e.target.value })} placeholder="https://..." /></div>
          <div className="sm:col-span-2">
            <Button onClick={() => update.mutate({ key: "organization", value: org })} disabled={update.isPending}>
              <Save className="h-4 w-4 mr-1" />Salvar organização
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SLA de Demandas</CardTitle>
          <CardDescription>Prazos automáticos por prioridade.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-4">
          <div><Label>Urgente (h)</Label><Input type="number" value={sla.urgente_horas} onChange={(e) => setSla({ ...sla, urgente_horas: Number(e.target.value) })} /></div>
          <div><Label>Alta (h)</Label><Input type="number" value={sla.alta_horas} onChange={(e) => setSla({ ...sla, alta_horas: Number(e.target.value) })} /></div>
          <div><Label>Média (dias)</Label><Input type="number" value={sla.media_dias} onChange={(e) => setSla({ ...sla, media_dias: Number(e.target.value) })} /></div>
          <div><Label>Baixa (dias)</Label><Input type="number" value={sla.baixa_dias} onChange={(e) => setSla({ ...sla, baixa_dias: Number(e.target.value) })} /></div>
          <div className="sm:col-span-4">
            <Button onClick={() => update.mutate({ key: "sla_demandas", value: sla })} disabled={update.isPending}>
              <Save className="h-4 w-4 mr-1" />Salvar SLA
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
