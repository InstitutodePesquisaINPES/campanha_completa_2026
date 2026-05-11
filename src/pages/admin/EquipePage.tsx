import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, UserPlus, Shield, UserCog, Activity } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const ROLE_DESCRIPTIONS = {
  candidato: { label: "Candidato", desc: "Visão total de BI, Copilot AI e metas. Sem ações operacionais." },
  admin: { label: "Administrador", desc: "Controle total sobre o painel de configurações, membros e Billing." },
  coord_geral: { label: "Coordenação Geral", desc: "Gestor máximo da campanha. Vê todos os KPIs de todos os núcleos." },
  coord_financeiro: { label: "Coordenação Financeira", desc: "Acesso exclusivo a contratos, despesas e orçamento TSE." },
  coord_juridico: { label: "Coordenação Jurídica", desc: "Focado em prazos de registro, compliance e notificações." },
  coord_comunicacao: { label: "Coordenação de Comunicação", desc: "Gestão do War Room (redes), pautas e peças gráficas." },
  coord_mobilizacao: { label: "Coordenação de Mobilização", desc: "Focado no Mapa Estratégico, redutos e líderes locais." },
  lideranca_regional: { label: "Liderança Regional", desc: "Gere líderes abaixo dele e vê o CRM da sua região de atuação." },
  lideranca_local: { label: "Liderança Local", desc: "Gere apenas seus cabos eleitorais e visualiza a própria meta de votos." },
  cabo_eleitoral: { label: "Cabo Eleitoral", desc: "Usa o App Móvel para cadastrar eleitores no CRM. Visão restrita." },
  operador_crm: { label: "Operador de CRM", desc: "Call Center e disparos de WhatsApp. Não vê orçamento ou mapas táticos." },
  analista_dados: { label: "Analista de Dados", desc: "Sobe dados de planilhas e resultados de pesquisa para a IA." },
};

export default function EquipePage() {
  const { data: roles = [], isLoading: rolesLoading } = useUserRoles();
  const queryClient = useQueryClient();
  
  // Apenas cargos de gestão podem acessar a Equipe
  const canManage = roles.some(r => ["admin", "coord_geral", "coord_mobilizacao", "lideranca_regional", "lideranca_local"].includes(r));

  const { data: equipe = [], isLoading } = useQuery({
    queryKey: ["equipe-list"],
    queryFn: async () => {
      const res = await api.get("/equipe");
      return res as any;
    },
    enabled: canManage,
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUserLogs, setSelectedUserLogs] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    role: "cabo_eleitoral",
    phone: "",
    cpf: "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post("/equipe", data);
    },
    onSuccess: (res: any) => {
      toast.success("Membro adicionado com sucesso!", {
        description: `Senha temporária gerada: ${res.temporaryPassword}`,
        duration: 10000, // Tempo extra para copiar a senha
      });
      queryClient.invalidateQueries({ queryKey: ["equipe-list"] });
      setIsDialogOpen(false);
    },
    onError: (err: any) => {
      toast.error("Erro ao adicionar", { description: err.response?.data?.message || "Você não tem permissão para criar este nível." });
    }
  });

  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["equipe-logs", selectedUserLogs],
    queryFn: async () => {
      const res = await api.get(`/equipe/${selectedUserLogs}/logs`);
      return res as any;
    },
    enabled: !!selectedUserLogs,
  });

  if (rolesLoading) return null;
  if (!canManage) return <Navigate to="/" replace />;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6 p-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black flex items-center gap-2">
              <Users className="h-7 w-7 text-indigo-600" />
              Gestão de Equipe
            </h1>
            <p className="text-slate-500 mt-1">
              Adicione membros, defina as patentes hierárquicas e rastreie as atividades do seu comitê.
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="font-bold shadow-md gap-2" size="lg">
                <UserPlus className="h-5 w-5" /> Adicionar Membro
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Recrutar novo Membro</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <Input 
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Ex: João da Silva" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Ex: joao@campanha.com" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Telefone / WhatsApp</Label>
                    <Input 
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(XX) 9XXXX-XXXX" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CPF</Label>
                    <Input 
                      value={formData.cpf}
                      onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                      placeholder="Somente números" 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Patente / Permissão (Role)</Label>
                  <Select value={formData.role} onValueChange={v => setFormData({ ...formData, role: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(ROLE_DESCRIPTIONS).map(([key, info]) => (
                        <SelectItem key={key} value={key}>{info.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Explicação Didática da Patente */}
                  <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg flex items-start gap-3 mt-2">
                    <Shield className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-indigo-900 leading-tight">
                      <strong>O que este perfil pode fazer:</strong><br/>
                      {(ROLE_DESCRIPTIONS as any)[formData.role]?.desc}
                    </p>
                  </div>
                </div>

                <Button 
                  className="w-full mt-4" 
                  size="lg" 
                  onClick={() => createMutation.mutate(formData)}
                  disabled={createMutation.isPending || !formData.email || !formData.fullName}
                >
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Cadastrar e Gerar Senha
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabela de Equipe */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-300" /></div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-500">
                  <th className="px-6 py-4">Membro</th>
                  <th className="px-6 py-4">Contato</th>
                  <th className="px-6 py-4">Patente Principal</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Cadastro</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {equipe.map((membro: any) => (
                  <tr key={membro.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 shrink-0">
                          {membro.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{membro.fullName}</p>
                          <p className="text-xs text-slate-500">{membro.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {membro.phone || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
                        {(ROLE_DESCRIPTIONS as any)[membro.roles[0]]?.label || membro.roles[0]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {membro.active ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                          <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Ativo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
                          <span className="h-2 w-2 rounded-full bg-slate-400"></span> Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {format(new Date(membro.createdAt), "dd MMM, yyyy", { locale: ptBR })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" title="Editar Permissões">
                          <UserCog className="h-4 w-4 text-slate-400 hover:text-indigo-600" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Ver Rastro de Auditoria"
                          onClick={() => setSelectedUserLogs(membro.id)}
                        >
                          <Activity className="h-4 w-4 text-slate-400 hover:text-emerald-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {equipe.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      Nenhum membro da equipe encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Sheet de Auditoria */}
        <Sheet open={!!selectedUserLogs} onOpenChange={(open) => !open && setSelectedUserLogs(null)}>
          <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-500" />
                Rastro de Auditoria
              </SheetTitle>
              <p className="text-sm text-muted-foreground">Histórico de ações deste usuário na plataforma.</p>
            </SheetHeader>
            
            {logsLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-slate-300" /></div>
            ) : logs.length === 0 ? (
              <p className="text-center text-slate-500 py-10">Nenhuma atividade registrada ainda.</p>
            ) : (
              <div className="space-y-4">
                {logs.map((log: any) => (
                  <div key={log.id} className="border-l-2 border-slate-200 pl-4 py-1 relative">
                    <div className="absolute w-2 h-2 rounded-full bg-slate-300 -left-[5px] top-3 border border-white"></div>
                    <p className="text-xs text-slate-400 font-mono mb-1">
                      {format(new Date(log.createdAt), "dd/MM HH:mm")}
                    </p>
                    <p className="text-sm font-semibold text-slate-700">
                      Ação: <span className="text-indigo-600">{log.action}</span>
                    </p>
                    <p className="text-sm text-slate-500">Tabela: {log.tableName}</p>
                    {log.recordId && <p className="text-xs text-slate-400 mt-1">ID: {log.recordId}</p>}
                  </div>
                ))}
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AppLayout>
  );
}
