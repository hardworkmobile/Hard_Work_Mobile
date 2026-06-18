import { NextRequest, NextResponse } from "next/server";
import { getUploadUrl, r2PublicUrl } from "@/lib/r2";
import { nanoid } from "nanoid";

type Params = { params: Promise<{ id: string; itemId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id, itemId } = await params;
  const { contentType } = await req.json();

  const ext = contentType === "image/png" ? "png" : "jpg";
  const key = `inspections/${id}/${itemId}/${nanoid()}.${ext}`;

  const uploadUrl  = await getUploadUrl(key, contentType);
  const publicUrl  = `${r2PublicUrl}/${key}`;

  return NextResponse.json({ uploadUrl, key, publicUrl });
}
