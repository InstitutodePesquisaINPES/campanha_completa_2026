"""
TSE ETL Worker — Entry Point

Poll tse_import_jobs no PostgreSQL e processa cada job:
1. Download ZIP do CDN TSE
2. Salva bruto no MinIO (bronze)
3. Extrai CSV, normaliza, gera Parquet (silver)
4. Carrega no ClickHouse (gold)
5. Atualiza status no PostgreSQL
"""
import time
import traceback
import psycopg
from src.config import DATABASE_URL, POLL_INTERVAL


def poll_next_job(conn) -> dict | None:
    """Busca o próximo job com status 'queued' e marca como 'running'."""
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE tse_import_jobs
            SET status = 'running', started_at = NOW()
            WHERE id = (
                SELECT id FROM tse_import_jobs
                WHERE status = 'queued'
                ORDER BY created_at ASC
                LIMIT 1
                FOR UPDATE SKIP LOCKED
            )
            RETURNING id, tipo, uf, ano, source_url
        """)
        row = cur.fetchone()
        conn.commit()
        if row:
            return {
                "id": str(row[0]),
                "tipo": row[1],
                "uf": row[2],
                "ano": row[3],
                "source_url": row[4],
            }
    return None


def log_job(conn, job_id: str, level: str, message: str):
    """Registra log do job no PostgreSQL."""
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO tse_import_logs (job_id, level, message) VALUES (%s, %s, %s)",
            (job_id, level, message),
        )
        conn.commit()


def finish_job(conn, job_id: str, status: str, total: int = 0, error_msg: str | None = None):
    """Finaliza o job com status 'done' ou 'failed'."""
    with conn.cursor() as cur:
        cur.execute(
            """UPDATE tse_import_jobs
               SET status = %s, finished_at = NOW(),
                   total_registros = %s, progress_pct = 100,
                   error_msg = %s
               WHERE id = %s""",
            (status, total, error_msg, job_id),
        )
        conn.commit()


def process_job(conn, job: dict):
    """Processa um job TSE completo."""
    job_id = job["id"]
    tipo = job["tipo"]
    uf = job["uf"]
    ano = job["ano"]

    log_job(conn, job_id, "info", f"Iniciando processamento: {tipo} {uf} {ano}")

    # TODO Fase 4: implementar pipeline completo
    # 1. download_tse_zip(tipo, uf, ano) → salvar em MinIO bronze/
    # 2. extract_csv_stream() → parse streaming
    # 3. normalize_schema() → polars DataFrame
    # 4. write_parquet() → MinIO silver/
    # 5. load_clickhouse() → INSERT batch
    # 6. run_quality_checks()

    log_job(conn, job_id, "info", "Pipeline placeholder — aguardando implementação completa")
    finish_job(conn, job_id, "done", total=0)


def main():
    """Loop principal do worker."""
    print("[TSE Worker] Iniciando...")
    print(f"[TSE Worker] Poll interval: {POLL_INTERVAL}s")

    conn = psycopg.connect(DATABASE_URL)

    while True:
        try:
            job = poll_next_job(conn)
            if job:
                print(f"[TSE Worker] Job encontrado: {job['id']} ({job['tipo']} {job['uf']} {job['ano']})")
                process_job(conn, job)
                print(f"[TSE Worker] Job {job['id']} concluído")
            else:
                time.sleep(POLL_INTERVAL)
        except KeyboardInterrupt:
            print("[TSE Worker] Encerrando...")
            break
        except Exception as e:
            print(f"[TSE Worker] Erro: {e}")
            traceback.print_exc()
            time.sleep(POLL_INTERVAL)

    conn.close()


if __name__ == "__main__":
    main()
