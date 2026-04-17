// API ViaCEP - busca de endereços por CEP
export interface ViaCepAddress {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  erro?: boolean;
}

export async function fetchCep(cep: string): Promise<ViaCepAddress | null> {
  const cleaned = cep.replace(/\D/g, "");
  if (cleaned.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
    if (!res.ok) return null;
    const data = (await res.json()) as ViaCepAddress;
    if (data.erro) return null;
    return data;
  } catch {
    return null;
  }
}
