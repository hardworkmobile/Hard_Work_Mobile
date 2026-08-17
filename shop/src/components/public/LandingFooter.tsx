import Link from "next/link";
import { PHONE, PHONE_HREF, AREA } from "@/lib/marketing";

// Pairs with LandingHeader — no Explore/nav links, only the legal minimum,
// so the page keeps a single conversion goal end to end.
export function LandingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-[#1e2833] text-gray-300">
      <div className="mx-auto max-w-6xl px-4 py-10 text-center sm:px-6">
        <p className="text-lg font-bold text-white">
          Hard Work <span className="text-[#d4af37]">Mobile</span>
        </p>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-gray-400">
          Mobile auto repair across Southeast PA. We come to your home or office with honest,
          upfront pricing at {`$80/hr`} — no shop, no tow, no surprises.
        </p>
        <a href={PHONE_HREF} className="mt-3 inline-block font-semibold text-white hover:text-[#d4af37]">{PHONE}</a>
        <p className="mt-1 text-sm text-gray-400">{AREA}</p>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-gray-500">
        <p>© {year} Hard Work Mobile. All rights reserved.</p>
        <p className="mt-2 flex justify-center gap-4">
          <Link href="/privacy" className="hover:text-[#d4af37]">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-[#d4af37]">Terms of Service</Link>
        </p>
      </div>
    </footer>
  );
}
