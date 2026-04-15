import { AppLayout } from "@/components/layout/AppLayout";
import { useProfile } from "@/hooks/useProfile";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, ClipboardList, Calendar, BarChart3, Shield } from "lucide-react";

const stats = [
  { label: "Territórios", value: "—", icon: MapPin, color: "text-blue-400" },
  { label: "Pessoas", value: "—", icon: Users, color: "text-green-400" },
  { label: "Demandas", value: "—", icon: ClipboardList, color: "text-orange-400" },
  { label: "Agenda", value: "—", icon: Calendar, color: "text-purple-400" },
];

export default function Index() {
  const { data: profile } = useProfile();
  const { data: roles = [] } = useUserRoles();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">
            Olá, {profile?.full_name || "Usuário"} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Bem-vindo ao SIGT — Sistema Integrado de Gestão Territorial
          </p>
          {roles.length > 0 && (
            <div className="flex gap-2 mt-2">
              {roles.map((role) => (
                <Badge key={role} variant="secondary" className="gap-1">
                  <Shield className="h-3 w-3" />
                  {role}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">Módulo em construção</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Painel Operacional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Os dashboards de BI serão construídos na Etapa 6. 
              Por agora, configure os territórios e comece o cadastro de pessoas.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
