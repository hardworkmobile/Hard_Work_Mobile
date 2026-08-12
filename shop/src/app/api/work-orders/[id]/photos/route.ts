import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/require-staff";
import { r2, r2BucketName, r2PublicUrl } from "@/lib/r2";

type Params = { params: Promise<{ id: string }> };

// Upload a photo against the work order itself (e.g. completed work), so it
// can be texted to the customer. Inspection photos live separately, on their
// checklist items.
export async function POST(req: NextRequest, { params }: Params) {
  if (!requireStaff(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const wo = await prisma.workOrder.findUnique({ where: { id }, select: { id: true } });
  if (!wo) return NextResponse.json({ error: "Work order not found" }, { status: 404 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files can be sent to customers." }, { status: 422 });
    }

    const ext = file.type === "image/png" ? "png" : "jpg";
    const key = `work-orders/${id}/${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await r2.send(new PutObjectCommand({
      Bucket: r2BucketName,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }));

    const photo = await prisma.workOrderPhoto.create({
      data: {
        workOrderId: id,
        url: `${r2PublicUrl}/${key}`,
        storageKey: key,
        caption: (formData.get("caption") as string | null) || null,
      },
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (err) {
    console.error("[work-order-photos] upload failed:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
