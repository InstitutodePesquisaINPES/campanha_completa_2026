"""Configuração do worker TSE ETL via variáveis de ambiente."""
import os

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://campanha:campanha@localhost:5432/campanha")
CLICKHOUSE_URL = os.environ.get("CLICKHOUSE_URL", "http://localhost:8123")
CLICKHOUSE_DB = os.environ.get("CLICKHOUSE_DB", "eleicoes")
CLICKHOUSE_USER = os.environ.get("CLICKHOUSE_USER", "campanha")
CLICKHOUSE_PASSWORD = os.environ.get("CLICKHOUSE_PASSWORD", "")
MINIO_ENDPOINT = os.environ.get("MINIO_ENDPOINT", "localhost")
MINIO_PORT = int(os.environ.get("MINIO_PORT", "9000"))
MINIO_ACCESS_KEY = os.environ.get("MINIO_ACCESS_KEY", "")
MINIO_SECRET_KEY = os.environ.get("MINIO_SECRET_KEY", "")
MINIO_USE_SSL = os.environ.get("MINIO_USE_SSL", "false").lower() == "true"
POLL_INTERVAL = int(os.environ.get("TSE_WORKER_POLL_INTERVAL", "10"))
BATCH_SIZE = int(os.environ.get("TSE_WORKER_BATCH_SIZE", "10000"))

# Buckets MinIO
BUCKET_BRONZE = "tse-bronze"
BUCKET_SILVER = "tse-silver"
BUCKET_GOLD = "tse-gold"
