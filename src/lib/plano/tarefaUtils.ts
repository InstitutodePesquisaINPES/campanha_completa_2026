import type { Tarefa } from "@/hooks/useCampanhas";

export type SubtarefaValidacao = {
  validas: string[];
  vazias: number;
  duplicadas: string[];
  erros: string[];
};

export function validarSubtarefasTexto(texto: string): SubtarefaValidacao {
  const linhas = texto.split("\n");
  const trimmed = linhas.map((l) => l.trim());
  const vazias = trimmed.filter((l, i) => !l && i < trimmed.length - 1).length;
  const naoVazias = trimmed.filter(Boolean);

  // Detectar duplicadas (case-insensitive)
  const seen = new Map<string, number>();
  naoVazias.forEach((l) => {
    const k = l.toLowerCase();
    seen.set(k, (seen.get(k) ?? 0) + 1);
  });
  const duplicadas = Array.from(seen.entries())
    .filter(([, n]) => n > 1)
    .map(([k]) => k);

  const validas: string[] = [];
  const setValidas = new Set<string>();
  for (const l of naoVazias) {
    const k = l.toLowerCase();
    if (!setValidas.has(k)) {
      validas.push(l);
      setValidas.add(k);
    }
  }

  const erros: string[] = [];
  if (vazias > 0) erros.push(`${vazias} linha${vazias > 1 ? "s" : ""} em branco no meio do texto.`);
  if (duplicadas.length > 0) erros.push(`${duplicadas.length} item${duplicadas.length > 1 ? "ns" : ""} duplicado${duplicadas.length > 1 ? "s" : ""} foram unificados.`);
  // Itens muito longos
  const longos = validas.filter((l) => l.length > 200).length;
  if (longos > 0) erros.push(`${longos} item${longos > 1 ? "ns" : ""} muito longo${longos > 1 ? "s" : ""} (>200 caracteres).`);

  return { validas, vazias, duplicadas, erros };
}

// =========== RASCUNHO (localStorage) ===========
const DRAFT_KEY = "plano:nova-tarefa-draft";

export function salvarRascunho(campanhaId: string, draft: unknown) {
  try {
    const all = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "{}");
    all[campanhaId] = { ...(draft as object), _savedAt: new Date().toISOString() };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

export function carregarRascunho<T>(campanhaId: string): T | null {
  try {
    const all = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "{}");
    return (all[campanhaId] as T) ?? null;
  } catch {
    return null;
  }
}

export function limparRascunho(campanhaId: string) {
  try {
    const all = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "{}");
    delete all[campanhaId];
    localStorage.setItem(DRAFT_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

// =========== DUPLICAR ===========
export function tarefaParaFormularioDuplicado(t: Tarefa & Record<string, unknown>) {
  return {
    titulo: `${t.titulo} (cópia)`,
    descricao: (t.descricao as string) ?? "",
    area: t.area as string,
    prioridade: t.prioridade as string,
    data_prevista: new Date().toISOString().slice(0, 10),
    dia: t.dia as number,
    semana: t.semana as number,
    fase_legal: ((t.fase_legal as string) ?? "pre_campanha_legal") as
      | "pre_campanha_legal"
      | "campanha_oficial"
      | "pos_eleicao",
    is_marco: !!t.is_marco,
    permitido_antes_registro: t.permitido_antes_registro !== false,
    responsavel_papel: ((t.responsavel_papel as string) ?? "") as string,
    o_que_e: ((t.o_que_e as string) ?? "") as string,
    o_que_faz: ((t.o_que_faz as string) ?? "") as string,
    entregaveis: ((t.entregaveis as string) ?? "") as string,
    respaldo_legal: ((t.respaldo_legal as string) ?? "") as string,
    subtarefas: "",
  };
}
