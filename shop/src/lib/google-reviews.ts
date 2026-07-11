// Google Places API (New) — reviews for the public testimonials page.
// Docs: https://developers.google.com/maps/documentation/places/web-service/place-details

// Resolved once via /api/google-reviews/resolve (staff-only) and hardcoded here —
// Place IDs are stable, public identifiers, not secrets.
export const HARD_WORK_MOBILE_PLACE_ID = process.env.GOOGLE_PLACE_ID ?? "";

export type GoogleReview = {
  authorName: string;
  authorPhotoUrl: string | null;
  rating: number;
  text: string;
  relativeTime: string;
  publishTime: string;
};

export type GooglePlaceReviews = {
  rating: number;
  userRatingCount: number;
  googleMapsUri: string;
  reviews: GoogleReview[];
};

type PlaceDetailsResponse = {
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: {
    rating?: number;
    text?: { text?: string };
    relativePublishTimeDescription?: string;
    publishTime?: string;
    authorAttribution?: { displayName?: string; photoUri?: string };
  }[];
};

// Best-effort: returns null on any failure so the page renders fine without it.
export async function getGooglePlaceReviews(): Promise<GooglePlaceReviews | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey || !HARD_WORK_MOBILE_PLACE_ID) {
    console.warn("[google-reviews] GOOGLE_PLACES_API_KEY or GOOGLE_PLACE_ID not set — skipping");
    return null;
  }

  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${HARD_WORK_MOBILE_PLACE_ID}`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "rating,userRatingCount,googleMapsUri,reviews",
        },
        // Reviews don't change minute-to-minute — cache a day to keep this cheap.
        next: { revalidate: 86400 },
      }
    );
    if (!res.ok) {
      console.error("[google-reviews] Place Details failed:", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as PlaceDetailsResponse;

    return {
      rating: data.rating ?? 0,
      userRatingCount: data.userRatingCount ?? 0,
      googleMapsUri: data.googleMapsUri ?? "https://www.google.com/maps?cid=15453899563222996524",
      reviews: (data.reviews ?? []).map((r) => ({
        authorName: r.authorAttribution?.displayName ?? "Google User",
        authorPhotoUrl: r.authorAttribution?.photoUri ?? null,
        rating: r.rating ?? 5,
        text: r.text?.text ?? "",
        relativeTime: r.relativePublishTimeDescription ?? "",
        publishTime: r.publishTime ?? "",
      })),
    };
  } catch (err) {
    console.error("[google-reviews] fetch failed:", err);
    return null;
  }
}

// Text Search (New) — used once by /api/google-reviews/resolve to find the Place ID.
// Returns raw status + body (not just parsed places) so failures are diagnosable
// instead of silently looking like "no results".
export async function searchPlaceCandidates(query: string, useLocationBias = true) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY not set");

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount",
    },
    body: JSON.stringify({
      textQuery: query,
      ...(useLocationBias
        ? { locationBias: { circle: { center: { latitude: 40.0841195, longitude: -75.575869 }, radius: 15000 } } }
        : {}),
    }),
  });
  const bodyText = await res.text();
  let bodyJson: unknown;
  try {
    bodyJson = JSON.parse(bodyText);
  } catch {
    bodyJson = bodyText;
  }
  return { status: res.status, ok: res.ok, body: bodyJson };
}
