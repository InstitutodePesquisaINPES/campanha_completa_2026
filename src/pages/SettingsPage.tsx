import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Navigate } from "react-router-dom";
import { useSystemSettings, useUpdateSystemSetting } from "@/hooks/useSystemSettings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Settings, Brush, Trophy, Building } from "lucide-react";
import { ThemePanel } from "@/components/ui/ThemePanel";

export default function SettingsPage() {
  const { data: roles = [], isLoading: rolesLoading } = useUserRoles();
  const isAdmin = roles.includes("admin");

  const { data: settingsMap = {}, isLoading } = useSystemSettings();
  const updateSettings = useUpdateSystemSetting();

  // Eleição
  const [tipo, setTipo] = useState("");
  const [ano, setAno] = useState("");
  const [turno, setTurno] = useState("");
  const [uf, setUf] = useState("");

  // White Label / Branding
  const [brandName, setBrandName] = useState("");
  const [brandNumber, setBrandNumber] = useState("");
  const [brandSubtitle, setBrandSubtitle] = useState("");

  // Gamificação
  const [pontosPorEleitor, setPontosPorEleitor] = useState("");

  useEffect(() => {
    if (Object.keys(settingsMap).length >= 0 && !isLoading) {
      setTipo(settingsMap["eleicao_tipo"] || "");
      setAno(settingsMap["eleicao_ano"] || "");
      setTurno(settingsMap["eleicao_turno"] || "");
      setUf(settingsMap["eleicao_uf"] || "");
      
      setBrandName(settingsMap["brand_name"] || "KIRIBAMBA");
      setBrandNumber(settingsMap["brand_number"] || "70");
      setBrandSubtitle(settingsMap["brand_subtitle"] || "Avante · Dep. Federal");
      
      setPontosPorEleitor(settingsMap["gamificacao_pontos_base"] || "10");
    }
  }, [settingsMap, isLoading]);

  const handleSave = () => {
    updateSettings.mutate({
      eleicao_tipo: tipo,
      eleicao_ano: ano,
      eleicao_turno: turno,
      eleicao_uf: uf,
      brand_name: brandName,
      brand_number: brandNumber,
      brand_subtitle: brandSubtitle,
      gamificacao_pontos_base: pontosPorEleitor,
    });
  };

  if (rolesLoading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-2 tracking-tight">
            <Settings className="h-7 w-7 text-blue-600" />
            Configurações e White Label
          </h1>
          <p className="text-slate-500 mt-1 mb-4">Gerencie os parâmetros globais e a identidade visual da campanha.</p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between shadow-sm">
            <div>
              <h3 className="text-blue-800 font-bold flex items-center gap-2">
                Procurando pela Importação de Dados do TSE?
              </h3>
              <p className="text-blue-600 text-sm mt-1">
                A importação de dados brutos e planilhas fica no painel principal de Administração.
              </p>
            </div>
            <Button variant="default" className="bg-blue-600 hover:bg-blue-700" onClick={() => window.location.href = '/admin?tab=tse'}>
              Acessar Dados do TSE
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* THEME ENGINE */}
        <div className="md:col-span-2">
          <ThemePanel />
        </div>

        {/* IDENTIDADE VISUAL */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
              <CardTitle className="text-lg flex items-center gap-2"><Brush className="w-5 h-5 text-indigo-500" /> Identidade Visual (Sidebar)</CardTitle>
              <CardDescription>Personalize o nome, número e cargo no menu principal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label>Nome da Campanha</Label>
                <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Ex: JOÃO PREFEITO" className="font-bold" />
              </div>
              <div className="space-y-2">
                <Label>Número Eleitoral</Label>
                <Input value={brandNumber} onChange={(e) => setBrandNumber(e.target.value)} placeholder="Ex: 12" className="text-xl font-black w-32" />
              </div>
              <div className="space-y-2">
                <Label>Partido e Cargo (Subtítulo)</Label>
                <Input value={brandSubtitle} onChange={(e) => setBrandSubtitle(e.target.value)} placeholder="Ex: PDT · Prefeito de SP" />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {/* GAMIFICAÇÃO */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                <CardTitle className="text-lg flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" /> Regras de Gamificação</CardTitle>
                <CardDescription>Defina o peso estratégico do engajamento.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label>Pontos base por Eleitor Captado</Label>
                  <Input type="number" value={pontosPorEleitor} onChange={(e) => setPontosPorEleitor(e.target.value)} placeholder="Ex: 10" />
                  <p className="text-xs text-slate-500">Esta pontuação alimenta o Ranking de Lideranças automaticamente.</p>
                </div>
              </CardContent>
            </Card>

            {/* ELEIÇÃO */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                <CardTitle className="text-lg flex items-center gap-2"><Building className="w-5 h-5 text-emerald-500" /> Dados da Eleição</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={tipo} onValueChange={setTipo}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="municipal">Municipal</SelectItem>
                        <SelectItem value="estadual">Estadual</SelectItem>
                        <SelectItem value="federal">Federal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ano</Label>
                    <Input value={ano} onChange={(e) => setAno(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Turno</Label>
                    <Select value={turno} onValueChange={setTurno}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1º Turno</SelectItem>
                        <SelectItem value="2">2º Turno</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>UF</Label>
                    <Input value={uf} onChange={(e) => setUf(e.target.value.toUpperCase())} maxLength={2} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button size="lg" className="px-12 font-bold shadow-md hover:shadow-lg transition-all" onClick={handleSave} disabled={updateSettings.isPending}>
            {updateSettings.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            Salvar e Aplicar
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
