import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { squareClient } from "@/lib/square";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (invoice.status === "PAID") return NextResponse.json({ error: "Cannot void a paid invoice" }, { status: 422 });

  // Cancel in Square if it was sent
  if (invoice.squareInvoiceId) {
    try {
      const getResponse = await squareClient.invoices.get({ invoiceId: invoice.squareInvoiceId });
      await squareClient.invoices.cancel({
        invoiceId: invoice.squareInvoiceId,
        version: getResponse.invoice!.version!,
      });
    } catch {
      // Log but don't block — Square cancellation is best-effort
    }
  }

  const updated = await prisma.invoice.update({
    where: { id },
    data: { status: "VOID" },
  });

  return NextResponse.json(updated);
}
