# ============================================
# KIRIBAMBA API - Backend Build (Multi-Stage)
# ============================================

# --- Estágio 1: Build ---
FROM node:20-alpine AS build
WORKDIR /app

RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json tsconfig.build.json nest-cli.json ./
RUN npx prisma generate

COPY . .
RUN npm run build

# Verificar que o build gerou o arquivo principal
RUN ls -la dist/main.js || (echo "ERRO: dist/main.js não foi gerado!" && exit 1)

# --- Estágio 2: Produção ---
FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./
COPY --from=build /app/tsconfig.json ./
COPY --from=build /app/package.json ./
COPY start.sh ./
RUN chmod +x start.sh

EXPOSE 3001
CMD ["./start.sh"]
