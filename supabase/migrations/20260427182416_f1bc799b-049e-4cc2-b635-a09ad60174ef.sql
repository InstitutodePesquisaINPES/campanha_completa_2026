UPDATE public.tse_csv_arquivos
SET status='aguardando', byte_cursor=0, linhas_processadas=0, progress_pct=0,
    error_msg=NULL, header_line=NULL, attempts=0, started_at=NULL, finished_at=NULL,
    ultima_atividade_em=now()
WHERE id='aacb1204-79cd-44c4-a657-68a1f2c62b20';