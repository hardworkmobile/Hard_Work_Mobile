import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { InvoiceStatus } from "@/generated/prisma";
import { requireStaff } from "@/lib/require-staff";

export async function GET(req: NextRequest) {
  if (!requireStaff(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as InvoiceStatus | null;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = 25;

  const where = status ? { status } : {};

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        customer: { select: { id: true, firstName: true, lastName: true } },
        workOrder: { select: { number: true, vehicle: { select: { year: true, make: true, model: true } } } },
        _count: { select: { payments: true } },
      },
    }),
    prisma.invoice.count({ where }),
  ]);

  return NextResponse.json({ invoices, total, page, limit });
}
