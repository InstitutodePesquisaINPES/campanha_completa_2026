import os
import httpx
import zipfile
import tempfile
from pathlib import Path
from src.config import TSE_CDN_BASE

def get_url_for_type(tipo: str, ano: int, uf: str) -> str:
    if tipo == "eleitorado":
        return f"{TSE_CDN_BASE}/perfil_eleitorado/perfil_eleitorado_{ano}.zip"
    elif tipo == "locais":
        return f"{TSE_CDN_BASE}/eleitorado_locais_votacao/eleitorado_local_votacao_{ano}.zip"
    elif tipo == "candidatos":
        return f"{TSE_CDN_BASE}/consulta_cand/consulta_cand_{ano}.zip"
    elif tipo == "resultados":
        return f"{TSE_CDN_BASE}/votacao_secao/votacao_secao_{ano}_{uf}.zip"
    raise ValueError(f"Tipo desconhecido: {tipo}")

def download_and_extract(tipo: str, ano: int, uf: str, dest_dir: str) -> list[str]:
    url = get_url_for_type(tipo, ano, uf)
    zip_path = os.path.join(dest_dir, f"{tipo}_{ano}_{uf}.zip")
    
    print(f"Baixando {url}...")
    with httpx.stream("GET", url, follow_redirects=True) as r:
        r.raise_for_status()
        with open(zip_path, "wb") as f:
            for chunk in r.iter_bytes(chunk_size=8192):
                f.write(chunk)
                
    extracted_files = []
    print(f"Extraindo {zip_path}...")
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        for file_info in zip_ref.infolist():
            if file_info.filename.lower().endswith('.csv'):
                # Filtro basico por UF se necessario, o Polars fará o filtro refinado
                zip_ref.extract(file_info, dest_dir)
                extracted_files.append(os.path.join(dest_dir, file_info.filename))
                
    # Remove o ZIP para economizar espaço
    os.remove(zip_path)
    return extracted_files
