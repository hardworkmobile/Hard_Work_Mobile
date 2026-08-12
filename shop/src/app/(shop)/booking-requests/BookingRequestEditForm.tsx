"use client";

import { useState } from "react";
import { TimeSlotPicker } from "@/components/work-orders/TimeSlotPicker";

const SERVICES = [
  "Vehicle Diagnostics / Check Engine Light",
  "Brake Repair",
  "Engine Repair",
  "Scheduled Maintenance",
  "Suspension Repair",
  "Electrical Repair",
  "Oil Change",
  "Pre-Purchase Inspection",
  "Other",
];

export type EditableBooking = {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicleYear: number;
  vehicleMake: string;
  vehicleModel: string;
  service: string;
  serviceOther?: string | null;
  issueDetails?: string | null;
  preferredDate: string;
  preferredTimeSlot: "MORNING" | "AFTERNOON" | "EVENING";
  serviceAddress: string;
};

const inputCls =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400";
const labelCls = "mb-1 block text-xs font-semibold text-gray-500";

export function BookingRequestEditForm({
  booking,
  onSaved,
  onCancel,
}: {
  booking: EditableBooking;
  onSaved: (updated: EditableBooking) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: booking.name,
    email: booking.email,
    phone: booking.phone,
    vehicleYear: String(booking.vehicleYear),
    vehicleMake: booking.vehicleMake,
    vehicleModel: booking.vehicleModel,
    service: booking.service,
    serviceOther: booking.serviceOther ?? "",
    issueDetails: booking.issueDetails ?? "",
    preferredDate: booking.preferredDate.slice(0, 10),
    preferredTimeSlot: booking.preferredTimeSlot,
    serviceAddress: booking.serviceAddress,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/booking-requests/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          vehicleYear: Number(form.vehicleYear),
          serviceOther: form.serviceOther || null,
          issueDetails: form.issueDetails || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Couldn't save changes.");
        return;
      }
      const updated = await res.json();
      onSaved(updated);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Name</label>
          <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Phone</label>
          <input className={inputCls} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Email</label>
          <input className={inputCls} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Vehicle Year</label>
          <input className={inputCls} type="number" value={form.vehicleYear} onChange={(e) => set("vehicleYear", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Make</label>
          <input className={inputCls} value={form.vehicleMake} onChange={(e) => set("vehicleMake", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Model</label>
          <input className={inputCls} value={form.vehicleModel} onChange={(e) => set("vehicleModel", e.target.value)} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Service</label>
        <select className={inputCls} value={form.service} onChange={(e) => set("service", e.target.value)}>
          {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {form.service === "Other" && (
        <div>
          <label className={labelCls}>Describe the service</label>
          <input className={inputCls} value={form.serviceOther} onChange={(e) => set("serviceOther", e.target.value)} />
        </div>
      )}

      <div>
        <label className={labelCls}>Issue details</label>
        <textarea
          className={inputCls + " resize-none"}
          rows={2}
          value={form.issueDetails}
          onChange={(e) => set("issueDetails", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Preferred Date</label>
          <input className={inputCls} type="date" value={form.preferredDate} onChange={(e) => set("preferredDate", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Service Address</label>
          <input className={inputCls} value={form.serviceAddress} onChange={(e) => set("serviceAddress", e.target.value)} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Time Slot</label>
        <TimeSlotPicker value={form.preferredTimeSlot} onChange={(v) => set("preferredTimeSlot", v as typeof form.preferredTimeSlot)} />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
