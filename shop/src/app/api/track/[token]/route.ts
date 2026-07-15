import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { haversineMiles } from "@/lib/geo";

type Params = { params: Promise<{ token: string }> };

// Public tracking feed for the customer's /track/[token] page. Keyed by an
// unguessable token; exposes only what the tracking view needs.
export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params;
  if (!token || token.length < 16) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const wo = await prisma.workOrder.findUnique({
    where: { trackingToken: token },
    select: {
      status: true,
      enRouteAt: true,
      serviceLocation: true,
      destLat: true,
      destLng: true,
      lastLat: true,
      lastLng: true,
      lastLocationAt: true,
    },
  });
  if (!wo || !wo.enRouteAt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const phase =
    wo.status === "IN_PROGRESS"
      ? "arrived"
      : ["SCHEDULED", "PENDING"].includes(wo.status)
        ? "en_route"
        : "ended";

  const mechanic =
    wo.lastLat != null && wo.lastLng != null
      ? { lat: wo.lastLat, lng: wo.lastLng, updatedAt: wo.lastLocationAt }
      : null;
  const dest = wo.destLat != null && wo.destLng != null ? { lat: wo.destLat, lng: wo.destLng } : null;

  return NextResponse.json({
    phase,
    enRouteAt: wo.enRouteAt,
    address: wo.serviceLocation,
    mechanic,
    dest,
    distanceMiles:
      mechanic && dest ? Math.round(haversineMiles(mechanic, dest) * 10) / 10 : null,
  });
}
