import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { WorkOrderStatus } from "@/generated/prisma";
import { requireStaff } from "@/lib/require-staff";
import { createCalendarEvent, deleteCalendarEvent } from "@/lib/google-calendar";

const schema = z.object({
  status: z.nativeEnum(WorkOrderStatus),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  if (!requireStaff(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const result = schema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 422 });
  }

  const { status } = result.data;

  // Set timestamps automatically on status transitions
  const timestamps: Record<string, Date | null> = {};
  if (status === "IN_PROGRESS") timestamps.startedAt = new Date();
  if (status === "COMPLETED") timestamps.completedAt = new Date();

  const existing = await prisma.workOrder.findUnique({
    where: { id },
    include: { customer: true, vehicle: true },
  });
  if (!existing) return NextResponse.json({ error: "Work order not found" }, { status: 404 });

  let googleEventId = existing.googleEventId;

  // Create a calendar event covering the full slot window when scheduled.
  if (status === "SCHEDULED" && !googleEventId && existing.scheduledAt && existing.scheduledTimeSlot) {
    const d = existing.scheduledAt;
    googleEventId = await createCalendarEvent({
      date: { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() },
      slot: existing.scheduledTimeSlot,
      summary: `${existing.customer.firstName} ${existing.customer.lastName} — ${existing.description}`,
      description: `Vehicle: ${existing.vehicle.year} ${existing.vehicle.make} ${existing.vehicle.model}\nWork Order: ${existing.number}\nPhone: ${existing.customer.phone}`,
      location: existing.serviceLocation ?? undefined,
      attendeeEmail: existing.customer.email ?? undefined,
    });
  }

  // Clean up the calendar event when a scheduled job is cancelled.
  if (status === "CANCELLED" && googleEventId) {
    await deleteCalendarEvent(googleEventId);
    googleEventId = null;
  }

  const workOrder = await prisma.workOrder.update({
    where: { id },
    data: { status, googleEventId, ...timestamps },
  });

  return NextResponse.json(workOrder);
}
