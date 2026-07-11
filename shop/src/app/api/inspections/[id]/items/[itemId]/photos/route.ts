import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/require-staff";

type Params = { params: Promise<{ itemId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  if (!requireStaff(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await params;
  const { url, storageKey } = await req.json();

  const photo = await prisma.inspectionPhoto.create({
    data: { inspectionItemId: itemId, url, storageKey },
  });

  return NextResponse.json(photo, { status: 201 });
}
