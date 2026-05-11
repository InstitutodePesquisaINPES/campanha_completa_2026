# Fluxos do Sistema

## Fluxo 1: Ingestão de Dados TSE (CSV Massivo)

1. Usuário acessa o painel admin no módulo "Dados TSE".
2. Clica em "Arquivar e processar em background".
3. Faz o upload de um arquivo `.csv` extraído dos Dados Abertos do TSE.
4. O *Frontend* envia o arquivo via `multipart/form-data` e passa o "tipo de dado" e "ano".
5. A Controller do NestJS armazena o arquivo no disco (pasta uploads) temporariamente.
6. Cria um registro em `tse_csv_arquivos` com status = `aguardando`.
7. O Controller chama `TseService.runWorker(tenantId)`.
8. O Service faz um `spawn` do processo Node (`import-master.js`) desanexado (`detached: true`).
9. O script `import-master.js` lê as linhas em Stream, mapeia as colunas, processa e tenta fazer o UPSERT no PostgreSQL via Prisma.
10. A cada 10.000 linhas o worker atualiza `progress_pct` na tabela.
11. O Frontend fica fazendo Polling desse `progress_pct` e move a barrinha de carregamento.
12. Ao finalizar, o Worker marca como `concluido` e a UI notifica o sucesso.

## Fluxo 2: Criação e Resolução de Demandas (Ouvidoria)

1. Usuário ou Call Center acessa aba de Ouvidoria.
2. Abre "Nova Demanda".
3. Vincula obrigatoriamente a uma Pessoa (Cidadão) previamente cadastrado. (Caso não exista, cadastra na hora).
4. Preenche título, descrição e Origem.
5. Sistema salva com status `aberta` e cria log de criação.
6. A Demanda é encaminhada para o setor responsável (Gabinete, Rua, etc) e a tabela `DemandaEncaminhamento` registra a transição de De -> Para.
7. O setor responsável resolve o pedido e marca como `resolvida`, preenchendo a `resolucaoDescricao`.

## Fluxo 3: Mapeamento de Lideranças

1. O Coordenador de Campanha entra no CRM.
2. Marca a pessoa "João" com a tag ou toggle de `isLideranca = true`.
3. A partir de agora, João aparece na lista de Lideranças.
4. O Operador vai inserindo pessoas no CRM e setando `liderancaId = João`.
5. O sistema contabiliza automaticamente (na tela de dashboard do João) que João tem 150 apoiadores vinculados a ele, extraindo métricas geográficas baseadas no CEP desses apoiadores.
