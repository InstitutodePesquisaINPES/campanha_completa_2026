# Integrações Externas

O Kiribamba é uma plataforma que concentra dados de fora e age para fora. As integrações devem ser tratadas com alto grau de robustez e prevenção a falhas (Retries, Filas).

## 1. Integração Oficial: TSE (Arquivos Abertos)
- **Tipo:** Assíncrona via Background Workers Locais (Arquivos CSV).
- **Processamento:** Como a integração é feita "offline" a partir dos dados abertos (zip baixado pelo cliente), o gargalo é I/O e Banco de Dados.
- **Fallback/Error:** Se uma linha do arquivo estiver quebrada, deve pular (skip) e logar na tela final, sem abortar os 5 milhões de linhas restantes. O log fica na entidade `TseCsvArquivo`.

## 2. WhatsApp API (Planejado)
- **Finalidade:** Disparo de convites para eventos de campanha, pesquisas de satisfação e atendimento passivo da ouvidoria.
- **Provedor:** Baileys ou Evolution API (Instância própria por Tenant para evitar banimento cruzado).
- **Regras Críticas:**
  - Controlar `Rate Limits` agressivamente (máx disparos por minuto) para evitar block no chip do político.
  - Implementar sistema de Webhooks para ouvir se a mensagem foi lida/entregue e alimentar a tabela de engajamento do CRM.
  - Todo disparo gera um `AuditLog`.

## 3. OpenAI / LLM (Planejado)
- **Finalidade:** Sugestão de roteiro/discurso para o candidato baseado nas dores do bairro, registradas na Ouvidoria (Demandas). Análise de sentimento das mensagens recebidas pelo Whatsapp.
- **Config:** A API Key ficará no `.env` do backend e nunca exposta. Prompts injetarão contextos estritos via RAG. (Ver doc específico de IA).

## 4. Ibge / ViaCEP
- Usada para o preenchimento automático no cadastro de Eleitores/Pessoas.
- **Cache:** Devemos guardar em cache (Redis ou Banco) consultas de CEP feitas repetidas vezes no mesmo dia para economizar network calls.
