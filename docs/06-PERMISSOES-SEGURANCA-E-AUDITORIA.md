# Permissões, Segurança e Auditoria

O sistema lida com dados sensíveis de eleitores e deve respeitar padrões estritos de segurança.

## Regra de Multi-Tenancy (Isolamento de Dados)
Diferente de sistemas tradicionais, no Kiribamba um usuário logado **jamais** pode ver dados de outro `tenant`.
Todo endpoint do backend **deve** extrair o `tenantId` do token JWT autenticado (via `@CurrentTenant()` decorator do NestJS). **Nunca** confie no `tenantId` enviado no corpo da requisição (body) ou params, a menos que seja um SuperAdmin criando contas.

## Matriz de Perfis (User Roles)

| Ação / Permissão | Admin | Coordenador | Operador | Liderança |
|------------------|-------|-------------|----------|-----------|
| Acesso Total / Config | Sim | Não | Não | Não |
| Exportar CSV de Eleitores | Sim | Sim | Não | Não |
| Cadastrar Pessoas (CRM) | Sim | Sim | Sim | Sim (só vinculados a ele) |
| Ver todas as Pessoas | Sim | Sim | Sim | Não (só sua base) |
| Apagar Demandas | Sim | Não | Não | Não |
| Ver Dashboard BI/Mapa | Sim | Sim | Não | Não |

## Auditoria (Tabela `AuditLog`)
Alterações sensíveis geram logs obrigatórios.
### O que deve gerar log:
- Exclusão de Pessoa, Demanda ou Liderança.
- Mudança de status de Demanda.
- Exportação massiva de dados (download de planilhas).
- Login falho (tentativas excessivas).

### Campos mínimos do Log
- `entity`: Nome da tabela (ex: "Pessoa").
- `entityId`: UUID modificado.
- `action`: CREATE, UPDATE, DELETE, EXPORT.
- `userId`: Quem fez.
- `tenantId`: Onde foi feito.
- `details`: JSON com as alterações (payload antigo e novo para DELETE/UPDATE).
