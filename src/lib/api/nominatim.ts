// Nominatim (OpenStreetMap) - geocoding gratuito
export interface GeocodeResult {
  lat: number;
  lon: number;
  display_name: string;
}

export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { "Accept-Language": "pt-BR" } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.length) return null;
    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
      display_name: data[0].display_name,
    };
  } catch {
    return null;
  }
}
