# Product Requirements Document (PRD)
**Plataforma Kiribamba | Inteligência e Comando Eleitoral**

---

## 1. Visão Geral (O Problema e a Solução)

A política moderna ainda opera em silos de dados. Campanhas gastam milhões, mas os prefeitos, deputados e coordenadores tomam decisões baseadas no "feeling" (achismo), planilhas de Excel quebradas e listas de transmissão de WhatsApp sem contexto geográfico. O **Kiribamba** nasce para erradicar a desorganização de campanhas, unindo inteligência de dados (BI), micro-segmentação territorial e comunicação em uma única plataforma SaaS Multi-Tenant. 

**O que o Kiribamba é:**
Um centro de comando tático. Uma plataforma "all-in-one" onde o QG de campanha analisa mapas de calor, a liderança cadastra eleitores, e o robô de IA cruza os dados do TSE para indicar onde há fuga de votos.

## 2. A Hierarquia da Campanha (Personas e Cargos)

A plataforma modela a estrutura exata de uma eleição profissional, dividindo acessos em 12 permissões (`AppRole`) isoladas.

### 👑 Núcleo Executivo
- **`candidato`**: Acesso de topo. Focado em relatórios de alto nível, BI de territórios e Copilot AI para tomada de decisões. Sem distrações operacionais.
- **`admin`**: Administrador Master (Agência/TI). Controle sobre configurações globais de sistema e billing.
- **`coord_geral`**: Chefe de Campanha. Autoridade máxima na operação diária, tem visão global de orçamentos, demandas e equipe.

### 🎯 Núcleos Táticos (Especialistas)
- **`coord_financeiro`**: Acesso focado no fluxo de caixa, pagamentos, contratos e limites impostos pelo TSE.
- **`coord_juridico`**: Foco em compliance eleitoral, acompanhamento de prazos e denúncias.
- **`coord_comunicacao`**: Opera o "War Room" de redes sociais. Gerencia pautas, requisição de materiais e menções.
- **`coord_mobilizacao`**: O "Mestre do Território". Usa o BI de Mapas para designar onde as lideranças devem focar esforço.

### 📍 Lideranças e Operação de Rua
- **`lideranca_regional`**: (Ex: Prefeitos de cidade base). Gerencia os líderes menores e acessa os KPIs de voto estritamente na sua região de influência.
- **`lideranca_local`**: (Ex: Vereador ou Presidente de Bairro). Focado em gerir seus próprios cabos eleitorais e bater metas semanais.
- **`cabo_eleitoral`**: O militante de base. Utiliza a versão "PWA Offline" no celular para bater de porta em porta, cadastrar eleitores no CRM e visualizar suas metas diárias.

### 💻 Retaguarda Operacional
- **`operador_crm`**: Operador de telemarketing focado em contatar as bases e disparar comunicações direcionadas.
- **`analista_dados`**: Perfil técnico focado em subir relatórios quantitativos e qualitativos (pesquisas) para retroalimentar a IA da plataforma.

---

## 3. Core Features (Módulos Principais)

### 🗺️ Inteligência Territorial (GIS & BI)
- Integração de dados do IBGE e TSE.
- Visualização de polígonos, zonas, seções eleitorais e áreas de atuação.
- Mapa de Calor de redutos eleitorais.

### 👥 CRM Eleitoral Avançado
- Gestão hiper-segmentada: Eleitor, Apoiador, Liderança.
- Controle de engajamento (Frio, Morno, Quente, Garantido).
- Segmentação paramétrica para disparos de comunicação.

### 🤖 Copilot AI (War Room)
- Agente Inteligente treinado (LLM) que consome dados da própria plataforma.
- Categoria de robôs especialistas: Analista Financeiro, Jurídico Eleitoral, Estrategista.
- Prevenção ativa contra "Prompt Injection" garantindo o uso restrito ao escopo da campanha.

### 🏆 Motor de Gamificação
- Geração de "Scores" por engajamento e metas alcançadas.
- Ranking de Lideranças em tempo real, motivando a militância no campo.

### 📱 Mobilidade (PWA)
- Progressive Web App instalável nativamente em iOS/Android.
- Armazenamento em cache (Workbox) que mantém a interface viva sem internet.

### 🛡️ Governança Corporativa e Auditoria
- **Hierarquia Estrita (RBAC):** Escalada de privilégios bloqueada por design. O sistema não permite que um usuário conceda patentes superiores à sua própria.
- **Audit Logs:** Big Brother corporativo. Todo `INSERT`, `UPDATE` ou `DELETE` gera um rastro inalterável (`AuditLog`), atrelando quem alterou, quando e o que mudou (JSON diff). Isso blinda o QG contra sabotagens e fraudes operacionais.

---

## 4. Diferencial Competitivo (Moat)
Diferente das ferramentas genéricas de CRM (Salesforce, Hubspot), o Kiribamba possui ontologia estritamente eleitoral. Todos os dados respeitam a taxonomia do **TSE** (Tribunal Superior Eleitoral). 

**100% Self-Hosted e Soberania de Dados:** O sistema rompeu com plataformas de DBaaS (como Supabase/Firebase) e opera em uma arquitetura `NestJS + Prisma + PostgreSQL` fechada, garantindo total controle sobre a residência dos dados. O modelo multi-tenant robusto, garantido pelas **Client Extensions do Prisma**, permite que a plataforma seja alugada simultaneamente para 100 candidatos diferentes, sem nenhum vazamento de dados, operando com total segurança e performance sob um único cluster Kubernetes/Docker.
