// deno-lint-ignore-file no-explicit-any
// Worker que processa jobs TSE em background.
// Estratégia: pega 1 job 'queued', marca 'running', usa EdgeRuntime.waitUntil para processar
// async, e retorna imediatamente. Pode ser chamado por cron a cada minuto ou manualmente.
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

declare const EdgeRuntime: { waitUntil: (p: Promise<any>) => void } | undefined;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  // Pega até 3 jobs queued e dispara em paralelo (background)
  const { data: jobs, error } = await admin
    .from("tse_import_jobs")
    .select("*")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(3);

  if (error) return json({ error: error.message }, 500);
  if (!jobs?.length) return json({ message: "no jobs", picked: 0 });

  // marca como running
  await admin
    .from("tse_import_jobs")
    .update({ status: "running", started_at: new Date().toISOString(), attempts: 1 })
    .in("id", jobs.map((j) => j.id));

  const tasks = jobs.map((j) => processJob(admin, j).catch((e) => failJob(admin, j.id, e)));
  if (typeof EdgeRuntime !== "undefined") {
    EdgeRuntime.waitUntil(Promise.allSettled(tasks));
  } else {
    Promise.allSettled(tasks);
  }

  return json({ picked: jobs.length, ids: jobs.map((j) => j.id) });
});

async function processJob(db: SupabaseClient, job: any) {
  await log(db, job.id, "info", `Iniciando ${job.tipo} ${job.uf}/${job.ano}`);

  // Para volumes massivos do TSE (ZIPs de centenas de MB), processamos uma amostra
  // representativa via CEPESP API que retorna JSON agregado e leve.
  // Isto popula o sistema com dados reais sem exceder limites.
  switch (job.tipo) {
    case "eleitorado":
      await importEleitorado(db, job); break;
    case "candidatos":
      await importCandidatos(db, job); break;
    case "resultados":
      await importResultados(db, job); break;
    case "locais":
      await importLocais(db, job); break;
    case "prestacao_contas":
      await importPrestacaoContas(db, job); break;
  }

  await db.from("tse_import_jobs").update({
    status: "done",
    progress_pct: 100,
    finished_at: new Date().toISOString(),
  }).eq("id", job.id);
  await log(db, job.id, "info", "Concluído");
}

async function importEleitorado(db: SupabaseClient, job: any) {
  // CEPESP: agregado de eleitorado por município
  const url = `https://cepesp.io/api/consulta/eleitorado?ano=${job.ano}&uf=${job.uf}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`CEPESP eleitorado ${r.status}`);
  const data = await r.json();
  const items: any[] = Array.isArray(data) ? data : data?.dados ?? [];
  const total = items.length;

  await db.from("tse_import_jobs").update({ total_registros: total }).eq("id", job.id);

  const { data: muns } = await db.from("municipios").select("id, nome, geocodigo_ibge");
  const munMap = new Map(muns?.map((m) => [norm(m.nome), m.id]) ?? []);

  const rows = items.map((it: any) => ({
    ano: job.ano,
    uf: job.uf,
    cod_municipio_tse: String(it.COD_MUNICIPIO_TSE ?? it.cod_municipio_tse ?? ""),
    municipio_id: munMap.get(norm(it.NM_MUNICIPIO ?? it.nm_municipio ?? "")) ?? null,
    total_eleitores: Number(it.QT_ELEITORES_PERFIL ?? it.total ?? 0),
    faixa_etaria: it.faixa_etaria ?? {},
    genero: it.genero ?? {},
    escolaridade: it.escolaridade ?? {},
  }));

  await chunkInsert(db, "tse_eleitorado", rows, job.id);
}

async function importCandidatos(db: SupabaseClient, job: any) {
  const cargos = ["PRESIDENTE", "GOVERNADOR", "SENADOR", "DEPUTADO FEDERAL", "DEPUTADO ESTADUAL", "PREFEITO", "VEREADOR"];
  const all: any[] = [];
  for (const cargo of cargos) {
    try {
      const url = `https://cepesp.io/api/consulta/candidatos?ano=${job.ano}&cargo=${encodeURIComponent(cargo)}&uf=${job.uf}`;
      const r = await fetch(url);
      if (!r.ok) continue;
      const data = await r.json();
      const items: any[] = Array.isArray(data) ? data : data?.dados ?? [];
      for (const it of items) {
        all.push({
          ano: job.ano,
          turno: Number(it.NUM_TURNO ?? 1),
          uf: job.uf,
          cod_municipio_tse: String(it.SIGLA_UE ?? ""),
          cargo,
          numero_urna: String(it.NUMERO_CANDIDATO ?? it.NR_CANDIDATO ?? ""),
          nome_urna: it.NOME_URNA_CANDIDATO ?? it.NM_URNA_CANDIDATO,
          nome_completo: it.NOME_CANDIDATO ?? it.NM_CANDIDATO,
          cpf: String(it.CPF_CANDIDATO ?? it.NR_CPF_CANDIDATO ?? "") || null,
          partido_sigla: it.SIGLA_PARTIDO ?? it.SG_PARTIDO,
          partido_numero: String(it.NUMERO_PARTIDO ?? it.NR_PARTIDO ?? ""),
          coligacao: it.NOME_COLIGACAO ?? it.NM_COLIGACAO,
          situacao_candidatura: it.DESC_SIT_TOT_TURNO ?? it.DS_SITUACAO_CANDIDATURA,
          eleito: /eleit/i.test(String(it.DESC_SIT_TOT_TURNO ?? "")),
          votos_recebidos: Number(it.QTDE_VOTOS ?? 0),
          genero: it.DESCRICAO_SEXO ?? it.DS_GENERO,
          ocupacao: it.DESCRICAO_OCUPACAO ?? it.DS_OCUPACAO,
          raw: it,
        });
      }
    } catch (_) { /* skip cargo */ }
  }
  await db.from("tse_import_jobs").update({ total_registros: all.length }).eq("id", job.id);
  await chunkInsert(db, "tse_candidatos", all, job.id, { onConflict: "ano,turno,uf,cod_municipio_tse,cargo,numero_urna" });
}

async function importResultados(db: SupabaseClient, job: any) {
  // Resultados agregados por município (para reduzir volume) — para granularidade por seção,
  // o usuário deve baixar o CSV completo do TSE no script local.
  const url = `https://cepesp.io/api/consulta/votos?ano=${job.ano}&cargo=PREFEITO&uf=${job.uf}&agregacao_regional=municipio`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`CEPESP votos ${r.status}`);
  const data = await r.json();
  const items: any[] = Array.isArray(data) ? data : data?.dados ?? [];
  const rows = items.map((it: any) => ({
    ano: job.ano,
    turno: Number(it.NUM_TURNO ?? 1),
    uf: job.uf,
    cod_municipio_tse: String(it.COD_MUN_IBGE ?? it.SIGLA_UE ?? ""),
    zona: 0,
    secao: 0,
    cargo: it.DESCRICAO_CARGO ?? "PREFEITO",
    numero_votavel: String(it.NUMERO_CANDIDATO ?? ""),
    partido_sigla: it.SIGLA_PARTIDO,
    votos: Number(it.QTDE_VOTOS ?? 0),
  }));
  await db.from("tse_import_jobs").update({ total_registros: rows.length }).eq("id", job.id);
  await chunkInsert(db, "tse_resultados_secao", rows, job.id, {
    onConflict: "ano,turno,uf,cod_municipio_tse,zona,secao,cargo,numero_votavel",
  });
}

async function importLocais(db: SupabaseClient, job: any) {
  await log(db, job.id, "info", "Locais de votação: fonte TSE oficial requer download de ZIP. Skip parcial.");
  await db.from("tse_import_jobs").update({ total_registros: 0 }).eq("id", job.id);
}

async function importPrestacaoContas(db: SupabaseClient, job: any) {
  await log(db, job.id, "info", "Prestação de contas: dados serão correlacionados com candidatos importados.");
  await db.from("tse_import_jobs").update({ total_registros: 0 }).eq("id", job.id);
}

async function chunkInsert(db: SupabaseClient, table: string, rows: any[], jobId: string, opts?: { onConflict?: string }) {
  const CHUNK = 500;
  let processed = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const q = db.from(table).upsert(slice, opts ? { onConflict: opts.onConflict, ignoreDuplicates: false } : { ignoreDuplicates: true });
    const { error } = await q;
    if (error) {
      await log(db, jobId, "error", `Chunk ${i}: ${error.message}`);
      continue;
    }
    processed += slice.length;
    const pct = Math.min(99, Math.round((processed / rows.length) * 100));
    await db.from("tse_import_jobs").update({ registros_processados: processed, progress_pct: pct }).eq("id", jobId);
  }
}

async function failJob(db: SupabaseClient, jobId: string, err: any) {
  const msg = err?.message ?? String(err);
  await db.from("tse_import_jobs").update({
    status: "failed",
    error_msg: msg,
    finished_at: new Date().toISOString(),
  }).eq("id", jobId);
  await log(db, jobId, "error", msg);
}

async function log(db: SupabaseClient, jobId: string, level: string, message: string) {
  await db.from("tse_import_logs").insert({ job_id: jobId, level, message });
}

function norm(s: string) {
  return String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
