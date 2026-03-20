import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../modules/attendance/useAttendance';
import AttendanceTable from '../../modules/attendance/components/AttendanceTable';
import { StatCard, Card } from '../../components/ui';
import { PageHeader } from '../../components/common';

export default function MyAttendance() {
  const { user } = useAuth();
  const { filtered, stats, records } = useAttendance(user?.id);

  const statCards = [
    { label: 'Present', value: stats.present, icon: '✅', bg: 'bg-emerald-50', text: 'text-emerald-700' },
    { label: 'Late', value: stats.late, icon: '⏰', bg: 'bg-amber-50', text: 'text-amber-700' },
    { label: 'Half Day', value: stats.halfDay, icon: '🌓', bg: 'bg-blue-50', text: 'text-blue-700' },
    { label: 'Total Records', value: records.length, icon: '📋', bg: 'bg-slate-50', text: 'text-slate-700' },
  ];

  const userNames = user ? { [user.id]: user.name } : {};

  return (
    <div className="space-y-6">
      <PageHeader title="My Attendance" subtitle="View your attendance history" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map(s => <StatCard key={s.label} {...s} />)}
      </div>
      <Card padding={false}>
        <AttendanceTable records={filtered} userNames={userNames} showEmployee={false} />
      </Card>
    </div>
  );
}
