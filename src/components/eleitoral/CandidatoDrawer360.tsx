import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCandidatoHistorico, useCandidatoMatchPessoa } from "@/hooks/useEleitoralTSE";
import { useNavigate } from "react-router-dom";
import { Trophy, User, Vote, ExternalLink, Calendar, Briefcase } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function CandidatoDrawer360({ candidato, onClose }: { candidato: any | null; onClose: () => void }) {
  const navigate = useNavigate();
  const { data: historico = [] } = useCandidatoHistorico(candidato?.nome_completo ?? null, candidato?.cpf ?? null);
  const { data: pessoaMatch } = useCandidatoMatchPessoa(candidato?.nome_completo ?? null, candidato?.cpf ?? null);

  if (!candidato) return null;

  const historicoExibicao = historico.length > 0 ? historico : [{
    ...candidato,
    municipio_nome: candidato.municipio_nome ?? candidato.cod_municipio_tse,
  }];

  const trend = [...historicoExibicao].reverse().map((h: any) => ({ ano: h.ano, votos: h.votos_recebidos, eleito: h.eleito }));
  const totalVotos = historicoExibicao.reduce((s: number, h: any) => s + (h.votos_recebidos ?? 0), 0);
  const eleicoes = historicoExibicao.length;
  const vitorias = historicoExibicao.filter((h: any) => h.eleito).length;

  return (
    <Sheet open={!!candidato} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="space-y-2">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold">
              {(candidato.nome_urna ?? candidato.nome_completo ?? "?").charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl">{candidato.nome_urna ?? candidato.nome_completo}</SheetTitle>
              <p className="text-xs text-muted-foreground">{candidato.nome_completo}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge variant="outline">{candidato.partido_sigla} · {candidato.numero_urna}</Badge>
                <Badge variant="outline">{candidato.cargo}</Badge>
                {candidato.eleito && <Badge className="bg-success text-success-foreground"><Trophy className="h-3 w-3 mr-1" />Eleito {candidato.ano}</Badge>}
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          {pessoaMatch && (
            <Card className="border-primary/40 bg-primary/5">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs font-medium">Cadastrado no CRM</p>
                    <p className="text-[10px] text-muted-foreground">{pessoaMatch.pessoa_nome}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate(`/pessoas`)}>
                  Abrir ficha <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-3 gap-2">
            <Card><CardContent className="p-3 text-center"><Vote className="h-4 w-4 mx-auto text-primary mb-1" /><p className="text-lg font-bold">{totalVotos.toLocaleString("pt-BR")}</p><p className="text-[10px] text-muted-foreground">Total votos</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><Calendar className="h-4 w-4 mx-auto text-info mb-1" /><p className="text-lg font-bold">{eleicoes}</p><p className="text-[10px] text-muted-foreground">Eleições</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><Trophy className="h-4 w-4 mx-auto text-success mb-1" /><p className="text-lg font-bold">{vitorias}</p><p className="text-[10px] text-muted-foreground">Vitórias</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Dados pessoais</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-muted-foreground">Nascimento: </span>{candidato.data_nascimento ?? "—"}</div>
              <div><span className="text-muted-foreground">Gênero: </span>{candidato.genero ?? "—"}</div>
              <div className="col-span-2 flex items-start gap-1"><Briefcase className="h-3 w-3 mt-0.5 text-muted-foreground" /><span>{candidato.ocupacao ?? "—"}</span></div>
              <div><span className="text-muted-foreground">CPF: </span>{candidato.cpf ?? "—"}</div>
              <div><span className="text-muted-foreground">Situação: </span>{candidato.situacao_eleicao ?? "—"}</div>
            </CardContent>
          </Card>

          {trend.length > 1 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Evolução de votos</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="ano" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                    <Tooltip formatter={(v: number) => v.toLocaleString("pt-BR")} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Line type="monotone" dataKey="votos" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Histórico completo de candidaturas</CardTitle></CardHeader>
            <CardContent className="space-y-1.5">
              {historicoExibicao.map((h: any) => (
                <div key={`${h.ano}-${h.cod_municipio_tse}-${h.cargo}`} className="flex items-center justify-between gap-2 text-xs p-2 rounded hover:bg-muted/50">
                  <div>
                    <span className="font-bold">{h.ano}</span> · {h.cargo} · {h.municipio_nome ?? h.cod_municipio_tse}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{h.partido_sigla} {h.numero_urna}</Badge>
                    <span className="font-mono font-medium">{(h.votos_recebidos ?? 0).toLocaleString("pt-BR")}</span>
                    {h.eleito && <Trophy className="h-3 w-3 text-success" />}
                  </div>
                </div>
              ))}
              {historico.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Mostrando os dados disponíveis desta candidatura.</p>}
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}
