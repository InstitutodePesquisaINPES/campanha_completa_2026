import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { useCampanhaAtiva, useTarefas, useMetas } from "@/hooks/useCampanhas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, AlertTriangle, TrendingUp, Quote } from "lucide-react";

/**
 * Briefing do Consultor — fala como Stenio Fernando, consultor político.
 * Diagnóstico em linguagem natural a partir dos dados reais da campanha:
 *  - dias até eleição × % do plano executado
 *  - tarefas atrasadas
 *  - metas em risco
 *  - próxima janela TSE crítica
 *  - sugestões de ação
 */
export function ConsultorBriefing() {
  const { data: campanha } = useCampanhaAtiva();
  const { data: tarefas = [] } = useTarefas(campanha?.id);
  const { data: metas = [] } = useMetas(campanha?.id);

  const { data: pessoasCount = 0 } = useQuery({
    queryKey: ["consultor-pessoas-count"],
    queryFn: async () => {
      try {
        const data = await api.get<any>("/pessoas/count");
        return data?.count ?? 0;
      } catch {
        return 0;
      }
    },
  });

  const insights = useMemo(() => {
    if (!campanha) return null;
    const hoje = new Date();
    const eleicao = new Date(campanha.data_eleicao);
    const inicio = new Date(campanha.data_inicio_plano);
    const diasParaEleicao = Math.max(0, Math.ceil((eleicao.getTime() - hoje.getTime()) / 86400000));
    const diasDecorridos = Math.max(0, Math.ceil((hoje.getTime() - inicio.getTime()) / 86400000));
    const pctPlano = Math.min(100, Math.round((diasDecorridos / 90) * 100));

    const concluidas = tarefas.filter((t) => t.status === "concluida").length;
    const total = tarefas.length;
    const pctExecucao = total > 0 ? Math.round((concluidas / total) * 100) : 0;

    const atrasadas = tarefas.filter(
      (t) => t.status !== "concluida" && new Date(t.data_prevista) < hoje
    ).length;

    const proximas = tarefas
      .filter((t) => t.status !== "concluida" && new Date(t.data_prevista) >= hoje)
      .sort((a, b) => new Date(a.data_prevista).getTime() - new Date(b.data_prevista).getTime())
      .slice(0, 3);

    const metasRisco = metas.filter((m) => m.valor_meta > 0 && (m.valor_realizado / m.valor_meta) < 0.5).length;
    const metaCadastro = (campanha.meta_votos ?? 0) * 0.35;
    const gapCadastro = Math.max(0, metaCadastro - pessoasCount);

    // Análise de ritmo: quanto deveríamos ter executado vs. quanto executamos
    const gapRitmo = pctPlano - pctExecucao;

    return {
      diasParaEleicao,
      pctPlano,
      pctExecucao,
      atrasadas,
      proximas,
      metasRisco,
      gapCadastro,
      metaCadastro,
      gapRitmo,
    };
  }, [campanha, tarefas, metas, pessoasCount]);

  if (!campanha || !insights) return null;

  // Mensagem-chave (estilo Stenio)
  const stenioMessage = (() => {
    if (insights.diasParaEleicao < 30) {
      return "Estamos na reta final. Toda decisão a partir daqui precisa ter impacto direto em voto. Pare de criar, comece a converter.";
    }
    if (insights.gapRitmo > 15) {
      return `Você está ${insights.gapRitmo} pontos atrás do ritmo do plano. Isso ainda é recuperável, mas precisa de uma semana de aceleração agora — não na próxima.`;
    }
    if (insights.atrasadas > 5) {
      return `${insights.atrasadas} tarefas atrasadas significam que sua estrutura está com gargalo. Reduza o escopo da semana e fortaleça o cumprido — o que se arrasta vira ruído.`;
    }
    if (insights.gapCadastro > 1000) {
      return `Faltam ${insights.gapCadastro.toLocaleString("pt-BR")} cadastros para a meta. Cadastro é o que separa intenção de voto de voto contado — priorize cobertura de bairro.`;
    }
    return "Campanha no ritmo. Mantenha disciplina nos marcos do TSE, agenda territorial e produção de conteúdo. Consistência > improviso.";
  })();

  // Recomendações táticas
  const recs: { icon: typeof Lightbulb; title: string; desc: string; tone: "warn" | "info" | "ok" }[] = [];

  if (insights.gapRitmo > 10) {
    recs.push({
      icon: TrendingUp,
      title: "Acelerar execução semanal",
      desc: `Plano em ${insights.pctPlano}% do tempo, mas execução só em ${insights.pctExecucao}%. Faça uma reunião de aceleração hoje e quebre as 3 próximas tarefas em entregáveis diários.`,
      tone: "warn",
    });
  }
  if (insights.atrasadas > 0) {
    recs.push({
      icon: AlertTriangle,
      title: `${insights.atrasadas} tarefa${insights.atrasadas > 1 ? "s" : ""} fora do prazo`,
      desc: "Reagende ou conclua hoje. Tarefa atrasada na campanha vira dívida emocional para a equipe — corte o ciclo.",
      tone: "warn",
    });
  }
  if (insights.gapCadastro > 0) {
    recs.push({
      icon: Lightbulb,
      title: "Operação de cadastro",
      desc: `Cadastrar ~${Math.ceil(insights.gapCadastro / Math.max(1, Math.ceil((insights.diasParaEleicao || 1) / 7)))} pessoas/semana até a eleição para fechar a meta de ${insights.metaCadastro.toLocaleString("pt-BR")}. Direcione a equipe de campo para Vitória da Conquista (base) + 2 cidades de foco/semana.`,
      tone: "info",
    });
  }
  if (insights.metasRisco > 0) {
    recs.push({
      icon: AlertTriangle,
      title: `${insights.metasRisco} meta${insights.metasRisco > 1 ? "s" : ""} abaixo de 50%`,
      desc: "Revise no painel de Metas se elas ainda fazem sentido. Cortar uma meta irreal é mais profissional do que arrastar até o fim.",
      tone: "warn",
    });
  }
  if (recs.length === 0) {
    recs.push({
      icon: TrendingUp,
      title: "Tudo no ritmo",
      desc: "Nenhuma anomalia crítica. Use esta janela para qualificar conteúdo digital e agenda territorial das próximas duas semanas.",
      tone: "ok",
    });
  }

  return (
    <Card className="overflow-hidden border-2" style={{ borderColor: "hsl(var(--brand-yellow) / 0.4)" }}>
      <CardHeader className="brand-gradient text-white pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Quote className="h-4 w-4" style={{ color: "hsl(var(--brand-yellow))" }} />
          Briefing do Consultor
          <Badge className="ml-auto bg-white/15 text-white border-white/20 hover:bg-white/20">Stenio Fernando</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5 space-y-4">
        <div className="stenio-quote">"{stenioMessage}"</div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
          <div className="rounded-md border p-2 text-center">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Plano</div>
            <div className="text-lg font-bold">{insights.pctPlano}%</div>
          </div>
          <div className="rounded-md border p-2 text-center">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Execução</div>
            <div className={`text-lg font-bold ${insights.gapRitmo > 10 ? "text-destructive" : "text-success"}`}>{insights.pctExecucao}%</div>
          </div>
          <div className="rounded-md border p-2 text-center">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Atrasadas</div>
            <div className={`text-lg font-bold ${insights.atrasadas > 0 ? "text-warning" : ""}`}>{insights.atrasadas}</div>
          </div>
          <div className="rounded-md border p-2 text-center">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">D-eleição</div>
            <div className={`text-lg font-bold ${insights.diasParaEleicao < 30 ? "text-destructive" : ""}`}>{insights.diasParaEleicao}</div>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recomendações táticas</div>
          {recs.map((r, i) => {
            const tone = r.tone === "warn" ? "border-warning/40 bg-warning/5" : r.tone === "ok" ? "border-success/40 bg-success/5" : "border-info/40 bg-info/5";
            const iconTone = r.tone === "warn" ? "text-warning" : r.tone === "ok" ? "text-success" : "text-info";
            return (
              <div key={i} className={`flex gap-3 rounded-md border p-3 ${tone}`}>
                <r.icon className={`h-4 w-4 mt-0.5 shrink-0 ${iconTone}`} />
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{r.title}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {insights.proximas.length > 0 && (
          <div className="pt-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Próximas 3 ações no plano</div>
            <div className="space-y-1.5">
              {insights.proximas.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-2 text-sm py-1.5 px-2 rounded hover:bg-muted/50">
                  <span className="truncate">{t.titulo}</span>
                  <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                    {new Date(t.data_prevista).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
