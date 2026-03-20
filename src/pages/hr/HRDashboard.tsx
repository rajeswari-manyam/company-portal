import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getUsers, getAllAttendance, getAllLeaves, getAnnouncements, getHolidays } from '../../data/store';
import { StatCard, Card, Badge } from '../../components/ui';
import { PageHeader } from '../../components/common';
import { formatDate, formatCurrency } from '../../utils/helpers';

export default function HRDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);

  const users = getUsers();
  const attendance = getAllAttendance();
  const leaves = getAllLeaves();
  const announcements = getAnnouncements();
  const holidays = getHolidays();

  const employees = users.filter(u => u.role === 'employee');
  const todayAtt = attendance.filter(a => a.date === today);
  const presentToday = todayAtt.filter(a => a.status === 'present' || a.status === 'late').length;
  const pendingLeaves = leaves.filter(l => l.status === 'pending');
  const upcomingHolidays = holidays.filter(h => h.date >= today).slice(0, 3);
  const recentLeaves = [...leaves].slice(0, 5);

  const stats = [
    { label: 'Total Employees', value: employees.length, icon: '👥', bg: 'bg-blue-50', text: 'text-blue-700', path: '/hr/employees' },
    { label: 'Present Today', value: presentToday, icon: '✅', bg: 'bg-emerald-50', text: 'text-emerald-700', path: '/hr/attendance' },
    { label: 'Pending Leaves', value: pendingLeaves.length, icon: '⏳', bg: 'bg-amber-50', text: 'text-amber-700', path: '/hr/leaves' },
    { label: 'Announcements', value: announcements.length, icon: '📢', bg: 'bg-rose-50', text: 'text-rose-700', path: '/hr/announcements' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user?.name?.split(' ')[0]} 👋`}
        subtitle="Here's your HR overview for today."
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(s => <StatCard key={s.label} {...s} onClick={() => navigate(s.path)} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding={false}>
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Recent Leave Requests</h3>
            <button onClick={() => navigate('/hr/leaves')} className="text-xs text-[#0B0E92] font-semibold hover:underline">View all</button>
          </div>
          <div className="divide-y divide-slate-50">
            {recentLeaves.length === 0 ? (
              <p className="text-center text-slate-400 py-8 text-sm">No leave requests</p>
            ) : recentLeaves.map(l => (
              <div key={l.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{l.userName}</p>
                  <p className="text-xs text-slate-400">{l.leaveType} · {l.days} day{l.days !== 1 ? 's' : ''}</p>
                </div>
                <Badge status={l.status} />
              </div>
            ))}
          </div>
        </Card>

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
