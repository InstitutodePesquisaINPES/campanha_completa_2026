import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Shield } from "lucide-react";

export default function ProfilePage() {
  const { data: profile, isLoading } = useProfile();
  const { data: roles = [] } = useUserRoles();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({ full_name: fullName, phone });
      toast({ title: "Perfil atualizado!" });
    } catch {
      toast({ variant: "destructive", title: "Erro ao salvar perfil" });
    }
  };

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
          <User className="h-6 w-6" />
          Meu Perfil
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>Dados Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome completo</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <Button onClick={handleSave} disabled={updateProfile.isPending}>
              {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </CardContent>
        </Card>

        {roles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Papéis no Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {roles.map((role) => (
                  <Badge key={role} variant="outline">{role}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
