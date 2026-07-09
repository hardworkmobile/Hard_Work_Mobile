"use client";

import { useState } from "react";
import { Wifi } from "lucide-react";

interface Props {
  invoiceId: string;
}

export function TerminalButton({ invoiceId }: Props) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSend() {
    if (!confirm("Send payment request to your Square Terminal?")) return;
    setState("sending");

    const res = await fetch(`/api/invoices/${invoiceId}/terminal-checkout`, { method: "POST" });

    if (!res.ok) {
      let msg: string;
      try {
        const data = await res.json();
        const detail = data.detail ? `\n${JSON.stringify(data.detail, null, 2)}` : "";
        msg = (data.error ?? `HTTP ${res.status}`) + detail;
      } catch {
        msg = `HTTP ${res.status} — ${res.statusText}`;
      }
      setErrorMsg(msg);
      setState("error");
      return;
    }

    setState("sent");
  }

  if (state === "sent") {
    return (
      <div className="flex items-center gap-1.5 rounded-md bg-green-50 border border-green-200 px-3 py-1.5 text-sm font-medium text-green-700">
        <Wifi className="h-4 w-4" />
        Waiting for payment…
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="max-w-md">
        <button
          onClick={() => setState("idle")}
          className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Terminal error — retry
        </button>
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {errorMsg}
        </pre>
      </div>
    );
  }

  return (
    <button
      onClick={handleSend}
      disabled={state === "sending"}
      className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
    >
      <Wifi className="h-4 w-4" />
      {state === "sending" ? "Sending…" : "Send to Terminal"}
    </button>
  );
}
