// src/pages/admin/AdminAttendance.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    RefreshCw, Search, Calendar,
    ChevronDown, ChevronUp, Edit2, Users, Moon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
    getIdleLogsApi,
    updateActivityApi,
    type IdleSession,
} from "../../service/IdleApi.service";

const BASE_URL = (import.meta as any).env.VITE_API_BASE_URL;

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusOption = 'Present' | 'Late' | 'Half Day' | 'Absent' | 'On Leave';
const STATUS_OPTIONS: StatusOption[] = ['Present', 'Late', 'Half Day', 'Absent', 'On Leave'];

const STATUS_CFG: Record<string, { border: string; text: string }> = {
    Present: { border: 'border-emerald-300', text: 'text-emerald-700' },
    Late: { border: 'border-amber-300', text: 'text-amber-700' },
    'Half Day': { border: 'border-blue-300', text: 'text-blue-700' },
    Absent: { border: 'border-red-300', text: 'text-red-600' },
    'On Leave': { border: 'border-purple-300', text: 'text-purple-700' },
};

interface BreakEntry { _id?: string; start: string; end?: string; }

interface NormRow {
    _id: string;
    employeeId: string;
    employeeInternalId: string;
    employeeName: string;
    employeeEmail: string;
    department: string;
    date: string;
    checkIn: string | null;
    checkInRaw: string | null;
    checkOut: string | null;
    workHours: number;
    breakHours: number;
    extraHours: number;
    completion: number;
    status: StatusOption;
    breaks: BreakEntry[];
    isLate: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}
function fmtHours(h: number): string | null {
    if (!h || h <= 0) return null;
    const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
    if (hh > 0 && mm > 0) return `${hh}h ${mm}m`;
    if (hh > 0) return `${hh}h`;
    return `${mm}m`;
}
function fmtBreakDuration(start: string, end?: string) {
    if (!end) return 'Active';
    const diff = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000);
    const m = Math.floor(diff / 60), s = diff % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
function calcBreakHours(breaks: BreakEntry[]): number {
    return (breaks ?? []).reduce((sum, b) => {
        if (b.start && b.end) return sum + (new Date(b.end).getTime() - new Date(b.start).getTime()) / 3_600_000;
        return sum;
    }, 0);
}
function isLateCheckIn(iso: string): boolean {
    const d = new Date(iso), cut = new Date(iso);
    cut.setHours(9, 40, 0, 0);
    return d > cut;
}
function getInitials(name: string) {
    return (name || 'UN').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
const AVATAR_COLORS = [
    'bg-violet-100 text-violet-700', 'bg-blue-100 text-blue-700',
    'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700',
    'bg-pink-100 text-pink-700', 'bg-cyan-100 text-cyan-700',
];
function avatarColor(n: string) { return AVATAR_COLORS[(n?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length]; }

function sumIdleSecondsToday(sessions: IdleSession[]): number {
    const today = new Date().toISOString().slice(0, 10);
    return sessions
        .filter(s => s.startTime?.slice(0, 10) === today)
        .reduce((sum, s) => {
            if (!s.startTime) return sum;
            const end = s.endTime ? new Date(s.endTime).getTime() : Date.now();
            return sum + Math.max(0, Math.floor((end - new Date(s.startTime).getTime()) / 1000));
        }, 0);
}

function filterIdleSessionsToday(sessions: IdleSession[]): IdleSession[] {
    const today = new Date().toISOString().slice(0, 10);
    return sessions.filter(s => s.startTime?.slice(0, 10) === today);
}

function fmtIdleSecs(secs: number): string {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function fmtIdleDuration(startIso: string, endIso?: string): string {
    const end = endIso ? new Date(endIso).getTime() : Date.now();
    const diff = Math.max(0, Math.floor((end - new Date(startIso).getTime()) / 1000));
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

function normalise(raw: any): NormRow {
    const empObj = raw.employeeId && typeof raw.employeeId === 'object' ? raw.employeeId : null;
    const empName = empObj?.name ?? raw.employeeName ?? '';
    const empEmail = empObj?.email ?? raw.email ?? '';
    const empDept = empObj?.department ?? raw.department ?? '';
    const empDisplay = empObj?.empId ?? empObj?.empNumber ?? '';
    const empInternal = empObj?._id ?? (typeof raw.employeeId === 'string' ? raw.employeeId : '');

    const sessions = raw.sessions ?? [];
    const sorted = [...sessions].sort((a: any, b: any) => new Date(a.loginTime).getTime() - new Date(b.loginTime).getTime());
    const firstLogin = sorted[0]?.loginTime ?? null;
    const lastLogout = raw.lastLogout ?? [...sessions].reverse().find((s: any) => s.logoutTime)?.logoutTime ?? null;

    const breaks = raw.breaks ?? [];
    const workHours = raw.totalWorkHours ?? 0;
    const extraHours = Math.max(0, workHours - 8);
    const completion = Math.min(100, Math.round((workHours / 8) * 100));

    return {
        _id: raw._id,
        employeeId: empDisplay || (typeof raw.employeeId === 'string' ? raw.employeeId : ''),
        employeeInternalId: empInternal,
        employeeName: empName,
        employeeEmail: empEmail,
        department: empDept,
        date: raw.date ? new Date(raw.date).toLocaleDateString('en-CA') : '',
        checkIn: firstLogin ? fmtTime(firstLogin) : null,
        checkInRaw: firstLogin,
        checkOut: lastLogout ? fmtTime(lastLogout) : null,
        workHours,
        breakHours: calcBreakHours(breaks),
        extraHours,
        completion,
        status: raw.status ?? 'Absent',
        breaks,
        isLate: firstLogin ? isLateCheckIn(firstLogin) : false,
    };
}

// ─── Breaks Cell ──────────────────────────────────────────────────────────────

function BreaksCell({ breaks }: { breaks: BreakEntry[] }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    if (!breaks?.length) return <span className="text-slate-300 text-sm">—</span>;
    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(o => !o)}
                className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
                {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {breaks.length} break{breaks.length !== 1 ? 's' : ''}
            </button>
            {open && (
                <div className="absolute left-0 top-8 z-30 bg-white rounded-xl shadow-xl border border-slate-100 p-3 min-w-[300px]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Break Details</p>
                    <div className="grid grid-cols-4 text-[10px] font-bold text-slate-400 border-b border-slate-100 pb-1 mb-1">
                        <span>#</span><span>Start</span><span>End</span><span>Duration</span>
                    </div>
                    {breaks.map((b, i) => (
                        <div key={b._id ?? i} className="grid grid-cols-4 text-xs text-slate-700 py-1.5 border-b border-slate-50 last:border-0 items-center">
                            <span className="text-slate-400 font-semibold">{i + 1}</span>
                            <span className="font-medium">{fmtTime(b.start)}</span>
                            <span>{b.end
                                ? <span className="font-medium">{fmtTime(b.end)}</span>
                                : <span className="text-amber-500 font-semibold">Active</span>}
                            </span>
                            <span className="text-slate-500">{fmtBreakDuration(b.start, b.end)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Idle Cell ────────────────────────────────────────────────────────────────

function IdleCell({ sessions, totalSecs }: { sessions: IdleSession[]; totalSecs: number }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    if (!totalSecs) return <span className="text-slate-300 text-sm">—</span>;

    const todaySessions = filterIdleSessionsToday(sessions);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(o => !o)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 transition-colors"
            >
                <Moon size={10} />
                {fmtIdleSecs(totalSecs)}
                {todaySessions.length > 0 && (open ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
            </button>

            {open && todaySessions.length > 0 && (
                <div className="absolute left-0 top-8 z-30 bg-white rounded-xl shadow-xl border border-slate-100 p-3 min-w-[320px]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Idle Sessions — {todaySessions.length} session{todaySessions.length !== 1 ? 's' : ''}
                    </p>
                    <div className="grid grid-cols-4 text-[10px] font-bold text-slate-400 border-b border-slate-100 pb-1 mb-1">
                        <span>#</span><span>Start</span><span>End</span><span>Duration</span>
                    </div>
                    {todaySessions.map((s, i) => (
                        <div key={s._id ?? i} className="grid grid-cols-4 text-xs text-slate-700 py-1.5 border-b border-slate-50 last:border-0 items-center">
                            <span className="text-slate-400 font-semibold">{i + 1}</span>
                            <span className="font-medium">{fmtTime(s.startTime)}</span>
                            <span>
                                {s.endTime
                                    ? <span className="font-medium">{fmtTime(s.endTime)}</span>
                                    : <span className="text-amber-500 font-semibold">Active</span>}
                            </span>
                            <span className="text-slate-500">{fmtIdleDuration(s.startTime, s.endTime)}</span>
                        </div>
                    ))}
                    {todaySessions.some(s => s.reason) && (
                        <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reasons</p>
                            {todaySessions.filter(s => s.reason).map((s, i) => (
                                <div key={s._id ?? i} className="flex items-start gap-2 text-xs">
                                    <span className="text-slate-400 font-semibold shrink-0 mt-0.5">
                                        #{todaySessions.indexOf(s) + 1}
                                    </span>
                                    <span className="text-slate-600 italic">"{s.reason}"</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({ row, onClose, onSaved }: { row: NormRow; onClose: () => void; onSaved: () => void }) {
    const [status, setStatus] = useState<StatusOption>(row.status);
    const [saving, setSaving] = useState(false);
    const save = async () => {
        setSaving(true);
        try {
            const body = new URLSearchParams();
            body.append('attendanceId', row._id);
            body.append('status', status);
            const res = await fetch(`${BASE_URL}/hr-update`, { method: 'POST', body, redirect: 'follow' });
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            toast.success('Attendance updated');
            onSaved(); onClose();
        } catch (e: any) { toast.error(e?.message ?? 'Failed to update'); }
        finally { setSaving(false); }
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
                <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 text-lg">✕</button>
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${avatarColor(row.employeeName)}`}>{getInitials(row.employeeName)}</div>
                    <div><h3 className="text-base font-bold text-slate-800">{row.employeeName}</h3><p className="text-xs text-slate-400">{row.date}</p></div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</label>
                    <select value={status} onChange={e => setStatus(e.target.value as StatusOption)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/30 bg-white">
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                    <button onClick={save} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0B0E92] to-[#3B46D4] text-white text-sm font-semibold disabled:opacity-60">
                        {saving ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function SkeletonRows() {
    return (
        <>{[1, 2, 3, 4, 5].map(i => (
            <tr key={i} className="border-b border-slate-100">
                {Array.from({ length: 10 }).map((_, j) => (
                    <td key={j} className="px-5 py-4">
                        <div className="h-4 rounded-md bg-slate-100 animate-pulse" style={{ width: `${45 + (j * 11) % 40}%` }} />
                    </td>
                ))}
            </tr>
        ))}</>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminAttendance() {
    const [allRows, setAllRows] = useState<NormRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tick, setTick] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [date, setDate] = useState(() => new Date().toLocaleDateString('en-CA'));
    const [empFilter, setEmpFilter] = useState('');
    const [editRow, setEditRow] = useState<NormRow | null>(null);

    // map: employeeInternalId → { totalSecs, sessions[] }
    const [idleMap, setIdleMap] = useState<Record<string, { secs: number; sessions: IdleSession[] }>>({});

    // ── Load attendance ───────────────────────────────────────────────────────
    useEffect(() => {
        setLoading(true); setError(null);
        fetch(`${BASE_URL}/getAllAttendance`, { method: 'GET', redirect: 'follow' })
            .then(res => { if (!res.ok) throw new Error(`Server error: ${res.status}`); return res.json(); })
            .then(data => {
                const list: any[] = Array.isArray(data) ? data
                    : Array.isArray(data?.data) ? data.data
                        : Array.isArray(data?.records) ? data.records : [];
                setAllRows(list.map(normalise));
            })
            .catch(e => setError(e?.message ?? 'Failed to load'))
            .finally(() => setLoading(false));
    }, [tick]);

    // ── Activity heartbeat ────────────────────────────────────────────────────
    useEffect(() => {
        const uid = localStorage.getItem('userId') ?? sessionStorage.getItem('userId') ?? '';
        if (!uid) return;
        const interval = setInterval(() => updateActivityApi(uid).catch(() => { }), 60_000);
        return () => clearInterval(interval);
    }, []);

    const handleRefresh = () => {
        setRefreshing(true); setTick(t => t + 1);
        setTimeout(() => setRefreshing(false), 800);
    };

    const uniqueEmployees = useMemo(() => {
        const map = new Map<string, string>();
        allRows.forEach(r => {
            const key = r.employeeName || r.employeeId;
            if (key && !map.has(key)) map.set(key, r.employeeName);
        });
        return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
    }, [allRows]);

    const filtered = useMemo(() => allRows.filter(r => {
        const matchDate = !date || r.date === date;
        const matchEmp = !empFilter || r.employeeName === empFilter || r.employeeId === empFilter;
        const q = search.toLowerCase();
        const matchSearch = !q
            || r.employeeName.toLowerCase().includes(q)
            || r.employeeEmail.toLowerCase().includes(q)
            || r.department.toLowerCase().includes(q)
            || r.status.toLowerCase().includes(q);
        return matchDate && matchEmp && matchSearch;
    }), [allRows, date, empFilter, search]);

    // ── Fetch idle sessions for every unique employee in the filtered view ────
    useEffect(() => {
        const seen = new Set<string>();
        const targets: { id: string; internalId: string }[] = [];

        filtered.forEach(r => {
            const key = r.employeeInternalId || r.employeeId;
            if (key && !seen.has(key)) {
                seen.add(key);
                targets.push({ id: key, internalId: r.employeeInternalId });
            }
        });

        if (!targets.length) { setIdleMap({}); return; }

        Promise.all(
            targets.map(({ id, internalId }) =>
                getIdleLogsApi(id)
                    .then(sessions => ({
                        key: internalId || id,
                        secs: sumIdleSecondsToday(sessions),
                        sessions,
                    }))
                    .catch(() => ({ key: internalId || id, secs: 0, sessions: [] as IdleSession[] }))
            )
        ).then(results => {
            const map: Record<string, { secs: number; sessions: IdleSession[] }> = {};
            results.forEach(({ key, secs, sessions }) => { map[key] = { secs, sessions }; });
            setIdleMap(map);
        });
    }, [filtered]);

    const stats = useMemo(() => {
        const d = allRows.filter(r => r.date === date);
        return {
            total: d.length,
            present: d.filter(r => r.status === 'Present').length,
            late: d.filter(r => r.status === 'Late').length,
            absent: d.filter(r => r.status === 'Absent').length,
            onLeave: d.filter(r => r.status === 'On Leave').length,
        };
    }, [allRows, date]);

    return (
        <div className="min-h-screen bg-slate-50 px-4 sm:px-6 lg:px-8 py-8"
            style={{ fontFamily: "'DM Sans','Plus Jakarta Sans','Segoe UI',sans-serif" }}>

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Attendance</h1>
                <p className="text-sm text-slate-400 mt-0.5">All employees attendance records</p>
            </div>

            {/* Summary cards */}
            {!loading && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                    {[
                        { label: 'Total', count: stats.total, from: 'from-slate-600', to: 'to-slate-500' },
                        { label: 'Present', count: stats.present, from: 'from-emerald-600', to: 'to-teal-500' },
                        { label: 'Late', count: stats.late, from: 'from-amber-500', to: 'to-yellow-400' },
                        { label: 'Absent', count: stats.absent, from: 'from-red-600', to: 'to-rose-400' },
                        { label: 'On Leave', count: stats.onLeave, from: 'from-violet-600', to: 'to-purple-400' },
                    ].map(s => (
                        <div key={s.label} className={`bg-gradient-to-br ${s.from} ${s.to} rounded-2xl px-4 py-3 text-white shadow-md`}>
                            <p className="text-2xl font-black">{s.count}</p>
                            <p className="text-xs font-semibold opacity-80 uppercase tracking-wide mt-0.5">{s.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Table card */}
            <div className="bg-white rounded-2xl ring-1 ring-slate-100 shadow-sm overflow-hidden">

                {/* Toolbar */}
                <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 flex-wrap items-start sm:items-center">
                    <div className="relative flex-1 min-w-[180px]">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name, email or status…"
                            className="w-full pl-9 pr-3 h-10 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/20" />
                    </div>
                    <div className="relative">
                        <Users size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select value={empFilter} onChange={e => setEmpFilter(e.target.value)}
                            className="pl-8 pr-8 h-10 rounded-xl border border-slate-200 text-sm bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/20">
                            <option value="">All Employees</option>
                            {uniqueEmployees.map(([key, name]) => (
                                <option key={key} value={key}>{name || key}</option>
                            ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    <div className="relative">
                        <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input type="date" value={date} onChange={e => setDate(e.target.value)}
                            className="pl-8 pr-3 h-10 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/20" />
                    </div>
                    <button onClick={handleRefresh}
                        className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                        <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>

                {/* Row count */}
                {!loading && (
                    <div className="px-5 py-2 text-xs text-slate-500 border-b border-slate-100">
                        <span className="font-semibold text-slate-700">{filtered.length}</span> record{filtered.length !== 1 ? 's' : ''}
                        {date && ` · ${new Date(date + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}`}
                    </div>
                )}

                {error && <div className="mx-5 my-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

                {/* Table */}
                <div className="mobile-scroll-container pb-2">
                    <table className="w-full text-sm min-w-[1000px]">
                        <thead>
                            <tr className="bg-slate-50/60 border-b border-slate-100">
                                {['EMPLOYEE', 'DATE', 'CHECK IN', 'CHECK OUT', 'HOURS', 'EXTRA HRS', 'IDLE', 'STATUS', 'BREAKS', 'ACTIONS'].map(h => (
                                    <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? <SkeletonRows />
                                : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="py-16 text-center text-slate-400">
                                            <div className="text-4xl mb-3">📋</div>
                                            <p className="text-sm font-medium">No attendance records found</p>
                                            <p className="text-xs text-slate-300 mt-1">Try a different date or employee</p>
                                        </td>
                                    </tr>
                                ) : filtered.map(r => {
                                    const idleEntry = idleMap[r.employeeInternalId] ?? idleMap[r.employeeId] ?? null;

                                    return (
                                        <tr key={r._id} className="hover:bg-slate-50/50 transition-colors group">
                                            {/* EMPLOYEE */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarColor(r.employeeName || 'UN')}`}>
                                                        {getInitials(r.employeeName || 'UN')}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800 whitespace-nowrap">
                                                            {r.employeeName || <span className="text-slate-400 italic">Unknown</span>}
                                                        </p>
                                                        {r.department && <p className="text-[10px] text-slate-400">{r.department}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            {/* DATE */}
                                            <td className="px-5 py-4 text-sm font-mono font-medium text-slate-700 whitespace-nowrap">{r.date}</td>
                                            {/* CHECK IN */}
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                {r.checkIn
                                                    ? <span className={`text-sm font-bold ${r.isLate ? 'text-red-500' : 'text-slate-800'}`}>{r.checkIn}</span>
                                                    : <span className="text-slate-300 text-sm">—</span>}
                                            </td>
                                            {/* CHECK OUT */}
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                {r.checkOut
                                                    ? <span className="text-sm font-medium text-slate-700">{r.checkOut}</span>
                                                    : r.checkIn
                                                        ? <span className="text-sm italic text-slate-400">Still clocked in</span>
                                                        : <span className="text-slate-300 text-sm">—</span>}
                                            </td>
                                            {/* HOURS */}
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                {fmtHours(r.workHours) ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full ${r.workHours >= 8 ? 'bg-emerald-500' : r.workHours >= 4 ? 'bg-amber-400' : 'bg-red-400'}`}
                                                                style={{ width: `${Math.min((r.workHours / 8) * 100, 100)}%` }} />
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-700 font-mono">{fmtHours(r.workHours)}</span>
                                                    </div>
                                                ) : <span className="text-slate-300 text-sm">—</span>}
                                            </td>
                                            {/* EXTRA HRS */}
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                {r.extraHours > 0
                                                    ? <span className="text-xs font-bold text-emerald-600">+{fmtHours(r.extraHours)}</span>
                                                    : <span className="text-slate-300 text-sm">—</span>}
                                            </td>
                                            {/* IDLE — clickable dropdown */}
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <IdleCell
                                                    sessions={idleEntry?.sessions ?? []}
                                                    totalSecs={idleEntry?.secs ?? 0}
                                                />
                                            </td>
                                            {/* STATUS */}
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold bg-white
                                                    ${STATUS_CFG[r.status]?.border ?? 'border-red-300'}
                                                    ${STATUS_CFG[r.status]?.text ?? 'text-red-600'}`}>
                                                    {r.status}
                                                </span>
                                            </td>
                                            {/* BREAKS */}
                                            <td className="px-5 py-4"><BreaksCell breaks={r.breaks} /></td>
                                            {/* ACTIONS */}
                                            <td className="px-5 py-4 text-center">
                                                <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => setEditRow(r)} title="Edit status"
                                                        className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                                                        <Edit2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                {!loading && filtered.length > 0 && (
                    <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/40 text-xs text-slate-400">
                        Showing <span className="font-semibold text-slate-600">{filtered.length}</span> of{' '}
                        <span className="font-semibold text-slate-600">{allRows.length}</span> total records
                    </div>
                )}
            </div>

            {editRow && <EditModal row={editRow} onClose={() => setEditRow(null)} onSaved={handleRefresh} />}
        </div>
    );
}