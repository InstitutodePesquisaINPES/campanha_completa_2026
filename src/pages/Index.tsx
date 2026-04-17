import { AppLayout } from "@/components/layout/AppLayout";
import { useProfile } from "@/hooks/useProfile";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, ClipboardList, Calendar, Shield, TrendingUp, Package, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [municipios, pessoas, demandas, demandasAbertas, agenda, materiais] = await Promise.all([
        supabase.from("municipios").select("id", { count: "exact", head: true }),
        supabase.from("pessoas").select("id", { count: "exact", head: true }),
        supabase.from("demandas").select("id", { count: "exact", head: true }),
        supabase.from("demandas").select("id", { count: "exact", head: true }).in("status", ["aberta", "triagem", "encaminhada", "em_andamento"]),
        supabase.from("agenda").select("id", { count: "exact", head: true }).gte("data_inicio", new Date().toISOString()),
        supabase.from("materiais").select("id", { count: "exact", head: true }).eq("ativo", true),
      ]);
      return {
        municipios: municipios.count ?? 0,
        pessoas: pessoas.count ?? 0,
        demandas: demandas.count ?? 0,
        demandasAbertas: demandasAbertas.count ?? 0,
        agenda: agenda.count ?? 0,
        materiais: materiais.count ?? 0,
      };
    },
  });
}

function useUpcomingAgenda() {
  return useQuery({
    queryKey: ["dashboard-agenda"],
    queryFn: async () => {
      const { data } = await supabase
        .from("agenda")
        .select("id, titulo, data_inicio, tipo, status, local")
        .gte("data_inicio", new Date().toISOString())
        .order("data_inicio", { ascending: true })
        .limit(5);
      return data ?? [];
    },
  });
}

function useUrgentDemandas() {
  return useQuery({
    queryKey: ["dashboard-demandas-urgentes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("demandas")
        .select("id, titulo, prioridade, status, protocolo, data_prazo")
        .in("prioridade", ["alta", "urgente"])
        .in("status", ["aberta", "triagem", "encaminhada", "em_andamento"])
        .order("data_prazo", { ascending: true, nullsFirst: false })
        .limit(5);
      return data ?? [];
    },
  });
}

const cards = [
  { key: "municipios", label: "Municípios", icon: MapPin, href: "/territorios", tone: "text-info" },
  { key: "pessoas", label: "Pessoas (CRM)", icon: Users, href: "/pessoas", tone: "text-success" },
  { key: "demandasAbertas", label: "Demandas Abertas", icon: ClipboardList, href: "/demandas", tone: "text-warning" },
  { key: "agenda", label: "Próximos Eventos", icon: Calendar, href: "/agenda", tone: "text-primary" },
  { key: "materiais", label: "Materiais Ativos", icon: Package, href: "/materiais", tone: "text-info" },
  { key: "demandas", label: "Total Demandas", icon: TrendingUp, href: "/bi", tone: "text-success" },
] as const;

const prioridadeColor: Record<string, string> = {
  urgente: "bg-destructive/10 text-destructive border-destructive/30",
  alta: "bg-warning/10 text-warning border-warning/30",
  media: "bg-info/10 text-info border-info/30",
  baixa: "bg-muted text-muted-foreground",
};

export default function Index() {
  const { data: profile } = useProfile();
  const { data: roles = [] } = useUserRoles();
  const { data: stats, isLoading } = useDashboardStats();
  const { data: agenda = [] } = useUpcomingAgenda();
  const { data: urgentes = [] } = useUrgentDemandas();

  return (
    <AppLayout>
      <div className="space-y-6 max-w-[1400px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Olá, {profile?.full_name?.split(" ")[0] || "Usuário"}
            </h1>
            <p className="text-muted-foreground mt-1">
              Painel executivo · Sistema Integrado de Gestão Territorial
            </p>
          </div>
          {roles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <Badge key={role} variant="outline" className="gap-1 capitalize">
                  <Shield className="h-3 w-3" />
                  {role}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {cards.map((c) => (
            <Link key={c.key} to={c.href}>
              <Card className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <c.icon className={`h-4 w-4 ${c.tone}`} />
                  </div>
                  <div className="text-2xl font-bold">
                    {isLoading ? <Skeleton className="h-7 w-12" /> : (stats?.[c.key] ?? 0).toLocaleString("pt-BR")}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4 text-primary" />
                Próximos Eventos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {agenda.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Nenhum evento agendado.</p>
              ) : (
                agenda.map((e) => (
                  <Link to="/agenda" key={e.id} className="block p-3 rounded-md border border-border hover:border-primary/40 hover:bg-accent/50 transition-colors">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{e.titulo}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {new Date(e.data_inicio).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                          {e.local ? ` · ${e.local}` : ""}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] capitalize">{e.tipo}</Badge>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="h-4 w-4 text-warning" />
                Demandas Prioritárias
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {urgentes.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma demanda urgente.</p>
              ) : (
                urgentes.map((d) => (
                  <Link to="/demandas" key={d.id} className="block p-3 rounded-md border border-border hover:border-primary/40 hover:bg-accent/50 transition-colors">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{d.titulo}</p>
                        <p className="text-xs text-muted-foreground">
                          {d.protocolo}
                          {d.data_prazo ? ` · prazo ${new Date(d.data_prazo).toLocaleDateString("pt-BR")}` : ""}
                        </p>
                      </div>
                      <Badge variant="outline" className={`text-[10px] capitalize ${prioridadeColor[d.prioridade]}`}>
                        {d.prioridade}
                      </Badge>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
