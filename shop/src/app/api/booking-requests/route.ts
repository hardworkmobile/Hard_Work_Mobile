import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { sendEmail, brandedEmail } from "@/lib/email";
import { sendSms } from "@/lib/sms";
import type { BookingRequestStatus, PreferredTimeSlot } from "@/generated/prisma";

const STATUSES = ["NEW", "CONTACTED", "SCHEDULED", "COMPLETED", "CANCELLED", "CONVERTED", "DECLINED"] as const;

// GET — admin list, optionally filtered by status. (staff only)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const statusParam = req.nextUrl.searchParams.get("status")?.toUpperCase();
  const status = STATUSES.includes(statusParam as (typeof STATUSES)[number])
    ? (statusParam as BookingRequestStatus)
    : undefined;

  const requests = await prisma.bookingRequest.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ requests });
}

// POST — public booking-request submission from the marketing site.
const TIME_SLOT_MAP: Record<string, PreferredTimeSlot> = {
  morning: "MORNING",
  afternoon: "AFTERNOON",
  evening: "EVENING",
};

const createSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().min(1),
  vehicleYear: z.coerce.number().int(),
  vehicleMake: z.string().trim().min(1),
  vehicleModel: z.string().trim().min(1),
  service: z.string().trim().min(1),
  serviceOther: z.string().trim().optional(),
  preferredDate: z.coerce.date(),
  preferredTimeSlot: z.string().transform((v) => v.toLowerCase()).pipe(z.enum(["morning", "afternoon", "evening"])),
  serviceAddress: z.string().trim().min(1),
  source: z.string().trim().optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid submission", details: parsed.error.flatten() }, { status: 422 });
  }
  const d = parsed.data;

  // Link to an existing customer by email if one exists.
  const customer = await prisma.customer.findFirst({
    where: { email: d.email.toLowerCase() },
    select: { id: true },
  });

  const created = await prisma.bookingRequest.create({
    data: {
      name: d.name,
      email: d.email.toLowerCase(),
      phone: d.phone,
      vehicleYear: d.vehicleYear,
      vehicleMake: d.vehicleMake,
      vehicleModel: d.vehicleModel,
      service: d.service,
      serviceOther: d.serviceOther,
      preferredDate: d.preferredDate,
      preferredTimeSlot: TIME_SLOT_MAP[d.preferredTimeSlot],
      serviceAddress: d.serviceAddress,
      source: d.source ?? "contact",
      customerId: customer?.id,
    },
    select: { id: true },
  });

  const serviceName = d.service === "Other" ? d.serviceOther ?? "Other" : d.service;
  const dateStr = d.preferredDate.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
  });
  const timeSlotLabel = { morning: "Morning (8 AM – 12 PM)", afternoon: "Afternoon (12 PM – 5 PM)", evening: "Evening (5 PM – 7 PM)" }[d.preferredTimeSlot] ?? d.preferredTimeSlot;
  const firstName = d.name.split(" ")[0] ?? d.name;

  // SMS confirmation to the customer
  void sendSms({
    to: d.phone,
    message: `Hi ${firstName}, Hard Work Mobile received your booking request for ${serviceName} on ${dateStr}. We'll call or text within a few hours to confirm. Questions? (484) 593-3875\n\nReply STOP to opt out`,
  });

  // SMS notification to the shop owner
  void sendSms({
    to: process.env.OWNER_PHONE ?? "",
    message: `New booking: ${d.name} — ${serviceName}, ${d.vehicleYear} ${d.vehicleMake} ${d.vehicleModel}, ${dateStr} ${timeSlotLabel}. Phone: ${d.phone}`,
  });

  // Email confirmation to the customer
  void sendEmail({
    to: d.email,
    subject: "We Got Your Request — Hard Work Mobile",
    html: brandedEmail(
      `Thanks, ${firstName}!`,
      `<p style="color:#475569;">We received your booking request and will review it shortly. Here's a summary:</p>
       <table style="width:100%;border-collapse:collapse;margin:16px 0;">
         <tr><td style="padding:8px 0;color:#94a3b8;width:120px;">Service</td><td style="padding:8px 0;color:#1e2833;font-weight:600;">${serviceName}</td></tr>
         <tr><td style="padding:8px 0;color:#94a3b8;">Vehicle</td><td style="padding:8px 0;color:#1e2833;font-weight:600;">${d.vehicleYear} ${d.vehicleMake} ${d.vehicleModel}</td></tr>
         <tr><td style="padding:8px 0;color:#94a3b8;">Date</td><td style="padding:8px 0;color:#1e2833;font-weight:600;">${dateStr}</td></tr>
         <tr><td style="padding:8px 0;color:#94a3b8;">Time</td><td style="padding:8px 0;color:#1e2833;font-weight:600;">${timeSlotLabel}</td></tr>
         <tr><td style="padding:8px 0;color:#94a3b8;">Location</td><td style="padding:8px 0;color:#1e2833;font-weight:600;">${d.serviceAddress}</td></tr>
       </table>
       <p style="color:#475569;">We'll usually call or text within a few hours to confirm your appointment. If you need to reach us sooner:</p>
       <a href="tel:4845933875" style="display:inline-block;background:#d4af37;color:#1e2833;font-weight:700;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:16px;">(484) 593-3875</a>`
    ),
  });

  // Notification to the shop owner
  const ownerEmail = process.env.RESEND_REPLY_TO ?? "JamesFerzanden@hardworkmobile.com";
  void sendEmail({
    to: ownerEmail,
    subject: `New Booking Request — ${firstName} · ${serviceName}`,
    html: brandedEmail(
      "New Booking Request",
      `<p style="color:#475569;">A new request just came in from the website:</p>
       <table style="width:100%;border-collapse:collapse;margin:16px 0;">
         <tr><td style="padding:8px 0;color:#94a3b8;width:120px;">Name</td><td style="padding:8px 0;color:#1e2833;font-weight:600;">${d.name}</td></tr>
         <tr><td style="padding:8px 0;color:#94a3b8;">Phone</td><td style="padding:8px 0;color:#1e2833;font-weight:600;"><a href="tel:${d.phone}" style="color:#1e2833;">${d.phone}</a></td></tr>
         <tr><td style="padding:8px 0;color:#94a3b8;">Email</td><td style="padding:8px 0;color:#1e2833;font-weight:600;"><a href="mailto:${d.email}" style="color:#1e2833;">${d.email}</a></td></tr>
         <tr><td style="padding:8px 0;color:#94a3b8;">Service</td><td style="padding:8px 0;color:#1e2833;font-weight:600;">${serviceName}</td></tr>
         <tr><td style="padding:8px 0;color:#94a3b8;">Vehicle</td><td style="padding:8px 0;color:#1e2833;font-weight:600;">${d.vehicleYear} ${d.vehicleMake} ${d.vehicleModel}</td></tr>
         <tr><td style="padding:8px 0;color:#94a3b8;">Date</td><td style="padding:8px 0;color:#1e2833;font-weight:600;">${dateStr}</td></tr>
         <tr><td style="padding:8px 0;color:#94a3b8;">Time</td><td style="padding:8px 0;color:#1e2833;font-weight:600;">${timeSlotLabel}</td></tr>
         <tr><td style="padding:8px 0;color:#94a3b8;">Location</td><td style="padding:8px 0;color:#1e2833;font-weight:600;">${d.serviceAddress}</td></tr>
       </table>
       <a href="${process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/booking-requests" style="display:inline-block;background:#d4af37;color:#1e2833;font-weight:700;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:16px;">View in Admin →</a>`
    ),
  });

  return NextResponse.json({ id: created.id }, { status: 201 });
}
