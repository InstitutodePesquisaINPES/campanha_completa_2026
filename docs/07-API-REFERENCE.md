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

### `POST /tse/upload` (Obsoleto/Interno)
Rotas agora são geridas via background worker.
- **POST `/tse/jobs/run`**: Dispara o background worker (`import-master.js`).

### `GET /tse/kpis`
Retorna totais consolidados para a dashboard principal.

### `GET /tse/candidato/historico`
Retorna o histórico de campanhas de um candidato pelo seu CPF ou Nome Completo.
- **Query Params:** `cpf`, `nomeCompleto`

### `POST /tse/candidatos`
Realiza buscas avançadas na base consolidada do TSE.
- **Body:** `{ "uf": "BA", "ano": 2024, "cargo": "Prefeito", "busca": "Nome do candidato" }`

### `GET /tse/eleitorado/perfil`
Retorna métricas demográficas agrupadas (gênero, faixa etária, escolaridade, cor_raca, estado_civil) de um estado ou município.
- **Query Params:** `uf`, `ano`, `municipio`

### `GET /tse/eleitorado/secao/perfil`
Idêntico ao Perfil do Eleitorado, mas com granularidade local, agrupando os dados dos eleitores de uma Zona e Seção eleitoral específica.
- **Query Params:** `uf`, `ano`, `cod_municipio_tse`, `zona`, `secao`

### `POST /tse/votos/secao`
Busca votos consolidados por seção eleitoral de um candidato específico.
- **Body:** `{ "uf": "BA", "ano": 2024, "cod_municipio_tse": "12345", "numero_votavel": "13" }`

### `GET /tse/locais-votacao`
Lista todos os locais físicos de votação do município.
- **Query Params:** `uf`, `ano`, `cod_municipio_tse`

### `GET /tse/comparativo`
Compara os top 10 candidatos mais votados num município por cargo.
- **Query Params:** `uf`, `municipio`, `cargo`

### `POST /tse/origem-votos-local`
Cruza votos com locais de votação para retornar o peso geográfico do candidato.
- **Body:** `{ "uf": "BA", "ano": 2024, "cod_municipio_tse": "12345", "numero_votavel": "13" }`

---

## 3. Módulo de Dashboard/Geo

### `GET /dashboard/mapa-calor`
Traz pontos de calor baseados no cruzamento entre TSE e endereços/bairros do CRM.
- **Retorno:** `[ { "lat": -12.3, "lng": -38.4, "peso": 45 }, ... ]`
