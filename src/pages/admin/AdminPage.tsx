import { AppLayout } from "@/components/layout/AppLayout";
import { useIsAdmin } from "@/hooks/useUserRoles";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield } from "lucide-react";
import { DashboardTab } from "@/components/admin/DashboardTab";
import { UsersTab } from "@/components/admin/UsersTab";
import { CampanhasTab } from "@/components/admin/CampanhasTab";
import { TerritoriosAdminTab } from "@/components/admin/TerritoriosAdminTab";
import { AuditTab } from "@/components/admin/AuditTab";
import { TagsTab } from "@/components/admin/TagsTab";
import { CentrosCustoTab } from "@/components/admin/CentrosCustoTab";
import { ConfiguracoesTab } from "@/components/admin/ConfiguracoesTab";
import { ExportTab } from "@/components/admin/ExportTab";
import { TSEImportTab } from "@/components/admin/TSEImportTab";

export default function AdminPage() {
  const isAdmin = useIsAdmin();

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Painel Administrativo
        </h1>

        <Tabs defaultValue="dashboard">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="campanhas">Campanhas</TabsTrigger>
            <TabsTrigger value="territorios">Territórios</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
            <TabsTrigger value="centros">Centros de Custo</TabsTrigger>
            <TabsTrigger value="config">Configurações</TabsTrigger>
            <TabsTrigger value="tse">Dados TSE</TabsTrigger>
            <TabsTrigger value="audit">Auditoria</TabsTrigger>
            <TabsTrigger value="export">Exportação</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard"><DashboardTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="campanhas"><CampanhasTab /></TabsContent>
          <TabsContent value="territorios"><TerritoriosAdminTab /></TabsContent>
          <TabsContent value="tags"><TagsTab /></TabsContent>
          <TabsContent value="centros"><CentrosCustoTab /></TabsContent>
          <TabsContent value="config"><ConfiguracoesTab /></TabsContent>
          <TabsContent value="tse"><TSEImportTab /></TabsContent>
          <TabsContent value="audit"><AuditTab /></TabsContent>
          <TabsContent value="export"><ExportTab /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
