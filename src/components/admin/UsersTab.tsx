import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Trash2, Users } from "lucide-react";
import type { AppRole } from "@/hooks/useUserRoles";
import { ConvidarUsuarioDialog } from "./ConvidarUsuarioDialog";

const ROLES: AppRole[] = ["admin", "coordenador", "lideranca", "operador", "visualizador"];

interface ProfileWithRoles {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  roles: AppRole[];
}

export function UsersTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<AppRole>("operador");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name");
      if (pErr) throw pErr;

      const { data: allRoles, error: rErr } = await supabase
        .from("user_roles")
        .select("*");
      if (rErr) throw rErr;

      return (profiles || []).map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        full_name: p.full_name,
        phone: p.phone,
        roles: (allRoles || [])
          .filter((r: any) => r.user_id === p.user_id)
          .map((r: any) => r.role as AppRole),
      })) as ProfileWithRoles[];
    },
  });

  const addRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Papel adicionado!" });
    },
    onError: (e: any) => {
      toast({ variant: "destructive", title: "Erro", description: e.message });
    },
  });

  const removeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Papel removido!" });
    },
    onError: (e: any) => {
      toast({ variant: "destructive", title: "Erro", description: e.message });
    },
  });

  const seedUsers = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("seed-test-users");
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      const created = data.results?.filter((r: any) => r.status === "created").length || 0;
      toast({ title: `Seed concluído! ${created} usuários criados.` });
    },
    onError: (e: any) => {
      toast({ variant: "destructive", title: "Erro no seed", description: e.message });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle>Usuários do Sistema ({users.length})</CardTitle>
        <div className="flex items-center gap-2">
          <ConvidarUsuarioDialog />
          <Button
            variant="outline"
            size="sm"
            onClick={() => seedUsers.mutate()}
            disabled={seedUsers.isPending}
          >
            {seedUsers.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Users className="h-4 w-4 mr-1" />}
            Seed Teste
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Papéis</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.full_name || "—"}</TableCell>
                <TableCell>{user.phone || "—"}</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {user.roles.length === 0 && (
                      <span className="text-xs text-muted-foreground">Sem papéis</span>
                    )}
                    {user.roles.map((role) => (
                      <Badge key={role} variant="secondary" className="gap-1">
                        {role}
                        <button
                          onClick={() => removeRole.mutate({ userId: user.user_id, role })}
                          className="ml-1 hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addRole.mutate({ userId: user.user_id, role: selectedRole })}
                      disabled={user.roles.includes(selectedRole)}
                    >
                      <UserPlus className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
