
## Auditoria do Sistema SIGT

Analisei o estado atual do projeto. Aqui está o diagnóstico e o plano para deixar a área admin completa e robusta.

### Estado Atual

**O que está pronto:**
- 35+ tabelas no banco com RLS configurado
- 12 módulos: CRM, Demandas, Agenda, Financeiro, Materiais, Plano 90d, BI, Mapas, Comunicação, Territorial, Documentos, Campo
- Auth + RBAC (5 papéis) + audit_logs
- Admin parcial: Stats, Users, Tags, Centros Custo, Export, Audit (6 abas)

**Gaps críticos da área Admin:**
1. **Sem CRUD de Campanhas** — coração do sistema, hoje só editável via SQL
2. **Sem gestão de Estados/Municípios/Bairros** centralizada
3. **Auditoria fraca** — sem filtros, sem busca, sem detalhes do diff (old/new data)
4. **Stats sem gráficos** — só números secos, sem evolução temporal
5. **Sem painel de Saúde do Sistema** — storage, RLS, contagens órfãs
6. **Sem configurações globais** — parâmetros de SLA, branding, defaults
7. **Sem gestão de convites** — criar usuário só via seed
8. **Export sem filtros** — baixa tudo, sem range de datas

### Plano de Implementação

**1. Reformular Admin com 9 abas robustas**
```
Dashboard | Usuários | Campanhas | Territórios | Tags | Centros Custo | Configurações | Auditoria | Exportação
```

**2. Novos componentes admin**

| Componente | Função |
|---|---|
| `DashboardTab.tsx` | KPIs + gráfico evolução 30d (pessoas/demandas/eventos) + alertas de saúde |
| `CampanhasTab.tsx` | CRUD campanhas + botão "Gerar Plano 90 dias" + ativar/desativar |
| `TerritoriosAdminTab.tsx` | Importar municípios IBGE, editar bairros em massa, classificação |
| `ConfiguracoesTab.tsx` | SLA por prioridade, nome da organização, logo, cores, defaults |
| `ConvidarUsuarioDialog.tsx` | Criar usuário via edge function (admin-create-user) com email + papel |
| `AuditDetailDialog.tsx` | Mostrar diff JSON old vs new com syntax highlight |

**3. Melhorias nos componentes existentes**
- `AuditTab`: filtros (tabela, ação, usuário, data) + paginação + clicar abre diff
- `ExportTab`: range de datas + escolher colunas + formato JSON além de CSV
- `StatsTab`: virar parte do Dashboard com gráficos (recharts já instalado)
- `UsersTab`: botão "Convidar usuário", desativar usuário, ver últimos logins

**4. Backend (migrations + edge functions)**
- Tabela `system_settings` (chave/valor JSON, singleton) com RLS admin-only
- Edge function `admin-create-user` (usa service_role para criar + atribuir papel)
- Edge function `admin-system-health` (conta órfãos, storage usado, RLS check)
- View `v_admin_stats_30d` para evolução diária

**5. Navegação**
- Adicionar badge "Admin" no sidebar para usuários admin
- Atalhos rápidos no Dashboard ("Criar campanha", "Convidar usuário", "Ver auditoria hoje")

### Estrutura técnica

```
src/
├── pages/admin/AdminPage.tsx          (9 abas)
├── components/admin/
│   ├── DashboardTab.tsx               (NEW)
│   ├── CampanhasTab.tsx               (NEW)
│   ├── TerritoriosAdminTab.tsx        (NEW)
│   ├── ConfiguracoesTab.tsx           (NEW)
│   ├── ConvidarUsuarioDialog.tsx      (NEW)
│   ├── AuditDetailDialog.tsx          (NEW)
│   ├── SystemHealthCard.tsx           (NEW)
│   ├── StatsTab.tsx                   (refactor → DashboardTab)
│   ├── UsersTab.tsx                   (+ convite, + desativar)
│   ├── AuditTab.tsx                   (+ filtros, + diff)
│   └── ExportTab.tsx                  (+ filtros de data)
└── hooks/useSystemSettings.ts         (NEW)

supabase/
├── migrations/                        (system_settings + view stats 30d)
└── functions/
    ├── admin-create-user/             (NEW)
    └── admin-system-health/           (NEW)
```

### Entregáveis
- Admin com 9 abas funcionais e robustas
- 2 edge functions seguras (verificam papel admin)
- 1 nova tabela + 1 view para métricas
- Auditoria com diff visual completo
- Convite de usuário funcionando end-to-end
- Dashboard com gráficos de evolução

Tempo estimado: 1 ciclo de implementação completo.
