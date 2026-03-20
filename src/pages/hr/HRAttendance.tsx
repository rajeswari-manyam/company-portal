import React from 'react';
import { useAttendance } from '../../modules/attendance/useAttendance';
import AttendanceTable from '../../modules/attendance/components/AttendanceTable';
import { StatCard, SearchInput, Card } from '../../components/ui';
import { PageHeader } from '../../components/common';
import Input from '../../components/ui/Input';

export default function HRAttendance() {
  const { filtered, search, setSearch, dateFilter, setDateFilter, stats, userNames, totalEmployees } = useAttendance();

  const statCards = [
    { label: 'Present', value: stats.present, icon: '✅', bg: 'bg-emerald-50', text: 'text-emerald-700' },
    { label: 'Late', value: stats.late, icon: '⏰', bg: 'bg-amber-50', text: 'text-amber-700' },
    { label: 'Half Day', value: stats.halfDay, icon: '🌓', bg: 'bg-blue-50', text: 'text-blue-700' },
    { label: 'Absent', value: Math.max(0, totalEmployees - stats.present - stats.late - stats.halfDay), icon: '❌', bg: 'bg-red-50', text: 'text-red-700' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" subtitle="Track employee attendance records" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map(s => <StatCard key={s.label} {...s} />)}
      </div>
      <Card padding={false}>
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search employee…" className="flex-1 min-w-[200px]" />
          <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-44" />
        </div>
        <AttendanceTable records={filtered} userNames={userNames} showEmployee />
      </Card>
    </div>
  );
}
