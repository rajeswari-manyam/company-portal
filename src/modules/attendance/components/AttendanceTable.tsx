// src/modules/attendance/components/AttendanceTable.tsx
//
// Works with the real-API AttendanceSummary shape.
// The only breaking change from the old version: `workSeconds` replaces the
// old field name if it was different — everything else is identical.

import React from 'react';
import { Table, Badge } from '../../../components/ui';
import type { Column } from '../../../components/ui/Table';
import type { AttendanceSummary } from '../useAttendance';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSeconds(s: number): string {
  if (!s) return '—';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const WORK_DAY_SEC = 8 * 3600; // 8-hour reference

function getCompletionPercent(workSeconds: number): number {
  return Math.min(Math.round((workSeconds / WORK_DAY_SEC) * 100), 100);
}

// ─── Component ────────────────────────────────────────────────────────────────

interface AttendanceTableProps {
  records: AttendanceSummary[];
  userNames: Record<string, string>;
  showEmployee?: boolean;
}

export default function AttendanceTable({
  records,
  userNames,
  showEmployee = true,
}: AttendanceTableProps) {

  const columns: Column<AttendanceSummary>[] = [
    ...(showEmployee
      ? [{
          key: 'userId' as keyof AttendanceSummary,
          header: 'Employee',
          render: (a: AttendanceSummary) => (
            <span className="font-semibold text-slate-800">
              {userNames[a.userId] ?? a.userId}
            </span>
          ),
        }]
      : []),
    {
      key: 'date',
      header: 'Date',
    },
    {
      key: 'checkIn',
      header: 'Check In',
      render: (a) => a.checkIn ?? '—',
    },
    {
      key: 'checkOut',
      header: 'Check Out',
      render: (a) => a.checkOut ?? '—',
    },
    {
      key: 'workSeconds',
      header: 'Hours Worked',
      render: (a) => formatSeconds(a.workSeconds),
    },
    {
      key: 'status',
      header: 'Status',
      render: (a) => <Badge status={a.status} />,
    },
    {
 
  key: 'completion', // ✅ UNIQUE KEY
  header: 'Completion',
      render: (a) => {
        const pct = getCompletionPercent(a.workSeconds);
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-slate-500">{pct}%</span>
          </div>
        );
      },
    },
  ];

  return (
    <Table<AttendanceSummary>
      columns={columns}
      data={records}
      keyExtractor={(a) => `${a.userId}-${a.date}-${a._id}`}
      emptyMessage="No attendance records found"
      emptyIcon="📅"
    />
  );
}