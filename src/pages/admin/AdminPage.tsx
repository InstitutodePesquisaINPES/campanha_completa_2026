import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useIsAdmin } from "@/hooks/useUserRoles";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield } from "lucide-react";
import { UsersTab } from "@/components/admin/UsersTab";
import { AuditTab } from "@/components/admin/AuditTab";
import { StatsTab } from "@/components/admin/StatsTab";
import { TagsTab } from "@/components/admin/TagsTab";
import { CentrosCustoTab } from "@/components/admin/CentrosCustoTab";
import { ExportTab } from "@/components/admin/ExportTab";

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

        <Tabs defaultValue="stats">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="stats">Estatísticas</TabsTrigger>
            <TabsTrigger value="users">Usuários & Papéis</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
            <TabsTrigger value="centros">Centros de Custo</TabsTrigger>
            <TabsTrigger value="export">Exportação</TabsTrigger>
            <TabsTrigger value="audit">Auditoria (LGPD)</TabsTrigger>
          </TabsList>
          <TabsContent value="stats"><StatsTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="tags"><TagsTab /></TabsContent>
          <TabsContent value="centros"><CentrosCustoTab /></TabsContent>
          <TabsContent value="export"><ExportTab /></TabsContent>
          <TabsContent value="audit"><AuditTab /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
