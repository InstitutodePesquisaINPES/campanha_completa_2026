# Importacao TSE em background

O modulo TSE importa CSVs oficiais do TSE pelo backend Nest/Prisma. O fluxo atual nao usa dados mockados e nao depende de Edge Function: o navegador envia o arquivo em partes, a API grava um manifesto e o worker `apps/api/import-master.js` le os chunks em streaming continuo.

## Fluxo operacional

1. Acesse a tela administrativa de importacao TSE.
2. Baixe o CSV oficial em `dadosabertos.tse.jus.br`, extraia o arquivo e selecione no upload.
3. Para arquivos acima de 50 MB, use obrigatoriamente **Arquivar e processar em background**.
4. Opcionalmente filtre por municipio antes de enviar.
5. A fila acompanha status, progresso, reprocessamento, pausa/retomada, exclusao e download do CSV original.

## Como funciona por dentro

- `src/components/admin/TSECsvUpload.tsx` envia o CSV em chunks de 40 MB.
- `apps/api/src/modules/tse/tse.service.ts` valida os caminhos em `/uploads`, organiza os chunks por upload e cria um arquivo `.manifest.json`.
- `apps/api/import-master.js` abre o manifesto e concatena os chunks em stream, sem duplicar o CSV inteiro no disco.
- O worker aplica os filtros reais de UF e municipio, normaliza cabecalhos oficiais do TSE e grava no banco via Prisma.
- Os lotes usam tamanho conservador e fallback de divisao automatica para evitar estouro de parametros em tabelas largas.

## Tipos suportados

| Tipo da tela | Tabela Prisma | Arquivo TSE comum |
| --- | --- | --- |
| `eleitorado_perfil` | `tseEleitoradoPerfil` | `eleitorado_eleicao.csv` |
| `eleitorado` | `tseEleitoradoSecao` | `perfil_eleitorado_*.csv` |
| `locais` | `tseLocalVotacao` | `eleitorado_local_votacao_*.csv` |
| `candidatos` | `tseCandidato` | `consulta_cand_*.csv` |
| `resultados` | `tseResultadoSecao` | `votacao_secao_*.csv` |

## Comandos de verificacao

```bash
cd apps/api
npm run build
npm test -- --runInBand
node --check import-master.js
```

```bash
cd ../..
npm run build
npm run test
```

## Variaveis uteis

| Variavel | Padrao | Uso |
| --- | --- | --- |
| `API_PORT` | `3001` | Porta da API Nest |
| `TSE_IMPORT_BATCH_SIZE` | `2000` | Tamanho inicial dos lotes do worker |

## Troubleshooting

- **Arquivo grande trava o navegador**: use o modo background. O modo inline fica bloqueado acima de 50 MB.
- **Worker finaliza com zero registros**: confira se o tipo selecionado combina com o CSV oficial e se os filtros de UF/municipio nao excluem todas as linhas.
- **Download baixa JSON**: use o botao da fila; ele chama o endpoint autenticado de download e recompõe os chunks em stream.
- **Reprocessar**: a fila zera o progresso e chama o worker novamente. A ingestao usa chaves unicas/`skipDuplicates`, evitando duplicacao fisica.
