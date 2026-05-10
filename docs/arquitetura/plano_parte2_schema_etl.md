# Plano de Migração — Parte 2/3

## Prisma Schema, ClickHouse, Worker TSE, Migração de Dados, Substituição Frontend

---

# 7. Fase 2 — Banco Operacional PostgreSQL (1-2 semanas)

## 7.1 Prisma Schema (resumo das entidades)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── GOVERNANÇA ───
enum AppRole {
  admin
  coordenador
  lideranca
  operador
  visualizador
}

model User {
  id            String   @id @default(uuid()) @db.Uuid
  email         String   @unique
  passwordHash  String   @map("password_hash")
  fullName      String   @default("") @map("full_name")
  phone         String?
  cpf           String?
  avatarUrl     String?  @map("avatar_url")
  active        Boolean  @default(true)
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  roles         UserRole[]
  refreshTokens RefreshToken[]
  @@map("users")
}

model UserRole {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  role      AppRole
  createdAt DateTime @default(now()) @map("created_at")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, role])
  @@map("user_roles")
}

model RefreshToken {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  tokenHash String   @map("token_hash")
  expiresAt DateTime @map("expires_at")
  revoked   Boolean  @default(false)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("refresh_tokens")
}

model AuditLog {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String?  @map("user_id") @db.Uuid
  action    String   // create, update, delete, export, login, logout
  tableName String   @map("table_name")
  recordId  String?  @map("record_id")
  oldData   Json?    @map("old_data")
  newData   Json?    @map("new_data")
  ipAddress String?  @map("ip_address")
  createdAt DateTime @default(now()) @map("created_at")
  @@index([tableName])
  @@index([userId])
  @@index([createdAt(sort: Desc)])
  @@map("audit_logs")
}

model SystemSetting {
  id          String   @id @default(uuid()) @db.Uuid
  key         String   @unique
  value       Json     @default("{}")
  description String?
  updatedBy   String?  @map("updated_by") @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  @@map("system_settings")
}

// ─── TERRITORIAL ───
model Estado {
  id             String      @id @default(uuid()) @db.Uuid
  nome           String
  sigla          String      @unique @db.Char(2)
  geocodigoIbge  String?     @unique @map("geocodigo_ibge")
  latitude       Float?
  longitude      Float?
  createdAt      DateTime    @default(now()) @map("created_at")
  updatedAt      DateTime    @updatedAt @map("updated_at")
  municipios     Municipio[]
  @@map("estados")
}

model Municipio {
  id              String    @id @default(uuid()) @db.Uuid
  estadoId        String    @map("estado_id") @db.Uuid
  nome            String
  geocodigoIbge   String?   @unique @map("geocodigo_ibge")
  populacao       Int?
  eleitoradoTotal Int?      @map("eleitorado_total")
  latitude        Float?
  longitude       Float?
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  estado          Estado    @relation(fields: [estadoId], references: [id], onDelete: Cascade)
  bairros         Bairro[]
  distritos       Distrito[]
  zonas           ZonaEleitoral[]
  @@map("municipios")
}

// Bairro, Distrito, Comunidade, ZonaEleitoral, SecaoEleitoral, AreaAtuacao
// seguem o mesmo padrão — cada um com FK para o pai e campos específicos

// ─── CRM ───
model Pessoa {
  id                   String   @id @default(uuid()) @db.Uuid
  fullName             String   @map("full_name")
  tipoPessoa           String?  @default("pf") @map("tipo_pessoa") // pf, pj
  cpf                  String?
  cnpj                 String?
  razaoSocial          String?  @map("razao_social")
  nomeFantasia         String?  @map("nome_fantasia")
  dataNascimento       String?  @map("data_nascimento")
  genero               String?
  escolaridade         String?
  nivelRelacionamento  String   @default("desconhecido") @map("nivel_relacionamento")
  observacoes          String?
  createdBy            String?  @map("created_by") @db.Uuid
  createdAt            DateTime @default(now()) @map("created_at")
  updatedAt            DateTime @updatedAt @map("updated_at")
  contatos             PessoaContato[]
  enderecos            PessoaEndereco[]
  papeis               PessoaPapel[]
  historico            PessoaHistorico[]
  consentimentos       PessoaConsentimento[]
  tags                 PessoaTag[]
  @@map("pessoas")
}

// PessoaContato, PessoaEndereco, PessoaPapel, PessoaHistorico,
// PessoaConsentimento, PessoaTag, Tag — seguem mesmo padrão

// ─── DEMANDAS, AGENDA, FINANCEIRO, CAMPANHAS, COMPLIANCE, COMUNICAÇÃO ───
// Cada módulo segue exatamente a mesma estrutura das tabelas Supabase atuais
// convertidas para Prisma models com relações tipadas

// ─── TSE (controle no PG) ───
model TseImportJob {
  id                    String   @id @default(uuid()) @db.Uuid
  tipo                  String   // eleitorado, locais, candidatos, resultados
  uf                    String
  ano                   Int
  status                String   @default("queued") // queued, running, done, failed, cancelled
  totalRegistros        Int?     @map("total_registros")
  registrosProcessados  Int?     @map("registros_processados")
  progressPct           Float    @default(0) @map("progress_pct")
  errorMsg              String?  @map("error_msg")
  sourceUrl             String?  @map("source_url")
  startedAt             DateTime? @map("started_at")
  finishedAt            DateTime? @map("finished_at")
  createdAt             DateTime @default(now()) @map("created_at")
  logs                  TseImportLog[]
  @@map("tse_import_jobs")
}

model TseImportLog {
  id        String   @id @default(uuid()) @db.Uuid
  jobId     String   @map("job_id") @db.Uuid
  level     String   @default("info")
  message   String
  createdAt DateTime @default(now()) @map("created_at")
  job       TseImportJob @relation(fields: [jobId], references: [id], onDelete: Cascade)
  @@map("tse_import_logs")
}

// ─── AI ───
model AiProvedor {
  id          String   @id @default(uuid()) @db.Uuid
  nome        String
  tipo        String   // openai, anthropic, google, local
  apiKey      String?  @map("api_key")
  baseUrl     String?  @map("base_url")
  status      String   @default("ativo")
  prioridade  Int      @default(0)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  modelos     AiModelo[]
  @@map("ai_provedores")
}

// AiModelo, AiCopilot, AiUsoLog — seguem mesmo padrão
```

> **Nota**: O schema completo tem ~55 models. Acima estão os principais. Todos seguem a mesma conversão: `snake_case` SQL → `camelCase` Prisma com `@map()`.

## 7.2 Migração de Dados Supabase → PostgreSQL Próprio

```bash
# 1. Exportar schema
supabase db dump --project-ref lryjfthdzmrgudamuqiu > dump_schema.sql

# 2. Exportar dados
supabase db dump --project-ref lryjfthdzmrgudamuqiu --data-only > dump_data.sql

# 3. No PostgreSQL novo, aplicar Prisma migrations primeiro
cd apps/api && npx prisma migrate deploy

# 4. Importar dados com script de transformação
# Script Node.js que:
#   - Lê dump_data.sql
#   - Mapeia auth.users → users (com password hash bcrypt)
#   - Mapeia profiles → users (merge)
#   - Mapeia user_roles → user_roles
#   - Copia todas as outras tabelas 1:1
#   - Ajusta FKs de auth.users(id) → users(id)
```

### Script de migração (`scripts/migrate-supabase-data.ts`)

```
Para cada tabela:
1. SELECT * FROM supabase via pg_dump
2. Transformar UUIDs de auth.users → users
3. INSERT no PostgreSQL novo via Prisma
4. Validar contagens: old count == new count
5. Log de erros por tabela
```

---

# 8. Fase 3 — ClickHouse + MinIO (1 semana)

## 8.1 ClickHouse DDL

```sql
-- Fatos
CREATE TABLE fato_resultado_secao (
  ano          UInt16,
  turno        UInt8,
  uf           FixedString(2),
  cod_municipio_tse String,
  municipio    String,
  zona         UInt16,
  secao        UInt16,
  cargo        String,
  numero_votavel String,
  nome_votavel String,
  partido      String,
  votos        UInt32
) ENGINE = MergeTree
PARTITION BY (ano, uf)
ORDER BY (ano, uf, cod_municipio_tse, zona, secao, cargo, numero_votavel);

CREATE TABLE fato_eleitorado_municipio (
  ano              UInt16,
  uf               FixedString(2),
  cod_municipio_tse String,
  municipio        String,
  zona             UInt16,
  secao            UInt16,
  total_eleitores  UInt32,
  genero           String,
  faixa_etaria     String,
  grau_instrucao   String,
  estado_civil     String,
  cor_raca         String
) ENGINE = MergeTree
PARTITION BY (ano, uf)
ORDER BY (ano, uf, cod_municipio_tse, zona, secao);

CREATE TABLE fato_prestacao_contas (
  ano              UInt16,
  uf               FixedString(2),
  cod_municipio_tse String,
  tipo_receita_despesa String,
  nome_candidato   String,
  numero_candidato String,
  partido          String,
  cargo            String,
  valor            Float64,
  descricao        String
) ENGINE = MergeTree
PARTITION BY (ano, uf)
ORDER BY (ano, uf, cod_municipio_tse, numero_candidato);

-- Dimensões
CREATE TABLE dim_candidato (
  ano              UInt16,
  uf               FixedString(2),
  cod_municipio_tse String,
  numero_urna      String,
  nome_urna        String,
  nome_completo    String,
  cpf              String,
  partido_sigla    String,
  cargo            String,
  genero           String,
  ocupacao         String,
  eleito           UInt8,
  situacao         String
) ENGINE = ReplacingMergeTree
ORDER BY (ano, uf, cod_municipio_tse, cargo, numero_urna);

CREATE TABLE dim_municipio (
  cod_municipio_tse String,
  nome              String,
  uf                FixedString(2),
  populacao         UInt32,
  eleitorado        UInt32
) ENGINE = ReplacingMergeTree
ORDER BY (cod_municipio_tse);
```

## 8.2 MinIO — Buckets e Organização

```
Buckets a criar:
├── tse-bronze/          # ZIPs originais
│   └── {tipo}/{ano}/{uf}/original.zip
├── tse-silver/          # Parquet processado
│   └── {tipo}/ano={ano}/uf={uf}/part-XXXX.parquet
├── tse-gold/            # Exports finais
│   └── exports/
├── documents/           # Anexos do sistema
│   └── demandas/, materiais/, contratos/
└── backups/             # pg_dump, ch_backup
    └── postgres/, clickhouse/
```

---

# 9. Fase 4 — Worker TSE Python (2-3 semanas)

## 9.1 Estrutura

```
workers/tse-etl/
├── src/
│   ├── __init__.py
│   ├── main.py              # Entry point — poll jobs do PG
│   ├── config.py             # Env vars
│   ├── downloaders/
│   │   └── tse_cdn.py        # Download ZIP com sha256
│   ├── parsers/
│   │   └── csv_parser.py     # Streaming CSV latin1 → records
│   ├── transformers/
│   │   ├── eleitorado.py
│   │   ├── candidatos.py
│   │   ├── resultados.py
│   │   └── locais.py
│   ├── loaders/
│   │   ├── minio_loader.py   # Salva bronze/silver
│   │   ├── clickhouse_loader.py  # INSERT batch
│   │   └── parquet_writer.py     # polars → Parquet
│   ├── quality/
│   │   └── checks.py         # Validações pós-carga
│   └── db/
│       └── postgres.py        # Atualiza jobs/logs
├── pyproject.toml
├── Dockerfile
└── tests/
```

## 9.2 Fluxo do Pipeline

```
1. Poll: SELECT * FROM tse_import_jobs WHERE status = 'queued' ORDER BY created_at LIMIT 1
2. Lock: UPDATE status = 'running', started_at = now()
3. Download: GET zip do CDN TSE → calcular sha256 → salvar em MinIO bronze/
4. Extract: Stream ZIP → CSV entries filtradas por UF
5. Parse: csv latin1 ; delimited → records (streaming, sem carregar tudo)
6. Transform: Normalizar colunas, tipos, encoding
7. Write Parquet: polars DataFrame → Parquet particionado → MinIO silver/
8. Load ClickHouse: INSERT em batch de 10.000 linhas
9. Quality: Contagem, nulls, duplicatas → registrar em tse_quality_checks
10. Finish: UPDATE status = 'done', finished_at, total_registros
11. Error: UPDATE status = 'failed', error_msg
```

## 9.3 Dockerfile

```dockerfile
FROM python:3.12-slim
WORKDIR /app
RUN pip install uv
COPY pyproject.toml .
RUN uv pip install --system -r pyproject.toml
COPY src/ src/
CMD ["python", "-m", "src.main"]
```

---

# 10. Fase 5 — Substituição dos Hooks Frontend (2 semanas)

## 10.1 Criar API Client

```typescript
// apps/web/src/lib/apiClient.ts
const API_URL = import.meta.env.VITE_API_URL;

class ApiClient {
  private token: string | null = null;

  setToken(token: string) { this.token = token; }
  clearToken() { this.token = null; }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        ...options.headers,
      },
      credentials: 'include', // para refresh token cookie
    });
    if (res.status === 401) {
      // tentar refresh
      const refreshed = await this.refresh();
      if (refreshed) return this.request(path, options);
      throw new Error('Session expired');
    }
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  get<T>(path: string) { return this.request<T>(path); }
  post<T>(path: string, body: any) { return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) }); }
  patch<T>(path: string, body: any) { return this.request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }); }
  delete<T>(path: string) { return this.request<T>(path, { method: 'DELETE' }); }

  private async refresh(): Promise<boolean> {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
      if (!res.ok) return false;
      const { token } = await res.json();
      this.setToken(token);
      return true;
    } catch { return false; }
  }
}

export const api = new ApiClient();
```

## 10.2 Exemplo: Migração do `usePessoas`

```typescript
// ANTES (Supabase direto):
import { supabase } from "@/integrations/supabase/client";
export function usePessoas(search?: string) {
  return useQuery({
    queryKey: ["pessoas", search],
    queryFn: async () => {
      let q = supabase.from("pessoas").select("*").limit(500);
      // ...filtros...
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

// DEPOIS (API própria):
import { api } from "@/lib/apiClient";
export function usePessoas(search?: string, nivel?: string, tipo?: string) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (nivel && nivel !== "all") params.set("nivel", nivel);
  if (tipo && tipo !== "all") params.set("tipo", tipo);
  return useQuery({
    queryKey: ["pessoas", search, nivel, tipo],
    queryFn: () => api.get(`/pessoas?${params}`),
  });
}
```

## 10.3 Ordem de Migração dos Hooks (38 arquivos)

| Prioridade | Hook | Dependência |
|-----------|------|-------------|
| 1 | AuthContext.tsx | Nenhuma — base de tudo |
| 2 | useUserRoles.ts | Auth |
| 3 | useProfile.ts | Auth |
| 4 | useSystemSettings.ts | Auth |
| 5 | useTerritorio.ts | Nenhuma |
| 6 | usePessoas.ts | Territorial |
| 7 | useDemandas.ts | Pessoas, Territorial |
| 8 | useAgenda.ts | Pessoas, Territorial |
| 9 | useFinanceiro.ts | Pessoas |
| 10 | useCampanhas.ts | Territorial |
| 11 | useCompliance.ts | Campanhas |
| 12 | useComunicacao360.ts | Campanhas |
| 13 | useAI.ts | Nenhuma |
| 14 | useBIStats.ts | Tudo acima |
| 15 | useDashboardKPIs.ts | Tudo acima |
| 16 | useEleitoralTSE.ts | ClickHouse via API |
| 17 | useTSEImport.ts | API |
| 18 | Restantes (mapa, materiais, etc.) | Módulos anteriores |

## 10.4 AuthContext — Antes vs Depois

```typescript
// DEPOIS:
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<User>('/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const signIn = async (email: string, password: string) => {
    const { token, user } = await api.post<LoginResponse>('/auth/login', { email, password });
    api.setToken(token);
    setUser(user);
  };

  const signOut = async () => {
    await api.post('/auth/logout', {});
    api.clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
```

---

# 11. Fase 6 — Remover Supabase (1-2 semanas)

## Checklist de remoção:

- [ ] Verificar que ZERO hooks importam `supabase` client
- [ ] Remover `src/integrations/supabase/` inteiro
- [ ] Remover `@supabase/supabase-js` do package.json
- [ ] Remover variáveis `VITE_SUPABASE_*` de `.env`
- [ ] Remover diretório `supabase/` (functions, migrations, config)
- [ ] Remover `scripts/tse-import.mjs` (substituído pelo worker Python)
- [ ] Remover `.github/workflows/tse-import.yml`
- [ ] Atualizar `docs/` para refletir nova arquitetura
- [ ] Desativar projeto Supabase após 30 dias de produção estável

> **Continua na Parte 3**: Dashboards BI, Metabase, Backups, Deploy, Cronograma, Checklist Final.
