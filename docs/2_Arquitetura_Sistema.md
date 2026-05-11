# Arquitetura de Engenharia
**Plataforma Kiribamba**

---

## 1. Visão Geral da Stack

O Kiribamba é desenhado para alta concorrência e estabilidade corporativa. Optou-se por uma estrutura **Monorepo**, garantindo que as fronteiras entre o front-end visual e o back-end transacional sejam fluidas para o desenvolvedor, mas impenetráveis para o usuário final.

### Stack Tecnológica (100% Self-Hosted):
- **Frontend (Visual):** React 18, Vite, TailwindCSS, Shadcn UI, Framer Motion, TanStack Query.
  - **Comunicação de Rede:** Todas as interações com o backend ocorrem via **Axios (`apiClient.ts`)**, eliminando o antigo SDK do Supabase. O wrapper injeta os headers de Autenticação (Bearer) e Tenant (`x-tenant-id`).
- **Backend (API):** NestJS 11 (Node.js), TypeScript estrito, JWT Passport, BullMQ para mensageria assíncrona.
- **Banco de Dados (Storage):** PostgreSQL gerenciado via Prisma ORM v7. A solução independe de serviços DBaaS, operando inteiramente em contêineres próprios.

---

## 2. Multi-Tenancy e RLS (Row-Level Security)

A maior premissa de um SaaS Político é a **inviolabilidade de dados**. Um candidato não pode, sob hipótese alguma, ter acesso aos eleitores de um concorrente hospedado na mesma plataforma.

Para resolver isso de forma imune a erro humano no desenvolvimento:
- Utilizamos **Prisma Client Extensions** no backend para injetar automaticamente o filtro de inquilino (Tenant). Isso atua como o motor de Row-Level Security no nível da aplicação.
- Toda consulta e gravação no banco de dados recebe obrigatoriamente a assinatura do `tenantId`.
- No lado da API, o decorator `@CurrentTenant()` aciona o interceptador global (`TenantGuard`) e repassa essa variável. O Prisma bloqueia na base qualquer operação cross-tenant ou operações sem o ID do comitê explícito.

---

## 3. Segurança e Auditoria 100% Type-Safe

Após rigorosas auditorias estruturais (Hardening), a API NestJS não possui instâncias vulneráveis de `@Body() data: any`. 
- Todo Payload injetado no backend passa por um **DTO (Data Transfer Object)** protegido pelo `class-validator`.
- As saídas são higienizadas para evitar injeção SQL, e scripts cross-site (XSS) são tratados nos pipes de transformação.

---

## 4. Ecossistema Frontend e RBAC Corporativo

- **RBAC Hierárquico Avançado:** O acesso não é genérico. O React consome o hook `useUserRoles()` e monta uma interface mutante baseada em 12 patentes (`AppRole`), que vão desde o `candidato` (Dashboard de BI), passam por áreas restritas como `coord_financeiro` (Orçamento/TSE), até o braço operacional `cabo_eleitoral`.
- **Prevenção de Escalada de Privilégios (Privilege Escalation):** No Backend e no Frontend, o recrutamento e gestão de usuários ocorrem através de uma Matriz de Pesos. Um líder regional não tem permissão via API ou UI de cadastrar ou alterar acessos de alguém em uma patente superior à dele.
- **Auditoria Contínua (Audit Logs):** Cada ação de CRUD crítica (especialmente na equipe de usuários e financeiro) deixa um rastro inalterável na tabela `AuditLog`, anexando `userId`, `tenantId`, e os deltas do payload `oldData/newData`.
- **Roteamento Dinâmico:** As rotas vitais são protegidas por um componente `<ProtectedRoute />` que exige autenticação. Telas administrativas exigem a constante de permissões `MANAGE_ROLES`.
- **Resiliência de Campo (PWA):** 
  - A interface possui um Manifesto Web válido (`vite-plugin-pwa`). 
  - Estratégias do Workbox (`NetworkFirst` e `CacheFirst`) persistem consultas vitais no IndexedDB/CacheStorage. O App funciona mesmo em zonas de sombra 3G, essencial para as lideranças operacionais.

---

## 5. Infraestrutura de Produção e Deploy

O deploy é focado na containerização (Docker):
1. O Frontend é compilado estaticamente para HTML/CSS/JS e hospedado e servido de forma assíncrona por um container NGINX otimizado (`nginx.conf` estrito).
2. O Backend (NestJS) possui seu próprio cluster, compilado utilizando Node LTS Alpine.
