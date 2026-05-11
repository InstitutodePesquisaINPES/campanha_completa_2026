# Banco de Dados e Modelagem (Prisma)

A modelagem de dados é governada exclusivamente pelo arquivo `schema.prisma`. O banco de dados é um PostgreSQL hospedado. O Prisma ORM garante as tipagens.

## Regra de Ouro (Multi-Tenant)
Virtualmente **todas** as tabelas contêm as colunas:
`id` (String UUID), `tenantId` (String UUID), `createdAt` (DateTime), `updatedAt` (DateTime).

---

## Tabela: `Tenant`
### Finalidade
Armazena a raiz do espaço de trabalho (A conta da campanha/do político). 
### Regras
- Se o Tenant for deletado fisicamente, todas as suas linhas nas outras tabelas devem sofrer *Cascade Delete*.

## Tabela: `Pessoa`
### Finalidade
CRM Core. Contatos, eleitores, fornecedores.
### Campos Chave
- `fullName` (text) - Obrigatório.
- `cpf` (text) - Opcional.
- `isLideranca` (Boolean) - Se true, esta pessoa coordena uma base.
- `liderancaId` (UUID) - Auto-relacionamento (FK apontando pra Pessoa Pai).

## Tabela: `Demanda`
### Finalidade
Pedidos da ouvidoria.
### Campos Chave
- `titulo`, `descricao`, `status` (aberta, em_andamento, resolvida).
- `pessoaId` (FK) - Quem solicitou.
- `bairroId`, `municipioId` (FKs) - Onde o problema reside (Georreferenciamento).

## Tabelas do TSE (O Domínio de Dados Massivos)
Essas tabelas contêm milhões de linhas. Elas armazenam o resultado/perfil das urnas e eleitorados oficiais do TSE para cruzar com o CRM.
* **`TseEleitoradoSecao`**: Granularidade máxima do eleitor. Contém Perfil (raça, sexo, idade, instrução) agregado por Seção e Zona da cidade.
  * **Regras Especiais**: Índice composto obrigatório e único (`tenantId`, `ano`, `codMunicipioTse`, `zona`, `secao`, `faixaEtaria`, `genero`, etc.) para permitir o *UPSERT Idempotente* sem duplicar quando o worker rodar duas vezes o mesmo CSV.
* **`TseLocalVotacao`**: Mapeamento físico. (Endereços, Escolas) e Geo (Lat/Lng).

## Tabelas de Campanhas Internas
* **`Campanha`**: Tabela pai (ex: Ação Dia das Mães).
* **`CampanhaTarefa`**: Filhas da campanha. Tarefas que possuem `dataPrevista` e `dataConclusao` (indicando finalização). `prioridade` define urgência.

## Tabelas de Auditoria e Logs
* **`AuditLog`**: Salva quem fez, o que fez e quando. Campos: `entity`, `entityId`, `action`, `userId`. Utilizado muito para rastrear exclusões ou mudança de status de demandas.
