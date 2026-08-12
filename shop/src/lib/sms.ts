// Twilio's Messages endpoint sends both SMS and MMS — attaching `mediaUrls`
// (publicly reachable image URLs) turns the message into an MMS. Twilio caps
// this at 10 media per message and MMS delivery is US/Canada only.
export const MAX_MMS_MEDIA = 10;

// Best-effort, no-ops if credentials aren't configured. Returns whether the
// send was accepted, so callers can report accurately instead of guessing.
export async function sendSms(opts: {
  to: string;
  message: string;
  mediaUrls?: string[];
}): Promise<{ ok: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!accountSid || !authToken || !from) {
    console.warn("[sms] Twilio credentials not set — skipping send to", opts.to);
    return { ok: false, error: "Twilio is not configured." };
  }

  const e164 = toE164(opts.to);
  if (!e164) {
    console.warn("[sms] could not convert to E.164:", opts.to);
    return { ok: false, error: `"${opts.to}" isn't a valid US phone number.` };
  }

  const body = new URLSearchParams({ To: e164, From: from, Body: opts.message });
  // MediaUrl is a repeated form field, one per attachment.
  for (const mediaUrl of (opts.mediaUrls ?? []).slice(0, MAX_MMS_MEDIA)) {
    body.append("MediaUrl", mediaUrl);
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
      },
      body,
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("[sms] Twilio send failed:", res.status, text);
      // Twilio returns a JSON body with a human-readable `message`.
      let detail = `Twilio error ${res.status}`;
      try {
        const parsed = JSON.parse(text) as { message?: string };
        if (parsed.message) detail = parsed.message;
      } catch {
        /* keep the status-code fallback */
      }
      return { ok: false, error: detail };
    }
    return { ok: true };
  } catch (err) {
    console.error("[sms] Twilio send failed:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Send failed." };
  }
}

function toE164(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (phone.startsWith("+") && digits.length >= 10) return `+${digits}`;
  return null;
}
