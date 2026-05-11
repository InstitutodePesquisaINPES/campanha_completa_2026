# API Reference (NestJS Backend)

A API REST roda baseada em Node.js com NestJS e retorna sempre JSON.

## Autenticação
Todas as rotas (exceto `/auth/login` e `/auth/register`) exigem o Header:
`Authorization: Bearer <JWT_TOKEN>`

---

## 1. Módulo CRM (Pessoas)

### `GET /pessoas`
Busca todas as pessoas do tenant.
- **Query Params:** `page`, `limit`, `search` (nome/telefone), `liderancaId`, `isLideranca` (boolean).
- **Retorno:** Paginado `{ data: [], meta: { total, page } }`.

### `POST /pessoas`
Cria nova pessoa.
- **Body:** `{ "fullName": "João", "cpf": "111", "nivelRelacionamento": "apoiador", "liderancaId": "uuid" }`
- **Validações:** Não criar duas pessoas com mesmo CPF no mesmo Tenant (retorna 409 Conflict).

### `GET /pessoas/liderancas/hierarchy`
Retorna a árvore de lideranças e o número de pessoas atreladas a cada uma, formatado para uso gráfico e cálculo de "Peso Político".

---

## 2. Módulo de TSE / Uploads Massivos

### `POST /tse/upload`
Inicia o processo assíncrono de leitura de CSV.
- **Body:** `multipart/form-data` (arquivo CSV), campo `tipo` (`eleitorado_perfil`, `candidatos`, etc).
- **Retorno:** `{ "arquivoId": "uuid", "status": "aguardando" }`

### `GET /tse/arquivos/:id/status`
Faz o polling para a interface desenhar a barra de progresso.
- **Retorno:** `{ "progressPct": 45, "status": "processando", "linhasProcessadas": 450000 }`

---

## 3. Módulo de Dashboard/Geo

### `GET /dashboard/mapa-calor`
Traz pontos de calor baseados no cruzamento entre TSE e endereços/bairros do CRM.
- **Retorno:** `[ { "lat": -12.3, "lng": -38.4, "peso": 45 }, ... ]`
