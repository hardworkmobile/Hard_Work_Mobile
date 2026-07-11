import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { squareClient, squareLocationId } from "@/lib/square";
import { sendEmail, brandedEmail } from "@/lib/email";
import { requireStaff } from "@/lib/require-staff";
import type { Currency } from "square";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  if (!requireStaff(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      workOrder: { include: { lineItems: true, vehicle: true } },
    },
  });

  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (invoice.status === "VOID") return NextResponse.json({ error: "Invoice is voided" }, { status: 422 });
  if (invoice.squareInvoiceId) return NextResponse.json({ error: "Already sent via Square" }, { status: 409 });

  try {
    const vehicle = invoice.workOrder.vehicle;

    // Build line items — one per work order line item, or fall back to invoice total
    // Square requires integer quantities unless a quantity_unit is defined.
    // For fractional quantities (e.g. 1.5 hrs labor), collapse to qty 1 at the line total.
    const lineItems = invoice.workOrder.lineItems.length > 0
      ? invoice.workOrder.lineItems.map((item) =>
          Number.isInteger(item.quantity)
            ? {
                name: item.description,
                quantity: String(item.quantity),
                basePriceMoney: {
                  amount: BigInt(Math.round(item.unitPrice * 100)),
                  currency: "USD" as Currency,
                },
              }
            : {
                name: `${item.description} (${item.quantity} × $${item.unitPrice.toFixed(2)})`,
                quantity: "1",
                basePriceMoney: {
                  amount: BigInt(Math.round(item.quantity * item.unitPrice * 100)),
                  currency: "USD" as Currency,
                },
              }
        )
      : [
          {
            name: `Invoice ${invoice.number} — ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
            quantity: "1",
            basePriceMoney: {
              amount: BigInt(Math.round(invoice.total * 100)),
              currency: "USD" as Currency,
            },
          },
        ];

    const response = await squareClient.checkout.paymentLinks.create({
      idempotencyKey: `paylink-${id}`,
      order: {
        locationId: squareLocationId,
        lineItems,
        taxes: invoice.taxRate > 0 && invoice.workOrder.lineItems.length > 0
          ? [
              {
                uid: "sales-tax",
                name: `Sales Tax (${(invoice.taxRate * 100).toFixed(0)}%)`,
                percentage: String(invoice.taxRate * 100),
                scope: "ORDER",
                type: "ADDITIVE",
              },
            ]
          : undefined,
      },
      checkoutOptions: {
        allowTipping: false,
      },
      prePopulatedData: invoice.customer.email
        ? { buyerEmail: invoice.customer.email }
        : undefined,
    });

    const paymentLink = response.paymentLink!;
    const paymentUrl = paymentLink.url!;

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        squareInvoiceId: paymentLink.id,
        squareInvoiceUrl: paymentUrl,
        squareOrderId: paymentLink.orderId ?? null,
        status: "SENT",
        sentAt: new Date(),
      },
    });

    // Email the payment link to the customer (fire-and-forget)
    if (invoice.customer.email) {
      const dueStr = invoice.dueDate
        ? new Date(invoice.dueDate).toLocaleDateString("en-US", {
            month: "long", day: "numeric", year: "numeric",
          })
        : null;
      void sendEmail({
        to: invoice.customer.email,
        subject: `Invoice ${invoice.number} from Hard Work Mobile — $${invoice.total.toFixed(2)}`,
        html: brandedEmail(
          `Hi ${invoice.customer.firstName},`,
          `<p style="color:#475569;">Your invoice from Hard Work Mobile is ready. You can pay securely online with the button below.</p>
           <table style="width:100%;border-collapse:collapse;margin:16px 0;">
             <tr><td style="padding:8px 0;color:#94a3b8;width:120px;">Invoice</td><td style="padding:8px 0;color:#1e2833;font-weight:600;">${invoice.number}</td></tr>
             <tr><td style="padding:8px 0;color:#94a3b8;">Vehicle</td><td style="padding:8px 0;color:#1e2833;font-weight:600;">${vehicle.year} ${vehicle.make} ${vehicle.model}</td></tr>
             <tr><td style="padding:8px 0;color:#94a3b8;">Total</td><td style="padding:8px 0;color:#1e2833;font-weight:600;">$${invoice.total.toFixed(2)}</td></tr>
             ${dueStr ? `<tr><td style="padding:8px 0;color:#94a3b8;">Due</td><td style="padding:8px 0;color:#1e2833;font-weight:600;">${dueStr}</td></tr>` : ""}
           </table>
           <a href="${paymentUrl}" style="display:inline-block;background:#d4af37;color:#1e2833;font-weight:700;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:16px;">Pay Invoice Online</a>
           <p style="color:#475569;margin-top:24px;">Questions about this invoice? Give us a call at <a href="tel:4845933875" style="color:#1e2833;font-weight:600;">(484) 593-3875</a>.</p>`
        ),
      });
    }

    return NextResponse.json({ invoice: updated, paymentUrl });
  } catch (err: unknown) {
    // Surface the full Square error body for debugging
    if (err && typeof err === "object" && "body" in err) {
      return NextResponse.json({ error: "Square API error", detail: (err as { body: unknown }).body }, { status: 502 });
    }
    const msg = err instanceof Error ? err.message : "Square API error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
