# Project Memory

## Core
SIGT - Sistema Integrado de Gestão Territorial. Dark mode operacional. Primary blue #3B82F6 (217 91% 60%).
Supabase backend with RLS on all tables. RBAC via user_roles + has_role(). Portuguese UI.
6-stage plan: 1-Foundation ✅ 2-Territory ✅ 3-CRM ✅ 4-Demands ✅ 5-Logistics ✅ 6-BI/Maps ✅.
Never mock data. Everything real with Supabase persistence.
has_manage_role() = admin OR coordenador for write access.

## Memories
- [RBAC](mem://features/rbac) — 5 roles: admin, coordenador, lideranca, operador, visualizador
- [Territorial](mem://features/territorial) — 8 tabelas: estados, municipios, distritos, bairros, comunidades, zonas, secoes, areas_atuacao
- [CRM](mem://features/crm) — 10 tabelas: pessoas, contatos, enderecos, papeis, tags, vinculos, historico, consentimentos, anexos + Storage bucket
