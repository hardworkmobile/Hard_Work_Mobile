// Geocoding + distance helpers for en-route tracking.

// Best-effort address → coordinates via OpenStreetMap's Nominatim (free, no
// key; requires an identifying User-Agent). Called once when the mechanic
// taps "I'm En Route" — returns null on any failure, the tracking page just
// omits the destination marker.
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const params = new URLSearchParams({ format: "json", q: address, limit: "1", countrycodes: "us" });
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { "User-Agent": "HardWorkMobile/1.0 (jamesferzanden@hardworkmobile.com)" },
    });
    if (!res.ok) {
      console.error("[geo] nominatim failed:", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as { lat?: string; lon?: string }[];
    const hit = data[0];
    if (!hit?.lat || !hit?.lon) return null;
    return { lat: parseFloat(hit.lat), lng: parseFloat(hit.lon) };
  } catch (err) {
    console.error("[geo] geocode error:", err);
    return null;
  }
}

export function haversineMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 3958.8; // Earth radius, miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
