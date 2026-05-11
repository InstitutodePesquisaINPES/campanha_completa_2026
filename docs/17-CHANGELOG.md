# Changelog

Este arquivo mantém um log histórico de alto nível das principais entregas técnicas, úteis para dar contexto a IAs sobre o que acabou de ser feito ou refatorado.

## 2026-05-11 — v0.5.0 (TSE Ingestion & TypeScript Fixes)

### Adicionado
- **Background Worker Autônomo:** `import-master.js` integrado à Controller do NestJS via `child_process.spawn`. Uploads agora são feitos visualmente, jogados para a fila e processados em batch (10.000 linhas) de forma assíncrona.
- **Polling de Progresso:** UI (`TSECsvUpload.tsx`) acompanha em tempo real a % de linhas processadas pelo worker lendo do banco.

### Corrigido
- **Build do Coolify:** Resolvidos 20 erros de TypeScript apontados pelo compilador durante o `npm run build` causados por dessincronia do Prisma Schema.
- Ajuste de `nomeCompleto` para `fullName` no Dashboard Service.
- Remoção de campos legados (`areaKm2`, `idh`) do módulo Território que haviam sido otimizados.
- Tratamento correto de relações ausentes (`agendaEvento` para `agenda` e remoção de `campanhaParametro`).

### Migrações (Prisma)
- Criação e sincronização da tabela de altíssima fidelidade `TseEleitoradoSecao` com constrição `@@unique` múltipla para idempotência de CSVs.

### Pendente (Next Steps)
- Ligar os Dashboards Geográficos (Mapas Leaflet/Mapbox) usando os dados recém-inseridos na nova tabela granular.
