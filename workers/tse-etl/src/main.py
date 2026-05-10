import argparse
import tempfile
import uuid
from src.downloader import download_and_extract
from src.processor import process_file
from src.db import get_connection, log_job

def start_job(tipo: str, ano: int, uf: str) -> str:
    job_id = str(uuid.uuid4())
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO tse_import_jobs (id, tipo, uf, ano, status, progress_pct, started_at)
                VALUES (%s, %s, %s, %s, 'running', 0, NOW())
                """,
                (job_id, tipo, uf, ano)
            )
            conn.commit()
    return job_id

def main():
    parser = argparse.ArgumentParser(description="TSE ETL Worker")
    parser.add_argument("--tipo", required=True, choices=["eleitorado", "locais", "candidatos", "resultados"])
    parser.add_argument("--ano", type=int, default=2024)
    parser.add_argument("--uf", default="BA", help="UF ou BR para nacional")
    
    args = parser.parse_args()
    
    job_id = start_job(args.tipo, args.ano, args.uf)
    print(f"Iniciando Job {job_id} para {args.tipo} {args.ano} {args.uf}")
    
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            extracted_files = download_and_extract(args.tipo, args.ano, args.uf, tmpdir)
            total_inserted = 0
            for csv_file in extracted_files:
                inserted = process_file(csv_file, args.tipo, args.uf, args.ano, job_id)
                total_inserted += inserted
                
        from src.db import update_job_status
        update_job_status(job_id, "completed", progress=100.0)
        print(f"Job {job_id} concluído com sucesso. {total_inserted} registros inseridos.")
        
    except Exception as e:
        print(f"Erro fatal no job {job_id}: {e}")
        # o status error ja e atualizado pelo processor.py ou precisaria catch aqui
        from src.db import update_job_status
        update_job_status(job_id, "error", error_msg=str(e))
        
if __name__ == "__main__":
    main()
