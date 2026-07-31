// ─── MyProjects Helpers ───────────────────────────────────────────────────────
import React from 'react';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import type { Task } from '../modules/projects/types';

export const todayISO = () => new Date().toISOString().split('T')[0];

export const toISO = (date: string, time: string) =>
  new Date(`${date}T${time}:00`).toISOString();

export const isEndOfDay = () => new Date().getHours() >= 17;

export function fmtTime(iso?: string | null): string {
  if (!iso) return '—';
  try {
    if (/^\d{2}:\d{2}/.test(iso)) return iso.slice(0, 5);
    return new Date(iso).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return String(iso);
  }
}

export function fmtDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function normaliseTask(raw: Record<string, unknown>, projectName = '—'): Task {
  const pid = raw.projectId;
  const day =
    (raw.day as string) ??
    (raw.createdAt as string)?.slice(0, 10) ??
    (raw.startTime as string)?.slice(0, 10) ??
    '';

  // ✅ Always resolve to real MongoDB _id for both id and _id fields
  const mongoId = ((raw._id || raw.id) as string) ?? '';

  return {
    id:          mongoId,
    _id:         mongoId,
    projectId:
      typeof pid === 'object'
        ? ((pid as Record<string, unknown>)?._id as string ?? '')
        : ((pid as string) ?? ''),
    projectName:
      typeof pid === 'object'
        ? ((pid as Record<string, unknown>)?.name as string ?? projectName)
        : projectName,
    employeeId:
      typeof raw.employeeId === 'object'
        ? ((raw.employeeId as Record<string, unknown>)?._id as string ?? '')
        : ((raw.employeeId as string) ?? ''),
    description: (raw.description as string) ?? '',
    startTime:   (raw.startTime   as string) ?? '',
    endTime:     (raw.endTime     as string) ?? '',
    day,
    progress:    (raw.progress as string) ?? null,
    reason:      (raw.reason   as string) ?? null,
  };
}

// ─── Progress badge config ────────────────────────────────────────────────────
export const PROGRESS_CFG: Record<
  string,
  { bg: string; text: string; border: string; icon: React.ReactNode; dot: string }
> = {
  Completed: {
    bg:     'bg-emerald-50',
    text:   'text-emerald-700',
    border: 'border-emerald-200',
    icon:   React.createElement(CheckCircle2, { size: 11 }),
    dot:    'bg-emerald-400',
  },
  'In Progress': {
    bg:     'bg-blue-50',
    text:   'text-blue-700',
    border: 'border-blue-200',
    icon:   React.createElement(Clock, { size: 11 }),
    dot:    'bg-blue-400',
  },
  'Not Completed': {
    bg:     'bg-rose-50',
    text:   'text-rose-600',
    border: 'border-rose-200',
    icon:   React.createElement(AlertTriangle, { size: 11 }),
    dot:    'bg-rose-400',
  },
  Pending: {
    bg:     'bg-slate-50',
    text:   'text-slate-500',
    border: 'border-slate-200',
    icon:   React.createElement(Clock, { size: 11 }),
    dot:    'bg-slate-300',
  },
};