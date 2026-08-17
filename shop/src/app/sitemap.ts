import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { SERVICE_DATA } from "@/lib/marketing";
import { SITE_URL } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await prisma.post.findMany({
    where: { publishedAt: { not: null } },
    select: { slug: true, updatedAt: true },
  });

  const staticRoutes = ["", "/services", "/about", "/contact", "/testimonials", "/blog"].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const serviceRoutes = Object.keys(SERVICE_DATA).map((slug) => ({
    url: `${SITE_URL}/services/${slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));

  const postRoutes = posts.map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...serviceRoutes, ...postRoutes];
}
