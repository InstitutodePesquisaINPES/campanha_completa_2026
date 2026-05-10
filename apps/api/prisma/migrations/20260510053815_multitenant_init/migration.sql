-- CreateEnum
CREATE TYPE "AppRole" AS ENUM ('admin', 'coordenador', 'lideranca', 'operador', 'visualizador');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL DEFAULT '',
    "phone" TEXT,
    "cpf" TEXT,
    "avatar_url" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tenant_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "AppRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenant_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenant_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "table_name" TEXT NOT NULL,
    "record_id" TEXT,
    "old_data" JSONB,
    "new_data" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenant_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL DEFAULT '{}',
    "description" TEXT,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tenant_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estados" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "sigla" CHAR(2) NOT NULL,
    "geocodigo_ibge" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "municipios" (
    "id" UUID NOT NULL,
    "estado_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "geocodigo_ibge" TEXT,
    "populacao" INTEGER,
    "eleitorado_total" INTEGER,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "municipios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distritos" (
    "id" UUID NOT NULL,
    "municipio_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "geocodigo_ibge" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distritos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bairros" (
    "id" UUID NOT NULL,
    "municipio_id" UUID NOT NULL,
    "distrito_id" UUID,
    "nome" TEXT NOT NULL,
    "classificacao" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bairros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comunidades" (
    "id" UUID NOT NULL,
    "bairro_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "microarea" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comunidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zonas_eleitorais" (
    "id" UUID NOT NULL,
    "municipio_id" UUID NOT NULL,
    "numero_zona" INTEGER NOT NULL,
    "tribunal_regional" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zonas_eleitorais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secoes_eleitorais" (
    "id" UUID NOT NULL,
    "zona_id" UUID NOT NULL,
    "numero_secao" INTEGER NOT NULL,
    "local_votacao" TEXT,
    "endereco" TEXT,
    "eleitores_aptos" INTEGER,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "secoes_eleitorais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pessoas" (
    "id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "tipo_pessoa" TEXT DEFAULT 'pf',
    "cpf" TEXT,
    "cnpj" TEXT,
    "razao_social" TEXT,
    "nome_fantasia" TEXT,
    "data_nascimento" TEXT,
    "genero" TEXT,
    "escolaridade" TEXT,
    "nivel_relacionamento" TEXT NOT NULL DEFAULT 'desconhecido',
    "observacoes" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "is_lideranca" BOOLEAN NOT NULL DEFAULT false,
    "lideranca_id" UUID,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tenant_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',

    CONSTRAINT "pessoas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pessoas_contatos" (
    "id" UUID NOT NULL,
    "pessoa_id" UUID NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenant_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',

    CONSTRAINT "pessoas_contatos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pessoas_enderecos" (
    "id" UUID NOT NULL,
    "pessoa_id" UUID NOT NULL,
    "tipo" TEXT,
    "logradouro" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "cep" TEXT,
    "bairro_id" UUID,
    "municipio_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenant_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',

    CONSTRAINT "pessoas_enderecos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pessoas_papeis" (
    "id" UUID NOT NULL,
    "pessoa_id" UUID NOT NULL,
    "papel" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenant_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',

    CONSTRAINT "pessoas_papeis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "cor" TEXT,
    "categoria" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenant_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pessoas_tags" (
    "pessoa_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenant_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',

    CONSTRAINT "pessoas_tags_pkey" PRIMARY KEY ("pessoa_id","tag_id")
);

-- CreateTable
CREATE TABLE "demandas" (
    "id" UUID NOT NULL,
    "pessoa_id" UUID,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'aberta',
    "categoria" TEXT,
    "prioridade" TEXT NOT NULL DEFAULT 'media',
    "origem" TEXT,
    "protocolo" TEXT,
    "satisfacao_cidadao" DOUBLE PRECISION,
    "resolucao_descricao" TEXT,
    "municipio_id" UUID,
    "bairro_id" UUID,
    "eixo_id" UUID,
    "created_by" UUID,
    "atribuido_a" UUID,
    "data_abertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_prazo" TIMESTAMP(3),
    "data_resolucao" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tenant_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',

    CONSTRAINT "demandas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demandas_encaminhamentos" (
    "id" UUID NOT NULL,
    "demanda_id" UUID NOT NULL,
    "de_usuario_id" UUID,
    "para_usuario_id" UUID,
    "observacao" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenant_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',

    CONSTRAINT "demandas_encaminhamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demandas_anexos" (
    "id" UUID NOT NULL,
    "demanda_id" UUID NOT NULL,
    "arquivo_url" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenant_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',

    CONSTRAINT "demandas_anexos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agenda" (
    "id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" TEXT NOT NULL,
    "data_inicio" TIMESTAMP(3) NOT NULL,
    "data_fim" TIMESTAMP(3),
    "dia_inteiro" BOOLEAN NOT NULL DEFAULT false,
    "local" TEXT,
    "municipio_id" UUID,
    "bairro_id" UUID,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'agendado',
    "plano_acao_id" UUID,
    "responsavel_id" UUID,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tenant_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',

    CONSTRAINT "agenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agenda_participantes" (
    "id" UUID NOT NULL,
    "agenda_id" UUID NOT NULL,
    "pessoa_id" UUID NOT NULL,
    "papel" TEXT,
    "confirmado" BOOLEAN NOT NULL DEFAULT false,
    "compareceu" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenant_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',

    CONSTRAINT "agenda_participantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agenda_checkins" (
    "id" UUID NOT NULL,
    "agenda_id" UUID NOT NULL,
    "usuario_id" UUID,
    "tipo" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenant_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',

    CONSTRAINT "agenda_checkins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agenda_followups" (
    "id" UUID NOT NULL,
    "agenda_id" UUID NOT NULL,
    "descricao" TEXT NOT NULL,
    "responsavel_id" UUID,
    "prazo" TIMESTAMP(3),
    "concluido" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenant_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',

    CONSTRAINT "agenda_followups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "centros_custo" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "orcamento_previsto" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tenant_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',

    CONSTRAINT "centros_custo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "despesas" (
    "id" UUID NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "data_despesa" TIMESTAMP(3) NOT NULL,
    "categoria" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "centro_custo_id" UUID,
    "fornecedor_id" UUID,
    "documento_tipo" TEXT,
    "documento_numero" TEXT,
    "comprovante_url" TEXT,
    "responsavel_id" UUID,
    "plano_acao_id" UUID,
    "aprovador_id" UUID,
    "data_pagamento" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tenant_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',

    CONSTRAINT "despesas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receitas" (
    "id" UUID NOT NULL,
    "descricao" TEXT,
    "valor" DOUBLE PRECISION NOT NULL,
    "data_receita" TIMESTAMP(3) NOT NULL,
    "tipo" TEXT NOT NULL,
    "centro_custo_id" UUID,
    "origem_pessoa_id" UUID,
    "comprovante_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tenant_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',

    CONSTRAINT "receitas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tse_import_jobs" (
    "id" UUID NOT NULL,
    "tipo" TEXT NOT NULL,
    "uf" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "total_registros" INTEGER,
    "registros_processados" INTEGER,
    "progress_pct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "error_msg" TEXT,
    "source_url" TEXT,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenant_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',

    CONSTRAINT "tse_import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tse_import_logs" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'info',
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenant_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',

    CONSTRAINT "tse_import_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gamificacao_regras" (
    "id" UUID NOT NULL,
    "acao" TEXT NOT NULL,
    "pontos" INTEGER NOT NULL DEFAULT 0,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tenant_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',

    CONSTRAINT "gamificacao_regras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comunicacao_campanhas" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'whatsapp',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "filtros" JSONB,
    "mensagem" TEXT NOT NULL,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tenant_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',

    CONSTRAINT "comunicacao_campanhas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comunicacao_logs" (
    "id" UUID NOT NULL,
    "pessoa_id" UUID NOT NULL,
    "campanha_id" UUID,
    "tipo" TEXT NOT NULL DEFAULT 'whatsapp',
    "mensagem" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "provider_id" TEXT,
    "error_msg" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tenant_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',

    CONSTRAINT "comunicacao_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campanhas_estrategias" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "meta_votos" INTEGER,
    "orcamento_global" DOUBLE PRECISION,
    "data_eleicao" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'planejamento',
    "abrangencia" TEXT NOT NULL DEFAULT 'municipal',
    "estado_id" UUID,
    "municipio_id" UUID,
    "parent_campanha_id" UUID,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tenant_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',

    CONSTRAINT "campanhas_estrategias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eixos_estrategicos" (
    "id" UUID NOT NULL,
    "campanha_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "cor" TEXT,
    "orcamento_alocado" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tenant_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',

    CONSTRAINT "eixos_estrategicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planos_acao" (
    "id" UUID NOT NULL,
    "eixo_id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "data_inicio" TIMESTAMP(3),
    "data_fim" TIMESTAMP(3),
    "data_conclusao" TIMESTAMP(3),
    "orcamento_previsto" DOUBLE PRECISION,
    "responsavel_id" UUID,
    "depende_de_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tenant_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',

    CONSTRAINT "planos_acao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campanhas_parcerias" (
    "id" UUID NOT NULL,
    "campanha_id" UUID NOT NULL,
    "candidato_parceiro_nome" TEXT NOT NULL,
    "cargo_parceiro" TEXT NOT NULL,
    "municipio_id" UUID,
    "peso_estrategico" INTEGER NOT NULL DEFAULT 3,
    "observacoes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tenant_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',

    CONSTRAINT "campanhas_parcerias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_key" ON "user_roles"("user_id", "role");

-- CreateIndex
CREATE INDEX "audit_logs_table_name_idx" ON "audit_logs"("table_name");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "estados_sigla_key" ON "estados"("sigla");

-- CreateIndex
CREATE UNIQUE INDEX "estados_geocodigo_ibge_key" ON "estados"("geocodigo_ibge");

-- CreateIndex
CREATE UNIQUE INDEX "municipios_geocodigo_ibge_key" ON "municipios"("geocodigo_ibge");

-- CreateIndex
CREATE UNIQUE INDEX "tags_nome_key" ON "tags"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "gamificacao_regras_acao_key" ON "gamificacao_regras"("acao");

-- CreateIndex
CREATE INDEX "comunicacao_logs_pessoa_id_idx" ON "comunicacao_logs"("pessoa_id");

-- CreateIndex
CREATE INDEX "comunicacao_logs_campanha_id_idx" ON "comunicacao_logs"("campanha_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "municipios" ADD CONSTRAINT "municipios_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "estados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distritos" ADD CONSTRAINT "distritos_municipio_id_fkey" FOREIGN KEY ("municipio_id") REFERENCES "municipios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bairros" ADD CONSTRAINT "bairros_municipio_id_fkey" FOREIGN KEY ("municipio_id") REFERENCES "municipios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bairros" ADD CONSTRAINT "bairros_distrito_id_fkey" FOREIGN KEY ("distrito_id") REFERENCES "distritos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunidades" ADD CONSTRAINT "comunidades_bairro_id_fkey" FOREIGN KEY ("bairro_id") REFERENCES "bairros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zonas_eleitorais" ADD CONSTRAINT "zonas_eleitorais_municipio_id_fkey" FOREIGN KEY ("municipio_id") REFERENCES "municipios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secoes_eleitorais" ADD CONSTRAINT "secoes_eleitorais_zona_id_fkey" FOREIGN KEY ("zona_id") REFERENCES "zonas_eleitorais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoas" ADD CONSTRAINT "pessoas_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoas" ADD CONSTRAINT "pessoas_lideranca_id_fkey" FOREIGN KEY ("lideranca_id") REFERENCES "pessoas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoas" ADD CONSTRAINT "pessoas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoas_contatos" ADD CONSTRAINT "pessoas_contatos_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoas_contatos" ADD CONSTRAINT "pessoas_contatos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoas_enderecos" ADD CONSTRAINT "pessoas_enderecos_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoas_enderecos" ADD CONSTRAINT "pessoas_enderecos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoas_papeis" ADD CONSTRAINT "pessoas_papeis_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoas_papeis" ADD CONSTRAINT "pessoas_papeis_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoas_tags" ADD CONSTRAINT "pessoas_tags_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoas_tags" ADD CONSTRAINT "pessoas_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoas_tags" ADD CONSTRAINT "pessoas_tags_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandas" ADD CONSTRAINT "demandas_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandas" ADD CONSTRAINT "demandas_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandas" ADD CONSTRAINT "demandas_atribuido_a_fkey" FOREIGN KEY ("atribuido_a") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandas" ADD CONSTRAINT "demandas_eixo_id_fkey" FOREIGN KEY ("eixo_id") REFERENCES "eixos_estrategicos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandas" ADD CONSTRAINT "demandas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandas_encaminhamentos" ADD CONSTRAINT "demandas_encaminhamentos_demanda_id_fkey" FOREIGN KEY ("demanda_id") REFERENCES "demandas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandas_encaminhamentos" ADD CONSTRAINT "demandas_encaminhamentos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandas_anexos" ADD CONSTRAINT "demandas_anexos_demanda_id_fkey" FOREIGN KEY ("demanda_id") REFERENCES "demandas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandas_anexos" ADD CONSTRAINT "demandas_anexos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda" ADD CONSTRAINT "agenda_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda" ADD CONSTRAINT "agenda_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda" ADD CONSTRAINT "agenda_plano_acao_id_fkey" FOREIGN KEY ("plano_acao_id") REFERENCES "planos_acao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda" ADD CONSTRAINT "agenda_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda_participantes" ADD CONSTRAINT "agenda_participantes_agenda_id_fkey" FOREIGN KEY ("agenda_id") REFERENCES "agenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda_participantes" ADD CONSTRAINT "agenda_participantes_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda_participantes" ADD CONSTRAINT "agenda_participantes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda_checkins" ADD CONSTRAINT "agenda_checkins_agenda_id_fkey" FOREIGN KEY ("agenda_id") REFERENCES "agenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda_checkins" ADD CONSTRAINT "agenda_checkins_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda_followups" ADD CONSTRAINT "agenda_followups_agenda_id_fkey" FOREIGN KEY ("agenda_id") REFERENCES "agenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda_followups" ADD CONSTRAINT "agenda_followups_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "centros_custo" ADD CONSTRAINT "centros_custo_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "despesas" ADD CONSTRAINT "despesas_centro_custo_id_fkey" FOREIGN KEY ("centro_custo_id") REFERENCES "centros_custo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "despesas" ADD CONSTRAINT "despesas_plano_acao_id_fkey" FOREIGN KEY ("plano_acao_id") REFERENCES "planos_acao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "despesas" ADD CONSTRAINT "despesas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receitas" ADD CONSTRAINT "receitas_centro_custo_id_fkey" FOREIGN KEY ("centro_custo_id") REFERENCES "centros_custo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receitas" ADD CONSTRAINT "receitas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tse_import_jobs" ADD CONSTRAINT "tse_import_jobs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tse_import_logs" ADD CONSTRAINT "tse_import_logs_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "tse_import_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tse_import_logs" ADD CONSTRAINT "tse_import_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gamificacao_regras" ADD CONSTRAINT "gamificacao_regras_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunicacao_campanhas" ADD CONSTRAINT "comunicacao_campanhas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunicacao_logs" ADD CONSTRAINT "comunicacao_logs_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunicacao_logs" ADD CONSTRAINT "comunicacao_logs_campanha_id_fkey" FOREIGN KEY ("campanha_id") REFERENCES "comunicacao_campanhas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunicacao_logs" ADD CONSTRAINT "comunicacao_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campanhas_estrategias" ADD CONSTRAINT "campanhas_estrategias_parent_campanha_id_fkey" FOREIGN KEY ("parent_campanha_id") REFERENCES "campanhas_estrategias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campanhas_estrategias" ADD CONSTRAINT "campanhas_estrategias_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eixos_estrategicos" ADD CONSTRAINT "eixos_estrategicos_campanha_id_fkey" FOREIGN KEY ("campanha_id") REFERENCES "campanhas_estrategias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eixos_estrategicos" ADD CONSTRAINT "eixos_estrategicos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planos_acao" ADD CONSTRAINT "planos_acao_eixo_id_fkey" FOREIGN KEY ("eixo_id") REFERENCES "eixos_estrategicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planos_acao" ADD CONSTRAINT "planos_acao_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planos_acao" ADD CONSTRAINT "planos_acao_depende_de_id_fkey" FOREIGN KEY ("depende_de_id") REFERENCES "planos_acao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planos_acao" ADD CONSTRAINT "planos_acao_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campanhas_parcerias" ADD CONSTRAINT "campanhas_parcerias_campanha_id_fkey" FOREIGN KEY ("campanha_id") REFERENCES "campanhas_estrategias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campanhas_parcerias" ADD CONSTRAINT "campanhas_parcerias_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
