# Deploy, Ambientes e Variáveis

A infraestrutura do Kiribamba é orquestrada pelo **Coolify** utilizando containers Docker.

## 1. Ambientes
- **Local (Desenvolvimento):** Rodamos a API e Web via `npm run dev` com um PostgreSQL rodando num contêiner local (porta 5432).
- **Produção:** Gerenciado pelo Coolify. Faz pull automático da branch `main` do GitHub.

## 2. Configurações de Docker
- O backend usa um `Dockerfile` customizado que roda `npm run build` e expõe as portas da API.
- Devido às falhas recentes do TypeScript abortando o `build`, o código deve ser compilado e testado localmente (`npm run build` em `apps/api` e `apps/web`) antes de realizar o git push.

## 3. Variáveis de Ambiente Obrigatórias
O Coolify injeta as seguintes variáveis:

| Variável | Obrigatória | Onde Usa | Descrição |
|----------|-------------|----------|-----------|
| `DATABASE_URL` | Sim | Backend / Prisma | String de conexão para o PostgreSQL. |
| `JWT_SECRET` | Sim | Backend | Chave criptográfica dos tokens de sessão. |
| `JWT_EXPIRATION` | Sim | Backend | Tempo limite (Ex: `7d`). |
| `SERVICE_URL_WEB` | Sim | Front | A URL pública do frontend. |
| `SERVICE_URL_API` | Sim | Front/Back | A URL pública ou interna da API. |
| `OPENAI_API_KEY` | Não | Backend | Usada nos serviços de RAG e Inteligência. |

*(Nota de segurança: Nunca fazer commit de arquivos `.env` ou expor chaves reais nestes documentos Markdown).*

## 4. Banco de Dados (Migrações)
Sempre que o banco for alterado no `schema.prisma`:
1. Gerar migração: `npx prisma migrate dev --name alteracao`
2. Push pro github. O Coolify rodará `prisma migrate deploy` durante o script de inicialização do container (`start:prod`).
