import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function usePesquisas() {
  return useQuery({
    queryKey: ["pesquisas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pesquisas")
        .select("*, pesquisa_resultados(*), municipios(nome), campanhas(nome)")
        .order("data_divulgacao", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertPesquisa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: any) => {
      const { error } = p.id
        ? await supabase.from("pesquisas").update(p).eq("id", p.id)
        : await supabase.from("pesquisas").insert(p);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Pesquisa salva"); qc.invalidateQueries({ queryKey: ["pesquisas"] }); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpsertResultado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (r: any) => {
      const { error } = r.id
        ? await supabase.from("pesquisa_resultados").update(r).eq("id", r.id)
        : await supabase.from("pesquisa_resultados").insert(r);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pesquisas"] }); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useCaptacao() {
  return useQuery({
    queryKey: ["captacao_doadores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("captacao_doadores")
        .select("*, campanhas(nome)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertDoador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: any) => {
      const { error } = d.id
        ? await supabase.from("captacao_doadores").update(d).eq("id", d.id)
        : await supabase.from("captacao_doadores").insert(d);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Doador salvo"); qc.invalidateQueries({ queryKey: ["captacao_doadores"] }); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteDoador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("captacao_doadores").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Doador removido"); qc.invalidateQueries({ queryKey: ["captacao_doadores"] }); },
    onError: (e: any) => toast.error(e.message),
  });
}
