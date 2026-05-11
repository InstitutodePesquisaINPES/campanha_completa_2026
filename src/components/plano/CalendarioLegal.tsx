import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Gavel, FileText, Megaphone, Tv, Wallet, MessageSquare, Vote, ShieldCheck,
  AlertTriangle, CheckCircle2, Calendar as CalIcon, Info,
} from "lucide-react";
import { useCampanha } from "@/hooks/useCampanhas";

type Marco = {
  id: string;
  dias_antes: number;            // dias antes da eleição (D-x)
  data: Date;
  titulo: string;
  descricao: string;
  base_legal: string;
  categoria: "registro" | "propaganda" | "hgpe" | "financeiro" | "debate" | "voto" | "geral";
  cargos?: string[];             // se vazio, aplica a todos
  obrigatorio: boolean;
};

const cores: Record<Marco["categoria"], string> = {
  registro: "bg-warning/10 text-warning border-warning/30",
  propaganda: "bg-primary/10 text-primary border-primary/30",
  hgpe: "bg-info/10 text-info border-info/30",
  financeiro: "bg-success/10 text-success border-success/30",
  debate: "bg-accent text-accent-foreground border-border",
  voto: "bg-destructive/10 text-destructive border-destructive/30",
  geral: "bg-muted text-muted-foreground border-border",
};

const icones: Record<Marco["categoria"], React.ElementType> = {
  registro: FileText,
  propaganda: Megaphone,
  hgpe: Tv,
  financeiro: Wallet,
  debate: MessageSquare,
  voto: Vote,
  geral: Gavel,
};

function gerarMarcos(eleicao: Date, cargo: string): Marco[] {
  const d = (dias: number) => {
    const x = new Date(eleicao);
    x.setDate(x.getDate() - dias);
    return x;
  };
  const isExecutivo = ["prefeito", "vice_prefeito", "governador", "vice_governador", "presidente"].includes(cargo);
  const isMajoritario = isExecutivo || cargo === "senador";

  const lista: Marco[] = [
    // CONVENÇÕES PARTIDÁRIAS
    { id: "conv_inicio", dias_antes: 87, data: d(87), titulo: "Início das convenções partidárias",
      descricao: "Período de 20/jul a 5/ago para convenções de escolha de candidatos e deliberação sobre coligações/federações.",
      base_legal: "Lei 9.504/97 art. 8º", categoria: "geral", obrigatorio: true },
    { id: "conv_fim", dias_antes: 72, data: d(72), titulo: "Fim das convenções partidárias",
      descricao: "Encerramento do prazo para convenções. Após esta data, partidos não podem mais decidir candidaturas.",
      base_legal: "Lei 9.504/97 art. 8º", categoria: "geral", obrigatorio: true },

    // REGISTRO
    { id: "reg_cnd", dias_antes: 50, data: d(50), titulo: "Prazo final do registro de candidatura (DRAP/RRC)",
      descricao: "Apresentação do RRC ao TSE/TRE até 15/ago. Após este prazo, não há registro de novos candidatos.",
      base_legal: "Lei 9.504/97 art. 11", categoria: "registro", obrigatorio: true },
    { id: "candidatura_aprovada", dias_antes: 30, data: d(30), titulo: "Diligências sobre registros pendentes",
      descricao: "Período típico para julgamento de impugnações, recursos e diligências sobre registros.",
      base_legal: "LC 64/90; Res. TSE 23.609/19", categoria: "registro", obrigatorio: false },

    // PROPAGANDA
    { id: "prop_oficial", dias_antes: 49, data: d(49), titulo: "Início da propaganda eleitoral oficial",
      descricao: "Permitido pedir voto, comício, carreata, distribuição de material gráfico, propaganda em internet com aviso 'Propaganda Eleitoral'.",
      base_legal: "Lei 9.504/97 art. 36; Res. TSE 23.610/19 art. 7º", categoria: "propaganda", obrigatorio: true },
    { id: "outdoor_proibido", dias_antes: 49, data: d(49), titulo: "ATENÇÃO: outdoor é proibido",
      descricao: "É vedada a propaganda eleitoral em outdoor (Lei 9.504/97 art. 39 §8º). Multa: R$ 5.000 a R$ 15.000.",
      base_legal: "Lei 9.504/97 art. 39 §8º", categoria: "propaganda", obrigatorio: true },
    { id: "showmicio_proibido", dias_antes: 49, data: d(49), titulo: "ATENÇÃO: showmício é proibido",
      descricao: "Apresentação de artistas em comício é vedada (Lei 9.504/97 art. 39 §7º). Multa e cassação possíveis.",
      base_legal: "Lei 9.504/97 art. 39 §7º", categoria: "propaganda", obrigatorio: true },

    // HGPE
    ...(isExecutivo || cargo === "senador" || cargo.startsWith("deputado") ? [{
      id: "hgpe", dias_antes: 35, data: d(35), titulo: "Início do HGPE — Rádio e TV",
      descricao: "Horário Gratuito de Propaganda Eleitoral nos 35 dias anteriores à eleição. Distribuído por tempo de partido na Câmara.",
      base_legal: "Lei 9.504/97 art. 47", categoria: "hgpe" as const, obrigatorio: true,
    }] : []),

    // DEBATES
    { id: "debate_inicio", dias_antes: 48, data: d(48), titulo: "Início do período de debates",
      descricao: "Debates podem ser realizados após o prazo de registro. Emissoras devem convidar candidatos com 5%+ na Câmara.",
      base_legal: "Lei 9.504/97 art. 46", categoria: "debate", obrigatorio: false },
    { id: "debate_fim", dias_antes: 2, data: d(2), titulo: "Último dia para debates em rádio/TV",
      descricao: "Vedada a realização de debates a partir do dia anterior ao pleito (sexta-feira anterior à eleição).",
      base_legal: "Lei 9.504/97 art. 46", categoria: "debate", obrigatorio: false },

    // FINANCEIRO
    { id: "abertura_conta", dias_antes: 60, data: d(60), titulo: "Abertura de conta bancária da campanha",
      descricao: "Conta bancária específica para movimentação da campanha (CNPJ eleitoral). Recomendado abrir antes do registro.",
      base_legal: "Res. TSE 23.607/19 art. 10", categoria: "financeiro", obrigatorio: true },
    { id: "prest_parcial1", dias_antes: 41, data: d(41), titulo: "1ª prestação de contas parcial",
      descricao: "Divulgação parcial de receitas e despesas (até 73 dias após pedido de registro / próximo a 09/set nas gerais).",
      base_legal: "Lei 9.504/97 art. 28 §4º", categoria: "financeiro", obrigatorio: true },
    { id: "prest_parcial2", dias_antes: 11, data: d(11), titulo: "2ª prestação de contas parcial",
      descricao: "Segunda divulgação parcial (próximo a 27/set nas eleições gerais).",
      base_legal: "Lei 9.504/97 art. 28 §4º", categoria: "financeiro", obrigatorio: true },
    { id: "prest_final", dias_antes: -30, data: d(-30), titulo: "Prestação de contas final ao TSE/TRE",
      descricao: "Até 30 dias após o pleito (1º turno). Sem prestar contas: candidato fica inelegível e pode perder o diploma.",
      base_legal: "Lei 9.504/97 art. 29", categoria: "financeiro", obrigatorio: true },

    // VOTAÇÃO
    { id: "boca_proibida", dias_antes: 0, data: d(0), titulo: "PROIBIDO: boca de urna no dia da eleição",
      descricao: "É vedada qualquer manifestação em local de votação — uso de bandeiras, distribuição de santinhos, transporte de eleitor.",
      base_legal: "Lei 9.504/97 art. 39-A; Código Eleitoral art. 39", categoria: "voto", obrigatorio: true },
    { id: "transporte_proibido", dias_antes: 0, data: d(0), titulo: "PROIBIDO: transporte de eleitor",
      descricao: "Salvo transporte público regular ou pelo poder público, é vedado oferecer transporte ao eleitor.",
      base_legal: "Lei 6.091/74 art. 11", categoria: "voto", obrigatorio: true },
    { id: "eleicao", dias_antes: 0, data: d(0), titulo: "🗳️ DIA DA ELEIÇÃO (1º turno)",
      descricao: "Votação das 8h às 17h (horário de Brasília). Mobilização de fiscais por seção, sala de apuração e plano de crise.",
      base_legal: "Lei 9.504/97 art. 1º; Constituição Federal", categoria: "voto", obrigatorio: true },
    ...(isMajoritario ? [{
      id: "segundo_turno", dias_antes: -28, data: d(-28), titulo: "Possível 2º turno (28 dias depois)",
      descricao: "Em municípios com 200k+ eleitores e nas eleições para governador/presidente: 2º turno se nenhum candidato fizer maioria absoluta.",
      base_legal: "Constituição Federal art. 29 II + 77 §3º", categoria: "voto" as const, obrigatorio: false,
    }] : []),

    // PÓS
    { id: "diploma", dias_antes: -75, data: d(-75), titulo: "Diplomação dos eleitos",
      descricao: "Até 19/dez (eleições gerais) / 19/dez (municipais). Após diploma, eleito pode tomar posse.",
      base_legal: "Código Eleitoral art. 215", categoria: "geral", obrigatorio: true },
  ];

  return lista
    .filter((m) => !m.cargos || m.cargos.includes(cargo))
    .sort((a, b) => b.dias_antes - a.dias_antes);
}

export function CalendarioLegal({ campanhaId }: { campanhaId: string }) {
  const { data: campanha } = useCampanha(campanhaId);

  const marcos = useMemo(() => {
    if (!campanha?.data_eleicao) return [];
    return gerarMarcos(new Date(campanha.data_eleicao), campanha.cargo);
  }, [campanha]);

  if (!campanha) return null;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const passados = marcos.filter((m) => m.data < hoje);
  const futuros = marcos.filter((m) => m.data >= hoje);
  const proximos14d = futuros.filter((m) => (m.data.getTime() - hoje.getTime()) / 86400000 <= 14);

  const renderMarco = (m: Marco) => {
    const Icon = icones[m.categoria];
    const isPast = m.data < hoje;
    const diasRestantes = Math.ceil((m.data.getTime() - hoje.getTime()) / 86400000);
    return (
      <Card key={m.id} className={`relative ${isPast ? "opacity-60" : ""}`}>
        <div className={`absolute -left-[1.85rem] top-4 h-4 w-4 rounded-full border-2 border-background ${
          isPast ? "bg-muted-foreground" : Math.abs(diasRestantes) <= 14 ? "bg-destructive" : "bg-primary"
        }`} />
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-start gap-2 min-w-0 flex-1">
              <Icon className="h-4 w-4 mt-0.5 shrink-0 text-foreground/70" />
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight">{m.titulo}</p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <CalIcon className="h-2.5 w-2.5" />
                  {m.data.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
                  {" · "}
                  {m.dias_antes >= 0 ? `D-${m.dias_antes}` : `D+${Math.abs(m.dias_antes)}`}
                  {!isPast && diasRestantes <= 14 && diasRestantes >= 0 && (
                    <Badge variant="outline" className="text-[9px] h-4 px-1 bg-destructive/10 text-destructive border-destructive/30 ml-1">
                      em {diasRestantes}d
                    </Badge>
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <Badge variant="outline" className={`text-[9px] capitalize ${cores[m.categoria]}`}>{m.categoria}</Badge>
              {m.obrigatorio && <Badge variant="outline" className="text-[9px] gap-0.5"><CheckCircle2 className="h-2.5 w-2.5" />Obrigatório</Badge>}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{m.descricao}</p>
          <p className="text-[10px] text-muted-foreground/80 italic mt-1.5 border-l-2 border-border pl-1.5">
            ⚖️ {m.base_legal}
          </p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <Alert className="border-info/30 bg-info/5">
        <Info className="h-4 w-4 text-info" />
        <AlertDescription className="text-xs">
          Calendário gerado automaticamente a partir da <strong>data da eleição ({new Date(campanha.data_eleicao).toLocaleDateString("pt-BR")})</strong> e do cargo (<strong className="capitalize">{campanha.cargo?.replace("_", " ") || "Não definido"}</strong>).
          Datas conforme <strong>Lei 9.504/97</strong>, <strong>Res. TSE 23.610/2019</strong> (atualizada pela 23.735/2024) e legislação correlata.
          Consulte sempre o calendário oficial do TSE para sua eleição.
        </AlertDescription>
      </Alert>

      {proximos14d.length > 0 && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Atenção · Próximos 14 dias ({proximos14d.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {proximos14d.map((m) => (
              <div key={m.id} className="flex items-start justify-between gap-2 text-xs">
                <span className="font-medium">{m.titulo}</span>
                <Badge variant="outline" className="shrink-0">{m.data.toLocaleDateString("pt-BR")}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" /> Próximos marcos legais ({futuros.length})
          </h3>
        </div>
        <div className="relative pl-6 border-l-2 border-border space-y-2">
          {futuros.map(renderMarco)}
          {futuros.length === 0 && (
            <p className="text-xs text-muted-foreground py-4 text-center">Eleição já ocorreu — veja marcos passados abaixo.</p>
          )}
        </div>
      </div>

      {passados.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground py-2">
            ▸ Marcos já decorridos ({passados.length})
          </summary>
          <div className="relative pl-6 border-l-2 border-border space-y-2 mt-2">
            {passados.map(renderMarco)}
          </div>
        </details>
      )}
    </div>
  );
}
