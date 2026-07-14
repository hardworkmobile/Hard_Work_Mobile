import { NextRequest, NextResponse } from "next/server";
import { getBusySlotsForDate } from "@/lib/google-calendar";

// Public, read-only: lets the booking form grey out time slots that already
// have something on the calendar. Fails open (nothing blocked) if the date
// is malformed or the calendar can't be reached — never wrongly turn away a
// real customer over a transient lookup failure.
export async function GET(req: NextRequest) {
  const dateParam = req.nextUrl.searchParams.get("date") ?? "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateParam);
  if (!match) {
    return NextResponse.json({ morning: false, afternoon: false, evening: false });
  }

  const [, year, month, day] = match;
  const busy = await getBusySlotsForDate({ year: +year, month: +month, day: +day });

  return NextResponse.json({
    morning: busy?.MORNING ?? false,
    afternoon: busy?.AFTERNOON ?? false,
    evening: busy?.EVENING ?? false,
  });
}
