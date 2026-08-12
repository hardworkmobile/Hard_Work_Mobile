import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/require-staff";
import { sendSms, MAX_MMS_MEDIA } from "@/lib/sms";
import { sendEmail, brandedEmail } from "@/lib/email";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  photoUrls: z.array(z.string().url()).min(1, "Pick at least one photo").max(MAX_MMS_MEDIA),
  message: z.string().trim().max(1000).optional(),
});

// Text (MMS) and email the customer photos of their vehicle. Unlike the
// fire-and-forget notifications elsewhere, these are awaited: this is a
// deliberate action and the sender needs an accurate result, not an optimistic
// one.
export async function POST(req: NextRequest, { params }: Params) {
  if (!requireStaff(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 422 }
    );
  }
  const { photoUrls, message } = parsed.data;

  const wo = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      vehicle: true,
      photos: { select: { id: true, url: true } },
      inspection: { include: { items: { include: { photos: { select: { url: true } } } } } },
    },
  });
  if (!wo) return NextResponse.json({ error: "Work order not found" }, { status: 404 });

  // Only allow photos that actually belong to this work order — otherwise this
  // endpoint would be an open relay for sending arbitrary media on our account.
  const allowed = new Set<string>([
    ...wo.photos.map((p) => p.url),
    ...(wo.inspection?.items.flatMap((i) => i.photos.map((p) => p.url)) ?? []),
  ]);
  const invalid = photoUrls.filter((u) => !allowed.has(u));
  if (invalid.length > 0) {
    return NextResponse.json(
      { error: "Those photos don't belong to this work order." },
      { status: 422 }
    );
  }

  const vehicleLabel = `${wo.vehicle.year} ${wo.vehicle.make} ${wo.vehicle.model}`;
  const note = message?.trim();
  const smsBody =
    `Hard Work Mobile — photos from your ${vehicleLabel}` +
    (note ? `\n\n${note}` : "") +
    `\n\nQuestions? (484) 593-3875`;

  // MMS requires the same A2P consent as SMS.
  let smsResult: { ok: boolean; error?: string } | null = null;
  if (wo.customer.smsOptIn && wo.customer.phone) {
    smsResult = await sendSms({ to: wo.customer.phone, message: smsBody, mediaUrls: photoUrls });
  }

  // Email always goes out when we have an address — it also carries the photos
  // at full resolution, which MMS compresses.
  let emailSent = false;
  if (wo.customer.email) {
    const imgs = photoUrls
      .map((u) => `<img src="${u}" alt="" style="width:100%;max-width:520px;border-radius:8px;margin:0 0 12px;" />`)
      .join("");
    await sendEmail({
      to: wo.customer.email,
      subject: `Photos from your ${vehicleLabel} — Hard Work Mobile`,
      html: brandedEmail(
        `Hi ${wo.customer.firstName},`,
        `<p style="color:#475569;">Here are photos from your ${vehicleLabel} (Work Order ${wo.number}).</p>
         ${note ? `<p style="color:#475569;white-space:pre-wrap;">${note}</p>` : ""}
         ${imgs}
         <p style="color:#475569;">Questions about what you're seeing? Give us a call:</p>
         <a href="tel:4845933875" style="display:inline-block;background:#d4af37;color:#1e2833;font-weight:700;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:16px;">(484) 593-3875</a>`
      ),
    });
    emailSent = true;
  }

  // Record which of the work order's own photos went out.
  const sentIds = wo.photos.filter((p) => photoUrls.includes(p.url)).map((p) => p.id);
  if (sentIds.length > 0) {
    await prisma.workOrderPhoto.updateMany({
      where: { id: { in: sentIds } },
      data: { sentAt: new Date() },
    });
  }

  const smsSent = smsResult?.ok ?? false;
  if (!smsSent && !emailSent) {
    return NextResponse.json(
      {
        error:
          smsResult?.error ??
          "This customer has no email on file and hasn't opted into text messages, so there's no way to reach them.",
      },
      { status: 422 }
    );
  }

  return NextResponse.json({
    smsSent,
    emailSent,
    photoCount: photoUrls.length,
    smsSkippedReason: !wo.customer.smsOptIn
      ? "Customer hasn't opted into text messages"
      : !wo.customer.phone
        ? "No phone number on file"
        : smsResult?.error,
  });
}
