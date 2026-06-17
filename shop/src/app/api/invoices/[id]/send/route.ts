import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { squareClient, squareLocationId } from "@/lib/square";

type Params = { params: Promise<{ id: string }> };

/** Find or create a Square customer; persist squareId on our Customer record */
async function ensureSquareCustomer(customerId: string): Promise<string> {
  const customer = await prisma.customer.findUniqueOrThrow({ where: { id: customerId } });

  if (customer.squareId) return customer.squareId;

  // Search by email first
  if (customer.email) {
    const searched = await squareClient.customers.search({
      query: { filter: { emailAddress: { exact: customer.email } } },
    });
    if (searched.customers?.[0]?.id) {
      await prisma.customer.update({ where: { id: customerId }, data: { squareId: searched.customers[0].id } });
      return searched.customers[0].id;
    }
  }

  // Create new Square customer
  const created = await squareClient.customers.create({
    idempotencyKey: `customer-${customerId}`,
    givenName: customer.firstName,
    familyName: customer.lastName,
    emailAddress: customer.email ?? undefined,
    phoneNumber: customer.phone,
    address: customer.address
      ? {
          addressLine1: customer.address,
          locality: customer.city ?? undefined,
          administrativeDistrictLevel1: customer.state ?? undefined,
          postalCode: customer.zip ?? undefined,
          country: "US",
        }
      : undefined,
  });

  const squareId = created.customer!.id!;
  await prisma.customer.update({ where: { id: customerId }, data: { squareId } });
  return squareId;
}

export async function POST(_req: NextRequest, { params }: Params) {
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
  if (!invoice.customer.email) {
    return NextResponse.json(
      { error: "Customer has no email address. Add one before sending via Square." },
      { status: 422 }
    );
  }

  try {
    const squareCustomerId = await ensureSquareCustomer(invoice.customerId);

    // 1. Create Square Order from line items
    const orderResponse = await squareClient.orders.create({
      idempotencyKey: `order-${id}`,
      order: {
        locationId: squareLocationId,
        customerId: squareCustomerId,
        lineItems: invoice.workOrder.lineItems.map((item) => ({
          name: item.description,
          quantity: String(item.quantity),
          basePriceMoney: {
            amount: BigInt(Math.round(item.unitPrice * 100)),
            currency: "USD",
          },
          note: item.partNumber ?? undefined,
        })),
        taxes:
          invoice.workOrder.lineItems.length > 0 && invoice.taxRate > 0
            ? [
                {
                  uid: "sales-tax",
                  name: "Sales Tax",
                  percentage: String(invoice.taxRate * 100),
                  scope: "ORDER",
                  type: "ADDITIVE",
                },
              ]
            : undefined,
      },
    });

    const orderId = orderResponse.order!.id!;

    // 2. Create Square Invoice
    const dueDate = invoice.dueDate ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const dueDateStr = dueDate.toISOString().split("T")[0]; // YYYY-MM-DD

    const invoiceResponse = await squareClient.invoices.create({
      idempotencyKey: `invoice-${id}`,
      invoice: {
        orderId,
        locationId: squareLocationId,
        primaryRecipient: { customerId: squareCustomerId },
        paymentRequests: [
          {
            requestType: "BALANCE",
            dueDate: dueDateStr,
            automaticPaymentSource: "NONE",
            tippingEnabled: false,
          },
        ],
        deliveryMethod: "EMAIL",
        invoiceNumber: invoice.number,
        title: `Invoice ${invoice.number}`,
        description: `${invoice.workOrder.vehicle.year} ${invoice.workOrder.vehicle.make} ${invoice.workOrder.vehicle.model} — Work Order ${invoice.workOrder.number}`,
        acceptedPaymentMethods: {
          card: true,
          bankAccount: false,
          squareGiftCard: false,
          buyNowPayLater: false,
          cashAppPay: false,
        },
      },
    });

    const squareInvoice = invoiceResponse.invoice!;

    // 3. Publish (triggers email delivery to customer)
    const publishResponse = await squareClient.invoices.publish({
      invoiceId: squareInvoice.id!,
      version: squareInvoice.version!,
      idempotencyKey: `publish-${id}`,
    });

    const published = publishResponse.invoice!;

    // 4. Persist Square IDs and payment URL
    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        squareInvoiceId: published.id,
        squareInvoiceUrl: published.publicUrl,
        status: "SENT",
        sentAt: new Date(),
      },
    });

    return NextResponse.json({ invoice: updated, paymentUrl: published.publicUrl });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Square API error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
