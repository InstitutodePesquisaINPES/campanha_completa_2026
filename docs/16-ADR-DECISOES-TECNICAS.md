# ADR — Decisões Técnicas (Architecture Decision Records)

Este documento registra as decisões que moldaram o código base do Kiribamba. IAs ou novos Devs não devem reverter ou propor mudanças estruturais que batam de frente com essas ADRs sem alinhar com os coordenadores do projeto.

## ADR 001 — Uso de Prisma e Multi-Tenancy Lógico
**Data:** 01/05/2026
**Contexto:** Precisávamos isolar campanhas sem criar múltiplos bancos de dados (schema-per-tenant ou db-per-tenant é custoso para manter).
**Decisão:** Usar `tenantId` em todas as tabelas e forçar via Guards do NestJS.
**Consequências:** 
- Evita provisionamento de infra. 
- Obriga todos os desenvolvedores/IAs a nunca esquecer o `where: { tenantId }`.

## ADR 002 — Ingestão Massiva com Child Process do Node
**Data:** 11/05/2026
**Contexto:** Arquivos CSV do TSE com 5 a 10 milhões de linhas travavam o `Event Loop` do NestJS, derrubando a API para os demais usuários conectados. Filas (BullMQ) com jobs por linha eram muito lentas (Redis overhead).
**Decisão:** Extrair a lógica do ETL para um script puramente Node (`import-master.js`) que usa `readline` nativo do `fs`. O NestJS usa `spawn` para executá-lo em modo detached e background. O script gerencia lotes (Batches) diretamente com o Prisma.
**Consequências:**
- Altíssima performance (Milhões de linhas em minutos).
- API NestJS livre para servir requests normais.
- Dificulta rastreio de logs em tempo real na aba (resolvemos com polling da tabela `TseCsvArquivo`).

## ADR 003 — Uso de Coolify
**Data:** Maio/2026
**Decisão:** Usar Coolify ao invés de Vercel/Heroku devido ao controle fino sobre workers (Docker) e economia com Postgres nativo. O `npm run build` precisa rodar liso localmente para evitar crashes de deploy na ponta.
