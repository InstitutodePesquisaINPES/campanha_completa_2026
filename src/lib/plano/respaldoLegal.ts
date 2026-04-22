// Biblioteca de referências legais para tarefas do plano de campanha
// Lei 9.504/97 + Resoluções TSE 23.607/2019 (financeiro), 23.609/2019 (registro), 23.610/2019 (propaganda)

export type RespaldoLegalRef = {
  id: string;
  norma: string;            // "Lei 9.504/97 art. 36-A"
  ementa: string;           // resumo curto
  fase: "pre_campanha_legal" | "campanha_oficial" | "pos_eleicao" | "ambos";
  permitido_antes_registro: boolean;
  texto_completo: string;   // texto pronto para colar no campo "respaldo_legal"
  tags: string[];
};

export const RESPALDO_LEGAL_DB: RespaldoLegalRef[] = [
  {
    id: "lei-9504-art-36a",
    norma: "Lei 9.504/97 · art. 36-A",
    ementa: "Atos preparatórios permitidos antes do registro (sem pedido de voto)",
    fase: "pre_campanha_legal",
    permitido_antes_registro: true,
    texto_completo:
      "Lei 9.504/97 art. 36-A — Não configuram propaganda eleitoral antecipada, desde que não envolvam pedido explícito de voto: a participação em entrevistas, encontros, debates; a realização de reuniões internas com filiados; a divulgação em redes sociais de posicionamentos pessoais sobre questões políticas; a realização de prévias partidárias; o pronunciamento em encontros do partido.",
    tags: ["pre-campanha", "atos preparatórios", "reuniao", "redes sociais", "debate"],
  },
  {
    id: "lei-9504-art-22a",
    norma: "Lei 9.504/97 · art. 22-A",
    ementa: "CNPJ eleitoral e conta bancária de campanha — apenas após registro",
    fase: "campanha_oficial",
    permitido_antes_registro: false,
    texto_completo:
      "Lei 9.504/97 art. 22-A — É obrigatória, para os candidatos, a inscrição no CNPJ. A abertura de conta bancária específica para movimentar recursos financeiros de campanha só pode ocorrer após o pedido de registro de candidatura. Antes do registro, o pré-candidato pode usar conta pessoal apenas para gastos próprios não eleitorais.",
    tags: ["cnpj", "conta bancaria", "tesoureiro", "financeiro", "registro"],
  },
  {
    id: "lei-9504-art-23",
    norma: "Lei 9.504/97 · art. 23",
    ementa: "Captação de recursos só após registro de candidatura",
    fase: "campanha_oficial",
    permitido_antes_registro: false,
    texto_completo:
      "Lei 9.504/97 art. 23 — A arrecadação de recursos financeiros para campanha eleitoral só pode ocorrer após o requerimento do registro de candidatura, a constituição do CNPJ eleitoral e a abertura da conta bancária específica. Antes disso, doadores podem ser MAPEADOS, mas não SOLICITADOS contribuição formal.",
    tags: ["doadores", "captacao", "arrecadacao", "financeiro"],
  },
  {
    id: "lei-9504-art-11",
    norma: "Lei 9.504/97 · art. 11",
    ementa: "Prazo de registro de candidatura — até 15/08 do ano eleitoral",
    fase: "campanha_oficial",
    permitido_antes_registro: false,
    texto_completo:
      "Lei 9.504/97 art. 11 — Os partidos e coligações solicitarão à Justiça Eleitoral o registro de seus candidatos até as 19 horas do dia 15 de agosto do ano em que se realizarem as eleições. A partir desse momento, abre-se a fase de campanha oficial.",
    tags: ["registro", "tse", "prazo", "candidatura"],
  },
  {
    id: "lei-9504-art-36",
    norma: "Lei 9.504/97 · art. 36",
    ementa: "Início da propaganda eleitoral oficial — a partir de 16/08",
    fase: "campanha_oficial",
    permitido_antes_registro: false,
    texto_completo:
      "Lei 9.504/97 art. 36 — A propaganda eleitoral somente é permitida após o dia 15 de agosto do ano da eleição. Antes dessa data, qualquer propaganda explícita (com pedido de voto, número de urna, slogan eleitoral) configura propaganda antecipada e está sujeita a multa.",
    tags: ["propaganda", "santinho", "comunicacao"],
  },
  {
    id: "res-tse-23610-hgpe",
    norma: "Resolução TSE 23.610/2019 · arts. 26-50",
    ementa: "Horário Gratuito de Propaganda Eleitoral (HGPE) — rádio e TV",
    fase: "campanha_oficial",
    permitido_antes_registro: false,
    texto_completo:
      "Resolução TSE 23.610/2019 — Disciplina a propaganda eleitoral em rádio e TV (HGPE), iniciada 35 dias antes da eleição. Aplica-se aos cargos de prefeito, governador, senador, deputado e presidente. Vereadores não têm acesso ao HGPE.",
    tags: ["hgpe", "radio", "tv", "propaganda"],
  },
  {
    id: "res-tse-23607-financeiro",
    norma: "Resolução TSE 23.607/2019",
    ementa: "Arrecadação e gastos de campanha — prestação de contas",
    fase: "campanha_oficial",
    permitido_antes_registro: false,
    texto_completo:
      "Resolução TSE 23.607/2019 — Disciplina a arrecadação e os gastos de recursos por partidos e candidatos e a prestação de contas nas eleições. Define limites de doação, vedações (fonte vedada), obrigatoriedade de identificação dos doadores e prazos de prestação de contas parcial e final.",
    tags: ["financeiro", "doacao", "prestacao de contas", "tesoureiro"],
  },
  {
    id: "res-tse-23609-registro",
    norma: "Resolução TSE 23.609/2019",
    ementa: "Pedido de registro de candidaturas (DRAP, RRC, certidões)",
    fase: "campanha_oficial",
    permitido_antes_registro: false,
    texto_completo:
      "Resolução TSE 23.609/2019 — Disciplina a escolha e o registro de candidatos. Documentos exigidos: DRAP do partido, RRC do candidato, certidões criminais, comprovação de filiação partidária, prova de desincompatibilização (quando aplicável), proposta de governo (executivo).",
    tags: ["registro", "drap", "rrc", "certidao", "filiacao"],
  },
  {
    id: "res-tse-23610-redes",
    norma: "Resolução TSE 23.610/2019 · arts. 27-30",
    ementa: "Propaganda eleitoral na internet — regras e limites",
    fase: "campanha_oficial",
    permitido_antes_registro: false,
    texto_completo:
      "Resolução TSE 23.610/2019 — Permite propaganda eleitoral na internet em sites, blogs, redes sociais e mensagens eletrônicas a partir de 16/08. Veda impulsionamento de conteúdo, exceto quando contratado diretamente por candidato/partido com identificação clara. Proibido uso de robôs e perfis falsos.",
    tags: ["redes sociais", "internet", "ads", "impulsionamento", "digital"],
  },
  {
    id: "lc-64-90",
    norma: "Lei Complementar 64/90 (Ficha Limpa)",
    ementa: "Inelegibilidades — verificação de elegibilidade do candidato",
    fase: "pre_campanha_legal",
    permitido_antes_registro: true,
    texto_completo:
      "Lei Complementar 64/90 (alterada pela LC 135/2010 — Ficha Limpa) — Define as hipóteses de inelegibilidade. Na fase pré-campanha, é fundamental o levantamento de certidões e a análise jurídica preventiva para identificar riscos antes do pedido de registro.",
    tags: ["elegibilidade", "ficha limpa", "certidao", "juridico"],
  },
  {
    id: "lei-9096-filiacao",
    norma: "Lei 9.096/95 · art. 18",
    ementa: "Filiação partidária — prazo de 6 meses antes da eleição",
    fase: "pre_campanha_legal",
    permitido_antes_registro: true,
    texto_completo:
      "Lei 9.096/95 art. 18 — Para concorrer a cargo eletivo, o eleitor deverá estar filiado a partido político no mínimo 6 meses antes da data da eleição. Verificar regularidade da filiação no sistema FILIA do TSE.",
    tags: ["filiacao", "partido", "elegibilidade"],
  },
  {
    id: "lei-9504-art-39",
    norma: "Lei 9.504/97 · art. 39",
    ementa: "Comícios, caminhadas e carreatas — regras",
    fase: "campanha_oficial",
    permitido_antes_registro: false,
    texto_completo:
      "Lei 9.504/97 art. 39 — Permite a realização de comícios entre 8h e 24h. Caminhadas e carreatas são livres durante o período de campanha. Veda uso de trios elétricos exceto em comícios. Distribuição de material gráfico permitida até a véspera da eleição.",
    tags: ["comicio", "caminhada", "carreata", "campo"],
  },
];

export function buscarRespaldo(query: string): RespaldoLegalRef[] {
  const q = query.trim().toLowerCase();
  if (!q) return RESPALDO_LEGAL_DB;
  return RESPALDO_LEGAL_DB.filter(
    (r) =>
      r.norma.toLowerCase().includes(q) ||
      r.ementa.toLowerCase().includes(q) ||
      r.tags.some((t) => t.includes(q))
  );
}
