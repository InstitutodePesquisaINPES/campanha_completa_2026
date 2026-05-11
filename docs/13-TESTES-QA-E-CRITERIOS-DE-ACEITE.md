# Testes, QA e Critérios de Aceite

O Kiribamba é voltado para campanhas de alto nível, logo, a quebra de um dashboard geográfico ou vazamento de eleitor entre tenants é inaceitável.

## 1. Critério de Aceite: Isolamento (Multi-Tenant)
- Nenhuma query `findMany`, `findFirst`, `update`, `delete` ou `count` pode ser enviada ao Prisma sem que `{ tenantId }` ou `tenantId: string` esteja presente na cláusula `where`.
- Se um dev criar um endpoint que lista "Todas as Lideranças" e esquecer o `tenantId`, estará expondo a base de dados de um candidato adversário para outro. **Isso é o critério de reprovação número 1**.

## 2. Critério de Aceite: Importação TSE
- Dado um CSV de 1.5GB do TSE, o sistema deve iniciar o background worker em menos de 5 segundos.
- O Frontend deve continuar navegável (Non-blocking).
- O uso de RAM do container Node não deve ultrapassar 500MB (Garantido pelo uso de Streams e `BATCH_SIZE = 10000`).

## 3. Critério de Aceite: Frontend
- Toda tabela deve ter paginação server-side. Carregar 5.000.000 de eleitores no client-side causará `Out Of Memory` no browser. (Usar `take` e `skip` no NestJS).
- Formulários complexos não devem piscar ou re-renderizar a tela toda ao digitar uma letra (Uso estrito de React Hook Form não controlado).
