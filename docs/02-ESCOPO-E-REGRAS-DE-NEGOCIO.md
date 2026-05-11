# Escopo e Regras de Negócio

## Módulo: Gestão de Pessoas (CRM Eleitoral)

### Objetivo
Permitir o cadastro total e unificado da base de eleitores, apoiadores e contatos gerais, vinculando-os ou não a "Lideranças".

### Perfis com acesso
- Administrador, Coordenador, Operador.

### Regras
- Uma pessoa pode ser vinculada a apenas UMA Liderança direta (Cabo eleitoral pai).
- O campo `fullName` (Nome Completo) é obrigatório. CPF é opcional (devido a cadastros rápidos na rua), mas deve ser formatado corretamente caso inserido.
- Se dois registros possuírem o mesmo CPF ou mesmo Telefone Principal, o sistema deve sugerir "Mesclagem" (Merge) (A ser implementado).

### Campos obrigatórios
- `fullName`, `nivelRelacionamento`.

## Módulo: Ingestão de Dados TSE

### Objetivo
Pegar dados brutos do Tribunal Superior Eleitoral (CSVs zipados) e jogar para o banco relacional sem travar o sistema ou duplicar dados.

### Regras
- **Anti-Duplicidade:** A inserção ocorre com UPSERT (`skipDuplicates: true` em bulk e constraints compostas no Postgres, como `tenantId + ano + zona + secao`).
- Importar o mesmo arquivo 5 vezes NÃO pode gerar 5 vezes mais registros.
- **Processamento:** Feito via `child_process.spawn` ativando o script `import-master.js` operando em lotes (batch = 10000).
- O frontend envia apenas o arquivo para um diretório temporário, cria o registro `TseCsvArquivo` com status `aguardando` e invoca o service. O Service spawna o worker e retorna. O worker avisa o banco a % do progresso.

## Módulo: Demandas (Ouvidoria)

### Objetivo
Cadastrar as solicitações do cidadão, acompanhar a resolução e saber o nível de insatisfação local.

### Regras
- Toda demanda deve ter "Origem" (WhatsApp, Gabinete, Rua).
- Status: `aberta`, `em_andamento`, `resolvida`, `cancelada`.
- Quando uma demanda muda de status, o `AuditLog` e o Histórico de Encaminhamento (`DemandaEncaminhamento`) devem ser preenchidos obrigatoriamente.
- Demandas podem ter `bairroId` ou `municipioId` para compor o mapa de calor de problemas.

## Módulo: Campanhas e Tarefas (Gestão Interna)

### Objetivo
Organizar a equipe interna do gabinete.

### Regras
- Campanhas são grandes projetos (ex: "Dia das Mães", "Eleição 2026", "Ação no Bairro X").
- Campanhas possuem "Fases" (Kanban).
- Dentro das fases existem Tarefas (`CampanhaTarefa`) que possuem responsáveis.
- Tarefas têm Prioridade (baixa, media, alta, urgente).
- A alteração do status (conclusão) da tarefa registra a data (`dataConclusao`).
