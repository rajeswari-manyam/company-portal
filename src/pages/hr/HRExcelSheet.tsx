// src/pages/hr/HRExcelSheets.tsx
// HR & Admin view: all Consultancy employees' call logs, read from real store.

import { useState, useMemo } from 'react';
import { Search, Phone, Clock, Download, Filter, FileCheck2, Users, ChevronDown } from 'lucide-react';
import { getCallEntriesForDept, getUsers, type CallEntry } from '../../data/store';

const RESUME_STATUS_LABELS: Record<CallEntry['resumeStatus'], string> = {
  sent:         'Resume Sent',
  received:     'Resume Received',
  pending:      'Pending',
  not_required: 'Not Required',
};

const RESUME_STATUS_COLORS: Record<CallEntry['resumeStatus'], string> = {
  sent:         'bg-blue-100 text-blue-700',
  received:     'bg-emerald-100 text-emerald-700',
  pending:      'bg-amber-100 text-amber-700',
  not_required: 'bg-slate-100 text-slate-500',
};

export default function HRExcelSheets() {
  // Load all Consultancy call entries from store
  const allEntries = useMemo(() => getCallEntriesForDept('Consultancy'), []);

  // Unique employee names for the filter dropdown
  const employeeNames = useMemo(
    () => [...new Set(allEntries.map(e => e.userName))].sort(),
    [allEntries],
  );

  const [search,       setSearch]  = useState('');
  const [empFilter,    setEmp]     = useState('');
  const [statusFilter, setStatus]  = useState<CallEntry['resumeStatus'] | ''>('');

  const filtered = useMemo(() => allEntries.filter(e => {
    const q = search.toLowerCase();
    return (
      (e.candidateName.toLowerCase().includes(q) || e.callNumber.includes(q) || e.userName.toLowerCase().includes(q)) &&
      (empFilter    ? e.userName      === empFilter    : true) &&
      (statusFilter ? e.resumeStatus  === statusFilter : true)
    );
  }), [allEntries, search, empFilter, statusFilter]);

  // Stats
  const totalCalls     = filtered.length;
  const resumeSent     = filtered.filter(e => e.resumeStatus === 'sent').length;
  const resumeReceived = filtered.filter(e => e.resumeStatus === 'received').length;
  const pending        = filtered.filter(e => e.resumeStatus === 'pending').length;

  function exportCSV() {
    const headers = ['Employee','Emp ID','Candidate','Phone','Call Time','Duration','Resume Status','Document Note','Notes'];
    const rows = filtered.map(e => [
      e.userName, e.employeeId, e.candidateName, e.callNumber, e.callTime,
      e.callDuration, RESUME_STATUS_LABELS[e.resumeStatus], e.documentNote, e.notes,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url;
    a.download = `consultancy-call-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Excel Sheets — Consultancy</h1>
          <p className="text-sm text-slate-500 mt-0.5">All employee call logs · {filtered.length} entries</p>
        </div>
        <button onClick={exportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200
                     bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all">
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Calls',       value: totalCalls,     icon: <Phone size={18} />,     color: 'from-[#0B0E92] to-[#69A6F0]'  },
          { label: 'Resumes Sent',      value: resumeSent,     icon: <FileCheck2 size={18} />, color: 'from-blue-500 to-blue-400'     },
          { label: 'Resumes Received',  value: resumeReceived, icon: <FileCheck2 size={18} />, color: 'from-emerald-500 to-teal-400'  },
          { label: 'Pending',           value: pending,        icon: <Clock size={18} />,      color: 'from-amber-500 to-orange-400'  },
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search candidate, phone, or employee…"
            className="w-full pl-10 pr-4 h-11 rounded-xl border border-slate-200 bg-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/20 focus:border-[#0B0E92] transition-all" />
        </div>
        <div className="relative">
          <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select value={empFilter} onChange={e => setEmp(e.target.value)}
            className="pl-9 pr-8 h-11 rounded-xl border border-slate-200 bg-white text-sm appearance-none
                       focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/20 focus:border-[#0B0E92] transition-all">
            <option value="">All Employees</option>
            {employeeNames.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select value={statusFilter} onChange={e => setStatus(e.target.value as CallEntry['resumeStatus'] | '')}
            className="pl-9 pr-8 h-11 rounded-xl border border-slate-200 bg-white text-sm appearance-none
                       focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/20 focus:border-[#0B0E92] transition-all">
            <option value="">All Statuses</option>
            {(Object.entries(RESUME_STATUS_LABELS) as [CallEntry['resumeStatus'], string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {['Employee','Candidate','Phone','Call Time','Duration','Resume Status','Notes'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-sm text-slate-400">
                  {allEntries.length === 0
                    ? 'No call logs yet — employees will appear here once they add entries'
                    : 'No entries match your filters'}
                </td></tr>
              ) : filtered.map((entry, idx) => (
                <tr key={entry.id} className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${idx % 2 ? 'bg-slate-50/30' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">{entry.userName.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{entry.userName}</p>
                        {/* Only show employeeId if it looks like a real ID (not an internal UUID) */}
                        {entry.employeeId && !/^[a-f0-9]{20,}/.test(entry.employeeId) && (
                          <p className="text-xs text-slate-400">{entry.employeeId}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">{entry.candidateName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{entry.callNumber}</td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {new Date(entry.callTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-700">{entry.callDuration}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${RESUME_STATUS_COLORS[entry.resumeStatus]}`}>
                      {RESUME_STATUS_LABELS[entry.resumeStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 max-w-[180px] truncate">{entry.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}