// Twilio SMS — best-effort, no-ops if credentials aren't configured.
export async function sendSms(opts: { to: string; message: string }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!accountSid || !authToken || !from) {
    console.warn("[sms] Twilio credentials not set — skipping SMS to", opts.to);
    return;
  }

  const e164 = toE164(opts.to);
  if (!e164) {
    console.warn("[sms] could not convert to E.164:", opts.to);
    return;
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
      },
      body: new URLSearchParams({ To: e164, From: from, Body: opts.message }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("[sms] Twilio send failed:", res.status, body);
    }
  } catch (err) {
    console.error("[sms] Twilio send failed:", err);
  }
}

function toE164(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (phone.startsWith("+") && digits.length >= 10) return `+${digits}`;
  return null;
}
