import { useState } from "react";
import { useStrategicMunicipios, useUpdateMunicipioStrategy, type StrategicMunicipio } from "@/hooks/useTerritorioStrategic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Star, AlertCircle, MapPin, Users, Home, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CLASS_INFO: Record<string, { label: string; cls: string; ord: number }> = {
  foco:  { label: "Sede",   cls: "bg-primary text-primary-foreground border-primary",          ord: 0 },
  A:     { label: "A · Alta",   cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/40 dark:text-emerald-300", ord: 1 },
  B:     { label: "B · Média",  cls: "bg-amber-500/15 text-amber-700 border-amber-500/40 dark:text-amber-300",         ord: 2 },
  C:     { label: "C · Baixa",  cls: "bg-slate-500/15 text-slate-600 border-slate-500/40 dark:text-slate-300",         ord: 3 },
  __:    { label: "Sem class.", cls: "bg-muted text-muted-foreground border-border",                                   ord: 4 },
};

function classOf(m: StrategicMunicipio) {
  return m.classificacao_estrategica ? CLASS_INFO[m.classificacao_estrategica] : CLASS_INFO.__;
}

export function VisaoEstrategicaTab() {
  const { data: municipios = [], isLoading } = useStrategicMunicipios();
  const updateStrategy = useUpdateMunicipioStrategy();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filtroClass, setFiltroClass] = useState<string>("__all__");
  const [showAll, setShowAll] = useState(false);
  const [sortBy, setSortBy] = useState<"prioridade" | "eleitorado" | "nome" | "cobertura">("prioridade");

  const baseList = showAll ? municipios : municipios.filter((m) => m.is_foco);
  const filtered = baseList
    .filter((m) => m.nome.toLowerCase().includes(search.toLowerCase()))
    .filter((m) => filtroClass === "__all__" || (filtroClass === "__none__" ? !m.classificacao_estrategica : m.classificacao_estrategica === filtroClass));

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "nome") return a.nome.localeCompare(b.nome);
    if (sortBy === "eleitorado") return (b.eleitorado_total || 0) - (a.eleitorado_total || 0);
    if (sortBy === "cobertura") return b.bairros_count - a.bairros_count;
    // prioridade: classificação asc, depois prioridade asc, depois eleitorado desc
    const ca = classOf(a).ord, cb = classOf(b).ord;
    if (ca !== cb) return ca - cb;
    const pa = a.prioridade_campanha ?? 99, pb = b.prioridade_campanha ?? 99;
    if (pa !== pb) return pa - pb;
    return (b.eleitorado_total || 0) - (a.eleitorado_total || 0);
  });

  const handleClassUpdate = async (m: StrategicMunicipio, value: string) => {
    try {
      await updateStrategy.mutateAsync({
        id: m.id,
        classificacao_estrategica: value === "__clear__" ? null : (value as any),
      });
      toast({ title: "Classificação atualizada", description: m.nome });
    } catch (e: any) { toast({ variant: "destructive", description: e.message }); }
  };

  const handlePrioridadeUpdate = async (m: StrategicMunicipio, value: string) => {
    try {
      await updateStrategy.mutateAsync({
        id: m.id,
        prioridade_campanha: value === "__clear__" ? null : parseInt(value),
      });
    } catch (e: any) { toast({ variant: "destructive", description: e.message }); }
  };

  // Métricas rápidas para o ranking
  const totalEleitorado = sorted.reduce((s, m) => s + (m.eleitorado_total || 0), 0);

  const gaps = municipios.filter((m) => m.is_foco && m.bairros_count === 0);
  const semClassificacao = municipios.filter((m) => m.is_foco && !m.classificacao_estrategica);

  return (
    <div className="space-y-4">
      {/* Alertas de gaps */}
      {(gaps.length > 0 || semClassificacao.length > 0) && (
        <div className="grid gap-3 md:grid-cols-2">
          {gaps.length > 0 && (
            <Card className="border-rose-500/30 bg-rose-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-rose-700 dark:text-rose-400 mb-2">
                  <AlertCircle className="h-4 w-4" /> {gaps.length} municípios foco sem bairros mapeados
                </div>
                <p className="text-xs text-muted-foreground mb-2">Sem bairros, você não consegue segmentar caminhadas, eventos nem demandas. Comece pelos maiores:</p>
                <div className="flex flex-wrap gap-1.5">
                  {gaps.slice(0, 6).map((m) => (
                    <Badge key={m.id} variant="outline" className="text-[10px] border-rose-300">{m.nome}</Badge>
                  ))}
                  {gaps.length > 6 && <Badge variant="outline" className="text-[10px]">+{gaps.length - 6}</Badge>}
                </div>
              </CardContent>
            </Card>
          )}
          {semClassificacao.length > 0 && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2">
                  <Star className="h-4 w-4" /> {semClassificacao.length} municípios sem classificação A/B/C
                </div>
                <p className="text-xs text-muted-foreground">Defina a prioridade estratégica para focar esforços e orçamento. Use o seletor de cada card abaixo.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-base">Ranking estratégico ({sorted.length})</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Eleitorado total visível: <strong>{totalEleitorado.toLocaleString("pt-BR")}</strong>
            </p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <Button size="sm" variant={showAll ? "outline" : "default"} onClick={() => setShowAll(!showAll)}>
              {showAll ? "Só foco da campanha" : `Ver todos (${municipios.length})`}
            </Button>
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="prioridade">Ordenar: Prioridade</SelectItem>
                <SelectItem value="eleitorado">Ordenar: Eleitorado</SelectItem>
                <SelectItem value="cobertura">Ordenar: Bairros</SelectItem>
                <SelectItem value="nome">Ordenar: Nome</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar município..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
            </div>
            <Select value={filtroClass} onValueChange={setFiltroClass}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas as classes</SelectItem>
                <SelectItem value="foco">Sede da campanha</SelectItem>
                <SelectItem value="A">A · Alta prioridade</SelectItem>
                <SelectItem value="B">B · Média</SelectItem>
                <SelectItem value="C">C · Baixa</SelectItem>
                <SelectItem value="__none__">Sem classificação</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              Nenhum município encontrado com esses filtros.
              {!showAll && <Button variant="link" onClick={() => setShowAll(true)} className="ml-1 p-0 h-auto">Ver todos</Button>}
            </p>
          ) : (
            <div className="space-y-2">
              {sorted.map((m, idx) => {
                const ci = classOf(m);
                const maxBairros = Math.max(1, ...sorted.map((x) => x.bairros_count));
                const cobertura = (m.bairros_count / maxBairros) * 100;
                return (
                  <div
                    key={m.id}
                    className={`grid grid-cols-[40px_1fr_auto_auto_auto] gap-3 items-center p-3 rounded-lg border transition-colors ${
                      m.is_foco ? "bg-primary/5 border-primary/20" : "bg-card border-border"
                    } hover:bg-accent/40`}
                  >
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">#{idx + 1}</div>
                      {m.prioridade_campanha && (
                        <Badge variant="outline" className="text-[10px] mt-1">P{m.prioridade_campanha}</Badge>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold truncate">{m.nome}</span>
                        {m.is_foco && <Badge className="text-[10px] h-4 bg-primary/15 text-primary border-primary/30 hover:bg-primary/15" variant="outline">Foco</Badge>}
                        <Badge variant="outline" className={`text-[10px] h-4 ${ci.cls}`}>{ci.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{m.eleitorado_total ? m.eleitorado_total.toLocaleString("pt-BR") : "?"} eleitores</span>
                        <span className="flex items-center gap-1"><Home className="h-3 w-3" />{m.bairros_count} bairros</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{m.pessoas_count} pessoas</span>
                      </div>
                      <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary/60 transition-all" style={{ width: `${cobertura}%` }} />
                      </div>
                    </div>

                    <Select value={m.classificacao_estrategica || "__clear__"} onValueChange={(v) => handleClassUpdate(m, v)}>
                      <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__clear__">Sem classe</SelectItem>
                        <SelectItem value="foco">Sede</SelectItem>
                        <SelectItem value="A">A · Alta</SelectItem>
                        <SelectItem value="B">B · Média</SelectItem>
                        <SelectItem value="C">C · Baixa</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={m.prioridade_campanha?.toString() || "__clear__"} onValueChange={(v) => handlePrioridadeUpdate(m, v)}>
                      <SelectTrigger className="w-20 h-8 text-xs"><SelectValue placeholder="P?" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__clear__">—</SelectItem>
                        <SelectItem value="1">P1 · Urgente</SelectItem>
                        <SelectItem value="2">P2</SelectItem>
                        <SelectItem value="3">P3</SelectItem>
                        <SelectItem value="4">P4</SelectItem>
                        <SelectItem value="5">P5</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="text-right text-xs">
                      {!m.geocodigo_ibge && <Badge variant="outline" className="text-[10px] text-rose-600 border-rose-300">Sem IBGE</Badge>}
                      {!m.eleitorado_total && <Badge variant="outline" className="text-[10px] mt-1">Sem eleitorado</Badge>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
