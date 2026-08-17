import type { Metadata } from "next";

// No branded 1200x630 share image exists in public/images/ yet — omit the
// `images` field until one does; title/description still render in previews.
export const SITE_NAME = "Hard Work Mobile";
export const SITE_URL = "https://hardworkmobile.com";

type Args = { title: string; description: string; path: string; type?: "website" | "article" };

export function buildMetadata({ title, description, path, type = "website" }: Args): Metadata {
  const url = `${SITE_URL}${path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: SITE_NAME, type, locale: "en_US" },
    twitter: { card: "summary", title, description },
  };
}
