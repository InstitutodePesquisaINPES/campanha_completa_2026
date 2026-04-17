import { useState, useRef } from "react";
import Papa from "papaparse";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const ANOS = [2024, 2022, 2020, 2018, 2016];

type TipoDado = "eleitorado" | "locais" | "candidatos" | "resultados";

const TIPOS: { value: TipoDado; label: string; tabela: string; hint: string }[] = [
  { value: "eleitorado", label: "Eleitorado (perfil)", tabela: "tse_eleitorado", hint: "perfil_eleitorado_AAAA.csv" },
  { value: "locais", label: "Locais de votação", tabela: "tse_locais_votacao", hint: "eleitorado_local_votacao_AAAA.csv" },
  { value: "candidatos", label: "Candidatos", tabela: "tse_candidatos", hint: "consulta_cand_AAAA_UF.csv" },
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

function mapRow(tipo: TipoDado, ano: number, uf: string, row: any): Record<string, any> | null {
  const ufRow = str(row.SG_UF) || str(row.UF) || uf;
  if (uf !== "BR" && ufRow && ufRow !== uf) return null;

  switch (tipo) {
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
  const [tipo, setTipo] = useState<TipoDado>("eleitorado");
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

  const tabela = TIPOS.find((t) => t.value === tipo)!.tabela;

  const reset = () => {
    setProgress(0); setEnviados(0); setTotalLidos(0); setDone(false); setErro(null);
  };

  const sendChunk = async (registros: any[], firstChunk: boolean): Promise<number> => {
    const { data, error } = await supabase.functions.invoke("tse-ingest-chunk-public", {
      body: {
        tabela,
        registros,
        ...(firstChunk ? { truncate_filter: { ano, uf } } : {}),
      },
    });
    if (error) throw new Error(error.message);
    if ((data as any)?.error) throw new Error((data as any).error);
    return (data as any)?.inserted ?? registros.length;
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
                const mapped = mapRow(tipo, ano, uf, row);
                if (!mapped) continue;
                buffer.push(mapped);
                if (buffer.length >= CHUNK) {
                  const slice = buffer;
                  buffer = [];
                  const ins = await sendChunk(slice, firstChunk);
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
                const ins = await sendChunk(buffer, firstChunk);
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

  const tipoCfg = TIPOS.find((t) => t.value === tipo)!;

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
          , extraia e envie o CSV. Processamos em chunks de {CHUNK} registros.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label className="mb-2 block">Tipo de dado</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoDado)} disabled={running}>
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
            onChange={(e) => { setFile(e.target.files?.[0] ?? null); reset(); }}
          />
          {file && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <FileText className="h-3 w-3" /> {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
            </p>
          )}
        </div>

        {(running || done || erro) && (
          <div className="space-y-2">
            <Progress value={progress} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Lidos: {totalLidos.toLocaleString("pt-BR")}</span>
              <span>Enviados: {enviados.toLocaleString("pt-BR")}</span>
              <span>{progress}%</span>
            </div>
          </div>
        )}

        {done && !erro && (
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
          <Button onClick={handleUpload} disabled={!file || running}>
            {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            {running ? "Processando..." : "Processar e enviar"}
          </Button>
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
