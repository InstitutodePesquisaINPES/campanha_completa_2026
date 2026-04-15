import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useIsAdmin } from "@/hooks/useUserRoles";
import { Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Settings } from "lucide-react";

export default function SettingsPage() {
  const isAdmin = useIsAdmin();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["system-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("system_settings").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const getSetting = (key: string) => {
    const s = settings.find((s: any) => s.key === key);
    if (!s) return "";
    const val = s.value;
    return typeof val === "string" ? val.replace(/^"|"$/g, "") : String(val);
  };

  const [tipo, setTipo] = useState("");
  const [ano, setAno] = useState("");
  const [turno, setTurno] = useState("");
  const [uf, setUf] = useState("");

  useEffect(() => {
    if (settings.length > 0) {
      setTipo(getSetting("eleicao_tipo"));
      setAno(getSetting("eleicao_ano"));
      setTurno(getSetting("eleicao_turno"));
      setUf(getSetting("eleicao_uf"));
    }
  }, [settings]);

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from("system_settings")
        .update({ value: JSON.stringify(value), updated_by: user?.id })
        .eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["system-settings"] }),
  });

  const handleSave = async () => {
    try {
      await Promise.all([
        updateSetting.mutateAsync({ key: "eleicao_tipo", value: tipo }),
        updateSetting.mutateAsync({ key: "eleicao_ano", value: ano }),
        updateSetting.mutateAsync({ key: "eleicao_turno", value: turno }),
        updateSetting.mutateAsync({ key: "eleicao_uf", value: uf }),
      ]);
      toast({ title: "Configurações salvas!" });
    } catch {
      toast({ variant: "destructive", title: "Erro ao salvar" });
    }
  };

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
      <div className="max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Configurações do Sistema
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>Eleição</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <Button onClick={handleSave} disabled={updateSetting.isPending}>
              {updateSetting.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Configurações
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
