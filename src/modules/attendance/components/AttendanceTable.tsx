import React from 'react';
import { Table, Badge } from '../../../components/ui';
import type { Column } from '../../../components/ui/Table';
import type { AttendanceSummary } from '../../../types';
import { AttendanceService } from '../AttendanceService';

interface AttendanceTableProps {
  records: AttendanceSummary[];
  userNames: Record<string, string>;
  showEmployee?: boolean;
}

export default function AttendanceTable({ records, userNames, showEmployee = true }: AttendanceTableProps) {
  const columns: Column<AttendanceSummary>[] = [
    ...(showEmployee ? [{
      key: 'userId',
      header: 'Employee',
      render: (a: AttendanceSummary) => (
        <span className="font-semibold text-slate-800">{userNames[a.userId] ?? a.userId}</span>
      ),
    }] : []),
    { key: 'date', header: 'Date' },
    { key: 'checkIn', header: 'Check In', render: (a) => a.checkIn ?? '—' },
    { key: 'checkOut', header: 'Check Out', render: (a) => a.checkOut ?? '—' },
    { key: 'workSeconds', header: 'Hours Worked', render: (a) => AttendanceService.formatSeconds(a.workSeconds) },
    { key: 'status', header: 'Status', render: (a) => <Badge status={a.status} /> },
    {
      key: 'completion',
      header: 'Completion',
      render: (a) => {
        const pct = AttendanceService.getCompletionPercent(a.workSeconds);
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
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
      keyExtractor={(a) => `${a.userId}-${a.date}`}
      emptyMessage="No attendance records found"
      emptyIcon="📅"
    />
  );
}
