# Fluxos do Sistema

## Fluxo 1: Ingestão de Dados TSE (CSV Massivo)

1. Usuário acessa o painel admin no módulo "Dados TSE".
2. Clica em "Arquivar e processar em background".
3. Faz o upload de um arquivo `.csv` extraído dos Dados Abertos do TSE.
4. O *Frontend* fatia o arquivo localmente (`file.slice`) em **chunks de 40MB** para evitar estouro de memória e bypassar restrições de proxy reverso (ex: limites de tamanho de payload no NGINX do Coolify).
5. O *Frontend* envia cada chunk de forma independente via `multipart/form-data` e o NestJS os armazena no disco (`/uploads/tse`).
6. Quando todas as partes sobem, o frontend dispara a meta-chamada para agrupar as partes e cria um registro em `tse_csv_arquivos` com status = `aguardando`.
7. O Controller (ou um CRON job) aciona o enfileiramento chamando `TseService.runWorker(tenantId)`.
8. O Service processa a fila instanciando via `spawn` o processo Node (`import-master.js`) de maneira desanexada (`detached: true`).
9. O script `import-master.js` junta as partes, lê as linhas em Stream, mapeia as colunas de acordo com o `TseCsvTipo`, processa e tenta fazer o UPSERT no PostgreSQL via Prisma.
10. A cada *batch* de registros importados (ex: 10.000), o worker atualiza `progress_pct` e a contagem de lidos/importados na tabela.
11. O Frontend fica fazendo Polling contínuo (usando `react-query` via `/tse/arquivos`) e move a barra de progresso.
12. Ao finalizar, o Worker marca como `concluido` (ou `erro`) e a UI notifica o sucesso, tornando os dados disponíveis nos dashboards sem recarregar a página.

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
