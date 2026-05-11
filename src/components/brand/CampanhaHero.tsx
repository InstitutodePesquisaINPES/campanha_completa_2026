import { useCampanhaAtiva } from "@/hooks/useCampanhas";
import { MapPin, Vote, Calendar, Target } from "lucide-react";

/**
 * Hero institucional da campanha ativa.
 * Visual marca Avante — azul institucional + amarelo solar +
 * número de urna em destaque, no estilo de banner político.
 */
export function CampanhaHero() {
  const { data: c } = useCampanhaAtiva();
  if (!c) return null;

  const dias = Math.max(0, Math.ceil((new Date(c.data_eleicao).getTime() - Date.now()) / 86400000));
  const partido = c.partido_sigla ?? "AVANTE";

  return (
    <div className="relative overflow-hidden rounded-2xl hero-gradient text-white shadow-lg">
      {/* Linhas decorativas */}
      <div className="absolute inset-0 opacity-20" aria-hidden>
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white blur-3xl" />
        <div className="absolute -bottom-32 -left-12 h-80 w-80 rounded-full" style={{ background: "hsl(var(--brand-yellow))" }} />
      </div>

      <div className="relative p-6 sm:p-8 grid md:grid-cols-[1fr_auto] gap-6 items-center">
        <div className="space-y-3 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="brand-pill">{partido}</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/80">
              {c.cargo?.replace("_", " ") || "Cargo não definido"} · Bahia
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
            {c.nome}
          </h1>
          <p className="text-sm sm:text-base text-white/85 max-w-2xl">
            Campanha estruturada com plano de 90 dias, cronograma legal do TSE e expansão regional pela
            microrregião de Vitória da Conquista.
          </p>

          <div className="flex flex-wrap gap-4 pt-2 text-sm">
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> Base: Vitória da Conquista</span>
            <span className="inline-flex items-center gap-1.5"><Target className="h-4 w-4" /> Meta: {c.meta_votos?.toLocaleString("pt-BR") ?? "—"} votos</span>
            <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Eleição: {new Date(c.data_eleicao).toLocaleDateString("pt-BR")}</span>
          </div>
        </div>

        {/* Número de urna gigante — assinatura visual da campanha */}
        <div className="flex flex-col items-center gap-2">
          <div className="brand-number h-28 w-28 sm:h-32 sm:w-32 text-6xl sm:text-7xl shadow-xl ring-4 ring-white/30">
            {c.numero_urna ?? "—"}
          </div>
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-widest text-white/70">Faltam</div>
            <div className="text-2xl font-black tabular-nums">{dias}<span className="text-sm font-normal text-white/70"> dias</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
