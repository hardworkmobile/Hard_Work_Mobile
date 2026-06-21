import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { StarRating } from "@/components/public/StarRating";
import { SERVICES, PHONE, PHONE_HREF } from "@/lib/marketing";

export const metadata: Metadata = {
  title: "About — Hard Work Mobile",
  description:
    "Hard Work Mobile is a mobile mechanic serving Chester, Delaware & Montgomery Counties, PA — honest diagnoses, fair pricing, and quality repairs at your location.",
};

export const dynamic = "force-dynamic";

const VALUES = [
  { icon: "fa-solid fa-check-circle", title: "Quality", body: "Every repair is done right or not at all. No shortcuts, no half-measures — just solid work you can count on." },
  { icon: "fa-solid fa-handshake", title: "Integrity", body: "You get an honest diagnosis and a straight answer. If it doesn't need fixing, I'll tell you." },
  { icon: "fa-solid fa-star", title: "Excellence", body: 'The bar is not "good enough." It is the standard a professional is proud to put their name on.' },
];

export default async function AboutPage() {
  const testimonials = await prisma.testimonial.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  return (
    <>
      {/* Hero */}
      <section
        className="relative bg-[#1e2833] bg-cover bg-center text-white"
        style={{ backgroundImage: "url(/images/about-hero-image.jpg)" }}
      >
        <div className="absolute inset-0 bg-[#12181f]/80" />
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <span className="inline-block rounded-full bg-[#d4af37] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#1e2833]">
            About Hard Work Mobile
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-3xl font-extrabold leading-tight sm:text-4xl">
            When You Dive into the Tough World of Auto Repair, Less than Perfect is a No-No!
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-300">
            How fortuitous, then, that I shall stop at nothing to deliver it for my clients.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/signature.png" alt="James Ferzanden signature" className="mx-auto mt-6 h-16 w-auto opacity-90" />
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/contact" className="rounded-lg bg-[#d4af37] px-6 py-3 font-bold text-[#1e2833] transition-colors hover:bg-[#c9a42e]">
              Get a Free Quote
            </Link>
            <a href={PHONE_HREF} className="rounded-lg border-2 border-white/40 px-6 py-3 font-semibold text-white transition-colors hover:border-[#d4af37] hover:text-[#d4af37]">
              <i className="fa-solid fa-phone mr-2" />{PHONE}
            </a>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <div className="bg-[#d4af37]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-2 px-4 py-3.5 text-sm font-bold text-[#1e2833]">
          <span><i className="fa-solid fa-wrench mr-2" />Mobile Auto Repair</span>
          <span><i className="fa-solid fa-certificate mr-2" />Certified Technician</span>
          <span><i className="fa-solid fa-comment-dollar mr-2" />Honest Pricing</span>
          <span><i className="fa-solid fa-map-location-dot mr-2" />Chester, Delaware &amp; Montgomery Co.</span>
        </div>
      </div>

      {/* Core values */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-bold text-[#1e2833]">What I Stand For</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-gray-600">
          Three principles that guide every job — from a simple oil change to a full engine repair.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {VALUES.map((v) => (
            <div key={v.title} className="rounded-xl bg-white p-6 text-center shadow-sm ring-1 ring-gray-100">
              <i className={`${v.icon} text-2xl text-[#d4af37]`} />
              <h3 className="mt-3 font-bold text-[#1e2833]">{v.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section
        className="relative bg-[#1e2833] bg-cover bg-center text-white"
        style={{ backgroundImage: "url(/images/mission-bg.jpeg)" }}
      >
        <div className="absolute inset-0 bg-[#0a2540]/85" />
        <div className="relative mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <span className="inline-block rounded-full bg-white/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#d4af37]">
            The Mission
          </span>
          <h2 className="mt-5 text-3xl font-extrabold sm:text-4xl">My Crusade</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-gray-200">
            To shatter the corrupt price gouging and degenerate upselling that robs good people blind.
            A business model which plunders its clients and technicians has not the right to exist at all.
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-bold text-[#1e2833]">What My Clients Say</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-gray-600">
          Real feedback from drivers across Chester, Delaware &amp; Montgomery Counties.
        </p>
        {testimonials.length > 0 ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.id} className="flex flex-col rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <StarRating rating={t.rating} />
                <blockquote className="mt-3 flex-1 text-gray-700">“{t.quote}”</blockquote>
                <figcaption className="mt-4 font-bold text-[#1e2833]">{t.authorName}</figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="mt-8 text-center text-gray-500">
            <Link href="/testimonials" className="font-semibold text-[#d4af37] hover:underline">Be the first to leave a review →</Link>
          </p>
        )}
      </section>

      {/* Contact + services info */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-white p-6 text-center shadow-sm ring-1 ring-gray-100">
              <i className="fa-solid fa-phone text-2xl text-[#d4af37]" />
              <h3 className="mt-3 font-bold text-[#1e2833]">Call or Text</h3>
              <p className="mt-1 text-sm text-gray-600">{PHONE}</p>
              <a href={PHONE_HREF} className="mt-2 inline-block text-sm font-bold text-[#d4af37] hover:underline">Call now</a>
            </div>
            <div className="rounded-xl bg-white p-6 text-center shadow-sm ring-1 ring-gray-100">
              <i className="fa-solid fa-envelope text-2xl text-[#d4af37]" />
              <h3 className="mt-3 font-bold text-[#1e2833]">Email</h3>
              <p className="mt-1 break-words text-sm text-gray-600">JamesFerzanden@hardworkmobile.com</p>
              <a href="mailto:JamesFerzanden@hardworkmobile.com" className="mt-2 inline-block text-sm font-bold text-[#d4af37] hover:underline">Send email</a>
            </div>
            <div className="rounded-xl bg-white p-6 text-center shadow-sm ring-1 ring-gray-100">
              <i className="fa-solid fa-clock text-2xl text-[#d4af37]" />
              <h3 className="mt-3 font-bold text-[#1e2833]">Hours</h3>
              <p className="mt-1 text-sm text-gray-600">Monday – Friday</p>
              <p className="text-sm text-gray-600">8:00 AM – 4:00 PM</p>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <i className="fa-solid fa-list-check text-2xl text-[#d4af37]" />
              <h3 className="mt-3 font-bold text-[#1e2833]">Services Offered</h3>
              <ul className="mt-2 space-y-1.5 text-sm">
                {SERVICES.map((s) => (
                  <li key={s.slug}>
                    <Link href={`/services/${s.slug}`} className="flex items-center gap-2 text-gray-600 hover:text-[#d4af37]">
                      <i className={`${s.icon} w-4 text-[#d4af37]`} />
                      {s.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#d4af37] py-16 text-center text-[#1e2833]">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-3xl font-bold">In Need of Hard Work?</h2>
          <p className="mt-3 text-[#1e2833]/80">Contact me and we will go from there. Fair enough?</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/contact" className="rounded-lg bg-[#1e2833] px-6 py-3 font-bold text-white transition-colors hover:bg-[#111b24]">
              Get in Touch
            </Link>
            <Link href="/services" className="rounded-lg border-2 border-[#1e2833] px-6 py-3 font-semibold text-[#1e2833] transition-colors hover:bg-[#1e2833]/10">
              View Services
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
