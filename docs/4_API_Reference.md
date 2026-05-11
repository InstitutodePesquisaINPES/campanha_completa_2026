# 🌐 API Reference & Endpoints Completos
**Plataforma Kiribamba Enterprise | Documentação Exaustiva de Rotas NestJS**

A API do Kiribamba é estritamente protegida. Todas as rotas (exceto health e login) possuem interceptadores **`JwtAuthGuard`** (Validação de Sessão) e **`TenantGuard`** (Isolamento de Dados/TenantId). Adicionalmente, as rotas validam hierarquia via RBAC (Role-Based Access Control).

Abaixo está o mapeamento completo e exaustivo de todos os **27 Módulos (Controllers)** implementados no backend.

---

## 🔐 1. Módulos de Governança, Autenticação e Configuração

### 1.1. Autenticação (`/auth`)
- `POST /auth/login`: Autentica o usuário e retorna o `access_token` JWT.
- `POST /auth/register`: Cadastro B2B de novos Agentes/Tenants na plataforma.
- `POST /auth/refresh`: Renova o token de sessão ativa.

### 1.2. Perfil Pessoal (`/profile`)
- `GET /profile/me`: Retorna os dados do usuário logado, seu tenant, avatar e `AppRole`.
- `PATCH /profile`: Atualiza os dados pessoais de perfil.
- `PATCH /profile/password`: Rota para alteração de senha segura.

### 1.3. Gestão de Equipe e Auditoria (`/equipe`)
- `GET /equipe`: Lista todos os usuários pertencentes ao Tenant atual.
- `POST /equipe`: Cadastra membro da equipe (respeitando a Patente Máxima do criador).
- `PATCH /equipe/:id`: Promove, rebaixa ou inativa um membro.
- `GET /equipe/logs`: Traz o `AuditLog` completo do sistema.
- `GET /equipe/:id/logs`: Traz o `AuditLog` exclusivo de um membro.

### 1.4. Inquilino (`/tenant`)
- `GET /tenant`: Dados do Comitê/Workspace atual.
- `PATCH /tenant`: Atualiza dados do Workspace (Nome, Slug).

### 1.5. Configurações de Sistema (`/system-settings`)
- `GET /system-settings`: Lista parâmetros dinâmicos globais (Tema, Logo, Pontos do App).
- `PATCH /system-settings`: Atualiza dicionário chave-valor das regras globais.

### 1.6. Administração Global (`/admin`)
- Módulo restrito ao Root do sistema (Dono da Kiribamba) e Administradores. Permite gestão de faturamento, infraestrutura e métricas de uso gerais.
- `GET /admin/users`: Lista de todos os usuários do sistema.
- `POST /admin/users`: Criação de novo usuário com hierarquia.
- `GET /admin/centros-custo`, `POST /admin/centros-custo`, `DELETE /admin/centros-custo/:id`: CRUD completo de Centros de Custo (Financeiro).
- `GET /admin/system-health`: Retorna métricas globais de saúde (Demandas em aberto, contas atrasadas, auditorias do dia).
- `GET /admin/stats/counts`: Realiza contagens rápidas e otimizadas em massa de 10 tabelas principais para o dashboard administrativo.
- `GET /admin/stats/30d`: Relatório estatístico dos últimos 30 dias de uso.

### 1.7. Healthcheck (`/health`)
- `GET /health`: Monitoramento para Load Balancers e Kubernetes. Status do banco, fila e memória.

---

## 🎯 2. Módulos de CRM e Inteligência Territorial

### 2.1. CRM de Eleitores (`/pessoas`)
- `GET /pessoas`: Lista e pesquisa paginada da base de contatos.
- `GET /pessoas/count`: Retorna o número total de contatos/eleitores registrados no tenant atual.
- `POST /pessoas`: Cadastra novo contato/eleitor via DTO rígido.
- `GET /pessoas/:id`: Dossiê completo do eleitor.
- `PATCH /pessoas/:id`: Atualização de informações de contato e tags.
- `DELETE /pessoas/:id`: Exclusão lógica (GDPR/LGPD).
- `POST /pessoas/segmentacao`: Busca vetorial avançada cruzando `tags`, `idade`, e `demografia`.
- `POST /pessoas/:id/enderecos`: Adiciona/atualiza endereços para cruzamento de mapas.

### 2.2. Cartografia Estrutural (`/territorial`)
- `GET /territorial/municipios`: Consulta ao censo/IBGE.
- `POST /territorial/municipios`: Cadastra municípios estratégicos para o candidato.
- `POST /territorial/zonas`: Cadastra Zonas Eleitorais.
- `POST /territorial/secoes`: Cadastra Seções de votação com geolocalização.

### 2.3. BI Territorial Avançado (`/territorio`)
- `GET /territorio/mapa-calor`: Endpoint de dados GIS. Retorna GeoJSON e Heatmaps baseados em endereços do CRM.
- `GET /territorio/liderancas`: Mapeia a presença de cabos eleitorais espalhados no mapa.
- `GET /territorio/estados`: Retorna a lista de UFs ativas no sistema.
- `GET /territorio/stats`: Contagem agregada de estados, municípios e bairros mapeados.
- `POST /territorio/importar-ibge`: Sincroniza e realiza *upsert* da malha territorial em background consumindo fontes do IBGE e OSM.

### 2.4. Logística de Campo (`/campo`)
- `GET /campo/roteiros`: Lista roteiros programados para porta a porta.
- `POST /campo/roteiros`: Cria uma jornada para a liderança executar.
- `PATCH /campo/roteiros/:id`: Atualiza status do roteiro.
- `POST /campo/checkin`: Grava a coordenada GPS atestando a presença da liderança no bairro.

---

## 💼 3. Módulos Estratégicos e de Comando

### 3.1. Planejamento de Campanhas (`/campanhas`)
- `GET /campanhas`: Lista as campanhas (Ex: Prefeito 2024, Deputado 2026) que o Tenant disputa.
- `POST /campanhas`: Abre um novo ciclo eleitoral no painel.
- `GET /campanhas/:id/parametros`: Carrega a configuração global/cronograma de uma campanha.
- `PUT /campanhas/:id/parametros`: Atualiza os parâmetros macro e escopo da campanha.
- `POST /campanhas/:id/subtarefas`: Loop assíncrono otimizado para injeção massiva de sub-rotinas vinculadas.
- `GET /campanhas/tarefas/:id/historico`: Busca log de auditoria detalhado das mudanças ocorridas em uma tarefa específica.
- `GET /campanhas/:id/tarefas/anexos-count`: Contagem inteligente (via `groupBy`) dos anexos vinculados a cada tarefa.
- `GET /campanhas/:id/marcos-criticos`: Filtra estritamente atividades estratégicas com urgência baseadas na data atual.

### 3.2. Estratégia e OKRs (`/strategy`)
- `GET /strategy/eixos`: Pilares macro da campanha.
- `POST /strategy/planos-acao`: Desdobra eixos em metas para a equipe tática cumprir.

### 3.3. Painéis Consolidados (`/dashboard`)
- `GET /dashboard/kpis`: Retorna o panorama executivo num único Request (Votos, Metas, Orçamento). Consumido pela Tela Inicial.
- `GET /dashboard/busca`: Global Search Omnichannel. Consolida buscas cruzadas entre Pessoas, Demandas e Campanhas, devolvendo dados padronizados para o cabeçalho de pesquisa rápida.

### 3.4. Sala de Comando (`/comando`)
- Rotas analíticas que trazem KPIs sensíveis (War Room) focados em metas semanais da coordenação.

### 3.5. Agenda e Eventos (`/agenda`)
- `GET /agenda`: Compromissos do candidato (Comícios, Debates).
- `POST /agenda`: Agenda novo evento, delegando para os `AppRoles` corretos.

### 3.6. Gamificação e Metas (`/score`)
- `GET /score/ranking`: Retorna o pódio das Lideranças e Cabos Eleitorais mais engajados do dia/mês. Base de dados processada com os pesos definidos no `/system-settings`.

---

## 📢 4. Módulos de War Room, Mídia e Comunicação

### 4.1. Comunicação e Redes (`/comunicacao`)
- `GET /comunicacao/pautas`: Assuntos em alta a serem gravados pelo candidato.
- `GET /comunicacao/mencoes`: Social Listening de detratores/apoiadores.
- `POST /comunicacao/disparos`: Engatilha disparos segmentados omnichannel.

### 4.2. Demandas e Ouvidoria (`/demandas`)
- `GET /demandas`: Kanban de requisições de eleitores (Ofícios, Buracos, Saúde).
- `POST /demandas`: Abertura de ticket.
- `PATCH /demandas/:id/status`: Muda o ticket de "Novo" para "Resolvido".

### 4.3. Material Logístico (`/materiais`)
- `GET /materiais`: Catálogo de Almoxarifado (Santinhos, Adesivos).
- `POST /materiais/requisicao`: Rota para Cabo Eleitoral solicitar lotes de material para seu município.

### 4.4. Repositório (`/documentos`)
- `GET /documentos`: Repositório PDF (Atas partidárias, Contratos).
- `POST /documentos/upload`: Envio seguro de arquivos confidenciais.

### 4.5. Notificações (`/notificacoes`)
- `GET /notificacoes`: Alertas em tempo real para os usuários do sistema.
- `POST /notificacoes/lida`: Marca alertas como resolvidos.

---

## 💰 5. Módulos Financeiros e Jurídicos

### 5.1. Caixa e Orçamento (`/financeiro`)
- `GET /financeiro/orcamento`: Retorna limites de gastos declarados ao TSE.
- `GET /financeiro/despesas`: Lista queima de caixa agrupada por centro de custo.
- `POST /financeiro/despesas`: Lançamento de notas fiscais no sistema.

### 5.2. Gestão de Contratos (`/contratos`)
- `GET /contratos`: Lista fornecedores e gráficas ativas.
- `POST /contratos/:id/aprovar`: Rota restrita ao Jurídico para dar aval no contrato antes do pagamento.

---

## 🤖 6. Módulos de Dados Brutos e Inteligência Artificial

### 6.1. Copilot AI Corporativo (`/ai`)
- `GET /ai/copilots`: Lista de Agentes Treinados (Assessor, Estrategista, Redator).
- `POST /ai/chat`: Interface WebSocket ou REST de conversa com o LLM da campanha, passando contexto restrito para evitar alucinações.
- `POST /ai/generate-copy`: Utilizado pelo módulo de Comunicação para redigir textos curtos instantaneamente.

### 6.2. Análise de Pesquisas (`/pesquisas`)
- `GET /pesquisas`: Banco de pesquisas quantitativas registradas no TRE.
- `POST /pesquisas/upload`: Sobe tabelas ou relatórios quali, alimentando a base vetorial do `/ai`.

### 6.3. Inteligência e Cruzamentos (`/inteligencia`)
- Módulo focado em BI profundo. Realiza junções pesadas (SQL Aggregations) entre o banco de `pesquisas` e a tabela de `territorio` para prever tendência de queda de intenção de voto.

---

## 📊 7. Módulos Auxiliares Transversais

### 7.1. Módulo de Exportação Universal (`/export`)
- `GET /export/:table`: Único endpoint responsável por lidar com downloads em massa (Excel/CSV). Valida a tabela alvo contra uma _whitelist_ e retorna os dados brutos filtrados por Tenant, removendo a necessidade de múltiplas Views SQL.

---

## 🛡️ Exception Handling & Status Codes (Padrão Kiribamba)

- **`200/201`**: Requisição processada e autorizada.
- **`400 Bad Request`**: DTO Interceptado (Faltam campos obrigatórios no Payload JSON).
- **`401 Unauthorized`**: Faltou Token JWT ou ele expirou. O Front-End reage abrindo a página de Login.
- **`403 Forbidden`**: Tentativa gravíssima de *Privilege Escalation* ou *Cross-Tenant Access*. Acesso negado pelo `TenantGuard`.
- **`404 Not Found`**: O registro procurado ou foi deletado logicamente ou não existe no Comitê atual.
- **`500 Internal Server Error`**: Exceção disparada. Fica atrelada ao log de auditoria no Sentry.
