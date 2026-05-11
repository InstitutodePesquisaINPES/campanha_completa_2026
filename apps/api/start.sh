#!/bin/sh
set -e

echo "========================================="
echo "🚀 Kiribamba API - Inicialização"
echo "========================================="
echo "DATABASE_URL configurada: $(echo $DATABASE_URL | sed 's/:.*@/:***@/')"

echo ""
echo "🔄 Gerando Prisma Client a partir do schema mais recente..."
npx prisma generate 2>&1 || echo "⚠️ prisma generate encontrou problemas, mas continuando..."

echo ""
echo "🔄 Rodando migrações do banco de dados (Prisma)..."
npx prisma migrate deploy 2>&1 || echo "⚠️ migrate deploy encontrou problemas, mas continuando..."

echo "🔄 Forçando db push para garantir que tabelas não-migradas existam..."
npx prisma db push --accept-data-loss 2>&1 || echo "⚠️ Push falhou. O banco pode não estar pronto."

echo ""
echo "🌱 Rodando seeder para garantir usuários base..."
npx prisma db seed 2>&1 || echo "⚠️ Seeder falhou ou já foi executado. Continuando..."

echo ""
echo "📂 Garantindo diretórios de upload..."
mkdir -p /app/uploads/tse
mkdir -p /app/uploads/anexos
echo "   uploads/tse ✓  uploads/anexos ✓"

echo ""
echo "🚀 Iniciando a API NestJS na porta 3001..."
exec node dist/main.js
