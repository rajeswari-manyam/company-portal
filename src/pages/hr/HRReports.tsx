// src/pages/hr/HRReports.tsx  (also used by AdminReports via re-export)
// HR/Admin: daily work report for ALL Consultancy employees, from real store.

import { useState, useMemo } from 'react';
import {
  Clock, TrendingUp, Download,
  ChevronLeft, ChevronRight, CheckCircle2, XCircle, AlertCircle,
  Users, Search, Filter, ChevronDown,
} from 'lucide-react';
import {
  getUsers, getAllAttendance, getAllCallEntries, getDepartments,
  type AttendanceSummary, type UserRecord,
} from '../../data/store';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const STATUS_CONFIG: Record<AttendanceSummary['status'], { label: string; color: string; icon: React.ReactNode }> = {
  present:    { label: 'Present',  color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 size={13} /> },
  absent:     { label: 'Absent',   color: 'bg-red-100 text-red-700',         icon: <XCircle size={13} />      },
  'half-day': { label: 'Half Day', color: 'bg-blue-100 text-blue-700',       icon: <AlertCircle size={13} />  },
  late:       { label: 'Late',     color: 'bg-amber-100 text-amber-700',     icon: <AlertCircle size={13} />  },
};

function secsToHours(s: number) { return s / 3600; }
function fmtHours(h: number) {
  const hrs  = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return `${hrs}h ${mins}m`;
}

export default function HRReports() {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [empFilter,    setEmp]    = useState('');
  const [statusFilter, setStatus] = useState<AttendanceSummary['status'] | ''>('');
  const [search, setSearch]       = useState('');

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1);
  }

  // ── Find the Consultancy department ID (case-insensitive name match) ────────
  const consultancyDeptId = useMemo(() => {
    const dept = getDepartments().find(
      d => d.name.trim().toLowerCase() === 'consultancy',
    );
    return dept?.id ?? null;
  }, []);

  // ── All Consultancy employees ─────────────────────────────────────────────
  // Match by departmentId (reliable) OR by department name string (fallback)
  const consultancyEmps: UserRecord[] = useMemo(() => {
    return getUsers().filter(u => {
      if (u.role !== 'employee') return false;
      if (consultancyDeptId && u.departmentId === consultancyDeptId) return true;
      // fallback: name-based match in case departmentId wasn't set properly
      return u.department?.trim().toLowerCase() === 'consultancy';
    });
  }, [consultancyDeptId]);

  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;

  // ── All attendance records for this month joined with employee info ─────────
  const allRecords = useMemo(() => {
    const attendance = getAllAttendance().filter(a => a.date.startsWith(monthPrefix));
    const callsByUser = getAllCallEntries().reduce<Record<string, number>>((acc, c) => {
      if (c.callTime.startsWith(monthPrefix)) acc[c.userId] = (acc[c.userId] ?? 0) + 1;
      return acc;
    }, {});

    const empSet = new Set(consultancyEmps.map(e => e.id));
    return attendance
      .filter(a => empSet.has(a.userId))
      .map(a => {
        const emp = consultancyEmps.find(e => e.id === a.userId)!;
        return {
          ...a,
          employeeName: emp?.name       ?? 'Unknown',
          employeeId:   emp?.employeeId ?? '—',
          callsMade:    callsByUser[a.userId] ?? 0,
        };
      });
  }, [consultancyEmps, monthPrefix]);

  // ── Per-employee summary cards ─────────────────────────────────────────────
  const summaries = useMemo(() => consultancyEmps.map(emp => {
    const recs      = allRecords.filter(r => r.userId === emp.id);
    const present   = recs.filter(r => r.status !== 'absent').length;
    const totalHrs  = recs.reduce((s, r) => s + secsToHours(r.workSeconds), 0);
    const avgHrs    = present > 0 ? totalHrs / present : 0;
    const onTimePct = recs.length > 0
      ? Math.round((recs.filter(r => r.status === 'present').length / recs.length) * 100)
      : 0;
    const totalCalls = recs.reduce((s, r) => s + r.callsMade, 0);
    return { emp, present, totalDays: recs.length, avgHrs, onTimePct, totalCalls };
  }), [allRecords, consultancyEmps]);

  // ── Filtered detail table ──────────────────────────────────────────────────
  const filtered = useMemo(() => allRecords.filter(r => {
    const q = search.toLowerCase();
    return (
      (r.employeeName.toLowerCase().includes(q) || r.date.includes(q)) &&
      (empFilter    ? r.userId === empFilter    : true) &&
      (statusFilter ? r.status === statusFilter : true)
    );
  }), [allRecords, search, empFilter, statusFilter]);

  // ── Overall stats ──────────────────────────────────────────────────────────
  const totalPresent  = allRecords.filter(r => r.status !== 'absent').length;
  const totalHours    = allRecords.reduce((s, r) => s + secsToHours(r.workSeconds), 0);
  const totalCallsAll = allRecords.reduce((s, r) => s + r.callsMade, 0);

  function exportCSV() {
    const headers = ['Employee','Emp ID','Date','Check In','Check Out','Work Hours','Status','Calls Made'];
    const rows = filtered.map(r => [
      r.employeeName, r.employeeId, r.date, r.checkIn ?? '—', r.checkOut ?? '—',
      fmtHours(secsToHours(r.workSeconds)), STATUS_CONFIG[r.status].label, r.callsMade,
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `consultancy-report-${year}-${String(month).padStart(2, '0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reports — Consultancy</h1>
          <p className="text-sm text-slate-500 mt-0.5">Daily work report for all consultancy employees</p>
        </div>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200
                     bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all"
        >
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

      {/* Overall stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Consultancy Employees', value: consultancyEmps.length, icon: <Users size={18} />,        color: 'from-[#0B0E92] to-[#69A6F0]'  },
          { label: 'Present (entries)',     value: totalPresent,           icon: <CheckCircle2 size={18} />,  color: 'from-emerald-500 to-teal-400'  },
          { label: 'Total Hours Worked',    value: fmtHours(totalHours),   icon: <Clock size={18} />,         color: 'from-violet-500 to-purple-400' },
          { label: 'Total Calls Made',      value: totalCallsAll,          icon: <TrendingUp size={18} />,    color: 'from-amber-500 to-orange-400'  },
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

      {/* No consultancy dept warning */}
      {consultancyDeptId === null && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-sm text-amber-700">
          ⚠️ No department named <strong>Consultancy</strong> was found. Please create it in the Departments section, then add employees to it.
        </div>
      )}

      {/* Per-employee summary cards */}
      {summaries.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Employee Summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {summaries.map(({ emp, present, totalDays, avgHrs, onTimePct, totalCalls }) => (
              <div key={emp.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B0E92] to-[#69A6F0] flex items-center justify-center shrink-0">
                    <span className="text-white text-sm font-bold">{emp.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{emp.name}</p>
                    <p className="text-xs text-slate-400">{emp.employeeId}</p>
                  </div>
                  <span className="ml-auto text-sm font-bold text-[#0B0E92]">{onTimePct}% on-time</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { v: `${present}/${totalDays}`, l: 'Days Present'  },
                    { v: fmtHours(avgHrs),          l: 'Avg Daily Hrs' },
                    { v: totalCalls,                l: 'Calls Made'    },
                  ].map(s => (
                    <div key={s.l} className="bg-slate-50 rounded-xl p-3">
                      <p className="text-lg font-bold text-slate-800">{s.v}</p>
                      <p className="text-xs text-slate-500">{s.l}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                    <span>Avg Hours vs 8h Target</span>
                    <span>{Math.round((avgHrs / 8) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#0B0E92] to-[#69A6F0] rounded-full transition-all"
                      style={{ width: `${Math.min((avgHrs / 8) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search employee or date…"
            className="w-full pl-10 pr-4 h-11 rounded-xl border border-slate-200 bg-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/20 focus:border-[#0B0E92] transition-all"
          />
        </div>
        <div className="relative">
          <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={empFilter}
            onChange={e => setEmp(e.target.value)}
            className="pl-9 pr-8 h-11 rounded-xl border border-slate-200 bg-white text-sm appearance-none
                       focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/20 focus:border-[#0B0E92] transition-all"
          >
            <option value="">All Employees</option>
            {consultancyEmps.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={statusFilter}
            onChange={e => setStatus(e.target.value as AttendanceSummary['status'] | '')}
            className="pl-9 pr-8 h-11 rounded-xl border border-slate-200 bg-white text-sm appearance-none
                       focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/20 focus:border-[#0B0E92] transition-all"
          >
            <option value="">All Statuses</option>
            {(Object.entries(STATUS_CONFIG) as [AttendanceSummary['status'], typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(([v, c]) => (
              <option key={v} value={v}>{c.label}</option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Detail table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">
            Daily Detail · {filtered.length} records
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {['Employee','Date','Check In','Check Out','Work Hours','Calls','Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-sm text-slate-400">
                    {consultancyEmps.length === 0
                      ? 'No consultancy employees found. Make sure the Consultancy department exists and has employees assigned to it.'
                      : allRecords.length === 0
                        ? `No attendance records for ${MONTH_NAMES[month - 1]} ${year}`
                        : 'No records match your filters'}
                  </td>
                </tr>
              ) : filtered.map((r, idx) => {
                const cfg = STATUS_CONFIG[r.status];
                return (
                  <tr
                    key={`${r.userId}-${r.date}`}
                    className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${idx % 2 ? 'bg-slate-50/30' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0B0E92] to-[#69A6F0] flex items-center justify-center shrink-0">
                          <span className="text-white text-xs font-bold">{r.employeeName.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{r.employeeName}</p>
                          <p className="text-xs text-slate-400">{r.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(r.date + 'T00:00').toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', weekday: 'short',
                      })}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">{r.checkIn  ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{r.checkOut ?? '—'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {r.workSeconds > 0 ? fmtHours(secsToHours(r.workSeconds)) : '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#0B0E92]">{r.callsMade || '—'}</td>
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