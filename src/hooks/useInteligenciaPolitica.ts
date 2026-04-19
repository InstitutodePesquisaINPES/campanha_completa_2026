import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ============== TIPOS ==============
export type ClassificacaoEstrategica = "reduto" | "disputa" | "expansao" | "perdido" | "neutro";
export type LiderancaClassificacao = "A" | "B" | "C" | "D";
export type LiderancaStatus = "mapeado" | "contactado" | "reuniao_marcada" | "comprometido" | "aliado" | "neutro" | "adversario";
export type LiderancaTipo = "religiosa" | "associativa" | "politica" | "comunitaria" | "empresarial" | "sindical" | "cultural" | "esportiva" | "familiar" | "profissional";
export type VereadorAlinhamento = "aliado" | "simpatizante" | "neutro" | "adversario" | "desconhecido";
export type FaixaVotos = "ate_150" | "f_150_500" | "f_500_1000" | "f_1000_2000" | "f_2000_5000" | "acima_5000";

export const FAIXA_LABEL: Record<FaixaVotos, string> = {
  ate_150: "Até 150",
  f_150_500: "150 a 500",
  f_500_1000: "500 a 1.000",
  f_1000_2000: "1.000 a 2.000",
  f_2000_5000: "2.000 a 5.000",
  acima_5000: "Acima de 5.000",
};

export const CLASS_LABEL: Record<ClassificacaoEstrategica, string> = {
  reduto: "Reduto",
  disputa: "Em Disputa",
  expansao: "Expansão",
  perdido: "Perdido",
  neutro: "Neutro",
};

export const CLASS_COLOR: Record<ClassificacaoEstrategica, string> = {
  reduto: "bg-success/10 text-success border-success/30",
  disputa: "bg-warning/10 text-warning border-warning/30",
  expansao: "bg-info/10 text-info border-info/30",
  perdido: "bg-destructive/10 text-destructive border-destructive/30",
  neutro: "bg-muted text-muted-foreground border-muted",
};

// ============== MUNICÍPIOS ESTRATÉGICOS ==============
export function useMunicipiosEstrategicos(campanhaId?: string) {
  return useQuery({
    queryKey: ["municipios-estrategicos", campanhaId],
    enabled: !!campanhaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("municipios_estrategicos")
        .select("*, municipio:municipios(id, nome, populacao_2022, latitude, longitude)")
        .eq("campanha_id", campanhaId!)
        .order("score", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertMunicipioEstrategico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data, error } = await supabase
        .from("municipios_estrategicos")
        .upsert(payload, { onConflict: "campanha_id,municipio_id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars: any) => {
      qc.invalidateQueries({ queryKey: ["municipios-estrategicos", vars.campanha_id] });
      toast.success("Município atualizado");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteMunicipioEstrategico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("municipios_estrategicos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["municipios-estrategicos"] });
      toast.success("Removido");
    },
  });
}

// ============== BAIRROS ESTRATÉGICOS ==============
export function useBairrosEstrategicos(campanhaId?: string, municipioId?: string) {
  return useQuery({
    queryKey: ["bairros-estrategicos", campanhaId, municipioId],
    enabled: !!campanhaId,
    queryFn: async () => {
      let q = supabase
        .from("bairros_estrategicos")
        .select("*, bairro:bairros(id, nome, municipio_id, latitude, longitude, zona_tipo, populacao_estimada)")
        .eq("campanha_id", campanhaId!)
        .order("score", { ascending: false });
      const { data, error } = await q;
      if (error) throw error;
      let rows = data ?? [];
      if (municipioId) rows = rows.filter((r: any) => r.bairro?.municipio_id === municipioId);
      return rows;
    },
  });
}

export function useUpsertBairroEstrategico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data, error } = await supabase
        .from("bairros_estrategicos")
        .upsert(payload, { onConflict: "campanha_id,bairro_id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bairros-estrategicos"] });
      toast.success("Bairro atualizado");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// ============== LIDERANÇAS ==============
export function useLiderancas(filters?: { campanhaId?: string; municipioId?: string; classificacao?: LiderancaClassificacao; status?: LiderancaStatus; tipo?: LiderancaTipo }) {
  return useQuery({
    queryKey: ["liderancas", filters],
    queryFn: async () => {
      let q = supabase
        .from("liderancas_locais")
        .select("*, municipio:municipios(nome), bairro:bairros(nome)")
        .order("influencia_score", { ascending: false })
        .limit(500);
      if (filters?.campanhaId) q = q.eq("campanha_id", filters.campanhaId);
      if (filters?.municipioId) q = q.eq("municipio_id", filters.municipioId);
      if (filters?.classificacao) q = q.eq("classificacao", filters.classificacao);
      if (filters?.status) q = q.eq("status", filters.status);
      if (filters?.tipo) q = q.eq("tipo", filters.tipo);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useLiderancaStats(campanhaId?: string) {
  return useQuery({
    queryKey: ["liderancas-stats", campanhaId],
    queryFn: async () => {
      let q = supabase.from("liderancas_locais").select("classificacao, status, tipo, votos_estimados");
      if (campanhaId) q = q.eq("campanha_id", campanhaId);
      const { data, error } = await q;
      if (error) throw error;
      const rows = data ?? [];
      const total = rows.length;
      const porClass: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
      const porStatus: Record<string, number> = {};
      const porTipo: Record<string, number> = {};
      let totalVotos = 0;
      rows.forEach((r: any) => {
        porClass[r.classificacao] = (porClass[r.classificacao] ?? 0) + 1;
        porStatus[r.status] = (porStatus[r.status] ?? 0) + 1;
        porTipo[r.tipo] = (porTipo[r.tipo] ?? 0) + 1;
        totalVotos += r.votos_estimados ?? 0;
      });
      return { total, porClass, porStatus, porTipo, totalVotos };
    },
  });
}

export function useUpsertLideranca() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      if (payload.id) {
        const { data, error } = await supabase.from("liderancas_locais").update(payload).eq("id", payload.id).select().single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from("liderancas_locais").insert(payload).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["liderancas"] });
      qc.invalidateQueries({ queryKey: ["liderancas-stats"] });
      toast.success("Liderança salva");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteLideranca() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("liderancas_locais").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["liderancas"] });
      qc.invalidateQueries({ queryKey: ["liderancas-stats"] });
      toast.success("Removido");
    },
  });
}

// ============== VEREADORES HISTÓRICOS ==============
export function useVereadoresHistoricos(filters?: { uf?: string; ano?: number; municipioId?: string; faixa?: FaixaVotos; alinhamento?: VereadorAlinhamento }) {
  return useQuery({
    queryKey: ["vereadores-historicos", filters],
    queryFn: async () => {
      let q = supabase
        .from("vereadores_historicos")
        .select("*, municipio:municipios(nome)")
        .order("votos_recebidos", { ascending: false })
        .limit(1000);
      if (filters?.uf) q = q.eq("uf", filters.uf);
      if (filters?.ano) q = q.eq("ano", filters.ano);
      if (filters?.municipioId) q = q.eq("municipio_id", filters.municipioId);
      if (filters?.faixa) q = q.eq("faixa_votos", filters.faixa);
      if (filters?.alinhamento) q = q.eq("alinhamento", filters.alinhamento);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useVereadorStats(uf = "BA", ano = 2024) {
  return useQuery({
    queryKey: ["vereadores-stats", uf, ano],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vereadores_historicos")
        .select("faixa_votos, alinhamento, eleito, votos_recebidos")
        .eq("uf", uf)
        .eq("ano", ano);
      if (error) throw error;
      const rows = data ?? [];
      const porFaixa: Record<string, number> = {};
      const porAlinhamento: Record<string, number> = {};
      let totalVotos = 0;
      let eleitos = 0;
      rows.forEach((r: any) => {
        porFaixa[r.faixa_votos] = (porFaixa[r.faixa_votos] ?? 0) + 1;
        porAlinhamento[r.alinhamento ?? "desconhecido"] = (porAlinhamento[r.alinhamento ?? "desconhecido"] ?? 0) + 1;
        totalVotos += r.votos_recebidos ?? 0;
        if (r.eleito) eleitos++;
      });
      return { total: rows.length, porFaixa, porAlinhamento, totalVotos, eleitos };
    },
  });
}

export function usePopularVereadores() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ uf = "BA", ano = 2024, votosMin = 150 }: { uf?: string; ano?: number; votosMin?: number }) => {
      const { data, error } = await supabase.rpc("popular_vereadores_historicos" as any, {
        _uf: uf,
        _ano: ano,
        _votos_min: votosMin,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ["vereadores-historicos"] });
      qc.invalidateQueries({ queryKey: ["vereadores-stats"] });
      toast.success(`${count} vereadores importados`);
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateVereador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data, error } = await supabase
        .from("vereadores_historicos")
        .update(payload)
        .eq("id", payload.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vereadores-historicos"] });
      toast.success("Vereador atualizado");
    },
  });
}
