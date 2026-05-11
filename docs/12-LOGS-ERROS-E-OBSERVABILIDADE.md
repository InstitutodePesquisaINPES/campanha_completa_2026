# Logs, Erros e Observabilidade

Para gerenciar um sistema com integrações pesadas como TSE e Background Workers, precisamos saber exatamente onde ocorreu a falha.

## 1. Níveis de Log (Backend)
Usamos o `Logger` nativo do NestJS.
- `logger.log()`: Início de importações, finalização de workers, logins com sucesso.
- `logger.warn()`: Falhas de autenticação, rate limits da API externa.
- `logger.error()`: Banco de dados inacessível, erro fatal de child_process.

## 2. Erros de Background Worker (CSV TSE)
- O `import-master.js` nunca deve dar `process.exit(1)` sem antes conectar no prisma e fazer um `update` na tabela `TseCsvArquivo` setando o status para `erro` e preenchendo a coluna `errorMsg`.
- Isso garante que o usuário saiba que a planilha quebrou pelo Frontend.

## 3. Erros de Interface
- Formulários devem barrar erros via `Zod` antes de baterem na API.
- Quando a API retorna 400 ou 500, capturar o erro no `catch` e mostrar um `toast.error(e.response.data.message)`. Nunca exibir "Internal Server Error" pro usuário final.

## 4. Auditoria de Dados Sensíveis
A tabela `AuditLog` mapeada no Prisma deve registrar ações críticas. Exemplo de log para exclusão de paciente:
`{ "entity": "Pessoa", "entityId": "uuid", "action": "DELETE", "userId": "uuid", "details": {"nome": "João", "cpf": "111"} }`
