

## Plano de campanha juridicamente correto, expansível e integrado

Hoje o módulo tem 3 problemas: (1) cabeçalho diz "90 dias" mas a campanha tem 167; (2) tarefas pré-campanha pedem coisas ilegais antes do registro TSE (abrir conta de campanha, captar doadores); (3) cada tarefa é "plana" — sem subtarefas, sem respaldo legal, sem o-que-é/o-que-faz, sem expandir.

### O que muda

**1. Schema (uma migração)**
- `campanha_tarefas` ganha: `fase_legal` (pre_campanha_legal | campanha_oficial | pos_eleicao), `respaldo_legal`, `o_que_e`, `o_que_faz`, `entregaveis`, `is_marco`, `responsavel_papel`, `permitido_antes_registro`.
- Nova tabela `campanha_subtarefas` (checklist dentro de cada tarefa) com RLS por escopo de campanha.

**2. Conteúdo da Kiribamba corrigido pela Lei 9.504/97**
- "Abrir conta bancária de campanha" (D1) → **"Definir conta PESSOAL do pré-candidato"** + nota: CNPJ eleitoral só após registro (art. 22-A).
- "Captar 50 doadores prioritários" → **"Mapear potenciais doadores (sem solicitar contribuição)"** — art. 23 veda arrecadação antes do registro.
- "Reuniões 1:1 com doadores" → **"Reuniões institucionais sem pedido de voto/recurso"** — art. 36-A.
- Reunião de fundação, contratos da equipe, registro TSE, propaganda, HGPE e prestação de contas viram **MARCOS** com respaldo legal completo (artigos da Lei 9.504/97 + Resoluções TSE 23.607, 23.609, 23.610/2019).
- Cada uma dessas tarefas recebe `o_que_e`, `o_que_faz`, `entregaveis` e `responsavel_papel` populados.

**3. UI do plano**

```text
┌─ Cabeçalho dinâmico ──────────────────────────────┐
│ Plano de Campanha · 167 dias                      │  ← usa duração real
│ Início 19/04/2026 · Eleição 04/10/2026 · D-165    │
└───────────────────────────────────────────────────┘

┌─ Tabs ────────────────────────────────────────────┐
│ Cronograma | Marcos | Fases & Metas | Semanas     │  ← nova aba "Marcos"
└───────────────────────────────────────────────────┘

┌─ Card de tarefa no cronograma ────────────────────┐
│ ☐ 🏁 REUNIÃO DE FUNDAÇÃO · D1 · 19/04             │
│   [marco] [pre-campanha] [organização] [urgente]  │
│   👤 Pré-candidato + Coord. Geral · 📎 2 anexos   │
└───────────────────────────────────────────────────┘
   ↓ clique abre Drawer
```

**Drawer rico (clicar em qualquer tarefa)** — abas dentro do drawer:
- **Visão geral**: status, "O que é", "O que faz", "Entregáveis", responsável, observações (auto-save).
- **Subtarefas**: checklist editável (adicionar / marcar / remover), barra de progresso.
- **Respaldo legal**: card destacado com artigos da Lei 9.504/97 e Resoluções TSE aplicáveis. Badge verde "Permitido antes do registro" ou vermelho "Apenas após registro TSE".
- **Documentos**: anexos (já existe, mantém).

**Cronograma agrupa por bloco legal** com banner no topo de cada bloco:
- 🟦 **PRÉ-CAMPANHA** (até registro TSE) — "Permitido: filiação, debate, redes sociais. Vedado: pedir voto, captar recursos, propaganda paga."
- 🟧 **CAMPANHA OFICIAL** (a partir do registro) — "Liberado: propaganda, captação, HGPE."

**Nova aba "Marcos"**: timeline vertical só com `is_marco=true` — visão executiva do que é decisão crítica vs. atividade tática.

### Arquivos a criar/editar

- `supabase/migrations/...` (via tool de migração) — schema + atualização das tarefas Kiribamba.
- `src/hooks/useSubtarefas.ts` — CRUD de subtarefas.
- `src/components/plano/TarefaDetailDrawer.tsx` — reescrito com tabs (Visão / Subtarefas / Legal / Anexos).
- `src/components/plano/CronogramaTarefas.tsx` — agrupamento por fase legal, ícone de marco, contador de subtarefas.
- `src/components/plano/MarcosTimeline.tsx` (novo) — timeline de marcos.
- `src/pages/plano/PlanoCampanhaPage.tsx` — cabeçalho dinâmico (`duracaoTotal` calculado), nova aba "Marcos".
- `src/integrations/supabase/types.ts` — regenerado automaticamente pela migração.

### Fora de escopo (decidir depois se quiser)
- Bloqueio automático ao tentar mover tarefa "campanha_oficial" para data anterior ao registro.
- Geração automática de subtarefas-modelo por marco (ex: marco "Constituição da equipe" já vem com 6 subtarefas pré-prontas).

