# Arquitetura do Sistema

## Visão Geral

Kiribamba utiliza uma arquitetura moderna baseada em Monorepo Lógico (front e back no mesmo repositório) focada em Javascript/Typescript.

```text
[Frontend Next.js]  <-- API REST (JSON) -->  [Backend NestJS]
        |                                           |
    Shadcn/UI                                Prisma ORM
    Tailwind                                        |
    React Query                              [PostgreSQL] (Hospedado localmente no Coolify)
```

## Separação Frontend / Backend

- **Frontend (`apps/web` ou pasta raiz Front):**
  - Next.js (App Router ou Pages Router dependendo da pasta).
  - Controle de Estado com Hooks (ex: React Query/SWR).
  - Layout e Estilização centralizada no `globals.css` e tokens do Tailwind.
  - Rotas blindadas (exige JWT no LocalStorage/Cookies).

- **Backend (`apps/api`):**
  - Framework: NestJS.
  - Separação clássica de Controller / Service / Module.
  - Todas as rotas possuem AuthGuard (JWT) e TenantGuard (Injeção automática do contexto do tenant).
  - Background processes: Scripts standalone Node.js ativados via `child_process` para não travar a Event Loop do NestJS durante importações massivas.

## Camada de Banco e Multi-Tenant

O banco é único (Single Database) rodando PostgreSQL, mas totalmente particionado logicamente pelo campo `tenantId` em **todas** as tabelas. O Prisma injeta obrigatoriamente isso via Guardas ou Services.

## Estratégia de Deploy (Docker e Coolify)
O projeto é conteinerizado. O `Dockerfile` expõe os serviços web. A infra é gerenciada pelo Coolify, que ao receber webhooks do Github (branch main), orquestra o Git Pull, Build, Container Swap (Zero Downtime) da API e do Front.
