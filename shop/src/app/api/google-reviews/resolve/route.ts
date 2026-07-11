import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireStaff } from "@/lib/require-staff";
import { searchPlaceCandidates } from "@/lib/google-reviews";

// One-time lookup to find the Google Places ID for GOOGLE_PLACE_ID.
// Not needed once that env var is set — kept around in case the listing
// ever needs to be re-resolved (renamed, merged, etc.).
export async function GET() {
  const session = await auth();
  if (!requireStaff(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await searchPlaceCandidates("Hard Work Mobile Auto Tech Co.");
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Search failed" }, { status: 502 });
  }
}
