import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/require-staff";
import { geocodeAddress } from "@/lib/geo";
import { sendSms } from "@/lib/sms";
import { sendEmail, brandedEmail, appUrl } from "@/lib/email";

type Params = { params: Promise<{ id: string }> };

// "I'm En Route" — mints a tracking link, geocodes the destination, and
// notifies the customer by SMS (opt-in gated) and email.
export async function POST(_req: NextRequest, { params }: Params) {
  if (!requireStaff(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const wo = await prisma.workOrder.findUnique({
    where: { id },
    include: { customer: true, vehicle: true },
  });
  if (!wo) return NextResponse.json({ error: "Work order not found" }, { status: 404 });
  if (!["SCHEDULED", "PENDING"].includes(wo.status)) {
    return NextResponse.json({ error: `Work order is ${wo.status.toLowerCase()} — en-route tracking is for upcoming jobs` }, { status: 422 });
  }

  const trackingToken = wo.trackingToken ?? randomUUID();

  // Best-effort destination pin for the customer's map.
  let dest: { lat: number; lng: number } | null = null;
  if (wo.serviceLocation && (wo.destLat == null || wo.destLng == null)) {
    dest = await geocodeAddress(wo.serviceLocation);
  }

  const updated = await prisma.workOrder.update({
    where: { id },
    data: {
      trackingToken,
      enRouteAt: new Date(),
      ...(dest ? { destLat: dest.lat, destLng: dest.lng } : {}),
    },
  });

  const trackUrl = `${appUrl()}/track/${trackingToken}`;
  const firstName = wo.customer.firstName;

  if (wo.customer.smsOptIn && wo.customer.phone) {
    void sendSms({
      to: wo.customer.phone,
      message: `Hi ${firstName}, your Hard Work Mobile mechanic is on the way! Track our arrival live: ${trackUrl}\n\nReply STOP to opt out`,
    });
  }

  if (wo.customer.email) {
    void sendEmail({
      to: wo.customer.email,
      subject: "Your Mechanic Is On the Way — Hard Work Mobile",
      html: brandedEmail(
        `We're on the way, ${firstName}!`,
        `<p style="color:#475569;">Your mechanic is en route for your ${wo.vehicle.year} ${wo.vehicle.make} ${wo.vehicle.model} (${wo.description}). Follow our arrival live:</p>
         <a href="${trackUrl}" style="display:inline-block;background:#d4af37;color:#1e2833;font-weight:700;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:16px;">Track Your Mechanic</a>
         <p style="color:#475569;margin-top:24px;">Questions? Call or text <a href="tel:4845933875" style="color:#1e2833;font-weight:600;">(484) 593-3875</a>.</p>`
      ),
    });
  }

  return NextResponse.json({
    trackingToken: updated.trackingToken,
    trackUrl,
    smsSent: !!(wo.customer.smsOptIn && wo.customer.phone),
    emailSent: !!wo.customer.email,
  });
}
