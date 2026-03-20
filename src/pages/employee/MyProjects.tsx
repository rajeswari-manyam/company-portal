import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getProjects } from '../../services/projectApi';
import {
    getTasksByEmployee,
    getTasksByEmployeeAndDate,
    createTask,
    updateTaskProgress,
} from '../../services/taskApi';

// ─── Types — matching real backend response ───────────────────────────────────
interface Project {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
}

// Real task shape from GET /employee-day or /getprojectsById
// projectId comes as nested object: { _id, name } OR plain string
interface Task {
    id: string;
    projectId: string;          // always normalised to string id
    projectName: string;        // extracted from nested projectId.name
    employeeId: string;
    description: string;
    startTime: string;
    endTime: string;
    day: string;
    progress: string | null;    // "Completed" | "Not Completed" | "In Progress" | null
    reason: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtTime(iso: string) {
    if (!iso) return '';
    try {
        if (/^\d{2}:\d{2}/.test(iso)) return iso.slice(0, 5);
        return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch { return iso; }
}
function today() { return new Date().toISOString().split('T')[0]; }
function toISO(date: string, time: string) {
    return new Date(`${date}T${time}:00`).toISOString();
}

// Normalise raw API task → Task (handles nested projectId object)
// Backend /employee-day matches tasks by createdAt date — no "day" field in response
function normaliseTask(raw: any): Task {
    const pid = raw.projectId;
    const day = raw.day
        ?? (raw.createdAt ? raw.createdAt.slice(0, 10) : null)
        ?? (raw.startTime ? raw.startTime.slice(0, 10) : '')
        ?? '';
    return {
        id: raw.id || raw._id,
        projectId: typeof pid === 'object' ? (pid?._id ?? '') : (pid ?? ''),
        projectName: typeof pid === 'object' ? (pid?.name ?? '—') : '—',
        employeeId: typeof raw.employeeId === 'object' ? (raw.employeeId?._id ?? '') : (raw.employeeId ?? ''),
        description: raw.description ?? '',
        startTime: raw.startTime ?? '',
        endTime: raw.endTime ?? '',
        day,
        progress: raw.progress ?? null,
        reason: raw.reason ?? null,
    };
}

const PROGRESS_STYLE: Record<string, { bg: string; color: string }> = {
    'Completed': { bg: '#dcfce7', color: '#16a34a' },
    'Not Completed': { bg: '#fff8e6', color: '#b7791f' },
    'In Progress': { bg: '#dbeafe', color: '#2563eb' },
};

const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4a5568', marginBottom: 6,
};
const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10,
    fontSize: '0.875rem', color: '#1a2340', fontFamily: 'inherit', outline: 'none', background: '#f8fafc',
};
const ghostBtn: React.CSSProperties = {
    padding: '9px 20px', borderRadius: 30, border: '1.5px solid #e2e8f0', background: '#f8fafc',
    color: '#6b7a9d', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
};
const primaryBtn: React.CSSProperties = {
    padding: '9px 22px', borderRadius: 30, border: 'none',
    background: 'linear-gradient(to right, #0B0E92, #69A6F0)',
    color: '#fff', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
    boxShadow: '0 4px 14px rgba(11,14,146,0.25)',
};

// ─── Add Task Modal ───────────────────────────────────────────────────────────
function AddTaskModal({ project, employeeId, onClose, onSaved }: {
    project: Project; employeeId: string;
    onClose: () => void; onSaved: (task: Task) => void;
}) {
    const [form, setForm] = useState({ description: '', startTime: '09:00', endTime: '17:00', day: today() });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async () => {
        if (!form.description.trim()) { setError('Description is required.'); return; }
        if (form.startTime >= form.endTime) { setError('End time must be after start time.'); return; }
        setSaving(true);
        try {
            const raw = await createTask({
                projectId: project.id,
                employeeId,
                description: form.description,
                startTime: toISO(form.day, form.startTime),
                endTime: toISO(form.day, form.endTime),
                day: form.day,
            });
            // createTask returns raw — normalise it
            const task: Task = {
                id: raw.id,
                projectId: project.id,
                projectName: project.name,
                employeeId,
                description: form.description,
                startTime: toISO(form.day, form.startTime),
                endTime: toISO(form.day, form.endTime),
                day: form.day,
                progress: raw.progress ?? null,
                reason: raw.reason ?? null,
            };
            onSaved(task);
            onClose();
        } catch (e: any) {
            setError(e?.response?.data?.message || 'Failed to create task.');
        } finally { setSaving(false); }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,20,60,0.5)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{ background: '#fff', borderRadius: 20, width: 'min(520px,100%)', boxShadow: '0 24px 64px rgba(11,14,146,0.18)', overflow: 'hidden', animation: 'modalIn 0.25s ease' }}>
                <style>{`@keyframes modalIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
                <div style={{ background: 'linear-gradient(to right,#0B0E92,#69A6F0)', padding: '20px 24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Log Daily Task</div>
                        <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.05rem' }}>{project.name}</div>
                    </div>
                    <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {error && <div style={{ background: '#fff0f0', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: '0.8rem', color: '#dc2626' }}>{error}</div>}
                    <div>
                        <label style={labelStyle}>Task Description *</label>
                        <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="What did you work on today?" style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }} />
                    </div>
                    <div>
                        <label style={labelStyle}>Date</label>
                        <input type="date" value={form.day} onChange={e => set('day', e.target.value)} style={inputStyle} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={labelStyle}>Start Time</label>
                            <input type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>End Time</label>
                            <input type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} style={inputStyle} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
                        <button onClick={onClose} style={ghostBtn}>Cancel</button>
                        <button onClick={handleSubmit} disabled={saving} style={{ ...primaryBtn, opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving…' : '+ Log Task'}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── End-of-Day Reason Modal ──────────────────────────────────────────────────
// Shows when a task is not completed at end of day — prompts for reason
function ReasonModal({ task, onClose, onSaved }: {
    task: Task; onClose: () => void;
    onSaved: (id: string, progress: string, reason: string) => void;
}) {
    const [progress, setProgress] = useState('Not Completed');
    const [reason, setReason] = useState(task.reason ?? '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const OPTIONS = ['Not Completed', 'In Progress', 'Completed'];

    const handleSave = async () => {
        if (progress === 'Not Completed' && !reason.trim()) {
            setError('Please provide a reason why the task was not completed.');
            return;
        }
        setSaving(true);
        try {
            await updateTaskProgress(task.id, progress, reason || undefined);
            onSaved(task.id, progress, reason);
            onClose();
        } catch (e: any) {
            setError(e?.response?.data?.message || 'Failed to save. Please try again.');
        } finally { setSaving(false); }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 201, background: 'rgba(15,20,60,0.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{ background: '#fff', borderRadius: 20, width: 'min(500px,100%)', boxShadow: '0 24px 64px rgba(11,14,146,0.20)', overflow: 'hidden', animation: 'modalIn 0.25s ease' }}>

                {/* Header — amber warning tone */}
                <div style={{ background: 'linear-gradient(to right,#b45309,#f59e0b)', padding: '20px 24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                            End of Day Check-in
                        </div>
                        <div style={{ color: '#fff', fontWeight: 800, fontSize: '1rem', maxWidth: 320 }}>
                            {task.description.length > 60 ? task.description.slice(0, 60) + '…' : task.description}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem', marginTop: 4 }}>
                            📅 {task.day} · ⏰ {fmtTime(task.startTime)} – {fmtTime(task.endTime)}
                        </div>
                    </div>
                    <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
                </div>

                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {error && <div style={{ background: '#fff0f0', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: '0.8rem', color: '#dc2626' }}>{error}</div>}

                    {/* Progress selector */}
                    <div>
                        <label style={labelStyle}>How did this task go? *</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {OPTIONS.map(opt => {
                                const ps = PROGRESS_STYLE[opt];
                                const selected = progress === opt;
                                return (
                                    <button key={opt} onClick={() => setProgress(opt)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', background: selected ? ps.bg : '#f8fafc', outline: selected ? `2px solid ${ps.color}` : '1.5px solid #e2e8f0', transition: 'all 0.15s', fontFamily: 'inherit' }}>
                                        <span style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${selected ? ps.color : '#cbd5e1'}`, background: selected ? ps.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            {selected && <span style={{ color: '#fff', fontSize: '0.55rem', fontWeight: 900 }}>✓</span>}
                                        </span>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: selected ? ps.color : '#4a5568' }}>{opt}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Reason box — required for Not Completed, optional otherwise */}
                    <div>
                        <label style={labelStyle}>
                            {progress === 'Not Completed' ? (
                                <>Reason <span style={{ color: '#dc2626' }}>*</span> <span style={{ color: '#94a3b8', fontWeight: 400 }}>(why wasn't it completed?)</span></>
                            ) : (
                                <>Note <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></>
                            )}
                        </label>
                        <textarea
                            rows={3}
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            autoFocus={progress === 'Not Completed'}
                            placeholder={
                                progress === 'Not Completed'
                                    ? 'e.g. Waiting for client approval, blocked by dependency…'
                                    : 'Any additional notes?'
                            }
                            style={{ ...inputStyle, resize: 'vertical', minHeight: 90 }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                        <button onClick={onClose} style={ghostBtn}>Skip for now</button>
                        <button onClick={handleSave} disabled={saving}
                            style={{ ...primaryBtn, background: progress === 'Completed' ? 'linear-gradient(to right,#15803d,#22c55e)' : progress === 'Not Completed' ? 'linear-gradient(to right,#b45309,#f59e0b)' : 'linear-gradient(to right,#0B0E92,#69A6F0)', opacity: saving ? 0.7 : 1 }}>
                            {saving ? 'Saving…' : 'Save Update'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Update Progress Modal ────────────────────────────────────────────────────
function UpdateProgressModal({ task, onClose, onUpdated }: {
    task: Task; onClose: () => void;
    onUpdated: (id: string, progress: string, reason: string) => void;
}) {
    const [progress, setProgress] = useState(task.progress ?? 'In Progress');
    const [reason, setReason] = useState(task.reason ?? '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const OPTIONS = ['Completed', 'Not Completed', 'In Progress'];

    const handleSubmit = async () => {
        if (progress === 'Not Completed' && !reason.trim()) { setError('Reason is required when not completed.'); return; }
        setSaving(true);
        try {
            await updateTaskProgress(task.id, progress, reason || undefined);
            onUpdated(task.id, progress, reason);
            onClose();
        } catch (e: any) {
            setError(e?.response?.data?.message || 'Failed to update progress.');
        } finally { setSaving(false); }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 201, background: 'rgba(15,20,60,0.5)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{ background: '#fff', borderRadius: 20, width: 'min(460px,100%)', boxShadow: '0 24px 64px rgba(11,14,146,0.18)', overflow: 'hidden', animation: 'modalIn 0.25s ease' }}>
                <div style={{ background: 'linear-gradient(to right,#0B0E92,#69A6F0)', padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>Update Progress</div>
                        <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>{task.description.length > 50 ? task.description.slice(0, 50) + '…' : task.description}</div>
                    </div>
                    <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer' }}>✕</button>
                </div>
                <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {error && <div style={{ background: '#fff0f0', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: '0.8rem', color: '#dc2626' }}>{error}</div>}
                    <div>
                        <label style={labelStyle}>Progress Status *</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {OPTIONS.map(opt => {
                                const ps = PROGRESS_STYLE[opt];
                                const selected = progress === opt;
                                return (
                                    <button key={opt} onClick={() => setProgress(opt)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', background: selected ? ps.bg : '#f8fafc', outline: selected ? `2px solid ${ps.color}` : '1.5px solid #e2e8f0', transition: 'all 0.15s', fontFamily: 'inherit' }}>
                                        <span style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${selected ? ps.color : '#cbd5e1'}`, background: selected ? ps.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            {selected && <span style={{ color: '#fff', fontSize: '0.55rem', fontWeight: 900 }}>✓</span>}
                                        </span>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: selected ? ps.color : '#4a5568' }}>{opt}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div>
                        <label style={labelStyle}>
                            Reason {progress === 'Not Completed' ? <span style={{ color: '#dc2626' }}>*</span> : <span style={{ color: '#a0aec0', fontWeight: 400 }}>(optional)</span>}
                        </label>
                        <textarea rows={2} value={reason} onChange={e => setReason(e.target.value)} placeholder={progress === 'Not Completed' ? 'e.g. Waiting for client approval' : 'Add a note…'} style={{ ...inputStyle, resize: 'vertical', minHeight: 64 }} />
                    </div>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                        <button onClick={onClose} style={ghostBtn}>Cancel</button>
                        <button onClick={handleSubmit} disabled={saving} style={{ ...primaryBtn, opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving…' : 'Update Progress'}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Project Card ─────────────────────────────────────────────────────────────
function ProjectCard({ project, tasks, onAddTask, onUpdateProgress }: {
    project: Project; tasks: Task[];
    onAddTask: () => void;
    onUpdateProgress: (task: Task) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const [hovered, setHovered] = useState(false);

    const myTasks = tasks.filter(t => t.projectId === project.id);
    const todayTasks = myTasks.filter(t => t.day === today());
    const todayDone = todayTasks.filter(t => t.progress === 'Completed').length;
    const totalDone = myTasks.filter(t => t.progress === 'Completed').length;
    const todayPct = todayTasks.length > 0 ? Math.round((todayDone / todayTasks.length) * 100) : 0;

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{ background: '#fff', border: '1.5px solid #e8ecf4', borderRadius: 16, overflow: 'hidden', boxShadow: hovered ? '0 8px 28px rgba(11,14,146,0.12)' : '0 1px 6px rgba(30,40,100,0.06)', transform: hovered ? 'translateY(-2px)' : 'translateY(0)', transition: 'box-shadow 0.2s, transform 0.2s' }}>

            {/* Gradient bar — only on hover */}
            <div style={{ height: 3, background: 'linear-gradient(to right,#0B0E92,#69A6F0)', opacity: hovered ? 1 : 0, transition: 'opacity 0.2s' }} />

            <div style={{ padding: '20px 22px' }}>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1a2340', marginBottom: 6 }}>{project.name}</div>
                <div style={{ display: 'flex', gap: 14, fontSize: '0.73rem', color: '#a0aec0', marginBottom: 16 }}>
                    <span>🗓 Created: {fmtDate(project.createdAt)}</span>
                    <span>🔄 Updated: {fmtDate(project.updatedAt)}</span>
                </div>

                {/* Today's progress bar */}
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#4a5568' }}>
                        Today&nbsp;<span style={{ color: '#0B0E92' }}>{todayDone}/{todayTasks.length} done</span>
                        {totalDone > 0 && <span style={{ color: '#a0aec0', marginLeft: 8 }}>· {totalDone} total ✓</span>}
                    </div>
                    <div style={{ width: 100, height: 5, background: '#e2e8f0', borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                        <div style={{ height: '100%', width: `${todayPct}%`, background: 'linear-gradient(to right,#0B0E92,#69A6F0)', borderRadius: 10, transition: 'width 0.5s ease' }} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={onAddTask} style={{ ...primaryBtn, flex: 1, fontSize: '0.78rem', padding: '9px 14px' }}>+ Log Task</button>
                    <button onClick={() => setExpanded(e => !e)} style={{ ...ghostBtn, fontSize: '0.78rem', padding: '9px 14px' }}>
                        {expanded ? '▲ Hide' : `▼ Tasks (${myTasks.length})`}
                    </button>
                </div>
            </div>

            {/* Expanded task list */}
            {expanded && (
                <div style={{ borderTop: '1px solid #e8ecf4', padding: '0 22px 18px' }}>
                    {myTasks.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px 0', color: '#a0aec0', fontSize: '0.8rem' }}>No tasks logged yet.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 14 }}>
                            {[...myTasks].sort((a, b) => b.day.localeCompare(a.day)).map(task => {
                                const ps = PROGRESS_STYLE[task.progress ?? ''] ?? { bg: '#f8fafc', color: '#6b7a9d' };
                                return (
                                    <div key={task.id} style={{ padding: '12px 14px', borderRadius: 12, background: task.day === today() ? '#fafbff' : '#f8fafc', border: `1.5px solid ${task.day === today() ? '#bfdbfe' : '#e8ecf4'}` }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1a2340', flex: 1 }}>{task.description}</div>
                                            <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '3px 9px', borderRadius: 20, flexShrink: 0, background: ps.bg, color: ps.color }}>{task.progress ?? 'Pending'}</span>
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: '#a0aec0' }}>🗓 {task.day} · ⏰ {fmtTime(task.startTime)} – {fmtTime(task.endTime)}</div>
                                        {task.reason && <div style={{ fontSize: '0.72rem', color: '#b7791f', marginTop: 4, fontStyle: 'italic' }}>📝 {task.reason}</div>}
                                        <button onClick={() => onUpdateProgress(task)} style={{ marginTop: 8, padding: '5px 12px', borderRadius: 20, border: '1.5px solid #e2e8f0', background: '#fff', fontSize: '0.7rem', fontWeight: 600, color: '#0B0E92', cursor: 'pointer', fontFamily: 'inherit' }}>
                                            ↻ Update Progress
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard({ delay = 0 }: { delay?: number }) {
    return (
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #e8ecf4', overflow: 'hidden', animation: `fadeUp 0.4s ease ${delay}s both` }}>
            <div style={{ height: 3, background: '#e8ecf4' }} />
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="sk" style={{ height: 20, width: '50%' }} />
                <div className="sk" style={{ height: 12, width: '70%' }} />
                <div className="sk" style={{ height: 40, width: '100%', marginTop: 6, borderRadius: 10 }} />
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <div className="sk" style={{ height: 36, flex: 1, borderRadius: 30 }} />
                    <div className="sk" style={{ height: 36, width: 110, borderRadius: 30 }} />
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MyProjects() {
    const { user } = useAuth();
    const employeeId = user?._id ?? '';

    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [addTaskProject, setAddTaskProject] = useState<Project | null>(null);
    const [updateProgressTask, setUpdateProgressTask] = useState<Task | null>(null);
    // End-of-day reason modal
    const [reasonTask, setReasonTask] = useState<Task | null>(null);

    const load = async () => {
        setLoading(true); setError('');
        try {
            // Fetch projects
            const rawProjects = await getProjects();
            const mapped: Project[] = rawProjects.map((raw: any) => ({
                id: raw.id || raw._id,
                name: raw.name || raw.projectName || '(unnamed)',
                createdAt: raw.createdAt ?? '',
                updatedAt: raw.updatedAt ?? '',
            }));
            setProjects(mapped);

            if (!employeeId) { setLoading(false); return; }

            // Fetch tasks for last 30 days using local date strings
            // Backend /employee-day matches by createdAt date, not startTime
            const dates: string[] = [];
            for (let i = 0; i < 30; i++) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const y = d.getFullYear();
                const mo = String(d.getMonth() + 1).padStart(2, '0');
                const dy = String(d.getDate()).padStart(2, '0');
                dates.push(`${y}-${mo}-${dy}`);
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

        } catch (err) {
            console.error('[MyProjects] load error:', err);
            setError('Failed to load. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [employeeId]);

    // Check for end-of-day pending tasks (after 5 PM)
    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 17) return; // only after 5 PM
        const pending = tasks.find(
            t => t.day === today() && (!t.progress || t.progress === 'In Progress') && !t.reason
        );
        if (pending) setReasonTask(pending);
    }, [tasks]);

    const handleTaskSaved = (task: Task) =>
        setTasks(prev => [task, ...prev.filter(t => t.id !== task.id)]);

    const handleProgressUpdated = (id: string, progress: string, reason: string) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, progress, reason } : t));
        // After saving, check if there are more pending end-of-day tasks
        setReasonTask(null);
        setTimeout(() => {
            const hour = new Date().getHours();
            if (hour < 17) return;
            setTasks(prev => {
                const next = prev.find(t => t.id !== id && t.day === today() && (!t.progress || t.progress === 'In Progress') && !t.reason);
                if (next) setReasonTask(next);
                return prev;
            });
        }, 500);
    };

    const todayLoggedCount = tasks.filter(t => t.day === today()).length;
    const completedTodayCount = tasks.filter(t => t.day === today() && t.progress === 'Completed').length;

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                .myproj * { box-sizing:border-box; }
                .proj-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:18px; }
                @media(max-width:860px){ .proj-grid{ grid-template-columns:1fr; } }
                @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
                .proj-item { animation:fadeUp 0.4s ease both; }
                @keyframes skShimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
                .sk { background:linear-gradient(90deg,#f0f4ff 25%,#e2e8f0 50%,#f0f4ff 75%); background-size:400px 100%; animation:skShimmer 1.3s infinite linear; border-radius:6px; }
            `}</style>

            <div className="myproj" style={{ fontFamily: "'Plus Jakarta Sans','Segoe UI',sans-serif", display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h1 style={{ fontSize: 'clamp(1.3rem,4vw,1.75rem)', fontWeight: 800, color: '#1a2340', letterSpacing: '-0.4px', margin: 0 }}>My Projects</h1>
                        <p style={{ fontSize: '0.82rem', color: '#a0aec0', margin: '4px 0 0' }}>All projects · log and track your daily tasks</p>
                    </div>
                    {!loading && !error && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(to right,#0B0E92,#69A6F0)', color: '#fff', padding: '7px 16px', borderRadius: 30, fontSize: '0.78rem', fontWeight: 600, boxShadow: '0 4px 14px rgba(11,14,146,0.22)' }}>
                                🗂 {projects.length} project{projects.length !== 1 ? 's' : ''}
                            </span>
                            {todayLoggedCount > 0 && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f0fdf4', color: '#16a34a', padding: '7px 16px', borderRadius: 30, fontSize: '0.78rem', fontWeight: 600, border: '1.5px solid #bbf7d0' }}>
                                    ✓ {completedTodayCount}/{todayLoggedCount} today
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Loading */}
                {loading && <div className="proj-grid">{[0, 1, 2, 3].map(i => <SkeletonCard key={i} delay={i * 0.08} />)}</div>}

                {/* Error */}
                {!loading && error && (
                    <div style={{ background: '#fff0f0', border: '1.5px solid #fecaca', borderRadius: 14, padding: '20px 24px', color: '#dc2626', fontSize: '0.875rem' }}>
                        ⚠️ {error} <button onClick={load} style={{ marginLeft: 12, textDecoration: 'underline', background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>Retry</button>
                    </div>
                )}

                {/* Empty */}
                {!loading && !error && projects.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '64px 24px', background: '#fff', borderRadius: 16, border: '1.5px solid #e8ecf4' }}>
                        <div style={{ fontSize: '2.8rem', marginBottom: 12 }}>🗂️</div>
                        <div style={{ fontWeight: 700, color: '#1a2340', fontSize: '1rem', marginBottom: 6 }}>No projects found</div>
                        <div style={{ fontSize: '0.82rem', color: '#a0aec0' }}>Projects created by the admin will appear here.</div>
                    </div>
                )}

                {/* All Projects Grid */}
                {!loading && !error && projects.length > 0 && (
                    <div className="proj-grid">
                        {projects.map((p, i) => (
                            <div key={p.id} className="proj-item" style={{ animationDelay: `${i * 0.06}s` }}>
                                <ProjectCard
                                    project={p} tasks={tasks}
                                    onAddTask={() => setAddTaskProject(p)}
                                    onUpdateProgress={setUpdateProgressTask}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Task Modal */}
            {addTaskProject && (
                <AddTaskModal project={addTaskProject} employeeId={employeeId}
                    onClose={() => setAddTaskProject(null)} onSaved={handleTaskSaved} />
            )}

            {/* Update Progress Modal */}
            {updateProgressTask && (
                <UpdateProgressModal task={updateProgressTask}
                    onClose={() => setUpdateProgressTask(null)} onUpdated={handleProgressUpdated} />
            )}

            {/* End-of-Day Reason Modal — auto-triggered after 5 PM for pending tasks */}
            {reasonTask && !updateProgressTask && !addTaskProject && (
                <ReasonModal task={reasonTask}
                    onClose={() => setReasonTask(null)} onSaved={handleProgressUpdated} />
            )}
        </>
    );
}