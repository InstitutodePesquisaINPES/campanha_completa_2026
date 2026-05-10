import polars as pl
from typing import List, Dict, Any
from psycopg.extras import execute_values
from src.db import get_connection, log_job, update_job_status
from src.config import CHUNK_SIZE
import json

def process_file(file_path: str, tipo: str, uf: str, ano: int, job_id: str):
    log_job(job_id, "info", f"Iniciando processamento do arquivo {file_path}")
    
    # Mapeamento de colunas baseado no layout do TSE
    try:
        # Polars lazy frame para economizar memoria
        lf = pl.scan_csv(
            file_path,
            separator=";",
            encoding="latin1",
            infer_schema_length=10000,
            ignore_errors=True
        )
        
        # Filtro de UF se não for arquivo nacional e a coluna existir
        columns = lf.collect_schema().names()
        uf_col = next((c for c in ["SG_UF", "UF", "SG_UE"] if c in columns), None)
        
        if uf != "BR" and uf_col:
            lf = lf.filter(pl.col(uf_col) == uf)

        # Conta total (coletando dados pre-filtrados)
        df = lf.collect()
        total_rows = df.height
        log_job(job_id, "info", f"Total de linhas a processar: {total_rows}")
        update_job_status(job_id, "processing", total=total_rows, processed=0)
        
        processed = 0
        for i in range(0, total_rows, CHUNK_SIZE):
            chunk = df.slice(i, CHUNK_SIZE)
            records = map_chunk(chunk.to_dicts(), tipo, ano, uf)
            
            if records:
                insert_records(tipo, records)
                
            processed += len(records)
            update_job_status(job_id, "processing", progress=(processed / total_rows) * 100, processed=processed)
            
        log_job(job_id, "info", f"Arquivo {file_path} concluído. Inseridos {processed} registros.")
        return processed
        
    except Exception as e:
        log_job(job_id, "error", f"Falha ao processar {file_path}: {str(e)}")
        raise e

def map_chunk(rows: List[Dict[str, Any]], tipo: str, ano: int, default_uf: str) -> List[tuple]:
    records = []
    for row in rows:
        uf_row = row.get("SG_UF") or row.get("UF") or row.get("SG_UE") or default_uf
        if default_uf != "BR" and uf_row != default_uf:
            continue
            
        if tipo == "eleitorado":
            records.append((
                ano,
                uf_row,
                row.get("CD_MUNICIPIO") or row.get("CD_MUNIC_TSE"),
                int(row.get("NR_ZONA", 0)) if row.get("NR_ZONA") else None,
                int(row.get("NR_SECAO", 0)) if row.get("NR_SECAO") else None,
                int(row.get("QT_ELEITORES_PERFIL") or row.get("QT_ELEITORES") or 0),
                json.dumps({row.get("DS_GENERO"): 1}) if row.get("DS_GENERO") else None,
                json.dumps({row.get("DS_FAIXA_ETARIA"): 1}) if row.get("DS_FAIXA_ETARIA") else None,
                json.dumps({row.get("DS_GRAU_ESCOLARIDADE"): 1}) if row.get("DS_GRAU_ESCOLARIDADE") else None,
                json.dumps({row.get("DS_ESTADO_CIVIL"): 1}) if row.get("DS_ESTADO_CIVIL") else None
            ))
        elif tipo == "locais":
            records.append((
                ano,
                uf_row,
                row.get("CD_MUNICIPIO"),
                str(row.get("NR_LOCAL_VOTACAO") or row.get("CD_LOCAL_VOTACAO") or ""),
                row.get("NM_LOCAL_VOTACAO"),
                row.get("DS_ENDERECO"),
                row.get("NM_BAIRRO"),
                row.get("NR_CEP"),
                int(row.get("NR_ZONA", 0)) if row.get("NR_ZONA") else None,
                float(row.get("NR_LATITUDE")) if row.get("NR_LATITUDE") else None,
                float(row.get("NR_LONGITUDE")) if row.get("NR_LONGITUDE") else None
            ))
        elif tipo == "candidatos":
            records.append((
                ano,
                uf_row,
                int(row.get("NR_TURNO", 1)),
                row.get("DS_CARGO") or row.get("CD_CARGO") or "",
                str(row.get("NR_CANDIDATO", "")),
                row.get("NM_URNA_CANDIDATO"),
                row.get("NM_CANDIDATO"),
                row.get("NR_CPF_CANDIDATO"),
                row.get("SG_PARTIDO"),
                row.get("NR_PARTIDO"),
                row.get("NM_COLIGACAO"),
                row.get("DS_GENERO"),
                row.get("DS_OCUPACAO"),
                row.get("DS_SITUACAO_CANDIDATURA"),
                row.get("DS_SIT_TOT_TURNO"),
                "ELEITO" in str(row.get("DS_SIT_TOT_TURNO", "")).upper(),
                row.get("SG_UE")
            ))
        elif tipo == "resultados":
            records.append((
                ano,
                uf_row,
                int(row.get("NR_TURNO", 1)),
                row.get("DS_CARGO") or "",
                row.get("CD_MUNICIPIO"),
                int(row.get("NR_ZONA", 0)) if row.get("NR_ZONA") else None,
                int(row.get("NR_SECAO", 0)) if row.get("NR_SECAO") else None,
                str(row.get("NR_VOTAVEL", "")),
                row.get("SG_PARTIDO"),
                int(row.get("QT_VOTOS", 0))
            ))
            
    return records

def insert_records(tipo: str, records: List[tuple]):
    queries = {
        "eleitorado": """
            INSERT INTO tse_eleitorado (ano, uf, cod_municipio_tse, zona, secao, total_eleitores, genero, faixa_etaria, escolaridade, estado_civil)
            VALUES %s
        """,
        "locais": """
            INSERT INTO tse_locais_votacao (ano, uf, cod_municipio_tse, codigo_local, nome_local, endereco, bairro, cep, zona, latitude, longitude)
            VALUES %s
        """,
        "candidatos": """
            INSERT INTO tse_candidatos (ano, uf, turno, cargo, numero_urna, nome_urna, nome_completo, cpf, partido_sigla, partido_numero, coligacao, genero, ocupacao, situacao_candidatura, situacao_eleicao, eleito, cod_municipio_tse)
            VALUES %s
        """,
        "resultados": """
            INSERT INTO tse_resultados_secao (ano, uf, turno, cargo, cod_municipio_tse, zona, secao, numero_votavel, partido_sigla, votos)
            VALUES %s
        """
    }
    
    with get_connection() as conn:
        with conn.cursor() as cur:
            execute_values(cur, queries[tipo], records)
            conn.commit()
