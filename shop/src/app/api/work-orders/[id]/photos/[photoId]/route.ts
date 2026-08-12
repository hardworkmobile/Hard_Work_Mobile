import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/require-staff";
import { deleteFromR2 } from "@/lib/r2";

type Params = { params: Promise<{ photoId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!requireStaff(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { photoId } = await params;
  const photo = await prisma.workOrderPhoto.findUnique({ where: { id: photoId } });
  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await deleteFromR2(photo.storageKey);
  await prisma.workOrderPhoto.delete({ where: { id: photoId } });

  return NextResponse.json({ ok: true });
}
