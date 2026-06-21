import { Resend } from "resend";

const FROM = process.env.RESEND_FROM_EMAIL ?? "Hard Work Mobile <onboarding@resend.dev>";
// Customer replies (e.g. to a booking confirmation) route to a real inbox even
// when sending from a no-reply From address. Override with RESEND_REPLY_TO.
const REPLY_TO = process.env.RESEND_REPLY_TO ?? "JamesFerzanden@hardworkmobile.com";

export function appUrl() {
  return process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

// Best-effort send: no-ops cleanly if RESEND_API_KEY isn't configured (dev).
export async function sendEmail(opts: { to: string; subject: string; html: string }) {
  const keyPresent = !!process.env.RESEND_API_KEY;
  console.log("[email] sendEmail called — to:", opts.to, "| RESEND_API_KEY present:", keyPresent, "| from:", FROM);
  if (!keyPresent) {
    console.warn("[email] RESEND_API_KEY not set — skipping send to", opts.to);
    return;
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({ from: FROM, to: [opts.to], replyTo: REPLY_TO, subject: opts.subject, html: opts.html });
    console.log("[email] send result:", JSON.stringify(result));
  } catch (err) {
    console.error("[email] send failed:", err);
  }
}

export function brandedEmail(heading: string, bodyHtml: string) {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#1e2833;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
        <h1 style="color:#d4af37;margin:0;font-size:24px;">Hard Work Mobile</h1>
        <p style="color:#94a3b8;margin:8px 0 0;">Mobile Auto Repair · Southeast PA</p>
      </div>
      <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;padding:32px 24px;">
        <h2 style="color:#1e2833;margin-top:0;">${heading}</h2>
        ${bodyHtml}
        <p style="color:#94a3b8;font-size:13px;margin-top:32px;">Hard Work Mobile · Chester, Delaware &amp; Montgomery Counties, PA</p>
      </div>
    </div>
  `;
}
