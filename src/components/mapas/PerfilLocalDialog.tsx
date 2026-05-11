import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEleitoralSecaoPerfil } from "@/hooks/useEleitoralTSE";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Navigation, GraduationCap, Users2, Activity, Heart } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function PerfilLocalDialog({
  local,
  onClose,
}: {
  local: any;
  onClose: () => void;
}) {
  const open = !!local;

  const { data: perfil, isLoading } = useEleitoralSecaoPerfil(
    local?.uf,
    local?.ano,
    local?.cod_municipio_tse,
    local?.zona,
    local?.secao
  );

  const renderDataList = (title: string, icon: React.ReactNode, items: { name: string; value: number }[], total: number) => {
    // Sort descending by value
    const sorted = [...(items || [])].sort((a, b) => b.value - a.value);

    return (
      <div className="space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-1.5 text-muted-foreground border-b pb-1">
          {icon} {title}
        </h3>
        <div className="space-y-3">
          {sorted.map((item, idx) => {
            const pct = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="truncate pr-2 font-medium">{item.name}</span>
                  <span className="text-muted-foreground shrink-0">{item.value.toLocaleString('pt-BR')} ({pct.toFixed(1)}%)</span>
                </div>
                <Progress value={pct} className="h-1.5" />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-start gap-2">
            <Navigation className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p>{local?.nome_local}</p>
              <p className="text-sm font-normal text-muted-foreground">
                Zona {local?.zona} {local?.secao ? `· Seção ${local.secao}` : ''} · {local?.endereco}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-6">
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
            </div>
          </div>
        ) : perfil ? (
          <div className="space-y-6 pt-4">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center gap-4">
              <div className="bg-primary/20 p-3 rounded-full text-primary">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">{perfil.total.toLocaleString('pt-BR')}</p>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Eleitores Cadastrados na Zona</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
              {renderDataList("Gênero", <Users2 className="h-4 w-4" />, perfil.genero, perfil.total)}
              {renderDataList("Faixa Etária", <Activity className="h-4 w-4" />, perfil.faixa_etaria, perfil.total)}
              {renderDataList("Escolaridade", <GraduationCap className="h-4 w-4" />, perfil.grau_instrucao, perfil.total)}
              {renderDataList("Estado Civil", <Heart className="h-4 w-4" />, perfil.estado_civil, perfil.total)}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            Dados de perfil demográfico não encontrados para esta urna.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
