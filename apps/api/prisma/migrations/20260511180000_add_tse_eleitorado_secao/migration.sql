-- CreateTable
CREATE TABLE "tse_eleitorado_secao" (
    "id" UUID NOT NULL,
    "ano" INTEGER NOT NULL,
    "uf" VARCHAR(2) NOT NULL,
    "cod_municipio_tse" TEXT NOT NULL,
    "municipio" TEXT,
    "zona" INTEGER NOT NULL,
    "secao" INTEGER NOT NULL,
    "cod_local_votacao" TEXT,
    "nome_local_votacao" TEXT,
    "cor_raca" TEXT,
    "estado_civil" TEXT,
    "faixa_etaria" TEXT,
    "genero" TEXT,
    "grau_instrucao" TEXT,
    "quantidade_eleitores" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenant_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',

    CONSTRAINT "tse_eleitorado_secao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tse_eleitorado_secao_tenant_id_ano_uf_idx" ON "tse_eleitorado_secao"("tenant_id", "ano", "uf");

-- CreateIndex
CREATE UNIQUE INDEX "tse_eleitorado_secao_tenant_id_ano_uf_cod_municipio_tse_zon_key" ON "tse_eleitorado_secao"("tenant_id", "ano", "uf", "cod_municipio_tse", "zona", "secao", "cor_raca", "faixa_etaria", "genero", "grau_instrucao");

-- AddForeignKey
ALTER TABLE "tse_eleitorado_secao" ADD CONSTRAINT "tse_eleitorado_secao_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
