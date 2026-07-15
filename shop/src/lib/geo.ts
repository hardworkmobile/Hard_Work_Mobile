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

// Traffic-aware drive time via Google Routes API — reuses the Places API key
// (Routes API must also be enabled on it in Google Cloud Console). Best
// effort: returns null if the key isn't configured or the request fails, so
// callers can fall back to straight-line distance.
export async function getRoutedEtaMinutes(
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number }
): Promise<number | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "routes.duration",
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
        destination: { location: { latLng: { latitude: dest.lat, longitude: dest.lng } } },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
      }),
    });
    if (!res.ok) {
      console.error("[geo] Routes API failed:", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as { routes?: { duration?: string }[] };
    const duration = data.routes?.[0]?.duration; // e.g. "823s"
    if (!duration) return null;
    const seconds = parseInt(duration.replace(/s$/, ""), 10);
    return Number.isFinite(seconds) ? Math.round(seconds / 60) : null;
  } catch (err) {
    console.error("[geo] Routes API error:", err);
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
