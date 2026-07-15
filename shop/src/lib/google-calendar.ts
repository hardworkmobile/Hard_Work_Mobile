import { createSign } from "crypto";

// Google Calendar via a Service Account — the shop owner shares their calendar
// with the service account's email (like sharing with a person), so there's
// no OAuth consent screen or refresh-token lifecycle to manage.

const SCOPE = "https://www.googleapis.com/auth/calendar";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const TIME_ZONE = "America/New_York";

export const SLOT_HOURS: Record<"MORNING" | "AFTERNOON" | "EVENING", { startHour: number; endHour: number }> = {
  MORNING: { startHour: 8, endHour: 12 },
  AFTERNOON: { startHour: 12, endHour: 17 },
  EVENING: { startHour: 17, endHour: 19 },
};

function base64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Minutes that America/New_York is behind UTC for a given instant (handles DST).
function nyOffsetMinutes(date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const parts = Object.fromEntries(dtf.formatToParts(date).map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return (asUtc - date.getTime()) / 60000;
}

// Converts a local wall-clock time in America/New_York to the correct UTC instant.
function nyLocalToUtc(year: number, month: number, day: number, hour: number, minute = 0): Date {
  const approx = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const offsetMin = nyOffsetMinutes(approx);
  return new Date(approx.getTime() - offsetMin * 60000);
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// Local naive dateTime string (no offset) — paired with timeZone, Google
// Calendar's event create/update endpoints handle the DST conversion for us.
function localDateTimeString(year: number, month: number, day: number, hour: number, minute = 0) {
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00`;
}

async function getAccessToken(): Promise<string | null> {
  const clientEmail = process.env.GOOGLE_CALENDAR_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_CALENDAR_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey) {
    console.warn("[google-calendar] GOOGLE_CALENDAR_CLIENT_EMAIL/PRIVATE_KEY not set — skipping");
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: clientEmail,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`;
  const signature = base64url(createSign("RSA-SHA256").update(unsigned).sign(privateKey));
  const assertion = `${unsigned}.${signature}`;

  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    });
    if (!res.ok) {
      console.error("[google-calendar] token exchange failed:", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as { access_token?: string };
    return data.access_token ?? null;
  } catch (err) {
    console.error("[google-calendar] token exchange error:", err);
    return null;
  }
}

type SlotDate = { year: number; month: number; day: number };

export function slotWindow(date: SlotDate, slot: keyof typeof SLOT_HOURS) {
  const { startHour, endHour } = SLOT_HOURS[slot];
  return {
    start: { dateTime: localDateTimeString(date.year, date.month, date.day, startHour), timeZone: TIME_ZONE },
    end: { dateTime: localDateTimeString(date.year, date.month, date.day, endHour), timeZone: TIME_ZONE },
    startUtc: nyLocalToUtc(date.year, date.month, date.day, startHour),
    endUtc: nyLocalToUtc(date.year, date.month, date.day, endHour),
  };
}

// Best-effort: creates a calendar event for the given slot. Returns the
// event ID on success, or null if not configured / the request fails.
export async function createCalendarEvent(opts: {
  date: SlotDate;
  slot: keyof typeof SLOT_HOURS;
  summary: string;
  description?: string;
  location?: string;
  attendeeEmail?: string;
}): Promise<string | null> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const token = await getAccessToken();
  if (!token || !calendarId) return null;

  const { start, end } = slotWindow(opts.date, opts.slot);
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?sendUpdates=all`;
  const baseBody = { summary: opts.summary, description: opts.description, location: opts.location, start, end };

  async function insert(withAttendee: boolean) {
    return fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        ...baseBody,
        ...(withAttendee && opts.attendeeEmail ? { attendees: [{ email: opts.attendeeEmail }] } : {}),
      }),
    });
  }

  try {
    let res = await insert(true);

    // Some Google accounts (personal/free, without Workspace domain-wide
    // delegation) block a Service Account from sending attendee invites.
    // Fall back to creating the event without the invite rather than losing
    // the calendar sync entirely.
    if (!res.ok && opts.attendeeEmail) {
      const body = await res.text();
      console.warn("[google-calendar] createEvent with attendee failed, retrying without invite:", res.status, body);
      res = await insert(false);
    }

    if (!res.ok) {
      console.error("[google-calendar] createEvent failed:", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as { id?: string };
    return data.id ?? null;
  } catch (err) {
    console.error("[google-calendar] createEvent error:", err);
    return null;
  }
}

// Best-effort: deletes a previously created event. No-ops on failure —
// a stray calendar event isn't worth blocking a status change over.
export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const token = await getAccessToken();
  if (!token || !calendarId) return;

  try {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok && res.status !== 404 && res.status !== 410) {
      console.error("[google-calendar] deleteEvent failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("[google-calendar] deleteEvent error:", err);
  }
}

// Checks each of the three named slots on the given date for calendar
// conflicts (any existing event — not just ones this app created). Returns
// null if the calendar isn't configured or the request fails, so callers can
// distinguish "unknown" (best-effort: allow booking) from "confirmed free".
export async function getBusySlotsForDate(
  date: SlotDate
): Promise<Record<"MORNING" | "AFTERNOON" | "EVENING", boolean> | null> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const token = await getAccessToken();
  if (!token || !calendarId) return null;

  const dayStart = nyLocalToUtc(date.year, date.month, date.day, 0, 0);
  const dayEnd = nyLocalToUtc(date.year, date.month, date.day, 23, 59);

  try {
    // events.list rather than freeBusy: freeBusy can silently return no busy
    // data for shared/secondary calendars (looks identical to "free"), while
    // reading events uses the exact same access we already rely on to create
    // them. singleEvents expands recurring events into concrete instances.
    const params = new URLSearchParams({
      timeMin: dayStart.toISOString(),
      timeMax: dayEnd.toISOString(),
      singleEvents: "true",
      maxResults: "50",
    });
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) {
      console.error("[google-calendar] events.list failed:", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as {
      items?: {
        status?: string;
        transparency?: string;
        start?: { dateTime?: string; date?: string };
        end?: { dateTime?: string; date?: string };
      }[];
    };
    const busyPeriods = (data.items ?? [])
      // Skip cancelled events and ones marked "Free" (transparent) in Google Calendar.
      .filter((e) => e.status !== "cancelled" && e.transparency !== "transparent")
      .map((e) => ({
        // All-day events carry `date` (no time) — treat as blocking the whole day.
        start: new Date(e.start?.dateTime ?? (e.start?.date ? `${e.start.date}T00:00:00-05:00` : 0)),
        end: new Date(e.end?.dateTime ?? (e.end?.date ? `${e.end.date}T00:00:00-05:00` : 0)),
      }))
      .filter((b) => !isNaN(b.start.getTime()) && !isNaN(b.end.getTime()) && b.end > b.start);

    const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) => aStart < bEnd && bStart < aEnd;

    const result = {} as Record<"MORNING" | "AFTERNOON" | "EVENING", boolean>;
    for (const slot of Object.keys(SLOT_HOURS) as (keyof typeof SLOT_HOURS)[]) {
      const { startUtc, endUtc } = slotWindow(date, slot);
      result[slot] = busyPeriods.some((b) => overlaps(startUtc, endUtc, b.start, b.end));
    }
    return result;
  } catch (err) {
    console.error("[google-calendar] freeBusy error:", err);
    return null;
  }
}
