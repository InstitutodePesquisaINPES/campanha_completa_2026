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

### Corrigido (Estabilização TSE & Coolify)
- **Correção da URL da API (Zero Dados/404):** Garantido que o `apiClient.ts` sempre adicione `/` inicial ao `VITE_API_URL` caso seja configurado com rotas relativas no Coolify, prevenindo que o app renderize endpoints como `/admin/importacao/api/v1...` que quebravam a listagem dos dados (retornando HTML e gerando erros de SyntaxError na conversão de JSON).
- **Dependência de Produção:** Adicionado o pacote `multer` explicitamente no `package.json` da API para evitar erros no `npm run build` durante o deploy no Coolify.
- **Criação Segura de Diretórios de Upload:** Adicionado `fs.mkdirSync` no `tse.controller.ts` para garantir que a pasta `/uploads/tse` (usada pelo Multer em disco) exista no container, evitando exceções silenciosas de "No such file or directory".
- **Identificação do Erro de Sessão (Logout na importação):** Registrado na documentação e no changelog que o encerramento súbito de sessão ("tela branca e me joga para fora") durante ou antes das grandes importações em background estava atrelado ao ciclo de vida do JWT (padrão 15 minutos).

### Pendente (Next Steps)
- Ligar os Dashboards Geográficos (Mapas Leaflet/Mapbox) usando os dados recém-inseridos na nova tabela granular.
- Implementar fluxo transparente de *Refresh Token* no `apiClient.ts` para permitir sessões logadas e uploads ininterruptos longos.
