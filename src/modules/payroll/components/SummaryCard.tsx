import React from "react";

interface SummaryCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
}

export default function SummaryCard({ label, value, icon, gradient }: SummaryCardProps) {
  return (
    <div className={`group relative overflow-hidden rounded-2xl p-5 ${gradient} shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-default`}>
      <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-150" />
      <div className="relative z-10 flex items-start gap-4">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 text-xl shadow-inner">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-black tracking-tight text-white">{value}</p>
          <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-white/70">{label}</p>
        </div>
      </div>
    </div>
  );
}