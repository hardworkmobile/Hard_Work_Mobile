import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-square-hmacsha256-signature") ?? "";
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY ?? "";
  const webhookUrl = process.env.SQUARE_WEBHOOK_URL ?? "";

  // Verify Square's HMAC-SHA256 signature
  if (!signatureKey || !webhookUrl) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const expected = createHmac("sha256", signatureKey)
    .update(webhookUrl + rawBody)
    .digest("base64");

  const valid =
    expected.length === signature.length &&
    timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(signature, "utf8"));

  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  // Square fires payment.updated; status COMPLETED means money cleared
  if (event.type !== "payment.updated") {
    return NextResponse.json({ ok: true });
  }

  const payment = event.data?.object?.payment;
  if (!payment || payment.status !== "COMPLETED") {
    return NextResponse.json({ ok: true });
  }

  // payment_link_id links back to the payment link we created
  const paymentLinkId: string | undefined = payment.payment_link_id;
  if (!paymentLinkId) return NextResponse.json({ ok: true });

  const invoice = await prisma.invoice.findFirst({
    where: { squareInvoiceId: paymentLinkId },
  });

  if (!invoice || invoice.status === "VOID" || invoice.status === "PAID") {
    return NextResponse.json({ ok: true });
  }

  const amount = (payment.amount_money?.amount ?? 0) / 100;

  await prisma.$transaction(async (tx) => {
    // Idempotent: ignore duplicate webhook deliveries
    const existing = await tx.payment.findUnique({
      where: { squarePaymentId: payment.id },
    });
    if (existing) return;

    await tx.payment.create({
      data: {
        invoiceId: invoice.id,
        amount,
        method: "SQUARE",
        squarePaymentId: payment.id,
        status: "COMPLETED",
        note: "Paid via Square payment link",
        processedAt: new Date(payment.updated_at ?? payment.created_at),
      },
    });

    const allPayments = await tx.payment.findMany({ where: { invoiceId: invoice.id } });
    const totalPaid = allPayments.reduce((s, p) => s + p.amount, 0);

    if (totalPaid >= invoice.total - 0.01) {
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: "PAID", paidAt: new Date() },
      });
      await tx.workOrder.update({
        where: { id: invoice.workOrderId },
        data: { status: "PAID" },
      });
    } else {
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: "PARTIAL" },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
