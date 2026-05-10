import psycopg
from psycopg.rows import dict_row
from src.config import DATABASE_URL

def get_connection():
    return psycopg.connect(DATABASE_URL, row_factory=dict_row)

def update_job_status(job_id: str, status: str, progress: float = None, error_msg: str = None, total: int = None, processed: int = None):
    with get_connection() as conn:
        with conn.cursor() as cur:
            updates = ["status = %s"]
            params = [status]
            
            if progress is not None:
                updates.append("progress_pct = %s")
                params.append(progress)
            if error_msg is not None:
                updates.append("error_msg = %s")
                params.append(error_msg)
            if total is not None:
                updates.append("total_registros = %s")
                params.append(total)
            if processed is not None:
                updates.append("registros_processados = %s")
                params.append(processed)
            if status == "completed" or status == "error":
                updates.append("finished_at = NOW()")
                
            query = f"UPDATE tse_import_jobs SET {', '.join(updates)} WHERE id = %s"
            params.append(job_id)
            cur.execute(query, params)
            conn.commit()

def log_job(job_id: str, level: str, message: str):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO tse_import_logs (job_id, level, message) VALUES (%s, %s, %s)",
                (job_id, level, message)
            )
            conn.commit()
