# Importação Robusta de CSVs Grandes do TSE

## O problema atual

Hoje a importação acontece **100% no navegador** (`TSECsvUpload.tsx`):
- Papa Parse lê o CSV e envia chunks de 500 para a edge `tse-ingest-chunk-public`.
- Se o usuário fechar a aba, perder Wi-Fi, recarregar a página, der timeout de uma chamada, ou o browser ficar sem RAM com arquivo de 500MB+ → **perde tudo e tem que recomeçar do zero**.
- Não há histórico de qual arquivo foi enviado, em que linha parou, nem como retomar.
- Arquivos > 1GB simplesmente travam o navegador.

## A solução: "Arquivar e processar"

Modelo em 3 etapas, totalmente persistido no banco:

```text
[1] UPLOAD               [2] PROCESSAMENTO          [3] CONCLUSÃO
Browser envia CSV    →   Worker em background   →   Dados na tabela TSE
para Storage             lê do Storage em             + arquivo arquivado
(chunked, retomável)     fatias e ingere              (auditoria)
```

O usuário pode **fechar a aba** entre as etapas — tudo continua rodando no servidor.

## Arquitetura

### 1. Bucket privado `tse-csv-uploads` (Storage)
- CSV completo fica salvo lá (pode ter GB).
- Upload do browser usa `supabase.storage.upload()` com `upsert` — Supabase já faz upload em chunks resumível.
- Acesso só admin (RLS).

### 2. Tabela `tse_csv_arquivos` (nova)
Catálogo de cada CSV enviado:
- `id`, `nome_original`, `tipo` (eleitorado_perfil, candidatos…), `ano`, `uf`
- `storage_path`, `tamanho_bytes`, `total_linhas` (preenchido após scan)
- `linhas_processadas`, `linha_cursor` (último offset commitado → retomada)
- `status`: `aguardando`, `escaneando`, `processando`, `pausado`, `concluido`, `erro`
- `municipios_filtro` (text[]), `chunk_size` (default 500)
- `error_msg`, `created_by`, timestamps, `ultima_atividade_em`

### 3. Edge Function `tse-csv-worker` (nova, background)
- Pega 1 arquivo em `aguardando`/`processando` mais antigo.
- Faz **range download** do Storage (ex.: 5MB por vez).
- Parseia CSV com cursor por linha; pula até `linha_cursor`.
- Insere lote de 500 nas tabelas `tse_*` com upsert (lógica que já existe).
- A cada lote: atualiza `linha_cursor`, `linhas_processadas`, `progress_pct`.
- Tem **time budget** (~50s por execução); se não terminar, salva cursor e sai com status `processando` → próxima execução continua exatamente de onde parou.
- Se erro transitório → retry com backoff. Se erro fatal → status `erro` + `error_msg`.

### 4. Cron `pg_cron` a cada 1 minuto
Chama o `tse-csv-worker` automaticamente via `pg_net`. Garante que arquivos enfileirados são processados sem o usuário precisar clicar em nada. Botão "Processar agora" também disponível.

### 5. UI nova: aba "Arquivos CSV" dentro de `TSEImportTab`
Tabela viva (refetch 3s) com:
- Nome do arquivo, tipo detectado, UF/ano, tamanho
- Barra de progresso (% e linhas)
- Status com badge colorida
- Ações: **Pausar**, **Retomar**, **Reprocessar do zero**, **Excluir**, **Baixar original**, **Ver logs**

O componente atual `TSECsvUpload.tsx` continua existindo para uploads pequenos/rápidos, mas ganha uma opção **"Arquivar e processar em background"** (recomendado para arquivos > 50MB) que:
1. Sobe o CSV para Storage.
2. Cria registro em `tse_csv_arquivos`.
3. Dispara o worker uma vez (fast-start) e retorna.

## Vantagens

- **Robustez**: fechar aba, perder rede, reiniciar PC — não afeta nada.
- **Retomada exata**: se cair no meio de 2 milhões de linhas, retoma da linha 1.534.221.
- **Arquivamento**: CSV original guardado para auditoria e re-importação.
- **Sem travar browser**: parser roda na edge function, não no cliente.
- **Filtro por município** já suportado (campo `municipios_filtro`).
- **Idempotente**: usa upsert com `onConflict` (já existe nas tabelas TSE).
- **Auditoria**: logs por arquivo em `tse_import_logs` (linkando `arquivo_id`).

## Detalhes técnicos

### Migração SQL
```sql
-- Bucket privado
INSERT INTO storage.buckets (id, name, public) VALUES ('tse-csv-uploads', 'tse-csv-uploads', false);

-- Policies: só admin
CREATE POLICY "admin upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'tse-csv-uploads' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "admin read"  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'tse-csv-uploads' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'tse-csv-uploads' AND has_role(auth.uid(), 'admin'));

-- Tabela de catálogo
CREATE TABLE tse_csv_arquivos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_original text NOT NULL,
  tipo text NOT NULL,            -- eleitorado_perfil, candidatos, etc.
  ano int NOT NULL,
  uf text NOT NULL,
  storage_path text NOT NULL,
  tamanho_bytes bigint,
  total_linhas int,
  linhas_processadas int DEFAULT 0,
  linha_cursor int DEFAULT 0,    -- byte offset ou linha
  byte_cursor bigint DEFAULT 0,
  status text NOT NULL DEFAULT 'aguardando',
  progress_pct int DEFAULT 0,
  municipios_filtro text[],
  chunk_size int DEFAULT 500,
  error_msg text,
  attempts int DEFAULT 0,
  created_by uuid,
  ultima_atividade_em timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE tse_csv_arquivos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all" ON tse_csv_arquivos FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Cron a cada minuto
SELECT cron.schedule('tse-csv-worker', '* * * * *',
  $$SELECT net.http_post(url:='https://lryjfthdzmrgudamuqiu.supabase.co/functions/v1/tse-csv-worker',
    headers:='{"Authorization":"Bearer <ANON_KEY>","Content-Type":"application/json"}'::jsonb,
    body:='{}'::jsonb) as id;$$);
```

### Estratégia de cursor
- O worker faz `storage.download()` com `Range: bytes=N-M` (5MB).
- Parser `csv-parse` em modo stream conta bytes consumidos.
- A cada commit de lote (500 linhas), salva `byte_cursor` no banco.
- Se interrompido, próxima execução baixa range a partir do `byte_cursor` salvo (com pequeno overlap para resincronizar a quebra de linha).

### Time budget no worker
- 50 segundos de processamento + 5s de margem.
- Se acabar tempo: salva cursor, status `processando`, sai com 200.
- Cron pega na próxima execução (1 min depois).

## Arquivos a criar/editar

**Criar:**
- `supabase/migrations/<ts>_tse_csv_archive.sql` — migração descrita acima
- `supabase/functions/tse-csv-worker/index.ts` — worker com cursor/retomada
- `src/hooks/useTSECsvArquivos.ts` — query/mutations da tabela nova
- `src/components/admin/TSECsvArquivosList.tsx` — UI da fila com pausar/retomar/excluir

**Editar:**
- `src/components/admin/TSECsvUpload.tsx` — adicionar opção "Arquivar e processar em background" (sobe pra Storage + insere em `tse_csv_arquivos` em vez de processar inline)
- `src/components/admin/TSEImportTab.tsx` — incluir `<TSECsvArquivosList />` acima da fila atual de jobs

## Resultado para o usuário

1. Sobe um CSV de 800 MB de candidatos nacionais → barra de upload sobe pra Storage (resumível).
2. Aparece linha verde na lista "Arquivos CSV" com status `aguardando`.
3. Em ~1 min começa `processando` — barra avança em tempo real.
4. Pode fechar a aba, voltar amanhã, está concluído ou ainda rodando exatamente do ponto.
5. Pode pausar pra outro arquivo prioritário, depois retomar.
6. CSV original fica arquivado pra reimportação ou auditoria.
