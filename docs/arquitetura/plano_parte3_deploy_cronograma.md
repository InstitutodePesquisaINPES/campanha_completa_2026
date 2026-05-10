# Plano de Migração — Parte 3/3

## Dashboards, Metabase, Backups, Deploy, Cronograma e Checklist Final

---

# 12. Dashboards — Substituição do BI Frontend

## 12.1 Problema Atual

O `useBIStats` faz 7 queries paralelas buscando tabelas inteiras e calcula tudo no navegador:
```
pessoas → SELECT id, nivel_relacionamento, created_at
demandas → SELECT id, status, categoria, prioridade, data_abertura, data_resolucao
agenda → SELECT id, tipo, status, data_inicio
despesas → SELECT id, valor, categoria, status, data_despesa
receitas → SELECT id, valor, tipo, data
bairros → SELECT id, classificacao
municipios → SELECT id
```
Depois faz `.reduce()` e `.filter()` no browser. Funciona com 100 registros, quebra com 100.000.

O `useDashboardKPIs` faz **16 queries paralelas** incluindo realtime via channel.

## 12.2 Solução: Endpoints de BI no Backend

### Endpoints do `BiModule`

```
GET /bi/overview
  Retorna: { pessoas, demandas, agenda, municipios, bairros, totalDespesas, totalReceitas, saldo }
  Implementação: queries com COUNT/SUM no PostgreSQL, cache Redis 30s

GET /bi/pessoas-por-nivel
  Retorna: [{ nivel: "aliado", count: 45 }, ...]
  SQL: SELECT nivel_relacionamento, COUNT(*) FROM pessoas GROUP BY 1

GET /bi/demandas-por-status
  Retorna: [{ status: "aberta", count: 12 }, ...]

GET /bi/despesas-por-categoria
  Retorna: [{ categoria: "pessoal", total: 15000.00 }, ...]

GET /bi/monthly-trend?months=6
  Retorna: [{ month: "2026-04", pessoas: 23, demandas: 15, eventos: 8 }, ...]
  SQL: queries com DATE_TRUNC('month', created_at)

GET /bi/financeiro-resumo
  Retorna: { totalDespesas, totalReceitas, saldo, despesasPorCategoria, receitasPorTipo }
```

### Endpoints do `DashboardModule`

```
GET /dashboard/kpis
  Retorna: todos os KPIs que hoje estão em useDashboardKPIs
  Implementação: queries otimizadas com COUNT(*) + head: true equivalente
  Cache: Redis 30s, invalidado por webhook interno nos CUD

GET /dashboard/meus-itens
  Retorna: demandas e eventos do usuário logado (top 5 cada)
```

### Endpoints TSE/BI (ClickHouse)

```
GET /tse/kpis?uf=BA&ano=2024
  Fonte: ClickHouse — queries agregadas

GET /tse/candidatos?uf=BA&ano=2024&cargo=vereador&page=1&limit=50
  Fonte: ClickHouse dim_candidato + fato_resultado

GET /tse/eleitorado-perfil?uf=BA&ano=2024&municipio=XXXXX
  Fonte: ClickHouse fato_eleitorado_municipio — GROUP BY genero, faixa_etaria, etc.

GET /tse/resultados-secao?uf=BA&ano=2024&cod_municipio=XXXXX
  Fonte: ClickHouse fato_resultado_secao

GET /tse/comparativo?uf=BA&cargo=vereador
  Fonte: ClickHouse — agregar por ano

GET /tse/municipios-resumo?uf=BA&ano=2024
  Fonte: ClickHouse — total_eleitores, abstencao por municipio
```

## 12.3 Cache com Redis

```typescript
// apps/api/src/common/decorators/cached.decorator.ts
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(private redis: RedisService) {}

  async intercept(context, next) {
    const key = `cache:${request.url}`;
    const cached = await this.redis.get(key);
    if (cached) return JSON.parse(cached);

    const result = await next.handle().toPromise();
    await this.redis.setex(key, 30, JSON.stringify(result)); // 30s TTL
    return result;
  }
}

// Invalidação nos services de CUD:
async createDemanda(data) {
  const result = await this.prisma.demanda.create({ data });
  await this.redis.del('cache:/bi/*');
  await this.redis.del('cache:/dashboard/*');
  return result;
}
```

---

# 13. Metabase — BI Exploratório

## 13.1 Configuração

```yaml
# Já definido no docker-compose.data.yml
# Acessível via Coolify em https://bi.seudominio.com
```

## 13.2 Conexões de Dados

| Conexão | Host | Banco | Usuário | Permissão |
|---------|------|-------|---------|-----------|
| PostgreSQL | postgres:5432 | campanha | metabase_reader | SELECT only |
| ClickHouse | clickhouse:8123 | eleicoes | metabase_reader | SELECT only |

```sql
-- No PostgreSQL: criar user read-only para Metabase
CREATE USER metabase_reader WITH PASSWORD '${MB_READER_PASSWORD}';
GRANT CONNECT ON DATABASE campanha TO metabase_reader;
GRANT USAGE ON SCHEMA public TO metabase_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO metabase_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO metabase_reader;
```

## 13.3 Dashboards Sugeridos no Metabase

1. **Painel Eleitoral** — eleitorado por município, faixa etária, gênero
2. **Resultados por Seção** — mapa de calor, ranking de candidatos
3. **Comparativo Histórico** — evolução por ano/eleição
4. **Auditoria de Importações** — jobs TSE, status, erros
5. **Operacional** — demandas por status, financeiro acumulado

---

# 14. Política de Backups

## 14.1 PostgreSQL

```yaml
# Coolify suporta backup agendado de bancos PostgreSQL
# Configurar no Coolify UI: Database → Backups → Schedule

Estratégia:
  - pg_dump diário às 03:00 UTC
  - Retenção: 7 diários, 4 semanais, 3 mensais
  - Destino primário: volume local /backups/postgres/
  - Destino secundário: MinIO bucket backups/postgres/
  - Teste de restore: mensal (script automatizado)
```

```bash
# Script de backup (cron no container ou Coolify scheduled task)
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PGPASSWORD=$PG_PASSWORD pg_dump -h postgres -U campanha campanha \
  | gzip > /backups/postgres/campanha_${TIMESTAMP}.sql.gz

# Upload para MinIO
mc cp /backups/postgres/campanha_${TIMESTAMP}.sql.gz minio/backups/postgres/

# Limpar backups > 30 dias
find /backups/postgres/ -name "*.sql.gz" -mtime +30 -delete
```

## 14.2 ClickHouse

```
Estratégia:
  - ClickHouse é reconstruível a partir do MinIO (Parquet no silver/)
  - Backup de metadados (schemas) diário
  - Em caso de perda: re-executar worker para cada dataset no MinIO
  - Para tabelas pequenas (dim_*): backup via clickhouse-backup tool
```

## 14.3 MinIO

```
Estratégia:
  - Versionamento habilitado nos buckets críticos (tse-bronze, documents)
  - Sincronização externa com mc mirror para S3 externo ou outra VPS
  - Os dados no MinIO SÃO a fonte da verdade para TSE
  - Perder MinIO = perder dados brutos = precisa re-baixar do TSE
```

## 14.4 Código

```
  - GitHub: source of truth
  - Tags de release: v1.0, v2.0, etc.
  - Migrations versionadas no Prisma
  - Docker images tagueadas por commit SHA
```

---

# 15. Deploy no Coolify

## 15.1 Setup Inicial

```
1. Instalar Coolify na VPS:
   curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

2. Acessar Coolify UI em https://coolify.seudominio.com

3. Criar Projeto "Campanha Eleitoral"

4. Criar 2 Environments:
   - staging
   - production

5. Conectar repositório GitHub
```

## 15.2 Configuração dos Serviços

```
Stack App:
  - web: Docker Build, domínio app.seudominio.com, health check GET /
  - api: Docker Build, domínio api.seudominio.com, health check GET /health
  - postgres: Database service, sem domínio público
  - redis: Database service, sem domínio público
  - worker-tse: Docker Build, sem domínio (serviço interno)

Stack Data:
  - clickhouse: Docker image, sem domínio público
  - minio: Docker image, domínio interno minio.seudominio.com (console) 
  - metabase: Docker image, domínio bi.seudominio.com
  - metabase-pg: Database service, sem domínio público
```

## 15.3 Variáveis de Ambiente (no Coolify)

```env
# Shared
PG_PASSWORD=<gerado>
JWT_SECRET=<gerado>
JWT_REFRESH_SECRET=<gerado>
MINIO_ACCESS_KEY=<gerado>
MINIO_SECRET_KEY=<gerado>
CH_PASSWORD=<gerado>
MB_PG_PASSWORD=<gerado>
MB_READER_PASSWORD=<gerado>

# Web
VITE_API_URL=https://api.seudominio.com

# API
NODE_ENV=production
DATABASE_URL=postgresql://campanha:${PG_PASSWORD}@postgres:5432/campanha
REDIS_URL=redis://redis:6379
CLICKHOUSE_URL=http://clickhouse:8123
```

## 15.4 SSL/TLS

```
Coolify gerencia certificados SSL automaticamente via Let's Encrypt.
Todos os domínios públicos (app, api, bi) recebem HTTPS automático.
Serviços internos (postgres, redis, clickhouse, minio) ficam na rede Docker sem exposição.
```

---

# 16. Cronograma Consolidado

| Fase | Descrição | Duração | Dependências |
|------|-----------|---------|-------------|
| **0** | Segurança, organização, backup do Supabase | 2-4 dias | Nenhuma |
| **1** | Backend NestJS — setup, auth, módulos base | 1-2 semanas | Fase 0 |
| **2** | PostgreSQL próprio — Prisma schema, migração dados | 1-2 semanas | Fase 1 |
| **3** | ClickHouse + MinIO — DDL, buckets, conexões | 1 semana | Fase 2 |
| **4** | Worker TSE Python — download, parse, load | 2-3 semanas | Fase 3 |
| **5** | Frontend — trocar hooks, API client, testar | 2 semanas | Fase 2 |
| **6** | Remover Supabase — limpar código, desativar | 1-2 semanas | Fase 5 |
| **7** | Metabase + dashboards + backups | 1 semana | Fase 3 |
| **8** | Deploy produção + testes + estabilização | 1 semana | Tudo |

**Total estimado: 10-14 semanas** (2.5-3.5 meses)

### Marcos Críticos

| Marco | Data alvo (semanas) | Critério de sucesso |
|-------|-------------------|-------------------|
| API funcionando | S3 | Login, CRUD de 3 módulos via API |
| PostgreSQL migrado | S5 | Todos os dados do Supabase no PG novo, contagens iguais |
| ClickHouse com dados | S7 | 1 dataset TSE carregado, query < 1s |
| Frontend sem Supabase | S10 | Zero imports de `@supabase/supabase-js` |
| Produção estável | S12 | 7 dias sem incidente crítico |
| Supabase desativado | S14 | Projeto Supabase deletado |

---

# 17. Checklist Final de Validação

## Funcional

- [ ] Login/logout funcionam com JWT + refresh token
- [ ] Todos os 5 roles (admin, coordenador, liderança, operador, visualizador) operam corretamente
- [ ] CRUD completo em: pessoas, demandas, agenda, financeiro, campanhas
- [ ] Dashboard KPIs carregam em < 2 segundos
- [ ] BI overview carrega sem buscar tabelas inteiras
- [ ] Importação TSE funciona via worker Python
- [ ] Dados TSE aparecem nos dashboards eleitorais
- [ ] AI Chat proxy funciona via API
- [ ] Mapas (Leaflet) carregam dados via API
- [ ] Exportação de dados funciona
- [ ] Auditoria registra todas as operações CUD

## Segurança

- [ ] Zero credenciais hardcoded no frontend
- [ ] JWT com expiração curta (15min) + refresh (7d)
- [ ] Refresh token em cookie HTTP-only Secure SameSite
- [ ] Senhas com bcrypt (12 rounds)
- [ ] Rate limiting no login (5 tentativas/minuto)
- [ ] CORS configurado apenas para domínios permitidos
- [ ] PostgreSQL, Redis, ClickHouse sem porta pública
- [ ] MinIO console protegido por autenticação
- [ ] RLS substituído por Guards + middleware no NestJS
- [ ] Validação de input com class-validator em todos os endpoints

## Performance

- [ ] Dashboard KPIs: < 2s
- [ ] Lista de pessoas (500): < 1s
- [ ] Query ClickHouse (resultado por seção, 1M+ linhas): < 3s
- [ ] Importação TSE 1GB ZIP: < 30 minutos
- [ ] Frontend bundle: < 500KB gzipped

## Infraestrutura

- [ ] Backup PostgreSQL automático diário
- [ ] MinIO sincronizado externamente
- [ ] ClickHouse reconstruível a partir do MinIO
- [ ] Monitoramento de disco (alerta 80%)
- [ ] Health checks em todos os serviços
- [ ] Logs centralizados (stdout → Coolify)
- [ ] SSL em todos os domínios públicos

## Código

- [ ] Zero referências a `@supabase/supabase-js`
- [ ] Zero referências a `supabase.from()`
- [ ] Zero referências a `supabase.auth`
- [ ] Zero referências a `supabase.functions.invoke()`
- [ ] Diretório `supabase/` removido
- [ ] Testes unitários para auth, guards, services críticos
- [ ] README atualizado com nova arquitetura
- [ ] `.env.example` completo e documentado

---

# 18. O que NÃO fazer

```
❌ Supabase self-hosted como destino final
❌ TSE inteiro dentro do PostgreSQL operacional
❌ Edge Functions para ingestão de dados grandes
❌ BI agregando no navegador com .reduce()
❌ Microservices prematuros — usar monólito modular
❌ Kubernetes — complexidade desnecessária neste estágio
❌ Migração big-bang — fazer faseado com coexistência temporária
❌ Compartilhar PostgreSQL entre app e Metabase com mesmo user
❌ MinIO single-node como HA — documentar que é MVP
```

---

# 19. Resumo Executivo

| Item | De | Para |
|------|-----|------|
| Backend | Nenhum (frontend direto) | NestJS com 18 módulos |
| Auth | Supabase Auth | JWT próprio + refresh token |
| Banco operacional | Supabase PostgreSQL | PostgreSQL 16 autogerido |
| Banco analítico | Supabase PostgreSQL | ClickHouse |
| Storage | Supabase Storage | MinIO (S3 compatível) |
| ETL TSE | GitHub Actions + Edge Functions | Python worker com polars |
| BI | Frontend .reduce() | API + Redis cache + Metabase |
| Deploy | Supabase Cloud | Coolify + Docker Compose na VPS |
| Monitoramento | Nenhum | Coolify + health checks |
| Backups | Supabase gerenciado | pg_dump + MinIO + sync externo |
