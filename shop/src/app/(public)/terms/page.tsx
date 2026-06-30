import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service | Hard Work Mobile" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-[#1e2833] mb-8">Terms of Service</h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: June 29, 2026</p>

      <div className="prose prose-gray max-w-none space-y-6 text-gray-700 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-[#1e2833] mb-2">1. Services</h2>
          <p>
            Hard Work Mobile (&quot;we,&quot; &quot;us,&quot; &quot;our&quot;) provides mobile auto repair services
            across Chester, Delaware, and Montgomery Counties in Southeast Pennsylvania. By using our
            website or booking a service, you agree to these terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#1e2833] mb-2">2. Booking Requests</h2>
          <p>
            Submitting a booking request through our website does not guarantee an appointment.
            All bookings are subject to availability and confirmation by our team. We will contact
            you to confirm scheduling details.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#1e2833] mb-2">3. Pricing</h2>
          <p>
            Our standard labor rate is $80/hour. Parts and additional materials are billed separately.
            We provide estimates before beginning work and will notify you of any changes to the scope
            or cost before proceeding.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#1e2833] mb-2">4. Payment</h2>
          <p>
            Payment is due upon completion of service unless other arrangements have been made.
            We accept payments through Square, including credit/debit cards and Square Terminal.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#1e2833] mb-2">5. SMS Messaging</h2>
          <p>
            By opting in to text messages on our booking form, you consent to receive booking
            confirmations, appointment reminders, and service updates from Hard Work Mobile.
            Approximate message frequency is 1–5 messages per booking.
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Message and data rates may apply.</li>
            <li>Reply STOP at any time to opt out of text messages.</li>
            <li>Reply HELP for assistance.</li>
            <li>Consent to receive texts is not a condition of purchasing our services.</li>
            <li>Supported carriers include all major US carriers. Carriers are not liable for delayed or undelivered messages.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#1e2833] mb-2">6. Customer Portal</h2>
          <p>
            You may create an account on our customer portal to view work orders, invoices, and
            vehicle history. You are responsible for maintaining the confidentiality of your
            login credentials.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#1e2833] mb-2">7. Limitation of Liability</h2>
          <p>
            Hard Work Mobile is not liable for indirect, incidental, or consequential damages
            arising from the use of our services or website. Our total liability is limited to the
            amount paid for the specific service in question.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#1e2833] mb-2">8. Changes</h2>
          <p>
            We may update these terms from time to time. Continued use of our services after
            changes constitutes acceptance of the updated terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#1e2833] mb-2">9. Contact</h2>
          <p>
            Questions about these terms? Contact us at{" "}
            <a href="tel:4845933875" className="text-[#d4af37] font-semibold hover:underline">(484) 593-3875</a> or{" "}
            <a href="mailto:jamesferzanden@hardworkmobile.com" className="text-[#d4af37] font-semibold hover:underline">
              jamesferzanden@hardworkmobile.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
