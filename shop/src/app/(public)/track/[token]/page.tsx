import type { Metadata } from "next";
import { TrackingView } from "./TrackingView";

export const metadata: Metadata = {
  title: "Track Your Mechanic — Hard Work Mobile",
  description: "Follow your Hard Work Mobile mechanic's arrival in real time.",
  robots: { index: false, follow: false },
};

type Params = { params: Promise<{ token: string }> };

export default async function TrackPage({ params }: Params) {
  const { token } = await params;
  return <TrackingView token={token} />;
}
