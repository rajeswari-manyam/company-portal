// src/pages/employee/MyReports.tsx
// Consultancy employee — monthly call activity report.
// Data sourced from callEntries in local store (same data as MyExcelSheets).

import { useState, useMemo } from 'react';
import {
  Phone, Clock, TrendingUp, Calendar, Download,
  ChevronLeft, ChevronRight, CheckCircle2, CalendarCheck,
  FileCheck2, FileSpreadsheet, BarChart2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getCallEntriesForUser, type CallEntry } from '../../data/store';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const INTERVIEW_PREFIX = '[INTERVIEW_SCHEDULED]';
const SCREENED_PREFIX  = '[SCREENED]';

function isInterviewScheduled(e: CallEntry) {
  return e.notes?.startsWith(INTERVIEW_PREFIX) || e.notes?.startsWith(SCREENED_PREFIX);
}
function isScreened(e: CallEntry) { return e.notes?.startsWith(SCREENED_PREFIX); }

function parseDurationSecs(dur: string): number {
  const parts = (dur ?? '').split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}
function fmtDur(s: number): string {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

export default function MyReports() {
  const { user } = useAuth();
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-based

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1);
  }

  // All entries for this user in the selected month
  const monthEntries = useMemo(() => {
    if (!user) return [];
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    return getCallEntriesForUser(user.id).filter(e => e.callTime?.startsWith(prefix));
  }, [user, year, month]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalCalls      = monthEntries.length;
  const resumeReceived  = monthEntries.filter(e => e.resumeStatus === 'received').length;
  const resumeSent      = monthEntries.filter(e => e.resumeStatus === 'sent').length;
  const pending         = monthEntries.filter(e => e.resumeStatus === 'pending').length;
  const interviews      = monthEntries.filter(e => isInterviewScheduled(e)).length;
  const screened        = monthEntries.filter(e => isScreened(e)).length;
  const withAttachment  = monthEntries.filter(e => !!e.attachedFileName).length;

  const totalSecs  = monthEntries.reduce((s, e) => s + parseDurationSecs(e.callDuration), 0);
  const avgSecs    = totalCalls > 0 ? Math.round(totalSecs / totalCalls) : 0;

  // Group by day for daily breakdown
  const byDay = useMemo(() => {
    const map: Record<string, CallEntry[]> = {};
    monthEntries.forEach(e => {
      const day = e.callTime?.slice(0, 10) ?? 'unknown';
      if (!map[day]) map[day] = [];
      map[day].push(e);
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [monthEntries]);

  // ── Export ─────────────────────────────────────────────────────────────────
  function exportCSV() {
    const headers = ['Date','Candidate','Phone','Duration','Resume Status','Interview','Notes'];
    const rows = monthEntries.map(e => [
      e.callTime?.slice(0, 10) ?? '',
      e.candidateName,
      e.callNumber,
      e.callDuration,
      e.resumeStatus,
      isScreened(e) ? 'Screened' : isInterviewScheduled(e) ? 'Interview Scheduled' : '—',
      e.notes.replace(INTERVIEW_PREFIX, '').replace(SCREENED_PREFIX, '').trim(),
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-report-${year}-${String(month).padStart(2, '0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">Monthly call activity summary</p>
        </div>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200
                     bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all"
        >
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* ── Month picker ── */}
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

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Calls',     value: totalCalls,     icon: <Phone size={18} />,         color: 'from-[#0B0E92] to-[#69A6F0]'  },
          { label: 'Resume Received', value: resumeReceived, icon: <FileCheck2 size={18} />,    color: 'from-emerald-500 to-teal-400'  },
          { label: 'Interviews',      value: interviews,     icon: <CalendarCheck size={18} />, color: 'from-violet-500 to-purple-400' },
          { label: 'Screened',        value: screened,       icon: <CheckCircle2 size={18} />,  color: 'from-rose-400 to-pink-400'     },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shrink-0`}>
              <span className="text-white">{s.icon}</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Secondary stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Resume Sent',    value: resumeSent,    icon: <FileSpreadsheet size={16} />, color: 'from-blue-500 to-sky-400'     },
          { label: 'Pending',        value: pending,       icon: <Clock size={16} />,           color: 'from-amber-400 to-orange-400' },
          { label: 'With Attachment',value: withAttachment,icon: <BarChart2 size={16} />,       color: 'from-cyan-500 to-blue-400'    },
          { label: 'Active Days',    value: byDay.length,  icon: <Calendar size={16} />,        color: 'from-indigo-400 to-violet-400'},
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shrink-0`}>
              <span className="text-white">{s.icon}</span>
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Duration summary ── */}
      {totalCalls > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0B0E92] to-[#69A6F0] flex items-center justify-center shrink-0">
              <TrendingUp size={18} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Call Duration</p>
              <p className="text-xl font-bold text-slate-800">{fmtDur(totalSecs)}</p>
            </div>
          </div>
          <div className="sm:border-l sm:border-slate-100 sm:pl-6">
            <p className="text-xs text-slate-400 font-medium">Avg Duration / Call</p>
            <p className="text-xl font-bold text-slate-800">{fmtDur(avgSecs)}</p>
          </div>
          <div className="sm:border-l sm:border-slate-100 sm:pl-6 ml-auto">
            <p className="text-xs text-slate-400 font-medium">Screening Rate</p>
            <p className="text-xl font-bold text-slate-800">
              {interviews > 0 ? `${Math.round((screened / interviews) * 100)}%` : '—'}
            </p>
          </div>
        </div>
      )}

      {/* ── Daily breakdown table ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Daily Breakdown</h2>
        </div>

        {byDay.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0B0E92] to-[#69A6F0] opacity-20 flex items-center justify-center">
              <BarChart2 size={20} className="text-white" />
            </div>
            <p className="text-sm font-medium text-slate-500">No calls logged for {MONTH_NAMES[month - 1]} {year}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['Date', 'Total Calls', 'Total Duration', 'Resume Received', 'Interviews', 'Screened'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byDay.map(([day, entries], idx) => {
                  const daySecs = entries.reduce((s, e) => s + parseDurationSecs(e.callDuration), 0);
                  const dayReceived   = entries.filter(e => e.resumeStatus === 'received').length;
                  const dayInterviews = entries.filter(e => isInterviewScheduled(e)).length;
                  const dayScreened   = entries.filter(e => isScreened(e)).length;
                  return (
                    <tr key={day} className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${idx % 2 ? 'bg-slate-50/30' : ''}`}>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {new Date(day + 'T00:00').toLocaleDateString('en-IN', {
                          weekday: 'short', day: '2-digit', month: 'short',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EEF0FF] text-[#0B0E92]">
                          <Phone size={10} /> {entries.length}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700">{fmtDur(daySecs)}</td>
                      <td className="px-4 py-3">
                        {dayReceived > 0
                          ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">{dayReceived}</span>
                          : <span className="text-slate-300 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {dayInterviews > 0
                          ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">{dayInterviews}</span>
                          : <span className="text-slate-300 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {dayScreened > 0
                          ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700"><CheckCircle2 size={10} /> {dayScreened}</span>
                          : <span className="text-slate-300 text-xs">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}