# 🚀 Deploy Enterprise com Coolify & Docker Compose

A plataforma Kiribamba foi projetada para um deploy **Zero-Touch** (One-Click) em ambientes de produção através de um único arquivo `docker-compose.yml`.

Este método orquestra automaticamente:
1. **PostgreSQL 16** (Banco de Dados Isolado).
2. **Redis 7** (Filas de disparo de WhatsApp e Cache do BullMQ).
3. **Backend NestJS** (Roda migrações `npx prisma migrate` e o seeder automaticamente no startup).
4. **Frontend Vite/Nginx** (App compilado PWA para Web/Mobile).

---

## 🛠️ Passo a Passo (Deploy Automático)

### 1. Preparação no Coolify
1. Acesse o seu painel do Coolify.
2. Crie um novo **Project** e um novo **Environment** (ex: `Production`).
3. Clique em **Add New Resource** -> **Docker Compose**.

### 2. Conectando o Repositório
O Coolify pedirá o código fonte. Você tem duas opções:
- **Github App:** Selecione o repositório `campanha_eleitoral`. O Coolify vai ler o arquivo `docker-compose.yml` na raiz automaticamente.
- **Raw Compose:** Se preferir, cole o conteúdo do `docker-compose.yml` diretamente na caixa de texto.

### 3. Variáveis de Ambiente Secretas
Vá até a aba **Environment Variables** no Coolify e adicione as senhas reais. (As do compose são placeholders e o Coolify substitui as variáveis).
- `POSTGRES_USER` = (ex: `kiribamba_admin`)
- `POSTGRES_PASSWORD` = (Sua senha forte)
- `POSTGRES_DB` = `kiribamba`
- `JWT_SECRET` = (Gere um hash sha256 aleatório)

### 4. Deploy 🚀
Clique no botão roxo **Deploy**.
Neste exato momento, o servidor fará:
1. Download das imagens Alpine (Postgres/Redis).
2. `npm ci` e compilação em múltiplos estágios do Frontend e Backend.
3. O Backend (container `kiribamba_api`) iniciará usando o script `start.sh`.

---

## 🌱 O Seeding Automático (Primeiro Acesso)

O script `start.sh` garante que a aplicação só abra as portas (HTTP 3001) **após** o banco de dados estar 100% íntegro.

Durante o startup, você verá no log de Deploy do Coolify:
```bash
🔄 Rodando migrações do banco de dados (Prisma)...
🌱 Rodando seeder para garantir usuários base...
```

O sistema automaticamente injetará na tabela de produção:
- **O Tenant Master:** Comitê Central Kiribamba.
- **Login do Agência/Dono (Super Admin):** `admin@kiribamba.com` / Senha: `Sistema@1@2@3`
- **Login da Operação (Coordenação):** `coordenacao@kiribamba.com` / Senha: `Sistema@1@2@3`

> ⚠️ **IMPORTANTE:** Ao acessar a aplicação web pela primeira vez, faça o login e imediatamente altere estas senhas no menu `Configurações` -> `Perfil`.

---

## 🔄 Backup & Manutenção
Como estamos rodando tudo no `docker-compose.yml`, os dados vitais estão salvos em `Docker Volumes` mapeados no Host:
- `kiribamba_pgdata`: Tudo do PostgreSQL.
- `kiribamba_redisdata`: Sessões e filas.
- `kiribamba_uploads`: Contratos em PDF e comprovantes físicos.

Para fazer backup seguro pela VPS, basta realizar o `tar` do diretório do docker `/var/lib/docker/volumes/` referente a esta aplicação.
