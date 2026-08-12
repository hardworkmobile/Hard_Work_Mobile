"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Send, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_MEDIA = 10;

type Photo = { id: string; url: string; label?: string; source: "job" | "inspection" };

export function PhotoMessenger({
  workOrderId,
  initialPhotos,
  customerFirstName,
  smsOptIn,
  hasEmail,
}: {
  workOrderId: string;
  initialPhotos: Photo[];
  customerFirstName: string;
  smsOptIn: boolean;
  hasEmail: boolean;
}) {
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ text: string; error?: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function toggle(url: string) {
    setResult(null);
    setSelected((prev) =>
      prev.includes(url)
        ? prev.filter((u) => u !== url)
        : prev.length >= MAX_MEDIA
          ? prev
          : [...prev, url]
    );
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/work-orders/${workOrderId}/photos`, { method: "POST", body: form });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setResult({ text: body.error ?? "Upload failed.", error: true });
        return;
      }
      const photo = await res.json();
      setPhotos((prev) => [...prev, { id: photo.id, url: photo.url, source: "job" }]);
      setSelected((prev) => (prev.length < MAX_MEDIA ? [...prev, photo.url] : prev));
      router.refresh();
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function removePhoto(photo: Photo) {
    if (photo.source !== "job") return;
    if (!confirm("Delete this photo?")) return;
    const res = await fetch(`/api/work-orders/${workOrderId}/photos/${photo.id}`, { method: "DELETE" });
    if (res.ok) {
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      setSelected((prev) => prev.filter((u) => u !== photo.url));
      router.refresh();
    }
  }

  async function send() {
    setSending(true);
    setResult(null);
    try {
      const res = await fetch(`/api/work-orders/${workOrderId}/send-photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrls: selected, message: message.trim() || undefined }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResult({ text: body.error ?? "Couldn't send photos.", error: true });
        return;
      }
      const channels = [body.smsSent && "text", body.emailSent && "email"].filter(Boolean).join(" and ");
      setResult({
        text:
          `Sent ${body.photoCount} photo${body.photoCount === 1 ? "" : "s"} to ${customerFirstName} by ${channels}.` +
          (!body.smsSent && body.smsSkippedReason ? ` (No text — ${body.smsSkippedReason}.)` : ""),
      });
      setSelected([]);
      setMessage("");
      router.refresh();
    } finally {
      setSending(false);
    }
  }

  const noChannel = !smsOptIn && !hasEmail;

  return (
    <section className="rounded-lg border border-gray-200 p-5">
      <div className="mb-1 flex items-center gap-2">
        <ImageIcon className="h-4 w-4 text-gray-400" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Photos for Customer</h2>
      </div>
      <p className="mb-4 text-xs text-gray-400">
        {noChannel
          ? "This customer has no email and hasn't opted into texts — add contact info to send photos."
          : smsOptIn
            ? "Sent by text and email."
            : "Sent by email — this customer hasn't opted into text messages."}
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleUpload}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {photos.map((photo) => {
          const isSelected = selected.includes(photo.url);
          return (
            <div key={photo.id} className="relative">
              <button
                type="button"
                onClick={() => toggle(photo.url)}
                className={cn(
                  "block h-20 w-20 overflow-hidden rounded-lg border-2 transition-all",
                  isSelected ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200 hover:border-gray-300"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt="" className="h-full w-full object-cover" />
              </button>
              {isSelected && (
                <span className="pointer-events-none absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[11px] font-bold text-white">
                  {selected.indexOf(photo.url) + 1}
                </span>
              )}
              {photo.source === "job" && (
                <button
                  type="button"
                  onClick={() => removePhoto(photo)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow"
                  aria-label="Delete photo"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500 disabled:opacity-50"
        >
          {uploading ? (
            <span className="text-xs">…</span>
          ) : (
            <>
              <Camera className="h-5 w-5" />
              <span className="text-[10px]">Add</span>
            </>
          )}
        </button>
      </div>

      {photos.length === 0 && (
        <p className="mb-4 text-xs text-gray-400">
          No photos yet — take one of the finished work, or add photos during an inspection.
        </p>
      )}

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Optional note — e.g. “Here's the old brake pad next to the new one.”"
        rows={2}
        className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={send}
          disabled={sending || selected.length === 0 || noChannel}
          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {sending ? "Sending…" : `Send ${selected.length || ""} to Customer`.replace("  ", " ")}
        </button>
        {selected.length >= MAX_MEDIA && (
          <span className="text-xs text-gray-400">Max {MAX_MEDIA} per message</span>
        )}
      </div>

      {result && (
        <p className={cn("mt-3 text-xs", result.error ? "text-red-600" : "text-green-600")}>{result.text}</p>
      )}
    </section>
  );
}
