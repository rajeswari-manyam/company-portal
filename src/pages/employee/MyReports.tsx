// src/pages/employee/MyReports.tsx
// Consultancy employee: daily working hours report from real attendance store.

import { useState, useMemo } from 'react';
import {
  Clock, TrendingUp, Calendar, Download,
  ChevronLeft, ChevronRight, CheckCircle2, XCircle, AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAttendanceForUser, type AttendanceSummary } from '../../data/store';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const STATUS_CONFIG: Record<AttendanceSummary['status'], { label: string; color: string; icon: React.ReactNode }> = {
  present:   { label: 'Present',  color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 size={13} /> },
  absent:    { label: 'Absent',   color: 'bg-red-100 text-red-700',         icon: <XCircle size={13} />      },
  'half-day':{ label: 'Half Day', color: 'bg-blue-100 text-blue-700',       icon: <AlertCircle size={13} />  },
  late:      { label: 'Late',     color: 'bg-amber-100 text-amber-700',     icon: <AlertCircle size={13} />  },
};

function secsToHours(s: number) { return s / 3600; }
function fmtHours(h: number) {
  const hrs  = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return `${hrs}h ${mins}m`;
}
function fmtSecs(s: number) { return fmtHours(secsToHours(s)); }

export default function MyReports() {
  const { user } = useAuth();
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);   // 1-based

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1);
  }

  // Filter attendance records for this user + selected month
  const records = useMemo(() => {
    if (!user) return [];
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    return getAttendanceForUser(user.id).filter(r => r.date.startsWith(prefix));
  }, [user, year, month]);

  // Summary stats
  const totalDays    = records.length;
  const presentDays  = records.filter(r => r.status !== 'absent').length;
  const totalHours   = records.reduce((s, r) => s + secsToHours(r.workSeconds), 0);
  const avgHours     = presentDays > 0 ? totalHours / presentDays : 0;
  const onTimePct    = totalDays > 0
    ? Math.round((records.filter(r => r.status === 'present').length / totalDays) * 100)
    : 0;

  function exportCSV() {
    const headers = ['Date','Check In','Check Out','Work Hours','Status'];
    const rows = records.map(r => [
      r.date,
      r.checkIn  ?? '—',
      r.checkOut ?? '—',
      fmtSecs(r.workSeconds),
      STATUS_CONFIG[r.status].label,
    ]);
    const csv = [headers, ...rows].map(row => row.map(c => `"${c}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url;
    a.download = `my-report-${year}-${String(month).padStart(2, '0')}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">Daily working hours report</p>
        </div>
        <button onClick={exportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200
                     bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all">
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Month picker */}
      <div className="flex items-center gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-3 w-fit">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-slate-700 min-w-[130px] text-center">
          {MONTH_NAMES[month - 1]} {year}
        </span>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Working Days',  value: totalDays,          icon: <Calendar size={18} />,    color: 'from-[#0B0E92] to-[#69A6F0]'  },
          { label: 'Days Present',  value: presentDays,        icon: <CheckCircle2 size={18} />, color: 'from-emerald-500 to-teal-400'  },
          { label: 'Total Hours',   value: fmtHours(totalHours),icon: <Clock size={18} />,       color: 'from-violet-500 to-purple-400' },
          { label: 'On-Time Rate',  value: `${onTimePct}%`,    icon: <TrendingUp size={18} />,  color: 'from-amber-500 to-orange-400'  },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shrink-0`}>
              <span className="text-white">{s.icon}</span>
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Avg hours bar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-slate-700">Average Daily Hours</p>
          <p className="text-sm font-bold text-[#0B0E92]">{fmtHours(avgHours)} / 8h target</p>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#0B0E92] to-[#69A6F0] rounded-full transition-all duration-700"
            style={{ width: `${Math.min((avgHours / 8) * 100, 100)}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-2">{Math.round((avgHours / 8) * 100)}% of 8-hour daily goal</p>
      </div>

      {/* Daily table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Daily Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {['Date','Check In','Check Out','Work Hours','Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan={5} className="py-14 text-center text-sm text-slate-400">
                  No attendance records for {MONTH_NAMES[month - 1]} {year}
                </td></tr>
              ) : records.map((r, idx) => {
                const cfg = STATUS_CONFIG[r.status];
                return (
                  <tr key={r.date} className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${idx % 2 ? 'bg-slate-50/30' : ''}`}>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {new Date(r.date + 'T00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', weekday: 'short' })}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">{r.checkIn  ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{r.checkOut ?? '—'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {r.workSeconds > 0 ? fmtSecs(r.workSeconds) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                        {cfg.icon}{cfg.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}