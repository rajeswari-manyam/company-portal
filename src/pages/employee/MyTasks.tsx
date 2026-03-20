import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    getTasksByEmployee,
    getTasksByEmployeeAndDate,
    updateTaskProgress,
} from '../../services/taskApi';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Task {
    id: string;
    projectId: string;
    projectName: string;
    employeeId: string;
    description: string;
    startTime: string;
    endTime: string;
    day: string;
    progress: string | null;   // "Completed" | "Not Completed" | "In Progress" | null
    reason: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function today() { return new Date().toISOString().split('T')[0]; }

function fmt(d: string) {
    try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', weekday: 'short' }); }
    catch { return d; }
}
function fmtTime(iso: string) {
    if (!iso) return '';
    try {
        if (/^\d{2}:\d{2}/.test(iso)) return iso.slice(0, 5);
        return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch { return iso; }
}

// Normalise raw API task — handles nested projectId: { _id, name }
// NOTE: backend does NOT return a "day" field — derive it from createdAt
// The /employee-day endpoint matches tasks by their createdAt date, not startTime
function normaliseTask(raw: any): Task {
    const pid = raw.projectId;
    // Backend stores no explicit "day" field — use createdAt date portion
    // e.g. "2026-03-20T19:27:40.003Z" → "2026-03-20"
    const day = raw.day
        ?? (raw.createdAt ? raw.createdAt.slice(0, 10) : null)
        ?? (raw.startTime ? raw.startTime.slice(0, 10) : '')
        ?? '';
    return {
        id:          raw.id || raw._id || Math.random().toString(),
        projectId:   typeof pid === 'object' ? (pid?._id ?? '') : (pid ?? ''),
        projectName: typeof pid === 'object' ? (pid?.name ?? '—') : '—',
        employeeId:  typeof raw.employeeId === 'object' ? (raw.employeeId?._id ?? '') : (raw.employeeId ?? ''),
        description: raw.description ?? '',
        startTime:   raw.startTime ?? '',
        endTime:     raw.endTime   ?? '',
        day,
        progress:    raw.progress ?? null,
        reason:      raw.reason   ?? null,
    };
}

const isDone    = (t: Task) => t.progress === 'Completed';

const PROGRESS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
    'Completed':     { bg: '#dcfce7', color: '#16a34a', label: 'Completed' },
    'Not Completed': { bg: '#fff8e6', color: '#b7791f', label: 'Not Completed' },
    'In Progress':   { bg: '#dbeafe', color: '#2563eb', label: 'In Progress' },
};

// ─── Shared styles ────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10,
    fontSize: '0.875rem', color: '#1a2340', fontFamily: 'inherit', outline: 'none', background: '#f8fafc',
};
const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4a5568', marginBottom: 6,
};
const ghostBtn: React.CSSProperties = {
    padding: '9px 20px', borderRadius: 30, border: '1.5px solid #e2e8f0', background: '#f8fafc',
    color: '#6b7a9d', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
};
const primaryBtn: React.CSSProperties = {
    padding: '9px 22px', borderRadius: 30, border: 'none',
    background: 'linear-gradient(to right,#0B0E92,#69A6F0)',
    color: '#fff', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
    boxShadow: '0 4px 14px rgba(11,14,146,0.25)',
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function TaskSkeleton() {
    return (
        <div style={{ background: '#fff', border: '1.5px solid #e8ecf4', borderRadius: 12, padding: '16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div className="sk" style={{ width: 10, height: 10, borderRadius: '50%', marginTop: 4, flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="sk" style={{ height: 15, width: '65%' }} />
                <div className="sk" style={{ height: 11, width: '45%' }} />
            </div>
        </div>
    );
}

// ─── End-of-Day Reason Modal ──────────────────────────────────────────────────
function ReasonModal({ task, onClose, onSaved }: {
    task: Task; onClose: () => void;
    onSaved: (id: string, progress: string, reason: string) => void;
}) {
    const [progress, setProgress] = useState('Not Completed');
    const [reason,   setReason]   = useState(task.reason ?? '');
    const [saving,   setSaving]   = useState(false);
    const [error,    setError]    = useState('');
    const OPTIONS = ['Not Completed', 'In Progress', 'Completed'];

    const handleSave = async () => {
        if (progress === 'Not Completed' && !reason.trim()) { setError('Please provide a reason why this task was not completed.'); return; }
        setSaving(true);
        try {
            await updateTaskProgress(task.id, progress, reason || undefined);
            onSaved(task.id, progress, reason);
            onClose();
        } catch (e: any) {
            setError(e?.response?.data?.message || 'Failed to save. Please try again.');
        } finally { setSaving(false); }
    };

    const btnBg = progress === 'Completed'
        ? 'linear-gradient(to right,#15803d,#22c55e)'
        : progress === 'Not Completed'
            ? 'linear-gradient(to right,#b45309,#f59e0b)'
            : 'linear-gradient(to right,#0B0E92,#69A6F0)';

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(15,20,60,0.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{ background: '#fff', borderRadius: 20, width: 'min(500px,100%)', boxShadow: '0 24px 64px rgba(11,14,146,0.20)', overflow: 'hidden', animation: 'mIn 0.25s ease' }}>
                <style>{`@keyframes mIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>

                {/* Amber header */}
                <div style={{ background: 'linear-gradient(to right,#b45309,#f59e0b)', padding: '20px 24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                            ⏰ End of Day Check-in
                        </div>
                        <div style={{ color: '#fff', fontWeight: 800, fontSize: '1rem', lineHeight: 1.4, maxWidth: 340 }}>
                            {task.description.length > 65 ? task.description.slice(0, 65) + '…' : task.description}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem', marginTop: 5 }}>
                            🗂 {task.projectName} · 📅 {task.day} · ⏰ {fmtTime(task.startTime)} – {fmtTime(task.endTime)}
                        </div>
                    </div>
                    <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 12 }}>✕</button>
                </div>

                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {error && <div style={{ background: '#fff0f0', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: '0.8rem', color: '#dc2626' }}>{error}</div>}

                    <div>
                        <label style={labelStyle}>How did this task go? *</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {OPTIONS.map(opt => {
                                const ps = PROGRESS_STYLE[opt];
                                const sel = progress === opt;
                                return (
                                    <button key={opt} onClick={() => setProgress(opt)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', background: sel ? ps.bg : '#f8fafc', outline: sel ? `2px solid ${ps.color}` : '1.5px solid #e2e8f0', transition: 'all 0.15s', fontFamily: 'inherit' }}>
                                        <span style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${sel ? ps.color : '#cbd5e1'}`, background: sel ? ps.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            {sel && <span style={{ color: '#fff', fontSize: '0.55rem', fontWeight: 900 }}>✓</span>}
                                        </span>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: sel ? ps.color : '#4a5568' }}>{opt}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <label style={labelStyle}>
                            {progress === 'Not Completed'
                                ? <>Reason <span style={{ color: '#dc2626' }}>*</span> <span style={{ color: '#94a3b8', fontWeight: 400 }}>(why wasn't it completed?)</span></>
                                : <>Note <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></>}
                        </label>
                        <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} autoFocus={progress === 'Not Completed'}
                            placeholder={progress === 'Not Completed' ? 'e.g. Waiting for client approval, blocked by dependency…' : 'Any notes?'}
                            style={{ ...inputStyle, resize: 'vertical', minHeight: 90 }} />
                    </div>

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                        <button onClick={onClose} style={ghostBtn}>Skip for now</button>
                        <button onClick={handleSave} disabled={saving} style={{ ...primaryBtn, background: btnBg, opacity: saving ? 0.7 : 1 }}>
                            {saving ? 'Saving…' : 'Save Update'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Inline End-of-Day Reason Box (inside task card) ─────────────────────────
function InlineReasonBox({ task, onSaved }: {
    task: Task; onSaved: (id: string, progress: string, reason: string) => void;
}) {
    const [progress, setProgress] = useState('Not Completed');
    const [reason,   setReason]   = useState('');
    const [saving,   setSaving]   = useState(false);
    const [error,    setError]    = useState('');

    const handleSave = async () => {
        if (progress === 'Not Completed' && !reason.trim()) { setError('Please provide a reason.'); return; }
        setSaving(true);
        try {
            await updateTaskProgress(task.id, progress, reason || undefined);
            onSaved(task.id, progress, reason);
        } catch (e: any) {
            setError(e?.response?.data?.message || 'Failed to save.');
        } finally { setSaving(false); }
    };

    return (
        <div style={{ marginTop: 10, background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309' }}>⏰ End of day — update your progress</div>
            {error && <div style={{ fontSize: '0.72rem', color: '#dc2626' }}>{error}</div>}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['Completed', 'In Progress', 'Not Completed'].map(opt => {
                    const ps = PROGRESS_STYLE[opt];
                    const sel = progress === opt;
                    return (
                        <button key={opt} onClick={() => setProgress(opt)} style={{ padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${sel ? ps.color : '#e2e8f0'}`, background: sel ? ps.bg : '#fff', color: sel ? ps.color : '#6b7a9d', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                            {opt}
                        </button>
                    );
                })}
            </div>
            <textarea rows={2} value={reason} onChange={e => setReason(e.target.value)}
                placeholder={progress === 'Not Completed' ? 'Why was it not completed? (required)' : 'Add a note (optional)…'}
                style={{ ...inputStyle, minHeight: 60, resize: 'vertical', fontSize: '0.8rem', background: '#fff' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={handleSave} disabled={saving} style={{
                    ...primaryBtn, fontSize: '0.75rem', padding: '7px 18px', opacity: saving ? 0.7 : 1,
                    background: progress === 'Completed' ? 'linear-gradient(to right,#15803d,#22c55e)' : progress === 'Not Completed' ? 'linear-gradient(to right,#b45309,#f59e0b)' : 'linear-gradient(to right,#0B0E92,#69A6F0)',
                }}>
                    {saving ? 'Saving…' : 'Save'}
                </button>
            </div>
        </div>
    );
}

// ─── Task Card ────────────────────────────────────────────────────────────────
function TaskCard({ task, onProgressUpdated }: {
    task: Task; onProgressUpdated: (id: string, progress: string, reason: string) => void;
}) {
    const done    = isDone(task);
    const isToday = task.day === today();
    const hour    = new Date().getHours();
    const showInlineReason = isToday && hour >= 17 && !done && !task.reason && task.progress !== 'Completed';

    const ps = task.progress ? (PROGRESS_STYLE[task.progress] ?? { bg: '#f1f5f9', color: '#64748b', label: task.progress }) : null;

    return (
        <div style={{
            background: done ? '#f8fffe' : '#fff',
            border: `1.5px solid ${done ? '#bbf7d0' : isToday ? '#bfdbfe' : '#e8ecf4'}`,
            borderRadius: 14, padding: '16px', transition: 'all 0.2s',
            animation: 'taskFadeUp 0.35s ease both',
        }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                {/* Status dot */}
                <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, marginTop: 5, background: done ? '#16a34a' : isToday ? '#3b82f6' : '#e2e8f0', transition: 'background 0.2s' }} />

                {/* Body */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: done ? '#9ca3af' : '#1a2340', textDecoration: done ? 'line-through' : 'none', lineHeight: 1.45, marginBottom: 5 }}>
                        {task.description}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: '0.72rem', color: '#a0aec0' }}>
                        {task.projectName && task.projectName !== '—' && <span>🗂 {task.projectName}</span>}
                        <span>📅 {fmt(task.day)}</span>
                        {task.startTime && <span>⏰ {fmtTime(task.startTime)} – {fmtTime(task.endTime)}</span>}
                    </div>
                    {task.reason && (
                        <div style={{ marginTop: 6, fontSize: '0.72rem', color: '#b7791f', fontStyle: 'italic' }}>
                            📝 {task.reason}
                        </div>
                    )}
                    {/* Inline end-of-day reason box */}
                    {showInlineReason && <InlineReasonBox task={task} onSaved={onProgressUpdated} />}
                </div>

                {/* Badges */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    {ps ? (
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: ps.bg, color: ps.color, whiteSpace: 'nowrap' }}>
                            {ps.label}
                        </span>
                    ) : (
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: '#f1f5f9', color: '#94a3b8' }}>Pending</span>
                    )}
                    {isToday && (
                        <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#dbeafe', color: '#2563eb' }}>Today</span>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MyTasks() {
    const { user } = useAuth();

    // Use _id — that's what your AuthContext stores from loginApi response
    const employeeId = (user as any)?._id ?? (user as any)?.id ?? '';

    const [tasks,      setTasks]      = useState<Task[]>([]);
    const [loading,    setLoading]    = useState(true);
    const [bgLoading,  setBgLoading]  = useState(false);  // silent background refetch
    const [error,      setError]      = useState('');
    const [reasonTask, setReasonTask] = useState<Task | null>(null);

    // Filters
    const [statusFilter,  setStatusFilter]  = useState<'all' | 'pending' | 'completed' | 'in_progress'>('all');
    const [projectFilter, setProjectFilter] = useState<string>('all');
    const [dayFilter,     setDayFilter]     = useState<string>('all');

    const load = async () => {
        if (!employeeId) { setLoading(false); return; }
        setLoading(true); setError('');

        try {
            // The backend /employee-day endpoint matches tasks by their createdAt date.
            // Query today + last 30 days to get all tasks ever assigned to this employee.
            const dates: string[] = [];
            for (let i = 0; i < 30; i++) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                // Build local date string (YYYY-MM-DD) — avoids UTC offset shifting the date
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                dates.push(`${y}-${m}-${day}`);
            }

            const results = await Promise.allSettled(
                dates.map(date => getTasksByEmployeeAndDate(employeeId, date))
            );

            const allRaw: any[] = [];
            results.forEach(r => {
                if (r.status === 'fulfilled') allRaw.push(...(r.value as any[]));
            });

            // Deduplicate by _id
            const seen = new Set<string>();
            const deduped = allRaw.filter(raw => {
                const id = raw._id || raw.id;
                if (!id || seen.has(id)) return false;
                seen.add(id);
                return true;
            });

            setTasks(deduped.map(normaliseTask));
        } catch (err: any) {
            console.error('[MyTasks] load error:', err);
            setError('Failed to load tasks. Please try again.');
        } finally {
            setLoading(false);
            setBgLoading(false);
        }
    };

    useEffect(() => {
        if (employeeId) {
            load();
        } else {
            // Auth may not have hydrated yet — wait then stop loading
            const t = setTimeout(() => setLoading(false), 2000);
            return () => clearTimeout(t);
        }
    }, [employeeId]);

    // Auto-trigger end-of-day modal after 5 PM for unresolved pending tasks
    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 17 || tasks.length === 0 || reasonTask) return;
        const pending = tasks.find(t => t.day === today() && !isDone(t) && !t.reason);
        if (pending) setReasonTask(pending);
    }, [tasks]);

    const projectOptions = useMemo(() => {
        const map = new Map<string, string>();
        tasks.forEach(t => { if (t.projectId) map.set(t.projectId, t.projectName); });
        return [...map.entries()].map(([id, name]) => ({ id, name }));
    }, [tasks]);

    const filtered = useMemo(() => {
        return tasks.filter(t => {
            if (statusFilter === 'completed'   && !isDone(t))                         return false;
            if (statusFilter === 'pending'     && (isDone(t) || t.progress === 'In Progress')) return false;
            if (statusFilter === 'in_progress' && t.progress !== 'In Progress')        return false;
            if (projectFilter !== 'all' && t.projectId !== projectFilter)              return false;
            if (dayFilter === 'today'          && t.day !== today())                   return false;
            if (dayFilter !== 'all' && dayFilter !== 'today' && t.day !== dayFilter)   return false;
            return true;
        });
    }, [tasks, statusFilter, projectFilter, dayFilter]);

    const totalToday = tasks.filter(t => t.day === today()).length;
    const doneToday  = tasks.filter(t => t.day === today() && isDone(t)).length;

    const handleProgressUpdated = (id: string, progress: string, reason: string) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, progress, reason } : t));
        setReasonTask(null);
        // Check for next pending end-of-day task
        setTimeout(() => {
            const hour = new Date().getHours();
            if (hour < 17) return;
            setTasks(prev => {
                const next = prev.find(t => t.id !== id && t.day === today() && !isDone(t) && !t.reason);
                if (next) setReasonTask(next);
                return prev;
            });
        }, 600);
    };

    const selectStyle: React.CSSProperties = {
        padding: '8px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc',
        fontSize: '0.8rem', color: '#1a2340', fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                .mytasks * { box-sizing:border-box; }
                @keyframes taskFadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
                @keyframes skShimmer  { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
                .sk { background:linear-gradient(90deg,#f0f4ff 25%,#e2e8f0 50%,#f0f4ff 75%); background-size:400px 100%; animation:skShimmer 1.3s infinite linear; border-radius:5px; }
            `}</style>

            <div className="mytasks" style={{ fontFamily: "'Plus Jakarta Sans','Segoe UI',sans-serif", display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h1 style={{ fontSize: 'clamp(1.3rem,4vw,1.75rem)', fontWeight: 800, color: '#1a2340', letterSpacing: '-0.4px', margin: 0 }}>My Tasks</h1>
                        <p style={{ fontSize: '0.82rem', color: '#a0aec0', margin: '4px 0 0' }}>Your daily task log across all projects</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {bgLoading && <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Loading more…</span>}
                        {totalToday > 0 && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(to right,#0B0E92,#69A6F0)', color: '#fff', padding: '8px 16px', borderRadius: 30, fontSize: '0.78rem', fontWeight: 600, boxShadow: '0 4px 14px rgba(11,14,146,0.25)' }}>
                                ✅ Today: {doneToday}/{totalToday} done
                            </div>
                        )}
                        <button onClick={load} title="Refresh" style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                            🔄
                        </button>
                    </div>
                </div>

                {/* No employee ID warning */}
                {!loading && !employeeId && (
                    <div style={{ background: '#fff8e6', border: '1.5px solid #fde68a', borderRadius: 14, padding: '16px 20px', color: '#b45309', fontSize: '0.85rem', fontWeight: 500 }}>
                        ⚠️ Employee ID not found. Please log out and log in again.
                    </div>
                )}

                {/* Summary cards */}
                {!loading && !error && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 14 }}>
                        {[
                            { label: 'Total Tasks',   value: tasks.length,                                             color: '#0B0E92', bg: '#eff6ff' },
                            { label: "Today's",       value: totalToday,                                               color: '#0891b2', bg: '#ecfeff' },
                            { label: 'In Progress',   value: tasks.filter(t => t.progress === 'In Progress').length,   color: '#2563eb', bg: '#dbeafe' },
                            { label: 'Not Completed', value: tasks.filter(t => t.progress === 'Not Completed').length, color: '#b7791f', bg: '#fff8e6' },
                            { label: 'Completed',     value: tasks.filter(t => isDone(t)).length,                     color: '#16a34a', bg: '#f0fdf4' },
                        ].map(s => (
                            <div key={s.label} style={{ background: '#fff', border: '1.5px solid #e8ecf4', borderRadius: 14, padding: '14px 16px', boxShadow: '0 1px 6px rgba(30,40,100,0.05)' }}>
                                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color, letterSpacing: '-0.5px' }}>{s.value}</div>
                                <div style={{ fontSize: '0.72rem', color: '#6b7a9d', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Filters */}
                {!loading && !error && tasks.length > 0 && (
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} style={selectStyle}>
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                        </select>
                        <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} style={selectStyle}>
                            <option value="all">All Projects</option>
                            {projectOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <select value={dayFilter} onChange={e => setDayFilter(e.target.value)} style={selectStyle}>
                            <option value="all">All Dates</option>
                            <option value="today">Today</option>
                            {[...new Set(tasks.map(t => t.day))].sort((a, b) => b.localeCompare(a)).map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                        {(statusFilter !== 'all' || projectFilter !== 'all' || dayFilter !== 'all') && (
                            <button onClick={() => { setStatusFilter('all'); setProjectFilter('all'); setDayFilter('all'); }}
                                style={{ padding: '8px 14px', borderRadius: 10, border: '1.5px solid #fecaca', background: '#fff0f0', color: '#dc2626', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                ✕ Clear
                            </button>
                        )}
                    </div>
                )}

                {/* Loading */}
                {loading && <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[1,2,3,4].map(n => <TaskSkeleton key={n} />)}</div>}

                {/* Error */}
                {!loading && error && (
                    <div style={{ background: '#fff0f0', border: '1.5px solid #fecaca', borderRadius: 14, padding: '20px 24px', color: '#dc2626', fontSize: '0.875rem' }}>
                        ⚠️ {error}
                        <button onClick={load} style={{ marginLeft: 12, textDecoration: 'underline', background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>Retry</button>
                    </div>
                )}

                {/* Empty */}
                {!loading && !error && employeeId && filtered.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff', borderRadius: 16, border: '1.5px solid #e8ecf4' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📋</div>
                        <div style={{ fontWeight: 700, color: '#1a2340', marginBottom: 6 }}>{tasks.length === 0 ? 'No tasks yet' : 'No tasks match filters'}</div>
                        <div style={{ fontSize: '0.82rem', color: '#a0aec0' }}>{tasks.length === 0 ? 'Log tasks from My Projects to track your work here.' : 'Try adjusting the filters above.'}</div>
                    </div>
                )}

                {/* Task list */}
                {!loading && !error && filtered.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[...filtered].sort((a, b) => b.day.localeCompare(a.day)).map(task => (
                            <TaskCard key={task.id} task={task} onProgressUpdated={handleProgressUpdated} />
                        ))}
                    </div>
                )}
            </div>

            {/* End-of-day modal — auto-triggered after 5 PM */}
            {reasonTask && (
                <ReasonModal task={reasonTask} onClose={() => setReasonTask(null)} onSaved={handleProgressUpdated} />
            )}
        </>
    );
}