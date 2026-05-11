-- AlterEnum
ALTER TYPE "AppRole" ADD VALUE 'candidato';
ALTER TYPE "AppRole" ADD VALUE 'coord_geral';
ALTER TYPE "AppRole" ADD VALUE 'coord_financeiro';
ALTER TYPE "AppRole" ADD VALUE 'coord_juridico';
ALTER TYPE "AppRole" ADD VALUE 'coord_comunicacao';
ALTER TYPE "AppRole" ADD VALUE 'coord_mobilizacao';
ALTER TYPE "AppRole" ADD VALUE 'lideranca_regional';
ALTER TYPE "AppRole" ADD VALUE 'lideranca_local';
ALTER TYPE "AppRole" ADD VALUE 'cabo_eleitoral';
ALTER TYPE "AppRole" ADD VALUE 'operador_crm';
ALTER TYPE "AppRole" ADD VALUE 'analista_dados';

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_tenant_id_key_key" ON "system_settings"("tenant_id", "key");
