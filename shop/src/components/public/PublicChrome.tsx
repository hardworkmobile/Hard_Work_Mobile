"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/public/SiteHeader";
import { SiteFooter } from "@/components/public/SiteFooter";
import { LandingHeader } from "@/components/public/LandingHeader";
import { LandingFooter } from "@/components/public/LandingFooter";

// Service-detail pages (/services/<slug>) are the site's closest thing to a
// true ad-landing page, so they get a stripped header/footer with no links
// away — everywhere else keeps the full site nav.
const LANDING_PATH = /^\/services\/[^/]+$/;

export function PublicChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = LANDING_PATH.test(pathname ?? "");

  return (
    <>
      {isLanding ? <LandingHeader /> : <SiteHeader />}
      <main className="flex-1">{children}</main>
      {isLanding ? <LandingFooter /> : <SiteFooter />}
    </>
  );
}
