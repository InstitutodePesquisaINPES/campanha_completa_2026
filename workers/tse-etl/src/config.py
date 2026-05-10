import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/campanha_db")
TSE_CDN_BASE = "https://cdn.tse.jus.br/estatistica/sead/odsele"

CHUNK_SIZE = int(os.environ.get("CHUNK_SIZE", 50000))
