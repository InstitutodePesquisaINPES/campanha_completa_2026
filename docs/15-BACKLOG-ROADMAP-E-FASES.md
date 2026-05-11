# Backlog, Roadmap e Fases

O desenvolvimento do Kiribamba é incremental, focando primeiro no que entrega mais valor na estruturação da campanha.

## Fase 1 — Base do Sistema (Concluída / Em Refinamento)
### Objetivo
Criar estrutura inicial, isolamento de dados e importar as gigantescas bases abertas para dentro do banco de forma saudável.
### Inclui
- Login, Multi-Tenant, AuthGuard, Níveis de Acesso.
- Dashboard Inicial (Contadores estáticos de pessoas e demandas).
- Cadastro de Pacientes/Eleitores (CRM) com tag de Liderança.
- Importação do TSE com Background Worker (`import-master.js`).
- Gestão de Demandas (Ouvidoria simples).

## Fase 2 — Inteligência Geográfica e Campanhas (Atual)
### Objetivo
Dar utilidade aos dados massivos do TSE cruzados com o CRM.
### Inclui
- Dashboard de Mapa de Calor cruzando TSE x Endereços de Eleitores no CRM.
- Filtros avançados na Tabela do CRM (por Liderança, Bairro, Nível de Relacionamento).
- Módulo Completo de Tarefas e Kanban (Campanhas internas da equipe).
- Componentes visuais fiéis aos dados granulares de Seção e Zona do TSE.

## Fase 3 — Automações e Expansão Externa (Futura)
### Objetivo
Automatizar a comunicação com a ponta (o eleitor) usando a base montada.
### Inclui
- Disparos via WhatsApp API segmentados por Bairro ou Tag.
- Assistente RAG de Inteligência Artificial para mineração de discursos.
- Módulo PWA/App Mobile para a Liderança coletar nomes e demandas offline na rua.

## Fases Bloqueadas (Não fazer agora)
- Financeiro Eleitoral e Integração bancária/SPED.
