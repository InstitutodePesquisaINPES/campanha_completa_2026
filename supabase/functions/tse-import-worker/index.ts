// deno-lint-ignore-file no-explicit-any
// Worker que processa jobs TSE em background.
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

  const { data: jobs, error } = await admin
    .from("tse_import_jobs")
    .select("*")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(3);

  if (error) return json({ error: error.message }, 500);
  if (!jobs?.length) return json({ message: "no jobs", picked: 0 });

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

  switch (job.tipo) {
    case "eleitorado": await importEleitorado(db, job); break;
    case "candidatos": await importCandidatos(db, job); break;
    case "resultados": await importResultados(db, job); break;
    case "locais": await importLocais(db, job); break;
    case "prestacao_contas": await importPrestacaoContas(db, job); break;
  }

  await db.from("tse_import_jobs").update({
    status: "done",
    progress_pct: 100,
    finished_at: new Date().toISOString(),
  }).eq("id", job.id);
  await log(db, job.id, "info", "Concluído");
}

// Helper: roda SQL na CKAN do TSE (dadosabertos)
async function ckanSql(sql: string): Promise<any[]> {
  const url = `https://dadosabertos.tse.jus.br/api/3/action/datastore_search_sql?sql=${encodeURIComponent(sql)}`;
  const r = await fetch(url);
  if (!r.ok) return [];
  const data = await r.json();
  return data?.result?.records ?? [];
}

async function importEleitorado(db: SupabaseClient, job: any) {
  // Tenta múltiplos nomes de resource conhecidos do TSE
  const tableNames = [
    `perfil_eleitor_secao_${job.ano}`,
    `perfil_eleitorado_${job.ano}`,
    `eleitorado_atual_${job.ano}`,
  ];
  let items: any[] = [];
  let tableUsed = "";
  for (const t of tableNames) {
    items = await ckanSql(`SELECT * FROM "${t}" WHERE "SG_UF"='${job.uf}' LIMIT 50000`);
    if (items.length) { tableUsed = t; break; }
  }

  // Fallback: lista municípios IBGE para criar registros vazios estruturais
  if (!items.length) {
    await log(db, job.id, "info", "TSE API indisponível, usando municípios do IBGE como base");
    const r = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${job.uf}/municipios`);
    const muns = await r.json();
    items = muns.map((m: any) => ({
      SG_UF: job.uf,
      CD_MUNICIPIO: String(m.id).slice(0, 5),
      NM_MUNICIPIO: m.nome,
      QT_ELEITORES_PERFIL: 0,
    }));
    tableUsed = "ibge_fallback";
  }

  await log(db, job.id, "info", `Fonte: ${tableUsed}, ${items.length} registros`);
  await db.from("tse_import_jobs").update({ total_registros: items.length }).eq("id", job.id);

  const { data: muns } = await db.from("municipios").select("id, nome");
  const munMap = new Map(muns?.map((m) => [norm(m.nome), m.id]) ?? []);

  // Agrega por município
  const byMun = new Map<string, any>();
  for (const it of items) {
    const cod = String(it.CD_MUNICIPIO ?? it.COD_MUNICIPIO_TSE ?? "");
    const nome = it.NM_MUNICIPIO ?? "";
    const key = cod || nome;
    if (!byMun.has(key)) {
      byMun.set(key, {
        ano: job.ano,
        uf: job.uf,
        cod_municipio_tse: cod,
        municipio_id: munMap.get(norm(nome)) ?? null,
        total_eleitores: 0,
        faixa_etaria: {} as Record<string, number>,
        genero: {} as Record<string, number>,
        escolaridade: {} as Record<string, number>,
        estado_civil: {} as Record<string, number>,
      });
    }
    const acc = byMun.get(key)!;
    const qt = Number(it.QT_ELEITORES_PERFIL ?? 0);
    acc.total_eleitores += qt;
    const faixa = it.DS_FAIXA_ETARIA ?? it.DS_GR_FAIXA_ETARIA;
    const sexo = it.DS_GENERO ?? it.DS_SEXO;
    const esc = it.DS_GRAU_ESCOLARIDADE;
    const ec = it.DS_ESTADO_CIVIL;
    if (faixa) acc.faixa_etaria[faixa] = (acc.faixa_etaria[faixa] ?? 0) + qt;
    if (sexo) acc.genero[sexo] = (acc.genero[sexo] ?? 0) + qt;
    if (esc) acc.escolaridade[esc] = (acc.escolaridade[esc] ?? 0) + qt;
    if (ec) acc.estado_civil[ec] = (acc.estado_civil[ec] ?? 0) + qt;
  }

  await chunkInsert(db, "tse_eleitorado", Array.from(byMun.values()), job.id);
}

async function importCandidatos(db: SupabaseClient, job: any) {
  const items = await ckanSql(`SELECT * FROM "consulta_cand_${job.ano}_${job.uf}" LIMIT 50000`);
  const all = items.map((it: any) => ({
    ano: job.ano,
    turno: Number(it.NR_TURNO ?? 1),
    uf: job.uf,
    cod_municipio_tse: String(it.SG_UE ?? ""),
    cargo: it.DS_CARGO ?? "",
    numero_urna: String(it.NR_CANDIDATO ?? ""),
    nome_urna: it.NM_URNA_CANDIDATO,
    nome_completo: it.NM_CANDIDATO,
    cpf: String(it.NR_CPF_CANDIDATO ?? "") || null,
    partido_sigla: it.SG_PARTIDO,
    partido_numero: String(it.NR_PARTIDO ?? ""),
    coligacao: it.NM_COLIGACAO,
    situacao_candidatura: it.DS_SITUACAO_CANDIDATURA,
    eleito: /eleit/i.test(String(it.DS_SIT_TOT_TURNO ?? "")),
    genero: it.DS_GENERO,
    ocupacao: it.DS_OCUPACAO,
    raw: it,
  })).filter((c) => c.numero_urna);
  await db.from("tse_import_jobs").update({ total_registros: all.length }).eq("id", job.id);
  await chunkInsert(db, "tse_candidatos", all, job.id);
}

async function importResultados(db: SupabaseClient, job: any) {
  await log(db, job.id, "info", "Resultados por seção: volume massivo. Use download local.");
  await db.from("tse_import_jobs").update({ total_registros: 0 }).eq("id", job.id);
}

async function importLocais(db: SupabaseClient, job: any) {
  const items = await ckanSql(
    `SELECT * FROM "eleitorado_local_votacao_${job.ano}" WHERE "SG_UF"='${job.uf}' LIMIT 50000`,
  );
  if (!items.length) {
    await log(db, job.id, "info", "Nenhum local de votação retornado pela API TSE");
    await db.from("tse_import_jobs").update({ total_registros: 0 }).eq("id", job.id);
    return;
  }

  const { data: muns } = await db.from("municipios").select("id, nome");
  const munMap = new Map(muns?.map((m) => [norm(m.nome), m.id]) ?? []);

  const rows = items.map((it: any) => ({
    ano: job.ano,
    uf: job.uf,
    cod_municipio_tse: String(it.CD_MUNICIPIO ?? ""),
    municipio_id: munMap.get(norm(it.NM_MUNICIPIO ?? "")) ?? null,
    zona: Number(it.NR_ZONA ?? 0),
    codigo_local: String(it.NR_LOCAL_VOTACAO ?? ""),
    nome_local: it.NM_LOCAL_VOTACAO,
    endereco: it.DS_ENDERECO,
    bairro: it.NM_BAIRRO,
    cep: String(it.NR_CEP ?? "") || null,
    latitude: Number(it.NR_LATITUDE) || null,
    longitude: Number(it.NR_LONGITUDE) || null,
  })).filter((r) => r.codigo_local);

  await db.from("tse_import_jobs").update({ total_registros: rows.length }).eq("id", job.id);
  await chunkInsert(db, "tse_locais_votacao", rows, job.id);
}

async function importPrestacaoContas(db: SupabaseClient, job: any) {
  await log(db, job.id, "info", "Prestação de contas: skip nesta versão.");
  await db.from("tse_import_jobs").update({ total_registros: 0 }).eq("id", job.id);
}

async function chunkInsert(db: SupabaseClient, table: string, rows: any[], jobId: string) {
  const CHUNK = 500;
  let processed = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const { error } = await db.from(table).insert(slice);
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
