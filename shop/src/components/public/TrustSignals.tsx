import { Star, MessageCircle, FileCheck, Car } from "lucide-react";
import { prisma } from "@/lib/db";

const HONEST_POINTS = [
  { icon: MessageCircle, text: "You talk directly to the mechanic doing the work — no service writer in between." },
  { icon: FileCheck, text: "Upfront pricing, quoted before any work begins." },
  { icon: Car, text: "We come to you — no shop, no tow truck." },
];

// Only ever surfaces real, verifiable claims — no license, insurance, or
// years-in-business numbers, since none of those exist yet for this business.
export async function TrustSignals() {
  const [count, agg] = await Promise.all([
    prisma.testimonial.count({ where: { status: "PUBLISHED" } }),
    prisma.testimonial.aggregate({ where: { status: "PUBLISHED" }, _avg: { rating: true } }),
  ]);
  const avg = agg._avg.rating;

  return (
    <div className="mx-auto max-w-4xl">
      {count > 0 && avg != null && (
        <p className="flex items-center justify-center gap-2 text-center text-lg font-bold text-[#1e2833]">
          <Star className="h-5 w-5 fill-[#d4af37] text-[#d4af37]" />
          {avg.toFixed(1)} average from {count} real customer review{count === 1 ? "" : "s"}
        </p>
      )}
      <div className={`grid gap-5 sm:grid-cols-3 ${count > 0 && avg != null ? "mt-6" : ""}`}>
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
