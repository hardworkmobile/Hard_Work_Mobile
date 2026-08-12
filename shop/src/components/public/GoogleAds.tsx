"use client";

import { useEffect } from "react";
import Script from "next/script";
import { GOOGLE_ADS_ID, CONVERSIONS, reportConversion } from "@/lib/analytics";

// Loads the Google Ads global tag on the public marketing site (not the staff
// admin or customer portal) and reports a conversion whenever a visitor taps a
// phone number.
export function GoogleAds() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const link = target?.closest?.('a[href^="tel:"]');
      if (!link) return;
      // Fire and let the click proceed — the dialer opening doesn't unload the
      // page, so the beacon still sends. Deliberately not preventing default:
      // a blocked or slow tag must never stop a customer from calling.
      reportConversion(CONVERSIONS.clickToCall);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-ads-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GOOGLE_ADS_ID}');
        `}
      </Script>
    </>
  );
}
