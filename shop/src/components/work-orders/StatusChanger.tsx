"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkOrderStatus } from "@/generated/prisma";
import { TimeSlotPicker } from "./TimeSlotPicker";

const NEXT_STATUS: Partial<Record<WorkOrderStatus, WorkOrderStatus>> = {
  PENDING:     "SCHEDULED",
  SCHEDULED:   "IN_PROGRESS",
  IN_PROGRESS: "COMPLETED",
};

const NEXT_LABEL: Partial<Record<WorkOrderStatus, string>> = {
  PENDING:     "Mark Scheduled",
  SCHEDULED:   "Start Job",
  IN_PROGRESS: "Mark Complete",
};

export function StatusChanger({
  workOrderId,
  currentStatus,
  invoiceVoided = false,
  hasSchedule = false,
}: {
  workOrderId: string;
  currentStatus: WorkOrderStatus;
  invoiceVoided?: boolean;
  hasSchedule?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [showSchedulePrompt, setShowSchedulePrompt] = useState(false);
  const [promptDate, setPromptDate] = useState("");
  const [promptSlot, setPromptSlot] = useState("");

  const nextStatus = NEXT_STATUS[currentStatus];
  const label = NEXT_LABEL[currentStatus];

  async function patchStatus(status: WorkOrderStatus) {
    const res = await fetch(`/api/work-orders/${workOrderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return null;
    return res.json();
  }

  async function confirmSchedule() {
    if (!promptDate || !promptSlot) return;
    setLoading(true);
    setMessage(null);

    const putRes = await fetch(`/api/work-orders/${workOrderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledDate: promptDate, scheduledTimeSlot: promptSlot }),
    });
    if (!putRes.ok) {
      setMessage({ text: "Couldn't save the date/time. Try again.", error: true });
      setLoading(false);
      return;
    }

    const updated = await patchStatus("SCHEDULED");
    setLoading(false);
    setShowSchedulePrompt(false);
    if (!updated) {
      setMessage({ text: "Couldn't update status. Try again.", error: true });
      return;
    }
    setMessage(
      updated.googleEventId
        ? { text: "Scheduled — added to Google Calendar." }
        : { text: "Scheduled — but couldn't sync to Google Calendar. Check your calendar setup.", error: true }
    );
    router.refresh();
  }

  async function handleCancel() {
    if (!confirm("Cancel this work order?")) return;
    setLoading(true);
    await fetch(`/api/work-orders/${workOrderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    router.refresh();
    setLoading(false);
  }

  async function advance() {
    if (!nextStatus) return;

    // Scheduling needs a date/time to put on the calendar — prompt for one
    // instead of silently scheduling with nothing to sync.
    if (nextStatus === "SCHEDULED" && !hasSchedule) {
      setShowSchedulePrompt(true);
      return;
    }

    setLoading(true);
    setMessage(null);
    const updated = await patchStatus(nextStatus);
    setLoading(false);
    if (!updated) {
      setMessage({ text: "Couldn't update status. Try again.", error: true });
      return;
    }
    if (nextStatus === "SCHEDULED") {
      setMessage(
        updated.googleEventId
          ? { text: "Scheduled — added to Google Calendar." }
          : { text: "Scheduled — but couldn't sync to Google Calendar. Check your calendar setup.", error: true }
      );
    }
    router.refresh();
  }

  async function createInvoice() {
    setLoading(true);
    const res = await fetch(`/api/work-orders/${workOrderId}/invoice`, { method: "POST" });
    if (res.ok) {
      const inv = await res.json();
      router.push(`/invoices/${inv.id}`);
    } else {
      const err = await res.json();
      alert(err.error ?? "Failed to create invoice.");
    }
    setLoading(false);
  }

  async function markPaidCash() {
    if (!confirm("Mark this work order as paid (cash)?")) return;
    setLoading(true);
    await fetch(`/api/work-orders/${workOrderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAID" }),
    });
    router.refresh();
    setLoading(false);
  }

  if (currentStatus === "PAID" || currentStatus === "CANCELLED") return null;

  const showCashButton = currentStatus === "COMPLETED" || currentStatus === "INVOICED";
  const canCreateInvoice =
    currentStatus === "COMPLETED" || (currentStatus === "INVOICED" && invoiceVoided);

  if (showSchedulePrompt) {
    return (
      <div className="w-full max-w-sm space-y-2 rounded-lg border border-gray-200 bg-white p-3">
        <p className="text-xs font-medium text-gray-500">When is this job scheduled?</p>
        <Input type="date" value={promptDate} onChange={(e) => setPromptDate(e.target.value)} />
        <TimeSlotPicker value={promptSlot} onChange={setPromptSlot} />
        <div className="flex gap-2 pt-1">
          <Button onClick={confirmSchedule} disabled={loading || !promptDate || !promptSlot}>
            {loading ? "Scheduling…" : "Confirm Schedule"}
          </Button>
          <Button variant="ghost" onClick={() => setShowSchedulePrompt(false)} disabled={loading}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        {canCreateInvoice && (
          <Button onClick={createInvoice} disabled={loading}>
            {loading ? "Creating…" : invoiceVoided ? "Create New Invoice" : "Create Invoice"}
          </Button>
        )}
        {nextStatus && label && currentStatus !== "COMPLETED" && (
          <Button onClick={advance} disabled={loading}>
            {loading ? "Updating…" : label}
          </Button>
        )}
        {showCashButton && (
          <Button variant="secondary" onClick={markPaidCash} disabled={loading}>
            {loading ? "Updating…" : "Mark Paid (Cash)"}
          </Button>
        )}
        {!["INVOICED", "COMPLETED"].includes(currentStatus) && (
          <Button variant="ghost" onClick={handleCancel} disabled={loading} className="text-red-600 hover:bg-red-50 hover:text-red-700">
            Cancel Job
          </Button>
        )}
      </div>
      {message && (
        <p className={`mt-1.5 text-xs ${message.error ? "text-red-600" : "text-green-600"}`}>{message.text}</p>
      )}
    </div>
  );
}
