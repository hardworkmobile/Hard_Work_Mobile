"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Plus, Pencil, Trash2, Eye, EyeOff, MessageSquare } from "lucide-react";

type Row = {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  comments: number;
  createdAt: string;
};

export function BlogManager({ initialPosts }: { initialPosts: Row[] }) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [busy, setBusy] = useState<string | null>(null);

  async function togglePublish(p: Row) {
    setBusy(p.id);
    const res = await fetch(`/api/posts/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !p.published }),
    });
    setBusy(null);
    if (res.ok) {
      setPosts((prev) => prev.map((x) => (x.id === p.id ? { ...x, published: !x.published } : x)));
      router.refresh();
    }
  }

  async function remove(p: Row) {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    setBusy(p.id);
    const res = await fetch(`/api/posts/${p.id}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) setPosts((prev) => prev.filter((x) => x.id !== p.id));
  }

  return (
    <div className="max-w-5xl p-4 sm:p-8">
      <div className="mb-4 sm:mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Blog</h1>
        </div>
        <Link href="/admin/blog/new" className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New Post</span><span className="sm:hidden">New</span>
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-20 text-center text-gray-400">
          <FileText className="mx-auto mb-3 h-10 w-10 opacity-30" />
          <p className="font-medium text-gray-500">No posts yet</p>
          <p className="text-sm">Create your first post to get started.</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 sm:hidden">
            {posts.map((p) => (
              <div key={p.id} className={`rounded-lg border border-gray-200 p-4 ${busy === p.id ? "opacity-50" : ""}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate">{p.title}</p>
                    <p className="text-xs text-gray-400">/blog/{p.slug}</p>
                  </div>
                  <span className={`ml-2 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${p.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {p.published ? "Published" : "Draft"}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                  <MessageSquare className="h-3.5 w-3.5 text-gray-400" />{p.comments} comment{p.comments !== 1 ? "s" : ""}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => togglePublish(p)} className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
                    {p.published ? "Unpublish" : "Publish"}
                  </button>
                  <Link href={`/admin/blog/${p.id}/edit`} className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm text-center text-gray-600 hover:bg-gray-50">
                    Edit
                  </Link>
                  <button onClick={() => remove(p)} className="rounded-md border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-600">Title</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Comments</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {posts.map((p) => (
                  <tr key={p.id} className={busy === p.id ? "opacity-50" : "hover:bg-gray-50"}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{p.title}</p>
                      <p className="text-xs text-gray-400">/blog/{p.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${p.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {p.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="inline-flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5 text-gray-400" />{p.comments}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => togglePublish(p)} title={p.published ? "Unpublish" : "Publish"} className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100">
                          {p.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <Link href={`/admin/blog/${p.id}/edit`} title="Edit" className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100">
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button onClick={() => remove(p)} title="Delete" className="rounded-md p-1.5 text-red-500 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
