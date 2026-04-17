import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, UserPlus } from "lucide-react";
import type { AppRole } from "@/hooks/useUserRoles";

const ROLES: AppRole[] = ["admin", "coordenador", "lideranca", "operador", "visualizador"];

export function ConvidarUsuarioDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", full_name: "", phone: "", role: "operador" as AppRole });

  const submit = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-create-user", { body: form });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("Usuário criado!");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setOpen(false);
      setForm({ email: "", password: "", full_name: "", phone: "", role: "operador" });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><UserPlus className="h-4 w-4 mr-1" />Convidar usuário</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Criar novo usuário</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div><Label>Nome completo *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
          <div><Label>E-mail *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label>Senha temporária *</Label><Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="mínimo 6 caracteres" /></div>
          <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div>
            <Label>Papel *</Label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as AppRole })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={loading || !form.email || !form.password || !form.full_name}>
            {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
