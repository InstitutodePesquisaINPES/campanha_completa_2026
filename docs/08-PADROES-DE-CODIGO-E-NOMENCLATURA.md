# Padrões de Código e Nomenclatura

Para garantir que a base cresça limpa e múltiplas IAs não criem estilos misturados (como PascalCase misturado com snake_case na mesma API), o Kiribamba adota os seguintes padrões.

## 1. Banco de Dados (Prisma & Postgres)
- **Tabelas e Modelos (Schema Prisma):** `PascalCase` e singular (ex: `Pessoa`, `Demanda`, `TseCsvArquivo`).
- **Campos do Prisma:** `camelCase` (ex: `fullName`, `tenantId`, `createdAt`).
- **Mapeamento SQL:** Todo campo ou tabela deve ser mapeado para `snake_case` com `@map` e `@@map`. 
  - Exemplo: `fullName String @map("full_name")`
  - Exemplo: `@@map("tse_csv_arquivos")`
- **Tipos de Id:** UUID (String `@id @default(uuid()) @db.Uuid`).

## 2. Backend (NestJS)
- **Controllers e Services:** Usam decorators padrão (`@Controller('pessoas')`).
- **Retornos HTTP:** Em caso de erro, usar exceções nativas do NestJS (ex: `throw new BadRequestException('Mensagem');`).
- **DTOs:** Ficam na pasta `dto/` dentro de cada módulo. Nomes: `CreatePessoaDto`, `UpdatePessoaDto`. Validadores da `class-validator` são OBRIGATÓRIOS.

## 3. Frontend (React / Next.js)
- **Componentes:** `PascalCase` (ex: `DashboardMap.tsx`, `PessoasTable.tsx`).
- **Páginas (App Router ou Pages Router):** Pastas em minúsculo ou kebab-case.
- **Estilos:** Uso estrito do TailwindCSS. Proibido usar CSS Modules ou in-line styles desnecessários.
- **UI Components:** Reutilizar ao máximo a pasta `components/ui/` baseada no Shadcn (Botões, Inputs, Dialogs).

## 4. Tipagem Typescript
- **Uso do `any`:** PROIBIDO. Se não souber a tipagem, criar uma interface genérica ou usar `unknown`.

## 5. Nomenclatura Variáveis (Front e Back)
- Booleanos devem preferencialmente usar prefixo `is` ou `has` (`isLideranca`, `hasEndereco`).
- Funções que buscam dados devem iniciar com `get` ou `fetch` (`getDemandas`).
- Tratamento de eventos devem usar `handle` (`handleUpload`, `handleSubmit`).
