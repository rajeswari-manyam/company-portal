// src/pages/employee/MyExcelSheets.tsx
// Consultancy employees log their daily call activity here.
// Tabs: Call Logs (add/edit/delete) | Monthly Report (month picker, that employee only)

import { useState, useRef, useMemo } from 'react';
import {
  Plus, Search, Phone, Clock, FileCheck2, Trash2, Edit2,
  Download, User, MessageSquare, Calendar, Paperclip, X,
  FileSpreadsheet, BarChart2, CheckCircle2, CalendarCheck,
  TrendingUp, Lock, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getCallEntriesForUser, createCallEntry, updateCallEntry,
  deleteCallEntry, getUserById, type CallEntry,
} from '../../data/store';

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const RESUME_STATUS_LABELS: Record<CallEntry['resumeStatus'], string> = {
  sent: 'Resume Sent',
  received: 'Resume Received',
  pending: 'Pending',
  not_required: 'Not Required',
};

const RESUME_STATUS_COLORS: Record<CallEntry['resumeStatus'], string> = {
  sent: 'bg-blue-100 text-blue-700',
  received: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  not_required: 'bg-slate-100 text-slate-500',
};

const INTERVIEW_PREFIX = '[INTERVIEW_SCHEDULED]';
const SCREENED_PREFIX = '[SCREENED]';

function isInterviewScheduled(entry: CallEntry) {
  return entry.notes?.startsWith(INTERVIEW_PREFIX) || entry.notes?.startsWith(SCREENED_PREFIX);
}
function isScreened(entry: CallEntry) {
  return entry.notes?.startsWith(SCREENED_PREFIX);
}
function isLocked(entry: CallEntry) {
  return isScreened(entry);
}

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

const ACCEPTED_TYPES = '.xlsx,.xls,.csv,.pdf,.doc,.docx,.png,.jpg,.jpeg';

type FormShape = Omit<CallEntry, 'id' | 'userId' | 'employeeId' | 'userName' | 'department' | 'createdAt'>;

function emptyForm(): FormShape {
  return {
    candidateName: '',
    callNumber: '',
    callTime: new Date().toISOString().slice(0, 16),
    callDuration: '',
    resumeStatus: 'pending',
    documentNote: '',
    notes: '',
    attachedFileName: '',
    attachedFileData: '',
  };
}

// ── Interview Badge ───────────────────────────────────────────────────────────

function InterviewBadge({ entry, onScreened }: { entry: CallEntry; onScreened: () => void }) {
  if (isScreened(entry)) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
        <CheckCircle2 size={11} /> Screened
      </span>
    );
  }
  if (isInterviewScheduled(entry)) {
    return (
      <button
        onClick={onScreened}
        title="Mark as Screened"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                   bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors cursor-pointer"
      >
        <CalendarCheck size={11} /> Interview Scheduled — Mark Screened
      </button>
    );
  }
  return null;
}

// ── Monthly Report Tab ────────────────────────────────────────────────────────

function MonthlyReport({ allEntries }: { allEntries: CallEntry[] }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1);
  }

  // Only entries for the selected month
  const monthEntries = useMemo(() => {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    return allEntries.filter(e => e.callTime?.startsWith(prefix));
  }, [allEntries, year, month]);

  // Stats
  const totalCalls = monthEntries.length;
  const resumeReceived = monthEntries.filter(e => e.resumeStatus === 'received').length;
  const resumeSent = monthEntries.filter(e => e.resumeStatus === 'sent').length;
  const pending = monthEntries.filter(e => e.resumeStatus === 'pending').length;
  const interviews = monthEntries.filter(e => isInterviewScheduled(e)).length;
  const screened = monthEntries.filter(e => isScreened(e)).length;
  const withAttachment = monthEntries.filter(e => !!e.attachedFileName).length;

  const totalSecs = monthEntries.reduce((s, e) => s + parseDurationSecs(e.callDuration), 0);
  const avgSecs = totalCalls > 0 ? Math.round(totalSecs / totalCalls) : 0;

  // Group by day for breakdown table
  const byDay = useMemo(() => {
    const map: Record<string, CallEntry[]> = {};
    monthEntries.forEach(e => {
      const day = e.callTime?.slice(0, 10) ?? 'unknown';
      if (!map[day]) map[day] = [];
      map[day].push(e);
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [monthEntries]);

  function exportReport() {
    const headers = ['Date', 'Candidate', 'Phone', 'Duration', 'Resume Status', 'Interview', 'Notes'];
    const rows = monthEntries.map(e => [
      e.callTime?.slice(0, 10) ?? '',
      e.candidateName,
      e.callNumber,
      e.callDuration,
      RESUME_STATUS_LABELS[e.resumeStatus],
      isScreened(e) ? 'Screened' : isInterviewScheduled(e) ? 'Interview Scheduled' : '—',
      e.notes.replace(INTERVIEW_PREFIX, '').replace(SCREENED_PREFIX, '').trim(),
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `call-report-${year}-${String(month).padStart(2, '0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">

      {/* Month picker + export */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-2.5">
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
        <button
          onClick={exportReport}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200
                     bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all"
        >
          <Download size={14} /> Export Month
        </button>
      </div>

      {/* No data state */}
      {totalCalls === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0B0E92] to-[#69A6F0] opacity-20 flex items-center justify-center">
            <BarChart2 size={24} className="text-white" />
          </div>
          <p className="text-sm font-semibold text-slate-500">
            No calls logged for {MONTH_NAMES[month - 1]} {year}
          </p>
          <p className="text-xs text-slate-400">Try selecting a different month</p>
        </div>
      ) : (
        <>
          {/* Primary stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Calls', value: totalCalls, icon: <Phone size={18} />, color: 'from-[#0B0E92] to-[#69A6F0]' },
              { label: 'Resume Received', value: resumeReceived, icon: <FileCheck2 size={18} />, color: 'from-emerald-500 to-teal-400' },
              { label: 'Interviews', value: interviews, icon: <CalendarCheck size={18} />, color: 'from-violet-500 to-purple-400' },
              { label: 'Screened', value: screened, icon: <CheckCircle2 size={18} />, color: 'from-rose-400 to-pink-400' },
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

          {/* Secondary stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Resume Sent', value: resumeSent, icon: <FileSpreadsheet size={16} />, color: 'from-blue-500 to-sky-400' },
              { label: 'Pending', value: pending, icon: <Clock size={16} />, color: 'from-amber-400 to-orange-400' },
              { label: 'With Attachment', value: withAttachment, icon: <Paperclip size={16} />, color: 'from-cyan-500 to-blue-400' },
              { label: 'Active Days', value: byDay.length, icon: <Calendar size={16} />, color: 'from-indigo-400 to-violet-400' },
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

          {/* Duration summary */}
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
            <div className="sm:border-l sm:border-slate-100 sm:pl-6 sm:ml-auto">
              <p className="text-xs text-slate-400 font-medium">Screening Rate</p>
              <p className="text-xl font-bold text-slate-800">
                {interviews > 0 ? `${Math.round((screened / interviews) * 100)}%` : '—'}
              </p>
            </div>
          </div>

          {/* Daily breakdown table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">
                Daily Breakdown — {MONTH_NAMES[month - 1]} {year}
              </h3>
              <span className="text-xs text-slate-400">{totalCalls} total call{totalCalls !== 1 ? 's' : ''}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    {['Date', 'Calls', 'Total Duration', 'Resume Received', 'Interviews', 'Screened'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {byDay.map(([day, entries], idx) => {
                    const daySecs = entries.reduce((s, e) => s + parseDurationSecs(e.callDuration), 0);
                    const dayReceived = entries.filter(e => e.resumeStatus === 'received').length;
                    const dayInterviews = entries.filter(e => isInterviewScheduled(e)).length;
                    const dayScreened = entries.filter(e => isScreened(e)).length;
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
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function MyExcelSheets() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'logs' | 'report'>('logs');

  const [entries, setEntries] = useState<CallEntry[]>(
    () => (user ? getCallEntriesForUser(user.id) : []),
  );

  function refresh() {
    if (user) setEntries(getCallEntriesForUser(user.id));
  }

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormShape>(emptyForm());
  const [errors, setErrors] = useState<Partial<Record<keyof FormShape, string>>>({});
  const [fileError, setFileError] = useState('');
  const [scheduleInterview, setScheduleInterview] = useState(false);

  function fieldSet<K extends keyof FormShape>(key: K, value: FormShape[K]) {
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }));
  }

  // ── File upload ────────────────────────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setFileError('File must be under 5 MB'); return; }
    setFileError('');
    const reader = new FileReader();
    reader.onload = () => setForm(f => ({ ...f, attachedFileName: file.name, attachedFileData: reader.result as string }));
    reader.readAsDataURL(file);
  }

  function clearFile() {
    setForm(f => ({ ...f, attachedFileName: '', attachedFileData: '' }));
    setFileError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function downloadFile(entry: CallEntry) {
    if (!entry.attachedFileData || !entry.attachedFileName) return;
    const a = document.createElement('a');
    a.href = entry.attachedFileData; a.download = entry.attachedFileName; a.click();
  }

  // ── Validation ─────────────────────────────────────────────────────────────
  function validate(): boolean {
    const errs: typeof errors = {};
    if (!form.candidateName.trim()) errs.candidateName = 'Name is required';
    if (!form.callNumber.trim()) errs.callNumber = 'Phone number is required';
    if (!form.callTime) errs.callTime = 'Call time is required';
    if (!form.callDuration.trim()) errs.callDuration = 'Duration is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function openAdd() {
    setForm(emptyForm()); setEditId(null); setErrors({}); setFileError('');
    setScheduleInterview(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowForm(true);
  }

  function openEdit(entry: CallEntry) {
    const rawNotes = entry.notes.replace(INTERVIEW_PREFIX, '').replace(SCREENED_PREFIX, '').trim();
    setForm({
      candidateName: entry.candidateName,
      callNumber: entry.callNumber,
      callTime: entry.callTime,
      callDuration: entry.callDuration,
      resumeStatus: entry.resumeStatus,
      documentNote: entry.documentNote,
      notes: rawNotes,
      attachedFileName: entry.attachedFileName ?? '',
      attachedFileData: entry.attachedFileData ?? '',
    });
    setScheduleInterview(isInterviewScheduled(entry));
    setEditId(entry.id); setErrors({}); setFileError(''); setShowForm(true);
  }

  function handleSave() {
    if (!validate() || !user) return;
    const rawNotes = form.notes.trim();
    const finalNotes = scheduleInterview ? `${INTERVIEW_PREFIX} ${rawNotes}` : rawNotes;
    const payload = { ...form, notes: finalNotes };

    if (editId) {
      updateCallEntry(editId, payload);
    } else {
      const emp = getUserById(user.id);
      const empId: string =
        (user as any).employeeId ||
        emp?.employeeId ||
        emp?.name?.toUpperCase().replace(/\s+/g, '').slice(0, 6) ||
        'EMP';
      createCallEntry({
        ...payload,
        userId: user.id,
        employeeId: empId,
        userName: user.name ?? emp?.name ?? '',
        department: (user as any).department ?? emp?.department ?? 'Consultancy',
      });
    }
    refresh();
    setShowForm(false); setEditId(null); setScheduleInterview(false);
  }

  function markScreened(entry: CallEntry) {
    if (!confirm(`Mark "${entry.candidateName}" as Screened? This will lock the row.`)) return;
    const rawNotes = entry.notes.replace(INTERVIEW_PREFIX, '').replace(SCREENED_PREFIX, '').trim();
    updateCallEntry(entry.id, { notes: `${SCREENED_PREFIX} ${rawNotes}` });
    refresh();
  }

  function handleDelete(id: string) {
    if (confirm('Delete this call log entry?')) { deleteCallEntry(id); refresh(); }
  }

  function exportCSV() {
    const headers = ['Candidate', 'Phone', 'Call Time', 'Duration', 'Resume Status', 'Document Note', 'Interview', 'Notes', 'Attachment'];
    const rows = filtered.map(e => [
      e.candidateName, e.callNumber, e.callTime, e.callDuration,
      RESUME_STATUS_LABELS[e.resumeStatus], e.documentNote,
      isScreened(e) ? 'Screened' : isInterviewScheduled(e) ? 'Interview Scheduled' : '—',
      e.notes.replace(INTERVIEW_PREFIX, '').replace(SCREENED_PREFIX, '').trim(),
      e.attachedFileName ?? '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url;
    a.download = `my-call-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  const filtered = entries.filter(e => {
    const q = search.toLowerCase();
    return e.candidateName.toLowerCase().includes(q) || e.callNumber.includes(q);
  });

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Excel Sheets</h1>
          <p className="text-sm text-slate-500 mt-0.5">{entries.length} total call log{entries.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200
                       bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all">
            <Download size={15} /> Export CSV
          </button>
          {activeTab === 'logs' && (
            <button onClick={openAdd}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                         bg-gradient-to-r from-[#0B0E92] to-[#69A6F0] text-white text-sm font-semibold
                         shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all">
              <Plus size={16} /> Add Entry
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {([
          { id: 'logs', label: 'Call Logs', icon: <Phone size={14} /> },
          { id: 'report', label: 'Monthly Report', icon: <BarChart2 size={14} /> },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${activeTab === tab.id
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'}`}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════ CALL LOGS TAB ══════════════ */}
      {activeTab === 'logs' && (
        <div className="space-y-5">
          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by candidate name or phone…"
              className="w-full pl-10 pr-4 h-11 rounded-xl border border-slate-200 bg-white text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/20 focus:border-[#0B0E92] transition-all" />
          </div>

          {/* Form */}
          {showForm && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
              <h2 className="text-base font-semibold text-slate-800">
                {editId ? 'Edit Call Log' : 'New Call Log Entry'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Candidate Name */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Candidate / Person Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={form.candidateName} onChange={e => fieldSet('candidateName', e.target.value)}
                      placeholder="Full name"
                      className={`w-full pl-9 pr-3 h-10 rounded-xl border text-sm transition-all
                        focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/20 focus:border-[#0B0E92]
                        ${errors.candidateName ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'}`} />
                  </div>
                  {errors.candidateName && <p className="text-xs text-red-500 mt-1">{errors.candidateName}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={form.callNumber} onChange={e => fieldSet('callNumber', e.target.value)}
                      placeholder="+91 9876543210"
                      className={`w-full pl-9 pr-3 h-10 rounded-xl border text-sm transition-all
                        focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/20 focus:border-[#0B0E92]
                        ${errors.callNumber ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'}`} />
                  </div>
                  {errors.callNumber && <p className="text-xs text-red-500 mt-1">{errors.callNumber}</p>}
                </div>

                {/* Call Time */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Time of Call <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="datetime-local" value={form.callTime}
                      onChange={e => fieldSet('callTime', e.target.value)}
                      className={`w-full pl-9 pr-3 h-10 rounded-xl border text-sm transition-all
                        focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/20 focus:border-[#0B0E92]
                        ${errors.callTime ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'}`} />
                  </div>
                  {errors.callTime && <p className="text-xs text-red-500 mt-1">{errors.callTime}</p>}
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Call Duration <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={form.callDuration} onChange={e => fieldSet('callDuration', e.target.value)}
                      placeholder="e.g. 00:12:30"
                      className={`w-full pl-9 pr-3 h-10 rounded-xl border text-sm transition-all
                        focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/20 focus:border-[#0B0E92]
                        ${errors.callDuration ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'}`} />
                  </div>
                  {errors.callDuration && <p className="text-xs text-red-500 mt-1">{errors.callDuration}</p>}
                </div>

                {/* Resume Status */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Resume / Document Status</label>
                  <select value={form.resumeStatus}
                    onChange={e => fieldSet('resumeStatus', e.target.value as CallEntry['resumeStatus'])}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm
                               focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/20 focus:border-[#0B0E92] transition-all">
                    {(Object.entries(RESUME_STATUS_LABELS) as [CallEntry['resumeStatus'], string][]).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>

                {/* Document Note */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Document Note</label>
                  <div className="relative">
                    <FileCheck2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={form.documentNote} onChange={e => fieldSet('documentNote', e.target.value)}
                      placeholder="e.g. Resume shared via email"
                      className="w-full pl-9 pr-3 h-10 rounded-xl border border-slate-200 bg-white text-sm
                                 focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/20 focus:border-[#0B0E92] transition-all" />
                  </div>
                </div>

                {/* Interview toggle */}
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <div
                      onClick={() => setScheduleInterview(v => !v)}
                      className={`relative w-10 h-5 rounded-full transition-colors duration-200
                        ${scheduleInterview ? 'bg-violet-500' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200
                        ${scheduleInterview ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Interview scheduled for next day</span>
                    {scheduleInterview && (
                      <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">
                        Will be locked after screening
                      </span>
                    )}
                  </label>
                  <p className="text-xs text-slate-400 mt-1 ml-13">
                    Once the candidate is screened, the row will be locked (no further edits).
                  </p>
                </div>

                {/* File Upload */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Attach Excel / Document <span className="ml-1 text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input ref={fileInputRef} id="excel-file-upload" type="file"
                    accept={ACCEPTED_TYPES} onChange={handleFileChange} className="hidden" />
                  {form.attachedFileName ? (
                    <div className="flex items-center gap-3 h-11 px-4 rounded-xl border border-emerald-200 bg-emerald-50">
                      <FileSpreadsheet size={15} className="shrink-0 text-emerald-600" />
                      <span className="flex-1 truncate text-sm font-medium text-emerald-700">{form.attachedFileName}</span>
                      <button type="button" onClick={clearFile}
                        className="shrink-0 p-1 rounded-full text-emerald-500 hover:bg-emerald-200 transition-colors">
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <label htmlFor="excel-file-upload"
                      className="flex items-center gap-3 h-11 px-4 rounded-xl border border-dashed border-slate-300
                                 bg-slate-50 text-sm text-slate-500 cursor-pointer select-none
                                 hover:border-[#0B0E92] hover:bg-[#0B0E92]/5 hover:text-[#0B0E92] transition-all">
                      <Paperclip size={15} className="shrink-0" />
                      <span>Click to attach a file</span>
                      <span className="ml-auto text-xs text-slate-400 hidden sm:block">
                        xlsx · xls · csv · pdf · doc · jpg · png · max 5 MB
                      </span>
                    </label>
                  )}
                  {fileError && <p className="text-xs text-red-500 mt-1">{fileError}</p>}
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Additional Notes</label>
                  <div className="relative">
                    <MessageSquare size={14} className="absolute left-3 top-3 text-slate-400" />
                    <textarea value={form.notes} onChange={e => fieldSet('notes', e.target.value)}
                      rows={3} placeholder="Any extra details about this call or candidate…"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm resize-none
                                 focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/20 focus:border-[#0B0E92] transition-all" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => { setShowForm(false); setEditId(null); setFileError(''); setScheduleInterview(false); }}
                  className="px-5 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">
                  Cancel
                </button>
                <button onClick={handleSave}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0B0E92] to-[#69A6F0]
                             text-white text-sm font-semibold shadow-md hover:shadow-lg
                             hover:scale-[1.02] active:scale-[0.98] transition-all">
                  {editId ? 'Save Changes' : 'Add Entry'}
                </button>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!showForm && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0B0E92] to-[#69A6F0] opacity-20 flex items-center justify-center">
                <Phone size={24} className="text-white" />
              </div>
              <p className="text-sm font-medium text-slate-500">No call logs yet</p>
              <p className="text-xs text-slate-400">Click "Add Entry" to log your first call</p>
            </div>
          )}

          {/* Table */}
          {filtered.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60">
                      {['Candidate', 'Phone', 'Call Time', 'Duration', 'Resume Status', 'Interview', 'Attachment', 'Notes', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((entry, idx) => {
                      const locked = isLocked(entry);
                      return (
                        <tr key={entry.id}
                          className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors
                            ${idx % 2 ? 'bg-slate-50/30' : ''} ${locked ? 'opacity-80' : ''}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0B0E92] to-[#69A6F0] flex items-center justify-center shrink-0">
                                <span className="text-white text-xs font-bold">{entry.candidateName.charAt(0).toUpperCase()}</span>
                              </div>
                              <div>
                                <p className="font-medium text-slate-800">{entry.candidateName}</p>
                                {entry.documentNote && <p className="text-xs text-slate-400 truncate max-w-[130px]">{entry.documentNote}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600">{entry.callNumber}</td>
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                            {new Date(entry.callTime).toLocaleString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                            })}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-700">{entry.callDuration}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${RESUME_STATUS_COLORS[entry.resumeStatus]}`}>
                              {RESUME_STATUS_LABELS[entry.resumeStatus]}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <InterviewBadge entry={entry} onScreened={() => markScreened(entry)} />
                            {!isInterviewScheduled(entry) && <span className="text-slate-300 text-xs">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            {entry.attachedFileName ? (
                              <button onClick={() => downloadFile(entry)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg max-w-[140px]
                                           bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors">
                                <FileSpreadsheet size={12} className="shrink-0" />
                                <span className="truncate">{entry.attachedFileName}</span>
                              </button>
                            ) : <span className="text-slate-300 text-xs">—</span>}
                          </td>
                          <td className="px-4 py-3 text-slate-500 max-w-[150px] truncate">
                            {entry.notes.replace(INTERVIEW_PREFIX, '').replace(SCREENED_PREFIX, '').trim() || '—'}
                          </td>
                          <td className="px-4 py-3">
                            {locked ? (
                              <span className="inline-flex items-center gap-1 text-xs text-slate-400" title="Locked after screening">
                                <Lock size={12} /> Locked
                              </span>
                            ) : (
                              <div className="flex items-center gap-1">
                                <button onClick={() => openEdit(entry)}
                                  className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors" title="Edit">
                                  <Edit2 size={14} />
                                </button>
                                <button onClick={() => handleDelete(entry.id)}
                                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors" title="Delete">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════ MONTHLY REPORT TAB ══════════════ */}
      {activeTab === 'report' && <MonthlyReport allEntries={entries} />}
    </div>
  );
}