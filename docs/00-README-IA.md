# README PARA IA — Projeto Kiribamba

Este documento deve ser lido antes de qualquer alteração no sistema. Ele funciona como uma bússola rápida para que você entenda o contexto geral do projeto.

## Objetivo do sistema

Kiribamba é um sistema de inteligência política e gestão de campanhas eleitorais. Ele atua como um CRM Eleitoral massivo focado no controle de lideranças, eleitores, demandas (ouvidoria) e gestão estratégica por geolocalização e cruzamento de dados oficiais do TSE.

## Stack Principal

- **Frontend:** React + Next.js + TailwindCSS + Shadcn/UI + Lucide Icons + Mapbox (Mapas)
- **Backend:** Node.js + NestJS
- **Banco de Dados:** PostgreSQL (gerenciado via Prisma ORM)
- **Infra/Deploy:** Docker Compose + Coolify
- **Processamento:** Rotinas em Node Streams/Child Process para Background Workers (ingestão de CSV massiva)
- **Integrações (Atuais/Previstas):** TSE (Dados Abertos via CSV), WhatsApp API, OpenAI.

## Regras obrigatórias

1. **Arquitetura Restrita:** Não alterar a separação entre `apps/api` (backend) e `apps/web` (frontend). O projeto opera num monorepo (ou estrutura similar de pacotes locais).
2. **Banco de Dados (Prisma):** Nunca criar campos novos, tabelas ou alterar tipos em `schema.prisma` sem justificar e validar com o documento de Banco de Dados.
3. **Isolamento de Dados (Multi-Tenant):** **CRÍTICO.** Toda tabela de dados do cliente possui `tenantId`. Todas as queries (Leitura/Escrita) DEVEM obrigatoriamente incluir `where: { tenantId }`. Falhar nisto é considerado brecha de segurança grave.
4. **Tratamento Massivo de Dados:** Arquivos do TSE podem chegar a 1GB+. Nunca leia CSVs inteiros em memória (usar `fs.createReadStream`, `PapaParse` chunking ou `readline` e inserções em batch de 10k).
5. **Typescript Strict:** Não usar `any` sem extrema necessidade e aprovação documentada.
6. **Deploy Coolify:** O sistema depende do Dockerfile do backend e da varíavel de ambiente configurada no painel. Não modifique portas sem alinhar.

## Documentos principais para IAs

Sempre consulte os documentos a seguir ANTES de iniciar a implementação, conforme a sua tarefa:

- Para regras de negócio e limites do CRM: `02-ESCOPO-E-REGRAS-DE-NEGOCIO.md`
- Para alterar Prisma ou Postgres: `05-BANCO-DE-DADOS-E-MODELAGEM.md`
- Para alterar Endpoints (NestJS): `07-API-REFERENCE.md`
- Para alterar o Visual (Next.js/React): `09-FRONTEND-UI-UX-E-COMPONENTES.md`
- Para integrar WhatsApp ou IA: `10-INTEGRACOES-EXTERNAS.md` / `11-IA-RAG-PROMPTS-E-AUTOMACOES.md`

*(Não adivinhe funcionalidades. Se tiver dúvida se algo existe, pergunte ou consulte os documentos).*
