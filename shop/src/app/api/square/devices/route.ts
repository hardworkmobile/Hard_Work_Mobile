import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { squareClient } from "@/lib/square";

// Lists Square devices paired to this account, so the correct device ID
// (not the hardware serial number) can be set as SQUARE_TERMINAL_DEVICE_ID.
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const page = await squareClient.devices.list({ sortOrder: "ASC" });
    const devices = page.data.map((d) => ({
      deviceId: d.id,
      name: d.attributes?.name,
      model: d.attributes?.model,
      serialNumber: d.attributes?.manufacturersId,
      status: d.status?.category,
    }));
    return NextResponse.json({ devices });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "body" in err) {
      return NextResponse.json({ error: "Square error", detail: (err as { body: unknown }).body }, { status: 502 });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : "Square error" }, { status: 502 });
  }
}
