import { useState } from 'react';
import {
  getUsers, getDepartments, getAllAttendance, getAllLeaves,
  getAllPayslips, getPerformanceReviews,
} from '../../data/store';
import { Card } from '../../components/ui';
import { PageHeader } from '../../components/common';
import { formatCurrency } from '../../utils/helpers';

type Tab = 'overview' | 'attendance' | 'payroll' | 'departments';

export default function AdminReports() {
  const [tab, setTab] = useState<Tab>('overview');
  const today = new Date().toISOString().slice(0, 10);

  const users = getUsers();
  const departments = getDepartments();
  const attendance = getAllAttendance();
  const leaves = getAllLeaves();
  const payslips = getAllPayslips();
  const reviews = getPerformanceReviews();

  const employees = users.filter(u => u.role === 'employee');
  const presentToday = attendance.filter(a => a.date === today && (a.status === 'present' || a.status === 'late')).length;
  const attendanceRate = employees.length ? Math.round((presentToday / employees.length) * 100) : 0;
  const totalPayroll = payslips.reduce((s, p) => s + p.netSalary, 0);
  const avgSalary = employees.length ? Math.round(employees.reduce((s, e) => s + (e.salary || 0), 0) / employees.length) : 0;

  const leaveByType = leaves.reduce((acc: Record<string, number>, l) => {
    acc[l.leaveType] = (acc[l.leaveType] || 0) + 1;
    return acc;
  }, {});

  const deptHeadcount = departments.map(d => ({
    name: d.name,
    count: employees.filter(e => e.department === d.name).length,
    head: d.head,
  })).sort((a, b) => b.count - a.count);

  const perfDist = [
    { label: 'Excellent (≥4.5)', count: reviews.filter(r => r.rating >= 4.5).length, color: 'bg-emerald-500' },
    { label: 'Good (3–4.5)', count: reviews.filter(r => r.rating >= 3 && r.rating < 4.5).length, color: 'bg-blue-500' },
    { label: 'Average (2–3)', count: reviews.filter(r => r.rating >= 2 && r.rating < 3).length, color: 'bg-amber-500' },
    { label: 'Needs Work (<2)', count: reviews.filter(r => r.rating < 2).length, color: 'bg-red-500' },
  ];

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: '📊 Overview' },
    { key: 'attendance', label: '📅 Attendance' },
    { key: 'payroll', label: '💰 Payroll' },
    { key: 'departments', label: '🏢 Departments' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Analytics" subtitle="Company-wide insights and statistics" />

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t.key ? 'bg-[#0B0E92] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Employees', value: employees.length, icon: '👥', color: 'text-blue-700' },
            { label: 'Departments', value: departments.length, icon: '🏢', color: 'text-indigo-700' },
            { label: 'Today Attendance', value: `${attendanceRate}%`, icon: '✅', color: 'text-emerald-700' },
            { label: 'Pending Leaves', value: leaves.filter(l => l.status === 'pending').length, icon: '⏳', color: 'text-amber-700' },
            { label: 'Total Payroll', value: formatCurrency(totalPayroll), icon: '💰', color: 'text-emerald-700' },
            { label: 'Avg Salary', value: formatCurrency(avgSalary), icon: '📊', color: 'text-violet-700' },
            { label: 'Leave Requests', value: leaves.length, icon: '🌴', color: 'text-blue-700' },
            { label: 'Perf Reviews', value: reviews.length, icon: '⭐', color: 'text-amber-700' },
          ].map(s => (
            <Card key={s.label}>
              <p className="text-2xl mb-2">{s.icon}</p>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">{s.label}</p>
            </Card>
          ))}
        </div>
      )}

      {tab === 'attendance' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Present Today', value: attendance.filter(a => a.date === today && a.status === 'present').length, color: 'text-emerald-700' },
              { label: 'Late Today', value: attendance.filter(a => a.date === today && a.status === 'late').length, color: 'text-amber-700' },
              { label: 'Half Day', value: attendance.filter(a => a.date === today && a.status === 'half-day').length, color: 'text-blue-700' },
              { label: 'Attendance Rate', value: `${attendanceRate}%`, color: 'text-[#0B0E92]' },
            ].map(s => (
              <Card key={s.label} className="text-center">
                <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </Card>
            ))}
          </div>
          <Card>
            <h3 className="font-bold text-slate-800 mb-4">Leave by Type</h3>
            <div className="space-y-3">
              {Object.entries(leaveByType).map(([type, count]) => {
                const max = Math.max(...Object.values(leaveByType));
                const pct = max > 0 ? (count / max) * 100 : 0;
                return (
                  <div key={type} className="flex items-center gap-3">
                    <p className="text-sm text-slate-600 w-36 flex-shrink-0">{type}</p>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#0B0E92] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-sm font-bold text-slate-700 w-8 text-right">{count}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {tab === 'payroll' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Payroll', value: formatCurrency(totalPayroll), color: 'text-emerald-700' },
              { label: 'Avg Salary', value: formatCurrency(avgSalary), color: 'text-blue-700' },
              { label: 'Payslips Generated', value: payslips.length, color: 'text-violet-700' },
            ].map(s => (
              <Card key={s.label} className="text-center">
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </Card>
            ))}
          </div>
          <Card>
            <h3 className="font-bold text-slate-800 mb-4">Performance Distribution</h3>
            <div className="space-y-3">
              {perfDist.map(p => {
                const pct = reviews.length > 0 ? Math.round((p.count / reviews.length) * 100) : 0;
                return (
                  <div key={p.label} className="flex items-center gap-3">
                    <p className="text-sm text-slate-600 w-40 flex-shrink-0">{p.label}</p>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${p.color}`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-sm font-bold text-slate-700 w-8 text-right">{p.count}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {tab === 'departments' && (
        <Card>
          <h3 className="font-bold text-slate-800 mb-4">Headcount by Department</h3>
          <div className="space-y-3">
            {deptHeadcount.map(d => {
              const max = Math.max(...deptHeadcount.map(x => x.count), 1);
              return (
                <div key={d.name} className="flex items-center gap-3">
                  <div className="w-36 flex-shrink-0">
                    <p className="text-sm font-semibold text-slate-700">{d.name}</p>
                    <p className="text-xs text-slate-400">{d.head}</p>
                  </div>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#69A6F0] rounded-full" style={{ width: `${(d.count / max) * 100}%` }} />
                  </div>
                  <p className="text-sm font-bold text-slate-700 w-8 text-right">{d.count}</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
