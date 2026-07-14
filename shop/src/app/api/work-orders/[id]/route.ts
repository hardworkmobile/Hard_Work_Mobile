import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { PreferredTimeSlot } from "@/generated/prisma";
import { requireStaff } from "@/lib/require-staff";
import { slotWindow } from "@/lib/google-calendar";

const updateSchema = z.object({
  description: z.string().min(1).optional(),
  diagnosis: z.string().optional().nullable(),
  workPerformed: z.string().optional().nullable(),
  recommendations: z.string().optional().nullable(),
  technician: z.string().optional().nullable(),
  serviceLocation: z.string().optional().nullable(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  scheduledTimeSlot: z.nativeEnum(PreferredTimeSlot).optional().nullable(),
  startedAt: z.string().datetime().optional().nullable(),
  completedAt: z.string().datetime().optional().nullable(),
  mileageIn: z.number().int().nonnegative().optional().nullable(),
  mileageOut: z.number().int().nonnegative().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  customerNotes: z.string().optional().nullable(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  if (!requireStaff(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const workOrder = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      vehicle: true,
      lineItems: { orderBy: [{ type: "asc" }, { createdAt: "asc" }] },
      invoice: true,
    },
  });

  if (!workOrder) {
    return NextResponse.json({ error: "Work order not found" }, { status: 404 });
  }

  return NextResponse.json(workOrder);
}

export async function PUT(req: NextRequest, { params }: Params) {
  if (!requireStaff(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const result = updateSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.flatten() },
      { status: 422 }
    );
  }

  const { scheduledDate, scheduledTimeSlot, ...rest } = result.data;

  let scheduling: { scheduledAt?: Date | null; scheduledTimeSlot?: PreferredTimeSlot | null } = {};
  if (scheduledDate === null) {
    scheduling = { scheduledAt: null, scheduledTimeSlot: null };
  } else if (scheduledDate && scheduledTimeSlot) {
    const [year, month, day] = scheduledDate.split("-").map(Number);
    scheduling = { scheduledAt: slotWindow({ year, month, day }, scheduledTimeSlot).startUtc, scheduledTimeSlot };
  }

  const workOrder = await prisma.workOrder.update({
    where: { id },
    data: { ...rest, ...scheduling },
    include: { customer: true, vehicle: true, lineItems: true },
  });

  return NextResponse.json(workOrder);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!requireStaff(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await prisma.workOrder.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
