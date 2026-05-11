# PRD — Kiribamba (Campanha Completa 2026)

## 1. Visão geral
O Kiribamba é uma plataforma *All-In-One* (SaaS) desenhada para candidatos, coordenadores de campanha, prefeituras e lideranças políticas. Ele une as funções de um CRM sofisticado, um painel de BI/GIS de alta fidelidade e um gerenciador de tarefas diárias em um único ambiente.

## 2. Problema que o sistema resolve
Campanhas eleitorais e gabinetes políticos sofrem com a desorganização de dados. A base de apoiadores fica pulverizada em listas de transmissão no WhatsApp, planilhas no Excel e cadernos físicos. Além disso, o mapeamento de votos e capilaridade de cabos eleitorais (Lideranças) é quase impossível de visualizar geograficamente com clareza. 

## 3. Público-alvo
- Políticos com mandato (Prefeitos, Deputados, Vereadores).
- Candidatos a cargos majoritários e proporcionais (Foco: 2026).
- Coordenadores Gerais de Campanha.
- Gestores de Mobilização e Lideranças Locais.

## 4. Perfis de usuários
1. **Administrador/Gestor (Dono do Tenant):** Acesso irrestrito a todos os dados do gabinete/campanha, controle de BI financeiro, e configurações.
2. **Coordenador:** Pode gerenciar campanhas, demandas, lideranças e agenda.
3. **Operador/Call Center:** Apenas insere dados de pessoas, contatos, ouve demandas da população. Limitado na visão de estratégia e exportação.
4. **Liderança (Mobilizador):** Acesso via aplicativo/PWA simplificado. Só enxerga sua própria base de eleitores cadastrados e metas.

## 5. Objetivos do produto
- **Mapeamento de Base:** Saber exatamente onde estão os eleitores e de quem eles são (Lideranças atreladas).
- **Atendimento de Demandas (Ouvidoria Ativa):** Registrar pedidos, dores e sugestões dos cidadãos, para embasar discurso e ações.
- **Inteligência de Dados Georreferenciados:** Cruzar dados demográficos do TSE (seções, perfis) com a base do próprio candidato.

## 6. Funcionalidades obrigatórias
- Multi-tenancy (um Tenant por político/campanha).
- CRUD Massivo de "Pessoas" com tags de nível de relacionamento.
- Gestão de "Lideranças" com cálculo automático de "Tamanho da Base" de cada líder.
- Dashboard Geográfico (Mapa de Calor, Marcadores por Bairro/Cidade).
- Importação Idempotente e Massiva de CSVs Abertos do TSE (Upload > Background Worker > PostgreSQL).
- Ouvidoria/Demandas (Cadastro, Encaminhamento e Status de Resolução).
- Kanban de Campanhas e Tarefas Internas.

## 7. Funcionalidades opcionais
- Agenda e Compromissos Integrados (Módulo de Check-in em eventos).
- Módulo Financeiro Simplificado (Receitas e Despesas de Campanha).
- Disparo de E-mail / WhatsApp (1 para N ou Fluxos RAG com IA).

## 8. Funcionalidades futuras
- Aplicativo Mobile Nativo (React Native) focado na Liderança (Cabos Eleitorais) na rua.
- Assistente IA que lê os dados da campanha e monta discurso.
- Cruzamento com folha de pagamento pública.

## 9. Fora de escopo
- Prestação oficial de contas gerando SPED/TSE automático final (o sistema não substitui o contador, apenas auxilia internamente).
- Criação de Deepfakes ou disparos de spam contra a lei eleitoral.

## 10. Critérios de sucesso
- Sistema capaz de ingerir planilhas do TSE com > 5 milhões de linhas sem derrubar o servidor.
- O Dashboard do mapa carrega em menos de 3 segundos.
- Usuários não-técnicos conseguem operar e achar eleitores facilmente.

## 11. Riscos e limitações
- Alta volumetria de dados no banco devido ao TSE, exigindo indexação pesada (B-Tree).
- Tratamento da LGPD e manuseio de dados pessoais (CPFs, Telefones, Endereços). Tudo precisa de forte segurança.

## 12. Premissas técnicas e comerciais
- Plataforma operada como SaaS, hospedada em arquitetura escalável (VPS parrudo + Coolify).
- Backend deve suportar Node Child Processes/Streams para processamento pesado assíncrono.
