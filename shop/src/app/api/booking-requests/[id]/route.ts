import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/require-staff";
import type { PreferredTimeSlot } from "@/generated/prisma";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().min(1).optional(),
  vehicleYear: z.coerce.number().int().optional(),
  vehicleMake: z.string().trim().min(1).optional(),
  vehicleModel: z.string().trim().min(1).optional(),
  service: z.string().trim().min(1).optional(),
  serviceOther: z.string().trim().optional().nullable(),
  issueDetails: z.string().trim().optional().nullable(),
  preferredDate: z.coerce.date().optional(),
  preferredTimeSlot: z.enum(["MORNING", "AFTERNOON", "EVENING"]).optional(),
  serviceAddress: z.string().trim().min(1).optional(),
});

// Staff can correct a booking's details (time, address, vehicle, etc.) while
// it's still pending — once approved/declined it becomes the record of what
// was actually decided, so editing stops there.
export async function PATCH(req: NextRequest, { params }: Params) {
  if (!requireStaff(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.bookingRequest.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Booking request not found" }, { status: 404 });
  if (existing.status !== "NEW") {
    return NextResponse.json(
      { error: `Can't edit a booking that's already ${existing.status.toLowerCase()}.` },
      { status: 409 }
    );
  }

  const parsed = updateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 422 });
  }
  const d = parsed.data;

  const updated = await prisma.bookingRequest.update({
    where: { id },
    data: {
      ...d,
      preferredTimeSlot: d.preferredTimeSlot as PreferredTimeSlot | undefined,
      serviceOther: d.serviceOther === null ? null : d.serviceOther,
      issueDetails: d.issueDetails === null ? null : d.issueDetails,
    },
  });

  return NextResponse.json(updated);
}

// Declined bookings can be cleared out manually; anything still active stays
// protected so a stray click can't erase a live lead.
export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!requireStaff(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.bookingRequest.findUnique({ where: { id }, select: { status: true } });
  if (!existing) return NextResponse.json({ error: "Booking request not found" }, { status: 404 });
  if (existing.status !== "DECLINED") {
    return NextResponse.json(
      { error: "Only declined bookings can be deleted." },
      { status: 409 }
    );
  }

  await prisma.bookingRequest.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
