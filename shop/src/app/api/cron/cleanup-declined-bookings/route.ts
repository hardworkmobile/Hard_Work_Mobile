import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const RETENTION_DAYS = 90;

// Permanently removes declined booking requests older than the retention
// window. Only ever touches DECLINED — nothing active or historically
// converted is ever eligible.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET ?? "";
  const auth = req.headers.get("authorization") ?? "";

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

  const result = await prisma.bookingRequest.deleteMany({
    where: { status: "DECLINED", updatedAt: { lt: cutoff } },
  });

  return NextResponse.json({ deleted: result.count });
}
