import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTimeTracking } from '../../context/TimeTrackingContext';
import { getAttendanceForUser, getLeavesForUser, getAnnouncements, getHolidays } from '../../data/store';
import { StatCard, Card, Badge } from '../../components/ui';
import { PageHeader } from '../../components/common';
import { formatDate } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const { workSeconds, completionPercent } = useTimeTracking();
  const navigate = useNavigate();

  const attendance = getAttendanceForUser(user?.id ?? '');
  const leaves = getLeavesForUser(user?.id ?? '');
  const announcements = getAnnouncements(user?.departmentId);
  const holidays = getHolidays();
  const today = new Date().toISOString().slice(0, 10);
  const upcomingHolidays = holidays.filter(h => h.date >= today).slice(0, 3);

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const stats = [
    { label: 'Days Present', value: attendance.filter(a => a.workSeconds > 14400).length, icon: '✅', bg: 'bg-emerald-50', text: 'text-emerald-700', path: '/employee/attendance' },
    { label: 'Leaves Taken', value: leaves.filter(l => l.status === 'approved').length, icon: '🌴', bg: 'bg-amber-50', text: 'text-amber-700', path: '/employee/leaves' },
    { label: "Today's Progress", value: `${completionPercent}%`, icon: '📊', bg: 'bg-blue-50', text: 'text-blue-700' },
    { label: 'Announcements', value: announcements.length, icon: '📢', bg: 'bg-violet-50', text: 'text-[#0B0E92]', path: '/employee/announcements' },
  ];

  const recentLeaves = [...leaves].slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-2xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #0B0E92, #69A6F0)' }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-black">
            {user?.name?.charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-black">
              Good {new Date().getHours() < 12 ? 'Morning' : 'Afternoon'}, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-blue-100 mt-0.5">{user?.designation} · {user?.department}</p>
          </div>
          <div className="hidden sm:flex flex-col items-end">
            <div className="font-mono text-2xl font-black text-white">{fmt(workSeconds)}</div>
            <p className="text-blue-200 text-xs mt-0.5">Time tracked today</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <StatCard key={s.label} {...s} onClick={s.path ? () => navigate(s.path!) : undefined} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leave History */}
        <Card padding={false}>
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">My Recent Leaves</h3>
            <button onClick={() => navigate('/employee/leaves')} className="text-xs text-[#0B0E92] font-semibold hover:underline">View all</button>
          </div>
          <div className="divide-y divide-slate-50">
            {recentLeaves.length === 0 ? (
              <p className="text-center text-slate-400 py-8 text-sm">No leave requests yet</p>
            ) : recentLeaves.map(l => (
              <div key={l.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{l.leaveType}</p>
                  <p className="text-xs text-slate-400">{formatDate(l.startDate)} · {l.days} day{l.days !== 1 ? 's' : ''}</p>
                </div>
                <Badge status={l.status} />
              </div>
            ))}
          </div>
        </Card>

        {/* Upcoming Holidays */}
        <Card padding={false}>
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Upcoming Holidays</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {upcomingHolidays.length === 0 ? (
              <p className="text-center text-slate-400 py-8 text-sm">No upcoming holidays</p>
            ) : upcomingHolidays.map(h => (
              <div key={h.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🎉</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{h.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{h.type}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-500 font-medium">{formatDate(h.date)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
