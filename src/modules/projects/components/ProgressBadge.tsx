// ─── ProgressBadge ────────────────────────────────────────────────────────────
import React from 'react';
import { PROGRESS_CFG } from "../../../utils/projecthelper";

interface ProgressBadgeProps {
  value?: string | null;
}

export default function ProgressBadge({ value }: ProgressBadgeProps) {
  const cfg = PROGRESS_CFG[value ?? 'Pending'] ?? PROGRESS_CFG['Pending'];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      {cfg.icon}
      {value ?? 'Pending'}
    </span>
  );
}