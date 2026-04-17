// BrasilAPI - CNPJ, feriados, bancos
export interface CnpjData {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  email?: string;
  ddd_telefone_1?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
}

export interface Feriado {
  date: string;
  name: string;
  type: string;
}

export async function fetchCnpj(cnpj: string): Promise<CnpjData | null> {
  const cleaned = cnpj.replace(/\D/g, "");
  if (cleaned.length !== 14) return null;
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleaned}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchFeriados(year: number): Promise<Feriado[]> {
  try {
    const res = await fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}
