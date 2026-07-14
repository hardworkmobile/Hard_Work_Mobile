"use client";

import { cn } from "@/lib/utils";

const SLOTS = [
  { value: "MORNING", label: "Morning", desc: "8 AM – 12 PM" },
  { value: "AFTERNOON", label: "Afternoon", desc: "12 PM – 5 PM" },
  { value: "EVENING", label: "Evening", desc: "5 PM – 7 PM" },
] as const;

export function TimeSlotPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {SLOTS.map((s) => {
        const selected = value === s.value;
        return (
          <button
            key={s.value}
            type="button"
            onClick={() => onChange(s.value)}
            className={cn(
              "rounded-lg border-2 px-2 py-2 text-center transition-colors",
              selected ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"
            )}
          >
            <p className="text-xs font-semibold text-gray-800">{s.label}</p>
            <p className="text-[10px] text-gray-400">{s.desc}</p>
          </button>
        );
      })}
    </div>
  );
}
