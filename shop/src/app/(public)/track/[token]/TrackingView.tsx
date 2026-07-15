"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, Marker } from "leaflet";

type TrackData = {
  phase: "en_route" | "arrived" | "ended";
  enRouteAt: string;
  address: string | null;
  mechanic: { lat: number; lng: number; updatedAt: string | null } | null;
  dest: { lat: number; lng: number } | null;
  distanceMiles: number | null;
};

const POLL_MS = 8000;
const STALE_MS = 3 * 60 * 1000;

export function TrackingView({ token }: { token: string }) {
  const [data, setData] = useState<TrackData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const mechanicMarkerRef = useRef<Marker | null>(null);
  const didFitRef = useRef(false);

  // Poll the tracking feed.
  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const res = await fetch(`/api/track/${token}`);
        if (cancelled) return;
        if (res.status === 404) { setNotFound(true); return; }
        if (res.ok) setData(await res.json());
      } catch {
        // transient — keep last known state
      }
    }
    tick();
    const t = setInterval(tick, POLL_MS);
    return () => { cancelled = true; clearInterval(t); };
  }, [token]);

  // Build / update the map as data arrives.
  useEffect(() => {
    if (!data || data.phase !== "en_route" || !mapDivRef.current) return;
    if (!data.mechanic && !data.dest) return;

    let disposed = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (disposed || !mapDivRef.current) return;

      const dot = (color: string, size: number) =>
        L.divIcon({
          className: "",
          html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4);"></div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

      if (!mapRef.current) {
        const center = data.mechanic ?? data.dest!;
        mapRef.current = L.map(mapDivRef.current).setView([center.lat, center.lng], 12);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(mapRef.current);

        if (data.dest) {
          L.marker([data.dest.lat, data.dest.lng], { icon: dot("#1e2833", 18) })
            .addTo(mapRef.current)
            .bindPopup("Your location");
        }
      }

      if (data.mechanic) {
        if (!mechanicMarkerRef.current) {
          mechanicMarkerRef.current = L.marker([data.mechanic.lat, data.mechanic.lng], {
            icon: dot("#d4af37", 22),
          })
            .addTo(mapRef.current)
            .bindPopup("Your mechanic");
        } else {
          mechanicMarkerRef.current.setLatLng([data.mechanic.lat, data.mechanic.lng]);
        }

        if (!didFitRef.current && data.dest) {
          mapRef.current.fitBounds(
            [
              [data.mechanic.lat, data.mechanic.lng],
              [data.dest.lat, data.dest.lng],
            ],
            { padding: [40, 40] }
          );
          didFitRef.current = true;
        }
      }
    })();

    return () => { disposed = true; };
  }, [data]);

  // Tear the map down on unmount.
  useEffect(() => () => { mapRef.current?.remove(); mapRef.current = null; }, []);

  if (notFound) {
    return (
      <Shell>
        <p className="text-center text-gray-500">This tracking link is no longer active.</p>
      </Shell>
    );
  }

  if (!data) {
    return (
      <Shell>
        <p className="text-center text-gray-400">Loading tracking…</p>
      </Shell>
    );
  }

  if (data.phase === "arrived") {
    return (
      <Shell>
        <div className="text-center">
          <p className="text-3xl mb-3">🔧</p>
          <h2 className="text-xl font-bold text-[#1e2833]">Your mechanic has arrived!</h2>
          <p className="mt-2 text-gray-500">Work on your vehicle is underway.</p>
        </div>
      </Shell>
    );
  }

  if (data.phase === "ended") {
    return (
      <Shell>
        <p className="text-center text-gray-500">This service visit is complete. Thanks for choosing Hard Work Mobile!</p>
      </Shell>
    );
  }

  const stale =
    !data.mechanic?.updatedAt ||
    Date.now() - new Date(data.mechanic.updatedAt).getTime() > STALE_MS;

  return (
    <Shell>
      <div className="mb-4 text-center">
        <h2 className="text-xl font-bold text-[#1e2833]">Your mechanic is on the way</h2>
        <p className="mt-1 text-sm text-gray-500">
          {stale
            ? "Waiting for a location signal…"
            : data.distanceMiles != null
              ? `About ${data.distanceMiles} mi from you · updates live`
              : "Location updating live"}
        </p>
        {data.address && <p className="mt-1 text-xs text-gray-400">Heading to {data.address}</p>}
      </div>
      {(data.mechanic || data.dest) ? (
        <div ref={mapDivRef} className="h-[420px] w-full overflow-hidden rounded-xl ring-1 ring-gray-200" />
      ) : (
        <p className="py-16 text-center text-gray-400">Waiting for the first location update…</p>
      )}
      <p className="mt-4 text-center text-xs text-gray-400">
        Questions? Call or text{" "}
        <a href="tel:4845933875" className="font-semibold text-[#1e2833] hover:underline">(484) 593-3875</a>
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">{children}</div>
    </section>
  );
}
