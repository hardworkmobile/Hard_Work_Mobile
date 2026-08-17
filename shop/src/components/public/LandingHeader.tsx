import Link from "next/link";
import { Wrench } from "lucide-react";

// Stripped-down header for ad-landing pages (service detail pages): logo +
// phone only, no nav links away, so there's exactly one path off the page —
// call or use the booking form below.
export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 bg-[#1e2833]/95 backdrop-blur border-b border-white/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-white">
          <Wrench className="h-6 w-6 text-[#d4af37]" />
          <span className="text-lg font-bold tracking-tight">
            Hard Work <span className="text-[#d4af37]">Mobile</span>
          </span>
        </Link>
        <a href="tel:4845933875" className="rounded-lg bg-[#d4af37] px-4 py-1.5 text-sm font-bold text-[#1e2833] transition-colors hover:bg-[#c9a42e]">
          (484) 593-3875
        </a>
      </div>
    </header>
  );
}
