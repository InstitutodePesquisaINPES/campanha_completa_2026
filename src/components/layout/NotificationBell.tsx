import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotificacoes, type Notificacao } from "@/hooks/useNotificacoes";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const PRIORIDADE_COLOR: Record<Notificacao["prioridade"], string> = {
  urgente: "bg-destructive text-destructive-foreground",
  alta: "bg-orange-500 text-white",
  media: "bg-primary text-primary-foreground",
  baixa: "bg-muted text-muted-foreground",
};

export function NotificationBell() {
  const { data = [], naoLidas, marcarLida, marcarTodasLidas, remover } = useNotificacoes();
  const navigate = useNavigate();

  const handleClick = (n: Notificacao) => {
    if (!n.lida) marcarLida.mutate(n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {naoLidas > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {naoLidas > 99 ? "99+" : naoLidas}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm">Notificações</h4>
            {naoLidas > 0 && <Badge variant="secondary">{naoLidas} novas</Badge>}
          </div>
          {naoLidas > 0 && (
            <Button variant="ghost" size="sm" onClick={() => marcarTodasLidas.mutate()}>
              <CheckCheck className="h-4 w-4 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>
        <ScrollArea className="h-[420px]">
          {data.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
              Nenhuma notificação
            </div>
          ) : (
            <div className="divide-y">
              {data.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "p-3 hover:bg-accent/50 cursor-pointer group transition-colors",
                    !n.lida && "bg-accent/30",
                  )}
                  onClick={() => handleClick(n)}
                >
                  <div className="flex items-start gap-2">
                    <span className={cn("h-2 w-2 rounded-full mt-1.5 shrink-0", PRIORIDADE_COLOR[n.prioridade])} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn("text-sm truncate", !n.lida && "font-semibold")}>{n.titulo}</p>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {formatDistanceToNow(new Date(n.created_at), { locale: ptBR, addSuffix: false })}
                        </span>
                      </div>
                      {n.mensagem && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.mensagem}</p>
                      )}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                      {!n.lida && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            marcarLida.mutate(n.id);
                          }}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          remover.mutate(n.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
