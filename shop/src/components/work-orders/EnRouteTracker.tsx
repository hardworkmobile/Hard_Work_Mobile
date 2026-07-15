"use client";

import { useEffect, useRef, useState } from "react";
import { Navigation, X } from "lucide-react";

// "I'm En Route" — notifies the customer with a tracking link, then streams
// this phone's GPS to the server while the page stays open. Sharing stops
// when the mechanic taps Stop (or leaves the page); the customer's tracking
// page flips to "arrived" when the job is started via the existing Start Job.
export function EnRouteTracker({ workOrderId, alreadyEnRoute }: { workOrderId: string; alreadyEnRoute: boolean }) {
  const [sharing, setSharing] = useState(false);
  const [starting, setStarting] = useState(false);
  const [notice, setNotice] = useState<string | null>(
    alreadyEnRoute ? "Customer was already notified. Tap to resume sharing your location." : null
  );
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef(0);

  function stopSharing() {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setSharing(false);
  }

  // Stop the GPS watch when navigating away.
  useEffect(() => stopSharing, []);

  function beginWatch() {
    if (!("geolocation" in navigator)) {
      setError("This device doesn't support location sharing.");
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        // Throttle server pings to one per 15s — plenty for a live map.
        const now = Date.now();
        if (now - lastSentRef.current < 15000) return;
        lastSentRef.current = now;
        void fetch(`/api/work-orders/${workOrderId}/location`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        });
      },
      (err) => {
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied — enable it in your browser settings to share your position."
            : "Couldn't read your location."
        );
        stopSharing();
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
    setSharing(true);
  }

  async function start() {
    setStarting(true);
    setError(null);
    try {
      if (!alreadyEnRoute || !sharing) {
        const res = await fetch(`/api/work-orders/${workOrderId}/en-route`, { method: "POST" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error ?? "Couldn't start en-route tracking.");
          return;
        }
        const data = await res.json();
        setNotice(
          data.smsSent
            ? "Customer notified by text and email."
            : data.emailSent
              ? "Customer notified by email (no SMS opt-in on file)."
              : "Tracking started — customer has no contact info on file."
        );
      }
      beginWatch();
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
      {sharing ? (
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-sm font-semibold text-indigo-800">
            <Navigation className="h-4 w-4 animate-pulse" />
            Sharing your live location…
          </p>
          <p className="text-xs text-indigo-600">
            Keep this page open while driving. When you arrive, tap <strong>Start Job</strong> above to end tracking.
          </p>
          <button
            onClick={stopSharing}
            className="flex items-center gap-1 rounded-md border border-indigo-300 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
          >
            <X className="h-3.5 w-3.5" /> Stop sharing
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            onClick={start}
            disabled={starting}
            className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            <Navigation className="h-4 w-4" />
            {starting ? "Starting…" : alreadyEnRoute ? "Resume Location Sharing" : "I'm En Route — Notify Customer"}
          </button>
          {notice && <p className="text-xs text-indigo-700">{notice}</p>}
        </div>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
