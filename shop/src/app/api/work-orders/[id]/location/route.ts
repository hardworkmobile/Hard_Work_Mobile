import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/require-staff";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

// GPS ping from the mechanic's phone while en route.
export async function POST(req: NextRequest, { params }: Params) {
  if (!requireStaff(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid coordinates" }, { status: 422 });

  const updated = await prisma.workOrder
    .update({
      where: { id },
      data: { lastLat: parsed.data.lat, lastLng: parsed.data.lng, lastLocationAt: new Date() },
      select: { id: true },
    })
    .catch(() => null);
  if (!updated) return NextResponse.json({ error: "Work order not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
