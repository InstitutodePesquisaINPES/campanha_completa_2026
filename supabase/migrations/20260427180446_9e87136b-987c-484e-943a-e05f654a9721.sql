UPDATE public.tse_csv_arquivos
SET tipo = 'resultados',
    tabela_destino = 'tse_resultados_secao',
    status = 'aguardando',
    byte_cursor = 0,
    linhas_processadas = 0,
    progress_pct = 0,
    error_msg = NULL
WHERE id = 'aacb1204-79cd-44c4-a657-68a1f2c62b20';