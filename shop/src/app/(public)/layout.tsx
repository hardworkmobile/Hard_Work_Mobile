import type { Metadata } from "next";
import { PublicChrome } from "@/components/public/PublicChrome";
import { GoogleAds } from "@/components/public/GoogleAds";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Hard Work Mobile — Mobile Mechanic in Southeast PA",
  description:
    "Mobile auto repair that comes to you across Chester, Delaware & Montgomery Counties, PA. Diagnostics, brakes, engine, suspension, electrical & maintenance at $80/hr.",
  path: "/",
});

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900">
      <GoogleAds />
      <PublicChrome>{children}</PublicChrome>
    </div>
  );
}
