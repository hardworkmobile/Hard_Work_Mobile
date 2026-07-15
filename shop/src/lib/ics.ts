// Minimal iCalendar (.ics) generator — attached to appointment emails so the
// customer can add the job to any calendar app (Google, Apple, Outlook).
// Needed because Google blocks service accounts from sending attendee invites
// on non-Workspace accounts.

function icsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

// Escape per RFC 5545: backslash, semicolon, comma, newline.
function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

export function buildIcs(opts: {
  uid: string;
  start: Date;
  end: Date;
  summary: string;
  description?: string;
  location?: string;
}): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hard Work Mobile//Shop App//EN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${esc(opts.uid)}`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(opts.start)}`,
    `DTEND:${icsDate(opts.end)}`,
    `SUMMARY:${esc(opts.summary)}`,
    ...(opts.description ? [`DESCRIPTION:${esc(opts.description)}`] : []),
    ...(opts.location ? [`LOCATION:${esc(opts.location)}`] : []),
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Hard Work Mobile appointment reminder",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}
