import React from "react";

interface TabSelectorProps {
  tab: "filtered" | "all";
  counts: { filtered: number; all: number };
  onChange: (tab: "filtered" | "all") => void;
  month: string;
}

export default function TabSelector({ tab, counts, onChange, month }: TabSelectorProps) {
  return (
    <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 w-fit">
      {(["filtered", "all"] as const).map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`rounded-lg px-4 py-2 text-xs font-bold transition-all duration-200
            ${tab === t
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
              : "text-slate-500 hover:text-slate-700"
            }`}
        >
          {t === "filtered" ? `${month} (${counts.filtered})` : `All Payslips (${counts.all})`}
        </button>
      ))}
    </div>
  );
}