# Nomenclatura e Padrões (Conventions)
**Plataforma Kiribamba**

Para mantermos o código organizado em um projeto massivo, estabelecemos os seguintes padrões inquebráveis de nomenclatura.

---

## 1. Regras de Código (TypeScript / JavaScript)

### 1.1 Variáveis e Funções
- **Formato:** `camelCase`.
- **Exemplo:** `calcularScore()`, `metaVotos`, `totalCaptado`.
- **Justificativa:** Padrão do ecossistema JS/TS.

### 1.2 Classes, Interfaces e Componentes React
- **Formato:** `PascalCase`.
- **Exemplo:** `PwaInstallBanner`, `CreatePessoaDto`, `AuthService`.
- **Arquivos:** Arquivos que exportam um Componente React devem ter o mesmo nome do componente (ex: `RoleBasedDashboard.tsx`).

### 1.3 Constantes Globais
- **Formato:** `UPPER_SNAKE_CASE`.
- **Exemplo:** `API_BASE_URL`, `MAX_RETRY_ATTEMPTS`.

---

## 2. Banco de Dados e ORM (PostgreSQL / Prisma)

### 2.1 Modelos Prisma (Camada de Aplicação)
- **Formato:** `PascalCase` no singular.
- **Exemplo:** `model Pessoa`, `model CampanhaFase`.

### 2.2 Tabelas e Colunas PostgreSQL (Físico)
- **Formato:** `snake_case`.
- A plataforma usa a anotação `@map()` e `@@map()` do Prisma para que o banco seja padronizado com `snake_case` enquanto a aplicação lida com `camelCase`.
- **Exemplo:**
  ```prisma
  model CampanhaFase {
    id         String   @id @default(uuid()) @db.Uuid
    campanhaId String   @map("campanha_id") @db.Uuid
    createdAt  DateTime @default(now()) @map("created_at")

    @@map("campanha_fases")
  }
  ```

---

## 3. Padrão de Diretórios

### 3.1 Backend (NestJS)
Estrutura modular rigorosa. Todo módulo deve morar dentro de `apps/api/src/modules/<nome_modulo>`.
- `dto/` (Tipos e Data Transfer Objects)
- `<modulo>.controller.ts` (Regras HTTP e Roteamento)
- `<modulo>.service.ts` (Regras de Negócio e ORM)
- `<modulo>.module.ts` (Registro de dependências)

### 3.2 Frontend (React / Vite)
- `src/components/`: Pedaços visuais isolados (botões, modais).
- `src/pages/`: Representações de rotas completas (telas).
- `src/hooks/`: Hooks React customizados, geralmente invocando `useQuery` do TanStack.
- `src/lib/`: Funções utilitárias, clientes de API (`apiClient.ts`) e configurações vitais. Não há dependências diretas de SDKs de banco de dados (ex: Supabase) nestes módulos; toda a comunicação de dados cruza a rede via `apiClient`.

---

## 4. Integração Frontend-Backend (API REST)

### 4.1 Padrão de Endpoints
- **Mapeamento Direto:** Todos os endpoints NestJS devem seguir a taxonomia exata do recurso (ex: `GET /pessoas/count`, `POST /territorio/importar-ibge`).
- **Uso do Axios:** No frontend, as chamadas são feitas através de instâncias assíncronas limpas (`await api.get()`), tipando os retornos com Interfaces e encapsulando o erro no bloco `try/catch`.

### 4.2 Arquitetura de Módulos Globais (Export/Busca)
- Módulos transversais que não pertencem a um contexto único de negócios (como Exportação Genérica para Excel ou Busca Global na Navbar) devem ter seu próprio Módulo independente no backend.
- **Exemplo:** O `ExportModule` (`/export/:table`) recebe a requisição, valida a Tabela contra uma *whitelist*, localiza dinamicamente a Model do Prisma correspondente, extrai os dados limitados ao `tenantId` e devolve, centralizando as exportações em um só lugar.

---

## 5. Git Flow e Controle de Versão

### 5.1 Nomenclatura de Branches
- `main`: Ambiente de Produção.
- `campanha_completa_2026`: Branch de trabalho primário (Staging/Features).
- Prefixos para features paralelas: `feat/`, `fix/`, `chore/`.

### 5.2 Commits (Conventional Commits)
- `feat(modulo): descricao` -> Adição de novas funções.
- `fix(modulo): descricao` -> Correção de bugs.
- `docs(core): descricao` -> Documentação.
- `chore(deps): descricao` -> Atualização de infra e pacotes.
