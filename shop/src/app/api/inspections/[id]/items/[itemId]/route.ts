import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/require-staff";

type Params = { params: Promise<{ id: string; itemId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  if (!requireStaff(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await params;
  const { condition, notes } = await req.json();

  const item = await prisma.inspectionItem.update({
    where: { id: itemId },
    data: {
      ...(condition !== undefined && { condition }),
      ...(notes     !== undefined && { notes     }),
    },
    include: { photos: true },
  });

  return NextResponse.json(item);
}
