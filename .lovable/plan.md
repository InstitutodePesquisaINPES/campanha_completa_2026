# 🎯 Plano de Conclusão SIGT — 7 Frentes

Cada frente entregue **completa, real, com UI rica, filtros e integração end-to-end**. Sem mocks.

## Frente 1 — Limpeza: PlaceholderPage órfão (trivial)
- Remover import em `src/App.tsx` (linha 26) e deletar `src/pages/PlaceholderPage.tsx`.

## Frente 2 — Realtime no Comando + Notificações (médio)
- `useNotificacoes` JÁ tem subscription ✅. Falta no Comando/Demandas.
- Subscriptions em `demandas`, `agenda`, `campanha_tarefas`, `despesas` invalidando `indicadores-campanha`.
- Indicador "🟢 Ao vivo" no header, badge animado nos KPIs que mudam, toast discreto na atualização, reconexão automática.

## Frente 3 — Workflow de Aprovação de Contratos (alto)
Migration: tabelas `contrato_aprovacoes`, `contrato_workflow_template`, enum `contrato_aprovacao_status`. Trigger exige todas etapas aprovadas para vigência. Função `criar_aprovacoes_contrato`.
Regras por valor: <5k → 1 etapa; 5k–50k → 2; >50k → 3 com observação obrigatória.
UI `ContratoAprovacaoPanel`: stepper visual, cards por etapa com aprovador/papel, botões Aprovar/Rejeitar/Revisão, timeline, RLS por papel, notificações automáticas, dashboard "Pendentes minhas aprovações".

## Frente 4 — Mapas Avançados (alto)
Deps: `leaflet.markercluster`, `leaflet.heat`.
Camadas (toggle + opacidade): cluster pessoas, heatmap demandas, choropleth densidade eleitoral, isócronas OSRM, polígonos áreas atuação, eventos futuros, urbano vs rural.
Painel lateral colapsável, filtros (município/bairro/classificação/período), legenda dinâmica, exportar PNG, mini-mapa.

## Frente 5 — Exportação BI PDF/PNG (médio)
Deps: `html2canvas`, `jspdf`. Hook `useExportBI(ref)`. Dropdown PNG | PDF | PDF c/ filtros. PDF com capa+sumário+gráficos A4. Salva em Storage `relatorios-bi/` com link assinado 7d.

## Frente 6 — Dados IBGE Bahia + OSM (muito alto)
Schema: campos demográficos em `municipios` (populacao_2022, idh, urbano_pct, área), tabela `municipio_demografia` (faixa etária × sexo × ano), enriquecimento `bairros` (zona urbana/rural/mista, populacao_estimada, geometria, osm_id).
3 edge functions:
- `ibge-import-municipios-ba`: API IBGE Localidades + SIDRA tabelas 4709/9514/1378. Idempotente.
- `osm-import-bairros-ba`: Overpass API por município, classifica zona pela tag `place=`, estima população por área. Rate limit 1req/2s.
- `ibge-orchestrator`: cron mensal via pg_cron.
UI: `IBGEImportPanel` em Admin (status, botão importar, log) + `DemografiaTab` em Territórios (pirâmide etária Recharts, choropleth densidade, comparador de municípios, top 10, donut urbano/rural).

## Frente 7 — Testes Essenciais (médio)
15 testes: 8 hooks, 4 edge functions, 3 componentes. Helpers em `src/test/factories.ts`.

## Ordem de execução
1. Limpeza placeholder → 2. Realtime Comando → 3. Migrations (IBGE/OSM/contratos) → 4. Workflow contratos UI → 5. Edge functions IBGE/OSM → 6. Mapas avançados → 7. Exportação BI → 8. Painel IBGE + Demografia → 9. Testes.
