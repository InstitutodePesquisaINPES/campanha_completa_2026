// IBGE Localidades API
export interface IBGEEstado {
  id: number;
  sigla: string;
  nome: string;
}

export interface IBGEMunicipio {
  id: number;
  nome: string;
  microrregiao?: { mesorregiao?: { UF?: { sigla: string; nome: string } } };
}

const BASE = "https://servicodados.ibge.gov.br/api/v1/localidades";

export async function fetchEstados(): Promise<IBGEEstado[]> {
  const res = await fetch(`${BASE}/estados?orderBy=nome`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchMunicipiosByUF(uf: string): Promise<IBGEMunicipio[]> {
  const res = await fetch(`${BASE}/estados/${uf}/municipios`);
  if (!res.ok) return [];
  return res.json();
}
