import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useIsAdmin } from "@/hooks/useUserRoles";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield } from "lucide-react";
import { UsersTab } from "@/components/admin/UsersTab";
import { AuditTab } from "@/components/admin/AuditTab";

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

        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">Usuários & Papéis</TabsTrigger>
            <TabsTrigger value="audit">Logs de Auditoria</TabsTrigger>
          </TabsList>
          <TabsContent value="users">
            <UsersTab />
          </TabsContent>
          <TabsContent value="audit">
            <AuditTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
