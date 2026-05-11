# Frontend UI/UX e Componentes

## 1. Identidade Visual (TailwindCSS)
O design deve invocar uma sensação de dashboard governamental/político moderno e confiável.
- **Cores Primárias:** Azul Marinho ou Verde (definidas nos tokens do `tailwind.config`).
- **Modo Escuro:** O suporte a `dark mode` é mandatório. Classes como `dark:bg-slate-900` devem ser usadas.
- **Tipografia:** Fonte Sans moderna (Inter ou Roboto).

## 2. Padrão de Telas e Dashboards
A arquitetura visual baseia-se em:
- **Sidebar (Navegação):** Recolhível em telas pequenas.
- **Header:** Com breadcrumbs, campo de Busca Global e Foto do Usuário logado.
- **Área de Conteúdo principal:** Geralmente envelopada num componente `ScrollArea`.

## 3. Biblioteca de Componentes Base (Shadcn/UI)
Não reinvente a roda. Use a pasta `components/ui`:
- **Card:** Para agrupar estatísticas (`<Card><CardHeader><CardTitle/></CardHeader></Card>`).
- **Button:** Sempre usar os variants (`default`, `destructive`, `outline`, `ghost`). Evite inline styling no className do botão.
- **Table / DataTable:** Usar a biblioteca `@tanstack/react-table` se a lista for complexa. Caso contrário, use as primitivas `<Table>`.
- **Formulários:** Usar `react-hook-form` acoplado ao `zod` para validação no client-side. Renderizar com `<Form>`, `<FormField>`, `<FormItem>`.

## 4. Estado de Carregamento (Loading) e Erros
- Toda mutação assíncrona deve trocar o botão para um "Spinner" (Usar `Loader2` do `lucide-react` com `animate-spin`).
- Feedbacks de sucesso/falha devem usar o componente `sonner` (`toast.success` ou `toast.error`).
- Para páginas pesadas (ex: Dashboards de Mapas), use Skeletons UI.

## 5. Mapas (Módulo Geográfico)
- Usar Leaflet/React-Leaflet ou Mapbox.
- Marcadores agrupados (Clustering) quando houver muitos dados para não travar a UI.
