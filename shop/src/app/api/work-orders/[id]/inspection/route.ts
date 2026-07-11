import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { INSPECTION_TEMPLATE } from "@/lib/inspection-template";
import { requireStaff } from "@/lib/require-staff";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  if (!requireStaff(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: workOrderId } = await params;

  const wo = await prisma.workOrder.findUnique({ where: { id: workOrderId } });
  if (!wo) return NextResponse.json({ error: "Work order not found" }, { status: 404 });

  const existing = await prisma.inspection.findUnique({ where: { workOrderId } });
  if (existing) return NextResponse.json(existing);

  const inspection = await prisma.inspection.create({
    data: {
      workOrderId,
      items: {
        create: INSPECTION_TEMPLATE.flatMap((section) =>
          section.items.map((name) => ({
            category: section.category,
            name,
          }))
        ),
      },
    },
    include: { items: { include: { photos: true } } },
  });

  return NextResponse.json(inspection, { status: 201 });
}
