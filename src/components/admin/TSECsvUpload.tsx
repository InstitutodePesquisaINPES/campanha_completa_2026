import { useState, useRef } from "react";
import Papa from "papaparse";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Archive, Zap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { arquivarCsvParaProcessamento, type TseCsvTipo } from "@/hooks/useTSECsvArquivos";

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const ANOS = [2024, 2022, 2020, 2018, 2016];

type TipoDado =
  | "eleitorado"
  | "locais"
  | "candidatos"
  | "resultados"
  | "eleitorado_perfil"
  | "votacao_candidato_perfil";

// Detecção automática do tipo de dado pelo cabeçalho do CSV + nome do arquivo
function detectTipo(headers: string[], filename = ""): TipoDado | null {
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
  const H = new Set(headers.map(norm));
  const has = (...ks: string[]) => ks.every((k) => H.has(norm(k)));
  const hasAny = (...ks: string[]) => ks.some((k) => H.has(norm(k)));
  const file = norm(filename);

  if (file.includes("votacaocandidato") || (has("Nome candidato", "Votos nominais") && hasAny("Cor/raça", "Faixa etária", "Gênero", "Grau de instrução"))) return "votacao_candidato_perfil";
  if (file.includes("perfileleitorado") || file.includes("eleitoradoeleicao") || (hasAny("Quantidade de eleitores", "QT_ELEITORES_PERFIL") && hasAny("Cor / Raça", "DS_COR_RACA", "Faixa etária", "DS_FAIXA_ETARIA", "Gênero", "DS_GENERO", "Grau de instrução", "DS_GRAU_ESCOLARIDADE"))) return "eleitorado_perfil";
  if (file.includes("eleitoradolocalvotacao")) return "locais";
  if (file.includes("consultacand")) return "candidatos";
  if (file.includes("votacaosecao")) return "resultados";
  if (hasAny("NM_LOCAL_VOTACAO", "DS_LOCAL_VOTACAO")) return "locais";
  if (hasAny("NM_URNA_CANDIDATO", "NM_CANDIDATO") && hasAny("DS_CARGO", "CD_CARGO")) return "candidatos";
  if (hasAny("QT_VOTOS") && hasAny("NR_VOTAVEL")) return "resultados";
  if (hasAny("QT_ELEITORES_PERFIL", "QT_ELEITORES")) return "eleitorado";
  return null;
}

const TIPOS: { value: TipoDado; label: string; tabela: string; hint: string }[] = [
  { value: "eleitorado_perfil", label: "Eleitorado consolidado (perfil completo)", tabela: "tse_eleitorado_perfil", hint: "eleitorado_eleicao.csv (cor/raça, faixa etária, gênero, escolaridade, etc.)" },
  { value: "votacao_candidato_perfil", label: "Votação por candidato × perfil eleitor", tabela: "tse_votacao_candidato_perfil", hint: "votacao_candidato.csv (votos por candidato cruzados com perfil)" },
  { value: "eleitorado", label: "Eleitorado por seção (legado)", tabela: "tse_eleitorado", hint: "perfil_eleitorado_AAAA.csv" },
  { value: "locais", label: "Locais de votação", tabela: "tse_locais_votacao", hint: "eleitorado_local_votacao_AAAA.csv" },
  { value: "candidatos", label: "Candidatos (registro)", tabela: "tse_candidatos", hint: "consulta_cand_AAAA_UF.csv" },
  { value: "resultados", label: "Resultados por seção", tabela: "tse_resultados_secao", hint: "votacao_secao_AAAA_UF.csv" },
];

const CHUNK = 500;

function num(v: any): number | null {
  if (v === undefined || v === null || v === "" || v === "#NULO#" || v === "#NE#") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
function str(v: any): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (!s || s === "#NULO#" || s === "#NE#") return null;
  return s;
}

// Helper: lookup value by case/diacritic-insensitive header match
function pick(row: any, ...keys: string[]): any {
  for (const k of keys) {
    if (row[k] !== undefined) return row[k];
  }
  // Fallback: normalize keys
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
  const wanted = keys.map(norm);
  for (const k of Object.keys(row)) {
    if (wanted.includes(norm(k))) return row[k];
  }
  return undefined;
}

function mapRow(tipo: TipoDado, ano: number, uf: string, row: any): Record<string, any> | null {
  const ufRow = str(pick(row, "SG_UF", "UF")) || uf;
  if (uf !== "BR" && ufRow && ufRow !== uf) return null;

  switch (tipo) {
    case "eleitorado_perfil": {
      const anoCsv = num(pick(row, "Ano de eleição", "Ano de eleicao", "ANO_ELEICAO")) ?? ano;
      return {
        ano: anoCsv,
        uf: ufRow,
        regiao: str(pick(row, "Região", "Regiao")),
        municipio: str(pick(row, "Município", "Municipio")),
        pais: str(pick(row, "País", "Pais")),
        cor_raca: str(pick(row, "Cor / Raça", "Cor/Raça", "Cor / Raca", "Cor/Raca")),
        estado_civil: str(pick(row, "Estado civil")),
        faixa_etaria: str(pick(row, "Faixa etária", "Faixa etaria")),
        genero: str(pick(row, "Gênero", "Genero")),
        grau_instrucao: str(pick(row, "Grau de instrução", "Grau de instrucao")),
        identidade_genero: str(pick(row, "Identidade de gênero", "Identidade de genero")),
        interprete_libras: str(pick(row, "Intérprete de libras", "Interprete de libras")),
        quilombola: str(pick(row, "Quilombola")),
        quantidade_eleitores: num(pick(row, "Quantidade de eleitores")) ?? 0,
        data_carga: str(pick(row, "Data de carga")),
      };
    }
    case "votacao_candidato_perfil": {
      const anoCsv = num(pick(row, "Ano de eleição", "Ano de eleicao")) ?? ano;
      return {
        ano: anoCsv,
        uf: ufRow,
        regiao: str(pick(row, "Região", "Regiao")),
        municipio: str(pick(row, "Município", "Municipio")),
        cod_municipio_tse: str(pick(row, "Código município", "Codigo municipio")),
        cargo: str(pick(row, "Cargo")) || "",
        nome_candidato: str(pick(row, "Nome candidato")),
        numero_candidato: str(pick(row, "Número candidato", "Numero candidato")),
        ocupacao: str(pick(row, "Ocupação", "Ocupacao")),
        partido: str(pick(row, "Partido")),
        situacao_totalizacao: str(pick(row, "Situação totalização", "Situacao totalizacao")),
        turno: num(pick(row, "Turno")) ?? 1,
        zona: num(pick(row, "Zona")),
        cor_raca: str(pick(row, "Cor/raça", "Cor / Raça", "Cor/raca")),
        estado_civil: str(pick(row, "Estado civil")),
        faixa_etaria: str(pick(row, "Faixa etária", "Faixa etaria")),
        genero: str(pick(row, "Gênero", "Genero")),
        grau_instrucao: str(pick(row, "Grau de instrução", "Grau de instrucao")),
        votos_validos: num(pick(row, "Votos válidos", "Votos validos")) ?? 0,
        votos_nominais: num(pick(row, "Votos nominais")) ?? 0,
        data_carga: str(pick(row, "Data de carga")),
      };
    }
    case "eleitorado":
      return {
        ano, uf: ufRow,
        cod_municipio_tse: str(row.CD_MUNICIPIO) || str(row.CD_MUNIC_TSE),
        zona: num(row.NR_ZONA),
        secao: num(row.NR_SECAO),
        total_eleitores: num(row.QT_ELEITORES_PERFIL ?? row.QT_ELEITORES) ?? 0,
        genero: str(row.DS_GENERO) ? { [str(row.DS_GENERO)!]: num(row.QT_ELEITORES_PERFIL) ?? 1 } : null,
        faixa_etaria: str(row.DS_FAIXA_ETARIA) ? { [str(row.DS_FAIXA_ETARIA)!]: num(row.QT_ELEITORES_PERFIL) ?? 1 } : null,
        escolaridade: str(row.DS_GRAU_ESCOLARIDADE) ? { [str(row.DS_GRAU_ESCOLARIDADE)!]: num(row.QT_ELEITORES_PERFIL) ?? 1 } : null,
        estado_civil: str(row.DS_ESTADO_CIVIL) ? { [str(row.DS_ESTADO_CIVIL)!]: num(row.QT_ELEITORES_PERFIL) ?? 1 } : null,
      };
    case "locais":
      return {
        ano, uf: ufRow,
        cod_municipio_tse: str(row.CD_MUNICIPIO),
        codigo_local: str(row.NR_LOCAL_VOTACAO) || str(row.CD_LOCAL_VOTACAO) || "",
        nome_local: str(row.NM_LOCAL_VOTACAO),
        endereco: str(row.DS_ENDERECO),
        bairro: str(row.NM_BAIRRO),
        cep: str(row.NR_CEP),
        zona: num(row.NR_ZONA) ?? 0,
        latitude: num(row.NR_LATITUDE),
        longitude: num(row.NR_LONGITUDE),
      };
    case "candidatos":
      return {
        ano, uf: ufRow,
        turno: num(row.NR_TURNO) ?? 1,
        cargo: str(row.DS_CARGO) || str(row.CD_CARGO) || "",
        numero_urna: str(row.NR_CANDIDATO) || "",
        nome_urna: str(row.NM_URNA_CANDIDATO),
        nome_completo: str(row.NM_CANDIDATO),
        cpf: str(row.NR_CPF_CANDIDATO),
        partido_sigla: str(row.SG_PARTIDO),
        partido_numero: str(row.NR_PARTIDO),
        coligacao: str(row.NM_COLIGACAO),
        genero: str(row.DS_GENERO),
        ocupacao: str(row.DS_OCUPACAO),
        situacao_candidatura: str(row.DS_SITUACAO_CANDIDATURA),
        situacao_eleicao: str(row.DS_SIT_TOT_TURNO),
        eleito: /ELEITO/i.test(str(row.DS_SIT_TOT_TURNO) || ""),
        cod_municipio_tse: str(row.SG_UE),
      };
    case "resultados":
      return {
        ano, uf: ufRow,
        turno: num(row.NR_TURNO) ?? 1,
        cargo: str(row.DS_CARGO) || "",
        cod_municipio_tse: str(row.CD_MUNICIPIO),
        zona: num(row.NR_ZONA) ?? 0,
        secao: num(row.NR_SECAO) ?? 0,
        numero_votavel: str(row.NR_VOTAVEL) || "",
        partido_sigla: str(row.SG_PARTIDO),
        votos: num(row.QT_VOTOS) ?? 0,
      };
  }
}

export function TSECsvUpload() {
  const [tipo, setTipo] = useState<TipoDado>("eleitorado_perfil");
  const [ano, setAno] = useState<number>(2024);
  const [uf, setUf] = useState<string>("BA");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [enviados, setEnviados] = useState(0);
  const [totalLidos, setTotalLidos] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [tipoDetectado, setTipoDetectado] = useState<TipoDado | null>(null);
  const [autoDetect, setAutoDetect] = useState(true);
  const tipoEfetivo: TipoDado = autoDetect && tipoDetectado ? tipoDetectado : tipo;
  const tabela = TIPOS.find((t) => t.value === tipoEfetivo)!.tabela;

  // Modo de processamento
  const [modo, setModo] = useState<"background" | "inline">("background");
  const [archiving, setArchiving] = useState(false);

  // Filtro por município (para CSVs imensos como votação por seção / locais)
  const [scanningMun, setScanningMun] = useState(false);
  const [municipiosDisponiveis, setMunicipiosDisponiveis] = useState<{ codigo: string; nome: string }[]>([]);
  const [municipiosSelecionados, setMunicipiosSelecionados] = useState<Set<string>>(new Set());
  const [filtroBuscaMun, setFiltroBuscaMun] = useState("");
  const podeFiltrarMunicipio = ["resultados", "locais", "votacao_candidato_perfil", "eleitorado_perfil", "eleitorado", "candidatos"].includes(tipoEfetivo);

  const reset = () => {
    setProgress(0); setEnviados(0); setTotalLidos(0); setDone(false); setErro(null);
  };

  const handleFile = (f: File | null) => {
    setFile(f);
    setTipoDetectado(null);
    setMunicipiosDisponiveis([]);
    setMunicipiosSelecionados(new Set());
    setFiltroBuscaMun("");
    reset();
    if (!f) return;
    Papa.parse(f, {
      header: true,
      delimiter: ";",
      skipEmptyLines: true,
      encoding: "ISO-8859-1",
      preview: 1,
      complete: (res) => {
        const headers = (res.meta.fields ?? []) as string[];
        const det = detectTipo(headers, f.name);
        if (det) {
          setTipoDetectado(det);
          setAutoDetect(true);
          toast.success(`Tipo detectado: ${TIPOS.find((t) => t.value === det)?.label}`);
        } else {
          toast.warning("Não detectei o tipo. Selecione manualmente.");
          setAutoDetect(false);
        }
        // Auto-detecta ano/UF a partir da primeira linha
        const row = (res.data?.[0] ?? {}) as any;
        const anoRaw = row["Ano de eleição"] ?? row["Ano de eleicao"] ?? row["ANO_ELEICAO"];
        const ufRaw = row["UF"] ?? row["SG_UF"] ?? row["SG_UF_NASCIMENTO"];
        const anoNum = Number(String(anoRaw ?? "").trim());
        if (Number.isFinite(anoNum) && anoNum >= 1990 && anoNum <= 2100) setAno(anoNum);
        if (typeof ufRaw === "string" && /^[A-Z]{2}$/.test(ufRaw.trim())) setUf(ufRaw.trim());
      },
    });
  };

  // Varre o CSV para listar municípios únicos (rápido, só lê os campos de município)
  const escanearMunicipios = async () => {
    if (!file) return;
    setScanningMun(true);
    setMunicipiosDisponiveis([]);
    const map = new Map<string, string>();
    try {
      await new Promise<void>((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          delimiter: ";",
          skipEmptyLines: true,
          encoding: "ISO-8859-1",
          chunkSize: 1024 * 1024,
          chunk: (results) => {
            for (const row of results.data as any[]) {
              const codigo = String(
                pick(row, "CD_MUNICIPIO", "CD_MUNIC_TSE", "Código município", "Codigo municipio", "SG_UE") ?? ""
              ).trim();
              const nome = String(
                pick(row, "NM_MUNICIPIO", "Município", "Municipio", "NM_UE") ?? ""
              ).trim();
              if (!codigo && !nome) continue;
              const key = codigo || nome;
              if (!map.has(key)) map.set(key, nome || codigo);
            }
          },
          complete: () => resolve(),
          error: (err) => reject(err),
        });
      });
      const list = Array.from(map.entries())
        .map(([codigo, nome]) => ({ codigo, nome }))
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
      setMunicipiosDisponiveis(list);
      toast.success(`${list.length} municípios encontrados na planilha`);
    } catch (e: any) {
      toast.error("Falha ao varrer municípios: " + (e?.message ?? String(e)));
    } finally {
      setScanningMun(false);
    }
  };

  const matchMunicipio = (row: any): boolean => {
    if (municipiosSelecionados.size === 0) return true;
    const codigo = String(
      pick(row, "CD_MUNICIPIO", "CD_MUNIC_TSE", "Código município", "Codigo municipio", "SG_UE") ?? ""
    ).trim();
    const nome = String(
      pick(row, "NM_MUNICIPIO", "Município", "Municipio", "NM_UE") ?? ""
    ).trim();
    return municipiosSelecionados.has(codigo) || municipiosSelecionados.has(nome);
  };

  const sendChunk = async (registros: any[]): Promise<number> => {
    let attempt = 0;
    while (true) {
      const { data, error } = await supabase.functions.invoke("tse-ingest-chunk-public", {
        body: { tabela, registros },
      });
      if (error) throw new Error(error.message);
      const d = data as any;
      if (d?.retry && attempt < 5) {
        attempt++;
        const wait = 500 * Math.pow(2, attempt) + Math.floor(Math.random() * 500);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      if (d?.error) throw new Error(d.error);
      return d?.inserted ?? registros.length;
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Selecione um arquivo CSV");
      return;
    }
    reset();
    setRunning(true);

    let buffer: any[] = [];
    let firstChunk = true;
    let totalEnv = 0;
    let totalRead = 0;
    const fileSize = file.size;

    try {
      await new Promise<void>((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          delimiter: ";",
          skipEmptyLines: true,
          encoding: "ISO-8859-1",
          chunkSize: 1024 * 1024, // 1MB
          chunk: async (results, parser) => {
            parser.pause();
            try {
              for (const row of results.data as any[]) {
                totalRead++;
                if (!matchMunicipio(row)) continue;
                const mapped = mapRow(tipoEfetivo, ano, uf, row);
                if (!mapped) continue;
                buffer.push(mapped);
                if (buffer.length >= CHUNK) {
                  const slice = buffer;
                  buffer = [];
                  const ins = await sendChunk(slice);
                  firstChunk = false;
                  totalEnv += ins;
                  setEnviados(totalEnv);
                }
              }
              setTotalLidos(totalRead);
              const cursor = (results.meta as any).cursor ?? 0;
              setProgress(Math.min(99, Math.round((cursor / fileSize) * 100)));
              parser.resume();
            } catch (err) {
              parser.abort();
              reject(err);
            }
          },
          complete: async () => {
            try {
              if (buffer.length > 0) {
                const ins = await sendChunk(buffer);
                totalEnv += ins;
                setEnviados(totalEnv);
              }
              setProgress(100);
              setDone(true);
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          error: (err) => reject(err),
        });
      });
      toast.success(`Importação concluída: ${totalEnv.toLocaleString("pt-BR")} registros`);
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      setErro(msg);
      toast.error("Falha: " + msg);
    } finally {
      setRunning(false);
    }
  };

  const tipoCfg = TIPOS.find((t) => t.value === tipoEfetivo)!;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" /> Upload de CSV do TSE
        </CardTitle>
        <CardDescription>
          Baixe o ZIP em{" "}
          <a className="underline" href="https://dadosabertos.tse.jus.br/" target="_blank" rel="noreferrer">
            dadosabertos.tse.jus.br
          </a>
          , extraia e envie o CSV. O tipo é <strong>detectado automaticamente</strong> pelo cabeçalho. Processamos em chunks de {CHUNK} registros.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label className="mb-2 block">
              Tipo de dado {autoDetect && tipoDetectado && <span className="text-[10px] font-normal text-success ml-1">● auto-detectado</span>}
            </Label>
            <Select
              value={tipoEfetivo}
              onValueChange={(v) => { setTipo(v as TipoDado); setAutoDetect(false); }}
              disabled={running}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">Esperado: <code>{tipoCfg.hint}</code></p>
          </div>
          <div>
            <Label className="mb-2 block">Ano</Label>
            <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))} disabled={running}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ANOS.map((a) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-2 block">UF</Label>
            <Select value={uf} onValueChange={setUf} disabled={running}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-64">
                {UFS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                <SelectItem value="BR">BR (todos)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="mb-2 block">Arquivo CSV</Label>
          <Input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            disabled={running}
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          {file && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <FileText className="h-3 w-3" /> {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
            </p>
          )}
        </div>

        {file && podeFiltrarMunicipio && (
          <div className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <Label className="text-sm">Filtrar por município (opcional)</Label>
                <p className="text-xs text-muted-foreground">
                  Útil para planilhas estaduais imensas. Sem seleção = importa tudo.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={escanearMunicipios}
                disabled={running || scanningMun}
              >
                {scanningMun ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}
                {municipiosDisponiveis.length > 0 ? "Reescanear" : "Listar municípios"}
              </Button>
            </div>

            {municipiosDisponiveis.length > 0 && (
              <>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Buscar município..."
                    value={filtroBuscaMun}
                    onChange={(e) => setFiltroBuscaMun(e.target.value)}
                    className="h-8"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setMunicipiosSelecionados(new Set())}
                    disabled={municipiosSelecionados.size === 0}
                  >
                    Limpar
                  </Button>
                </div>
                {municipiosSelecionados.size > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {Array.from(municipiosSelecionados).slice(0, 20).map((k) => (
                      <Badge key={k} variant="secondary" className="text-[10px]">
                        {municipiosDisponiveis.find((m) => m.codigo === k || m.nome === k)?.nome ?? k}
                      </Badge>
                    ))}
                    {municipiosSelecionados.size > 20 && (
                      <Badge variant="outline" className="text-[10px]">
                        +{municipiosSelecionados.size - 20}
                      </Badge>
                    )}
                  </div>
                )}
                <ScrollArea className="h-48 rounded border">
                  <div className="p-2 space-y-1">
                    {municipiosDisponiveis
                      .filter((m) =>
                        !filtroBuscaMun ||
                        m.nome.toLowerCase().includes(filtroBuscaMun.toLowerCase()) ||
                        m.codigo.includes(filtroBuscaMun)
                      )
                      .slice(0, 500)
                      .map((m) => {
                        const key = m.codigo || m.nome;
                        const checked = municipiosSelecionados.has(key);
                        return (
                          <label
                            key={key}
                            className="flex items-center gap-2 px-2 py-1 text-xs rounded hover:bg-muted cursor-pointer"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(v) => {
                                const next = new Set(municipiosSelecionados);
                                if (v) next.add(key); else next.delete(key);
                                setMunicipiosSelecionados(next);
                              }}
                            />
                            <span className="flex-1">{m.nome || "—"}</span>
                            <span className="text-muted-foreground">{m.codigo}</span>
                          </label>
                        );
                      })}
                  </div>
                </ScrollArea>
              </>
            )}
          </div>
        )}

        <div className="rounded-lg border p-3 bg-muted/30">
          <Label className="text-sm font-medium mb-2 block">Modo de processamento</Label>
          <RadioGroup value={modo} onValueChange={(v) => setModo(v as any)} disabled={running || archiving} className="grid gap-2 md:grid-cols-2">
            <label className="flex items-start gap-3 rounded border bg-card p-3 cursor-pointer hover:border-primary/60 transition">
              <RadioGroupItem value="background" id="modo-bg" className="mt-0.5" />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Archive className="h-3.5 w-3.5" /> Arquivar e processar em background
                  <Badge variant="secondary" className="text-[10px] h-4">recomendado</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Sobe o CSV para o servidor e processa em background com retomada automática. Pode fechar a aba — ideal para arquivos grandes (&gt; 50 MB).
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 rounded border bg-card p-3 cursor-pointer hover:border-primary/60 transition">
              <RadioGroupItem value="inline" id="modo-inline" className="mt-0.5" />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Zap className="h-3.5 w-3.5" /> Processar agora no navegador
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Mais rápido para arquivos pequenos. <strong>Não feche a aba</strong> durante o envio.
                </p>
              </div>
            </label>
          </RadioGroup>
        </div>

        {(running || done || erro || archiving) && (
          <div className="space-y-2">
            <Progress value={progress} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Lidos: {totalLidos.toLocaleString("pt-BR")}</span>
              <span>Enviados: {enviados.toLocaleString("pt-BR")}</span>
              <span>{progress}%</span>
            </div>
          </div>
        )}

        {done && !erro && modo === "inline" && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Importação concluída. {enviados.toLocaleString("pt-BR")} registros inseridos em <code>{tabela}</code>.
            </AlertDescription>
          </Alert>
        )}
        {erro && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          {modo === "inline" ? (
            <Button onClick={handleUpload} disabled={!file || running}>
              {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {running ? "Processando..." : "Processar e enviar"}
            </Button>
          ) : (
            <Button
              onClick={async () => {
                if (!file) { toast.error("Selecione um arquivo"); return; }
                setArchiving(true);
                setProgress(0);
                setErro(null);
                try {
                  const arq = await arquivarCsvParaProcessamento({
                    file,
                    tipo: tipoEfetivo as TseCsvTipo,
                    ano,
                    uf,
                    municipios_filtro: municipiosSelecionados.size > 0 ? Array.from(municipiosSelecionados) : null,
                    onProgress: setProgress,
                  });
                  toast.success(`Arquivo enviado para a fila (${arq.id.slice(0, 8)}). Acompanhe abaixo.`);
                  setFile(null);
                  if (inputRef.current) inputRef.current.value = "";
                  reset();
                } catch (e: any) {
                  const msg = e?.message ?? String(e);
                  setErro(msg);
                  toast.error("Falha ao arquivar: " + msg);
                } finally {
                  setArchiving(false);
                }
              }}
              disabled={!file || archiving}
            >
              {archiving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Archive className="h-4 w-4 mr-2" />}
              {archiving ? "Enviando..." : "Arquivar e enfileirar"}
            </Button>
          )}
          {(done || erro) && (
            <Button variant="ghost" onClick={() => { setFile(null); reset(); if (inputRef.current) inputRef.current.value = ""; }}>
              Novo upload
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
