import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { CommentsSection } from "@/components/public/CommentsSection";
import { buildMetadata } from "@/lib/seo";

type Params = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

async function getPost(slug: string) {
  return prisma.post.findFirst({
    where: { slug, publishedAt: { not: null } },
    include: {
      author: { select: { name: true } },
      comments: { orderBy: { createdAt: "asc" }, select: { id: true, authorName: true, text: true, createdAt: true } },
    },
  });
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post — Hard Work Mobile" };
  return buildMetadata({
    title: `${post.title} — Hard Work Mobile`,
    description: post.summary ?? post.title,
    path: `/blog/${slug}`,
    type: "article",
  });
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link href="/blog" className="text-sm font-semibold text-[#d4af37] hover:underline">← Back to Blog</Link>

      <h1 className="mt-4 text-3xl font-extrabold text-[#1e2833] sm:text-4xl">{post.title}</h1>
      <p className="mt-2 text-sm text-gray-500">
        {post.publishedAt ? formatDate(post.publishedAt) : ""}
        {post.author?.name ? ` · ${post.author.name}` : ""}
      </p>

      {post.heroImage && (
        <div className="relative mt-6 aspect-video w-full overflow-hidden rounded-xl">
          <Image src={post.heroImage} alt={post.title} fill priority sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
        </div>
      )}

      <div className="mt-8 whitespace-pre-wrap text-lg leading-relaxed text-gray-800">{post.content}</div>

      <CommentsSection
        postId={post.id}
        allowComments={post.allowComments}
        initialComments={post.comments.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() }))}
      />
    </article>
  );
}
