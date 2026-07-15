import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { WorkOrderStatus } from "@/generated/prisma";
import { requireStaff } from "@/lib/require-staff";
import { createCalendarEvent, deleteCalendarEvent, slotWindow } from "@/lib/google-calendar";
import { sendEmail, brandedEmail } from "@/lib/email";
import { buildIcs } from "@/lib/ics";

const SLOT_LABELS: Record<string, string> = {
  MORNING: "Morning (8 AM – 12 PM)",
  AFTERNOON: "Afternoon (12 PM – 5 PM)",
  EVENING: "Evening (5 PM – 7 PM)",
};

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
    const dateParts = { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
    googleEventId = await createCalendarEvent({
      date: dateParts,
      slot: existing.scheduledTimeSlot,
      summary: `${existing.customer.firstName} ${existing.customer.lastName} — ${existing.description}`,
      description: `Vehicle: ${existing.vehicle.year} ${existing.vehicle.make} ${existing.vehicle.model}\nWork Order: ${existing.number}\nPhone: ${existing.customer.phone}`,
      location: existing.serviceLocation ?? undefined,
      attendeeEmail: existing.customer.email ?? undefined,
    });

    // Email the customer their appointment with a .ics attachment — Google
    // blocks the service account from inviting them directly (non-Workspace).
    if (existing.customer.email) {
      const { startUtc, endUtc } = slotWindow(dateParts, existing.scheduledTimeSlot);
      const dateStr = startUtc.toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "America/New_York",
      });
      const ics = buildIcs({
        uid: `${existing.id}@hardworkmobile.com`,
        start: startUtc,
        end: endUtc,
        summary: `Hard Work Mobile — ${existing.description}`,
        description: `Vehicle: ${existing.vehicle.year} ${existing.vehicle.make} ${existing.vehicle.model}\nWork Order: ${existing.number}\nQuestions? (484) 593-3875`,
        location: existing.serviceLocation ?? undefined,
      });
      void sendEmail({
        to: existing.customer.email,
        subject: "Your Service Appointment is Scheduled — Hard Work Mobile",
        html: brandedEmail(
          `You're on the schedule, ${existing.customer.firstName}!`,
          `<p style="color:#475569;">Your appointment is confirmed. The attached calendar file adds it to your calendar with a reminder.</p>
           <table style="width:100%;border-collapse:collapse;margin:16px 0;">
             <tr><td style="padding:8px 0;color:#94a3b8;width:120px;">Service</td><td style="padding:8px 0;color:#1e2833;font-weight:600;">${existing.description}</td></tr>
             <tr><td style="padding:8px 0;color:#94a3b8;">Vehicle</td><td style="padding:8px 0;color:#1e2833;font-weight:600;">${existing.vehicle.year} ${existing.vehicle.make} ${existing.vehicle.model}</td></tr>
             <tr><td style="padding:8px 0;color:#94a3b8;">Date</td><td style="padding:8px 0;color:#1e2833;font-weight:600;">${dateStr}</td></tr>
             <tr><td style="padding:8px 0;color:#94a3b8;">Time</td><td style="padding:8px 0;color:#1e2833;font-weight:600;">${SLOT_LABELS[existing.scheduledTimeSlot]}</td></tr>
             ${existing.serviceLocation ? `<tr><td style="padding:8px 0;color:#94a3b8;">Location</td><td style="padding:8px 0;color:#1e2833;font-weight:600;">${existing.serviceLocation}</td></tr>` : ""}
           </table>
           <p style="color:#475569;">We'll call or text 30 minutes before arrival. Questions or need to reschedule?</p>
           <a href="tel:4845933875" style="display:inline-block;background:#d4af37;color:#1e2833;font-weight:700;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:16px;">(484) 593-3875</a>`
        ),
        attachments: [{ filename: "appointment.ics", content: Buffer.from(ics).toString("base64") }],
      });
    }
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
