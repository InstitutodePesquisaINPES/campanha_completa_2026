FROM python:3.12-slim

WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# Instalar uv para gestão rápida de dependências
RUN pip install --no-cache-dir uv

# Copiar dependências e instalar
COPY pyproject.toml .
RUN uv pip install --system --no-cache .

# Copiar código
COPY src/ src/

# Entry point
CMD ["python", "-m", "src.main"]
