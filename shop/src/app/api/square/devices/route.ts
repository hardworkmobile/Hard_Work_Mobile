import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { squareClient, squareLocationId } from "@/lib/square";

function squareError(err: unknown) {
  if (err && typeof err === "object" && "body" in err) {
    return NextResponse.json({ error: "Square error", detail: (err as { body: unknown }).body }, { status: 502 });
  }
  return NextResponse.json({ error: err instanceof Error ? err.message : "Square error" }, { status: 502 });
}

// Lists Square devices paired to this account, so the correct device ID
// (not the hardware serial number) can be set as SQUARE_TERMINAL_DEVICE_ID.
// A terminal only appears here after signing in with a device code — see POST.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Convenience: /api/square/devices?create=1 generates a pairing code from
  // a browser (POST is awkward on a phone).
  if (req.nextUrl.searchParams.get("create")) return createDeviceCode();

  try {
    const [devicesPage, codesPage] = await Promise.all([
      squareClient.devices.list({ sortOrder: "ASC" }),
      squareClient.devices.codes.list({}),
    ]);
    const devices = devicesPage.data.map((d) => ({
      deviceId: d.id,
      name: d.attributes?.name,
      model: d.attributes?.model,
      serialNumber: d.attributes?.manufacturersId,
      status: d.status?.category,
    }));
    const deviceCodes = codesPage.data.map((c) => ({
      code: c.code,
      name: c.name,
      status: c.status,
      pairedDeviceId: c.deviceId ?? null,
      pairedAt: c.pairedAt ?? null,
    }));
    return NextResponse.json({ devices, deviceCodes });
  } catch (err: unknown) {
    return squareError(err);
  }
}

// Creates a device pairing code. Enter this code on the Square Terminal
// (Settings → sign out → "Use a device code") to pair it to the Terminal API.
export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return createDeviceCode();
}

async function createDeviceCode() {
  try {
    const response = await squareClient.devices.codes.create({
      idempotencyKey: crypto.randomUUID(),
      deviceCode: {
        name: "Hard Work Mobile Terminal",
        productType: "TERMINAL_API",
        locationId: squareLocationId,
      },
    });
    const code = response.deviceCode;
    return NextResponse.json({
      code: code?.code,
      expiresAt: code?.pairBy,
      instructions:
        "On the Square Terminal: Settings → sign out if signed in → choose 'Use a device code' and enter this code. Then GET this endpoint again to see the paired deviceId.",
    });
  } catch (err: unknown) {
    return squareError(err);
  }
}
