// Google Ads conversion tracking.
//
// These IDs are deliberately hardcoded rather than read from env vars: they're
// public (they ship in the page source anyway), and a missing env var is
// exactly how tracking silently died once already — the tag lived in the old
// CRA app's index.html and was lost when the site was rebuilt in Next.js.

export const GOOGLE_ADS_ID = "AW-17853782705";

// Conversion action labels, in `AW-XXXX/label` form as Google supplies them.
// Both carried over from the pre-Next.js site so the existing conversion
// actions keep their history instead of starting over.
export const CONVERSIONS = {
  // Fires when a visitor taps any tel: link on the marketing site.
  clickToCall: "AW-17853782705/6qciCIHegMIcELG1rMFC",
  // Fires only after a booking request is successfully submitted.
  bookingRequest: "AW-17853782705/mu8OCKPS7sEcELG1rMFC",
} as const;

type GtagWindow = Window & {
  gtag?: (...args: unknown[]) => void;
};

// Best-effort: no-ops if gtag hasn't loaded (blocked, offline, still loading).
// Never let a tracking failure break the user's actual action.
export function reportConversion(sendTo: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const gtag = (window as GtagWindow).gtag;
  if (typeof gtag !== "function") return;
  try {
    gtag("event", "conversion", { send_to: sendTo, value: 1.0, currency: "USD", ...params });
  } catch {
    /* tracking must never throw into the UI */
  }
}
