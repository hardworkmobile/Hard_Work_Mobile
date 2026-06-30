import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy | Hard Work Mobile" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-[#1e2833] mb-8">Privacy Policy</h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: June 29, 2026</p>

      <div className="prose prose-gray max-w-none space-y-6 text-gray-700 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-[#1e2833] mb-2">1. Information We Collect</h2>
          <p>When you use our website or book a service, we may collect:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Contact information:</strong> name, email address, phone number, service address</li>
            <li><strong>Vehicle information:</strong> year, make, model</li>
            <li><strong>Service details:</strong> requested service, preferred date and time</li>
            <li><strong>Account information:</strong> email and password if you create a customer portal account</li>
            <li><strong>Payment information:</strong> processed securely through Square; we do not store card numbers</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#1e2833] mb-2">2. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Schedule and perform auto repair services</li>
            <li>Send booking confirmations, appointment reminders, and service updates via email and/or SMS</li>
            <li>Process payments and send invoices</li>
            <li>Provide access to your customer portal (work orders, invoices, vehicle history)</li>
            <li>Respond to your inquiries</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#1e2833] mb-2">3. SMS Messaging</h2>
          <p>
            If you opt in to text messages, we will send booking confirmations, appointment reminders,
            and service updates to the phone number you provide. Approximate frequency: 1–5 messages
            per booking.
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Message and data rates may apply.</li>
            <li>Reply STOP to opt out at any time.</li>
            <li>Reply HELP for assistance.</li>
            <li>We do not sell, rent, or share your phone number or SMS opt-in consent with third parties for marketing purposes.</li>
            <li>No mobile information will be shared with third parties or affiliates for marketing or promotional purposes.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#1e2833] mb-2">4. Information Sharing</h2>
          <p>
            We do not sell your personal information. We share data only with service providers
            necessary to operate our business:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Square:</strong> payment processing</li>
            <li><strong>Twilio:</strong> SMS delivery</li>
            <li><strong>Resend:</strong> email delivery</li>
          </ul>
          <p className="mt-2">
            These providers process data solely on our behalf and are contractually obligated to
            protect your information.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#1e2833] mb-2">5. Data Security</h2>
          <p>
            We use industry-standard security measures including HTTPS encryption, secure password
            hashing, and secure cookie handling to protect your data. Payment processing is handled
            entirely by Square and never touches our servers.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#1e2833] mb-2">6. Data Retention</h2>
          <p>
            We retain your information for as long as necessary to provide our services and maintain
            your account. You may request deletion of your account and associated data by contacting us.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#1e2833] mb-2">7. Your Rights</h2>
          <p>You may:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Request access to the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your data</li>
            <li>Opt out of SMS messages at any time by replying STOP</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#1e2833] mb-2">8. Changes</h2>
          <p>
            We may update this policy from time to time. We will notify you of material changes
            by posting the updated policy on this page with a revised date.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#1e2833] mb-2">9. Contact</h2>
          <p>
            Questions about this policy? Contact us at{" "}
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
