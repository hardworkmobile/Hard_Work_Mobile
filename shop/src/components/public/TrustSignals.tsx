import { Star, MessageCircle, FileCheck, Car } from "lucide-react";
import { GOOGLE_REVIEW_COUNT, GOOGLE_REVIEW_RATING } from "@/lib/marketing";

const HONEST_POINTS = [
  { icon: MessageCircle, text: "You talk directly to the mechanic doing the work — no service writer in between." },
  { icon: FileCheck, text: "Upfront pricing, quoted before any work begins." },
  { icon: Car, text: "We come to you — no shop, no tow truck." },
];

// Only ever surfaces real, verifiable claims — no license, insurance, or
// years-in-business numbers, since none of those exist yet for this business.
export function TrustSignals() {
  const hasGoogleReviews = GOOGLE_REVIEW_COUNT > 0;

  return (
    <div className="mx-auto max-w-4xl">
      {hasGoogleReviews && (
        <p className="flex items-center justify-center gap-2 text-center text-lg font-bold text-[#1e2833]">
          <Star className="h-5 w-5 fill-[#d4af37] text-[#d4af37]" />
          {GOOGLE_REVIEW_RATING.toFixed(1)} average from {GOOGLE_REVIEW_COUNT} real Google review{GOOGLE_REVIEW_COUNT === 1 ? "" : "s"}
        </p>
      )}
      <div className={`grid gap-5 sm:grid-cols-3 ${hasGoogleReviews ? "mt-6" : ""}`}>
        {HONEST_POINTS.map((p) => (
          <div key={p.text} className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <p.icon className="h-5 w-5 shrink-0 text-[#d4af37]" />
            <p className="text-sm text-gray-700">{p.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
