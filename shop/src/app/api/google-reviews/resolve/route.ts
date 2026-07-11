import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireStaff } from "@/lib/require-staff";
import { searchPlaceCandidates, searchNearbyDebug, tryPlaceDetailsByFtid } from "@/lib/google-reviews";

// One-time lookup to find the Google Places ID for GOOGLE_PLACE_ID.
// Not needed once that env var is set — kept around in case the listing
// ever needs to be re-resolved (renamed, merged, etc.).
export async function GET() {
  const session = await auth();
  if (!requireStaff(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [withBias, withoutBias, broadQuery, nearbyTight, ftidLookup] = await Promise.all([
      searchPlaceCandidates("Hard Work Mobile Auto Tech Co.", true),
      searchPlaceCandidates("Hard Work Mobile Auto Tech Co.", false),
      searchPlaceCandidates("Hard Work Mobile mechanic West Chester PA", false),
      searchNearbyDebug(3000, 20),
      tryPlaceDetailsByFtid(),
    ]);
    return NextResponse.json({
      keyConfigured: !!process.env.GOOGLE_PLACES_API_KEY,
      withBias,
      withoutBias,
      broadQuery,
      nearbyTight,
      ftidLookup,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Search failed" }, { status: 502 });
  }
}
