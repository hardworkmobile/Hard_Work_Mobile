import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/portal/", "/track/", "/login", "/dashboard", "/work-orders", "/customers", "/invoices", "/booking-requests", "/inspections", "/admin"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
