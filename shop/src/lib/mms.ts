// Quo MMS — best-effort, no-ops if credentials aren't configured.
export async function sendMms(opts: { to: string; message: string; mediaUrl: string }) {
  const apiKey = process.env.QUO_API_KEY;
  const from = process.env.QUO_PHONE_ID;
  if (!apiKey || !from) {
    console.warn("[mms] QUO_API_KEY or QUO_PHONE_ID not set — skipping MMS to", opts.to);
    return;
  }

  const e164 = toE164(opts.to);
  if (!e164) {
    console.warn("[mms] could not convert to E.164:", opts.to);
    return;
  }

  try {
    const res = await fetch("https://api.quo.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify({
        content: opts.message,
        from,
        to: [e164],
        mediaUrls: [opts.mediaUrl],
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("[mms] Quo send failed:", res.status, body);
    }
  } catch (err) {
    console.error("[mms] Quo send failed:", err);
  }
}

function toE164(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (phone.startsWith("+") && digits.length >= 10) return `+${digits}`;
  return null;
}
