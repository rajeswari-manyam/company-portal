import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus, Search, Edit2, Trash2, AlertCircle,
    ChevronLeft, ChevronRight, X,
    Briefcase, Loader2, RefreshCw, Calendar, Users, CheckCircle2,
    Clock, AlertTriangle, ArrowLeft, Mail, Phone, Hash,
} from 'lucide-react';
import {
    getProjects,
    createProject,
    updateProject,
    deleteProject,
} from '../../service/projectApi';
import apiClient from '../../service/apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Project {
    id: string;
    projectName: string;
    createdAt?: string;
    updatedAt?: string;
}

interface Employee {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    empId?: string;
    designation?: string;
    department?: string;
}

interface Task {
    id: string;
    description: string;
    startTime?: string;
    endTime?: string;
    progress?: string | null;
    reason?: string | null;
    createdAt?: string;
    employee: Employee;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const AVATAR_BG = [
    '#7C3AED', '#2563EB', '#059669', '#D97706',
    '#DC2626', '#0891B2', '#0D9488', '#DB2777',
];
function avatarBg(name: string) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return AVATAR_BG[Math.abs(h) % AVATAR_BG.length];
}
function initials(name: string) {
    return name.split(' ').map(w => w[0] ?? '').slice(0, 2).join('').toUpperCase();
}
function fmtDate(iso?: string) {
    return iso
        ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';
}
function fmtTime(iso?: string) {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

// ─── Progress badge ───────────────────────────────────────────────────────────
const BADGE: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    'Completed': { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: <CheckCircle2 size={11} /> },
    'In Progress': { bg: 'bg-blue-50', text: 'text-blue-600', icon: <Clock size={11} /> },
    'Not Completed': { bg: 'bg-rose-50', text: 'text-rose-500', icon: <AlertTriangle size={11} /> },
    'Pending': { bg: 'bg-amber-50', text: 'text-amber-600', icon: <Clock size={11} /> },
};

function ProgressBadge({ value }: { value?: string | null }) {
    if (!value) return <span className="text-xs text-slate-400">—</span>;
    const s = BADGE[value] ?? { bg: 'bg-slate-50', text: 'text-slate-500', icon: null };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
            {s.icon}{value}
        </span>
    );
}

// ─── Employee Detail + Tasks Drill-down ──────────────────────────────────────
function EmployeeTaskDetail({
    employee,
    projectId,
    onBack,
}: {
    employee: Employee;
    projectId: string;
    onBack: () => void;
}) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        (async () => {
            setLoading(true); setError('');
            try {
                // GET /getTasksById/:employeeId?employeeId=...&projectId=...
                const res = await apiClient.get(
                    `/getTasksById/${employee.id}?employeeId=${employee.id}&projectId=${projectId}`
                );
                const raw = res.data?.tasks ?? res.data?.data ?? (Array.isArray(res.data) ? res.data : []);
                setTasks(raw.map((t: any) => ({
                    id: t._id || t.id,
                    description: t.description,
                    startTime: t.startTime,
                    endTime: t.endTime,
                    progress: t.progress ?? null,
                    reason: t.reason ?? null,
                    createdAt: t.createdAt,
                    employee: {
                        id: t.employeeId?._id || t.employeeId || employee.id,
                        name: t.employeeId?.name ?? employee.name,
                        email: t.employeeId?.email ?? employee.email ?? '',
                        phone: t.employeeId?.phone ?? employee.phone ?? '',
                        empId: t.employeeId?.empId ?? employee.empId ?? '',
                        designation: t.employeeId?.designation ?? employee.designation ?? '',
                        department: t.employeeId?.department ?? employee.department ?? '',
                    },
                })));
            } catch (e: any) {
                setError(e?.message ?? 'Failed to load tasks');
            } finally {
                setLoading(false);
            }
        })();
    }, [employee.id, projectId]);

    // Use employee info from first task if available (populated from API)
    const emp = tasks[0]?.employee ?? employee;

    // Breakdown counts
    const breakdown = tasks.reduce<Record<string, number>>((acc, t) => {
        if (t.progress) acc[t.progress] = (acc[t.progress] ?? 0) + 1;
        return acc;
    }, {});

    return (
        <div className="flex flex-col gap-0 flex-1 overflow-hidden">
            {/* Back button + employee header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
                <button
                    onClick={onBack}
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                >
                    <ArrowLeft size={15} className="text-slate-500" />
                </button>
                <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ background: avatarBg(emp.name) }}
                >
                    {initials(emp.name)}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{emp.name}</p>
                    <p className="text-xs text-slate-400 truncate">{emp.designation || emp.email}</p>
                </div>
                <span className="text-xs text-slate-400 shrink-0">
                    {loading ? '…' : `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`}
                </span>
            </div>

            {/* Employee info cards */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                        { icon: <Mail size={12} />, label: 'Email', value: emp.email },
                        { icon: <Phone size={12} />, label: 'Phone', value: emp.phone },
                        { icon: <Hash size={12} />, label: 'Employee ID', value: emp.empId },
                        { icon: <Briefcase size={12} />, label: 'Designation', value: emp.designation },
                        { icon: <Users size={12} />, label: 'Department', value: emp.department },
                    ].filter(r => r.value).map(row => (
                        <div key={row.label} className="bg-white rounded-xl border border-slate-100 px-3 py-2.5 flex items-start gap-2">
                            <span className="text-[#0B0E92] mt-0.5 shrink-0">{row.icon}</span>
                            <div className="min-w-0">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{row.label}</p>
                                <p className="text-xs text-slate-700 font-medium truncate mt-0.5">{row.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Task body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {loading && (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
                    </div>
                )}
                {!loading && error && (
                    <p className="text-sm text-rose-500 text-center py-8">{error}</p>
                )}
                {!loading && !error && tasks.length === 0 && (
                    <div className="text-center py-10">
                        <Briefcase className="w-7 h-7 text-slate-200 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">No tasks found for this employee</p>
                    </div>
                )}

                {!loading && tasks.length > 0 && (
                    <>
                        {/* Breakdown pills */}
                        <div className="flex gap-2 flex-wrap">
                            {[
                                { label: 'Total', count: tasks.length, color: 'bg-slate-100 text-slate-600' },
                                { label: 'Completed', count: breakdown['Completed'] ?? 0, color: 'bg-emerald-50 text-emerald-600' },
                                { label: 'In Progress', count: breakdown['In Progress'] ?? 0, color: 'bg-blue-50 text-blue-600' },
                                { label: 'Not Completed', count: breakdown['Not Completed'] ?? 0, color: 'bg-rose-50 text-rose-500' },
                                { label: 'Pending', count: breakdown['Pending'] ?? 0, color: 'bg-amber-50 text-amber-600' },
                            ].filter(s => s.label === 'Total' || s.count > 0).map(s => (
                                <div key={s.label} className={`rounded-xl px-3 py-2 text-center min-w-[64px] ${s.color}`}>
                                    <p className="text-lg font-bold leading-none">{s.count}</p>
                                    <p className="text-[10px] font-medium mt-0.5">{s.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Task list */}
                        <div className="space-y-2">
                            {tasks.map(task => (
                                <div key={task.id}
                                    className="rounded-xl border border-slate-100 px-4 py-3 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="text-sm text-slate-700 font-medium flex-1">{task.description}</p>
                                        <ProgressBadge value={task.progress} />
                                    </div>
                                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 flex-wrap">
                                        {task.startTime && (
                                            <span className="flex items-center gap-1">
                                                <Clock size={11} />
                                                {fmtTime(task.startTime)} — {fmtTime(task.endTime)}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <Calendar size={11} />
                                            {fmtDate(task.startTime ?? task.createdAt)}
                                        </span>
                                    </div>
                                    {task.reason && (
                                        <p className="mt-1.5 text-xs text-rose-400 italic bg-rose-50 rounded-lg px-2.5 py-1">
                                            Reason: {task.reason}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ─── Project Tasks Modal ──────────────────────────────────────────────────────
function ProjectTasksModal({ project, onClose }: { project: Project; onClose: () => void }) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [breakdown, setBreakdown] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeEmp, setActiveEmp] = useState<string | null>(null);

    // Drill-down: when set, show EmployeeTaskDetail instead of the list
    const [drillEmployee, setDrillEmployee] = useState<Employee | null>(null);

    useEffect(() => {
        (async () => {
            setLoading(true); setError('');
            try {
                // GET /project?projectId=...
                const res = await apiClient.get(`/project?projectId=${project.id}`);
                const data = res.data;
                setBreakdown(data.breakdown ?? {});
                setTasks((data.tasks ?? []).map((t: any) => ({
                    id: t._id || t.id,
                    description: t.description,
                    startTime: t.startTime,
                    endTime: t.endTime,
                    progress: t.progress ?? null,
                    reason: t.reason ?? null,
                    createdAt: t.createdAt,
                    employee: {
                        id: t.employeeId?._id || t.employeeId || '',
                        name: t.employeeId?.name ?? 'Unknown',
                        email: t.employeeId?.email ?? '',
                        phone: t.employeeId?.phone ?? '',
                        empId: t.employeeId?.empId ?? '',
                        designation: t.employeeId?.designation ?? '',
                        department: t.employeeId?.department ?? '',
                    },
                })));
            } catch (e: any) {
                setError(e?.message ?? 'Failed to load tasks');
            } finally {
                setLoading(false);
            }
        })();
    }, [project.id]);

    // Group tasks by employee
    const empGroups: { id: string; name: string; email: string; tasks: Task[]; employee: Employee }[] = [];
    tasks.forEach(t => {
        const existing = empGroups.find(g => g.id === t.employee.id);
        if (existing) existing.tasks.push(t);
        else empGroups.push({
            id: t.employee.id,
            name: t.employee.name,
            email: t.employee.email ?? '',
            employee: t.employee,
            tasks: [t],
        });
    });

    const visibleGroups = activeEmp ? empGroups.filter(g => g.id === activeEmp) : empGroups;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden">

                {/* ── Drill-down view ── */}
                {drillEmployee ? (
                    <>
                        {/* Modal top bar */}
                        <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
                            <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                                <Briefcase className="w-4 h-4 text-violet-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-base font-semibold text-slate-800 truncate">{project.projectName}</h2>
                                <p className="text-xs text-slate-400">Employee tasks</p>
                            </div>
                            <button onClick={onClose}
                                className="ml-auto p-1.5 hover:bg-slate-100 rounded-lg transition-colors shrink-0">
                                <X className="w-4 h-4 text-slate-500" />
                            </button>
                        </div>

                        {/* Drill-down content */}
                        <EmployeeTaskDetail
                            employee={drillEmployee}
                            projectId={project.id}
                            onBack={() => setDrillEmployee(null)}
                        />
                    </>
                ) : (
                    <>
                        {/* ── Default project tasks view ── */}

                        {/* Header */}
                        <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
                            <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                                <Briefcase className="w-4 h-4 text-violet-600" />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-slate-800">{project.projectName}</h2>
                                <p className="text-xs text-slate-400">
                                    {loading
                                        ? 'Loading…'
                                        : `${tasks.length} task${tasks.length !== 1 ? 's' : ''} · ${empGroups.length} employee${empGroups.length !== 1 ? 's' : ''}`}
                                </p>
                            </div>
                            <button onClick={onClose}
                                className="ml-auto p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                                <X className="w-4 h-4 text-slate-500" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

                            {loading && (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
                                </div>
                            )}

                            {!loading && error && (
                                <p className="text-sm text-rose-500 text-center py-8">{error}</p>
                            )}

                            {!loading && !error && tasks.length === 0 && (
                                <div className="text-center py-12">
                                    <Briefcase className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                    <p className="text-sm text-slate-400">No tasks for this project yet</p>
                                </div>
                            )}

                            {!loading && tasks.length > 0 && (
                                <>
                                    {/* Breakdown pills */}
                                    <div className="flex gap-2 flex-wrap">
                                        {[
                                            { label: 'Total', count: tasks.length, color: 'bg-slate-100 text-slate-600' },
                                            { label: 'Completed', count: breakdown['Completed'] ?? 0, color: 'bg-emerald-50 text-emerald-600' },
                                            { label: 'In Progress', count: breakdown['In Progress'] ?? 0, color: 'bg-blue-50 text-blue-600' },
                                            { label: 'Not Completed', count: breakdown['Not Completed'] ?? 0, color: 'bg-rose-50 text-rose-500' },
                                            { label: 'Pending', count: breakdown['Pending'] ?? 0, color: 'bg-amber-50 text-amber-600' },
                                        ].filter(s => s.label === 'Total' || s.count > 0).map(s => (
                                            <div key={s.label} className={`rounded-xl px-4 py-2 text-center min-w-[72px] ${s.color}`}>
                                                <p className="text-lg font-bold leading-none">{s.count}</p>
                                                <p className="text-[10px] font-medium mt-0.5">{s.label}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Employee filter tabs */}
                                    {empGroups.length > 1 && (
                                        <div className="flex gap-2 flex-wrap">
                                            <button
                                                onClick={() => setActiveEmp(null)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                                                    ${!activeEmp
                                                        ? 'bg-gradient-to-r from-[#0B0E92] to-[#69A6F0] text-white'
                                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                                All employees
                                            </button>
                                            {empGroups.map(g => (
                                                <button key={g.id} onClick={() => setActiveEmp(g.id)}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                                                        ${activeEmp === g.id
                                                            ? 'bg-gradient-to-r from-[#0B0E92] to-[#69A6F0] text-white'
                                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                                                        style={{ background: avatarBg(g.name) }}>
                                                        {initials(g.name)}
                                                    </span>
                                                    {g.name}
                                                    <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold
                                                        ${activeEmp === g.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                                        {g.tasks.length}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Employee rows — click to drill down */}
                                    {visibleGroups.map(g => (
                                        <div key={g.id}>
                                            {/* Clickable employee header */}
                                            <button
                                                onClick={() => setDrillEmployee(g.employee)}
                                                className="w-full flex items-center gap-2 mb-2 p-2 rounded-xl hover:bg-slate-50 transition-colors group text-left"
                                            >
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                                                    style={{ background: avatarBg(g.name) }}>
                                                    {initials(g.name)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-slate-700 group-hover:text-[#0B0E92] transition-colors">
                                                        {g.name}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 truncate">{g.email}</p>
                                                </div>
                                                <span className="text-xs text-slate-400 shrink-0">
                                                    {g.tasks.length} task{g.tasks.length !== 1 ? 's' : ''}
                                                </span>
                                                {/* View detail hint */}
                                                <span className="text-[10px] font-medium text-[#0B0E92] bg-[#EEF0FF] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                    View details →
                                                </span>
                                            </button>

                                            {/* Task cards under this employee */}
                                            <div className="space-y-2 pl-10">
                                                {g.tasks.map((task: Task) => (
                                                    <div key={task.id}
                                                        className="rounded-xl border border-slate-100 px-4 py-3 hover:bg-slate-50 transition-colors">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <p className="text-sm text-slate-700 font-medium flex-1">{task.description}</p>
                                                            <ProgressBadge value={task.progress} />
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 flex-wrap">
                                                            {task.startTime && (
                                                                <span className="flex items-center gap-1">
                                                                    <Clock size={11} />
                                                                    {fmtTime(task.startTime)} — {fmtTime(task.endTime)}
                                                                </span>
                                                            )}
                                                            <span className="flex items-center gap-1">
                                                                <Calendar size={11} />
                                                                {fmtDate(task.startTime ?? task.createdAt)}
                                                            </span>
                                                        </div>
                                                        {task.reason && (
                                                            <p className="mt-1.5 text-xs text-rose-400 italic bg-rose-50 rounded-lg px-2.5 py-1">
                                                                Reason: {task.reason}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────
const SkeletonRow = () => (
    <tr className="animate-pulse">
        {[10, 40, 15, 20, 20, 10].map((w, i) => (
            <td key={i} className="px-4 py-4">
                <div className="h-4 bg-slate-100 rounded-lg" style={{ width: `${w + 20}%` }} />
            </td>
        ))}
    </tr>
);

// ─── Create / Edit Modal ──────────────────────────────────────────────────────
interface ModalProps {
    mode: 'create' | 'edit';
    initial?: Project;
    onClose: () => void;
    onDone: () => void;
}

const ProjectModal: React.FC<ModalProps> = ({ mode, initial, onClose, onDone }) => {
    const [name, setName] = useState(initial?.projectName ?? '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!name.trim()) { setError('Project name is required'); return; }
        setSaving(true); setError('');
        try {
            if (mode === 'create') await createProject({ name: name.trim() });
            else await updateProject(initial!.id, { name: name.trim() });
            onDone(); onClose();
        } catch (e: any) {
            setError(e?.response?.data?.message ?? e?.message ?? 'Something went wrong.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
                <div className="flex items-center gap-3 px-6 pt-6 pb-5 border-b border-slate-100">
                    <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-slate-800">
                            {mode === 'create' ? 'Create New Project' : 'Edit Project'}
                        </h2>
                        <p className="text-xs text-slate-400">
                            {mode === 'create' ? 'Add a new project to the system' : 'Update the project name'}
                        </p>
                    </div>
                    <button onClick={onClose} className="ml-auto p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                        <X className="w-4 h-4 text-slate-500" />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    {error && (
                        <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{error}</p>
                    )}
                    <div>
                        <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                            PROJECT NAME <span className="text-rose-500">*</span>
                        </label>
                        <input
                            autoFocus
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700
                                       focus:outline-none focus:ring-2 focus:ring-[#69A6F0] focus:border-transparent bg-slate-50"
                            placeholder="e.g. Dashboard Redesign"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100">
                    <button onClick={onClose}
                        className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white
                                   bg-gradient-to-r from-[#0B0E92] to-[#69A6F0] hover:opacity-90 disabled:opacity-60 rounded-xl transition-opacity">
                        {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {mode === 'create' ? 'Create Project' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
const DeleteConfirmModal: React.FC<{
    name: string;
    onCancel: () => void;
    onConfirm: () => void;
    deleting: boolean;
}> = ({ name, onCancel, onConfirm, deleting }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-rose-500" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 mb-1">Delete Project</h3>
            <p className="text-sm text-slate-500 mb-6">
                Are you sure you want to delete <span className="font-medium text-slate-700">"{name}"</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
                <button onClick={onCancel}
                    className="flex-1 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors">
                    Cancel
                </button>
                <button onClick={onConfirm} disabled={deleting}
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium
                               text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-60 rounded-xl transition-colors">
                    {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Delete
                </button>
            </div>
        </div>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
interface HRProjectsProps { role?: 'hr' | 'admin'; }

const HRProjects: React.FC<HRProjectsProps> = ({ role = 'hr' }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const [showCreate, setShowCreate] = useState(false);
    const [editTarget, setEditTarget] = useState<Project | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [tasksProject, setTasksProject] = useState<Project | null>(null);

    const PER_PAGE = 10;

    const fetchProjects = useCallback(async () => {
        setLoading(true); setFetchError('');
        try {
            const data = await getProjects();
            setProjects(data);
        } catch (e: any) {
            setFetchError(e?.response?.data?.message ?? e?.message ?? 'Failed to load projects.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchProjects(); }, [fetchProjects]);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deleteProject(deleteTarget.id);
            setProjects(ps => ps.filter(p => p.id !== deleteTarget.id));
            setDeleteTarget(null);
        } catch (e: any) {
            alert(e?.response?.data?.message ?? e?.message ?? 'Delete failed.');
        } finally {
            setDeleting(false);
        }
    };

    const filtered = projects.filter(p => !search || p.projectName.toLowerCase().includes(search.toLowerCase()));
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    useEffect(() => { setPage(1); }, [search]);

    return (
        <div className="min-h-screen bg-slate-50">

            {/* Modals */}
            {showCreate && <ProjectModal mode="create" onClose={() => setShowCreate(false)} onDone={fetchProjects} />}
            {editTarget && <ProjectModal mode="edit" initial={editTarget} onClose={() => setEditTarget(null)} onDone={fetchProjects} />}
            {deleteTarget && (
                <DeleteConfirmModal
                    name={deleteTarget.projectName}
                    onCancel={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                    deleting={deleting}
                />
            )}
            {tasksProject && (
                <ProjectTasksModal project={tasksProject} onClose={() => setTasksProject(null)} />
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Project Management</h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {role === 'admin' ? 'Admin' : 'HR Manager'} — Manage all projects
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={fetchProjects} title="Refresh"
                            className="p-2.5 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition-colors">
                            <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button onClick={() => setShowCreate(true)}
                            className="flex items-center gap-2 bg-gradient-to-r from-[#0B0E92] to-[#69A6F0] hover:opacity-90 text-white
                                       text-sm font-medium px-4 py-2.5 rounded-xl transition-opacity shadow-sm">
                            <Plus className="w-4 h-4" /> New Project
                        </button>
                    </div>
                </div>

                {/* Error */}
                {fetchError && (
                    <div className="mb-4 flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {fetchError}
                        <button onClick={fetchProjects} className="ml-auto text-xs font-medium underline">Retry</button>
                    </div>
                )}

                {/* Summary card */}
                <div className="mb-6">
                    <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3 shadow-sm w-52">
                        <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                            <Briefcase className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{loading ? '—' : projects.length}</p>
                            <p className="text-xs text-slate-500">Total Projects</p>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 p-4 border-b border-slate-100">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl
                                           bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#69A6F0] focus:border-transparent"
                                placeholder="Search projects…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <p className="text-xs text-slate-400 ml-auto">
                            {filtered.length} project{filtered.length !== 1 ? 's' : ''}
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                                    {['#', 'Project Name', 'Tasks', 'Created At', 'Last Updated', 'Actions'].map(h => (
                                        <th key={h} className="text-left px-4 py-3 bg-slate-50 border-b border-slate-100 whitespace-nowrap">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading && Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)}

                                {!loading && paginated.map((p, idx) => (
                                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-4 py-3.5 text-xs text-slate-400 w-10">
                                            {(page - 1) * PER_PAGE + idx + 1}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                                                    <Briefcase className="w-4 h-4 text-violet-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800 text-sm">{p.projectName}</p>
                                                    <p className="text-xs text-slate-400 font-mono">{p.id}</p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-4 py-3.5">
                                            <button
                                                onClick={() => setTasksProject(p)}
                                                className="flex items-center gap-1.5 text-xs font-medium text-violet-600
                                                           hover:text-violet-800 bg-violet-50 hover:bg-violet-100
                                                           px-3 py-1.5 rounded-lg transition-colors">
                                                <Users size={13} /> View Tasks
                                            </button>
                                        </td>

                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                {fmtDate(p.createdAt)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                {fmtDate(p.updatedAt)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setEditTarget(p)}
                                                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" title="Edit">
                                                    <Edit2 className="w-4 h-4 text-slate-500" />
                                                </button>
                                                <button onClick={() => setDeleteTarget(p)}
                                                    className="p-1.5 hover:bg-rose-50 rounded-lg transition-colors" title="Delete">
                                                    <Trash2 className="w-4 h-4 text-rose-400" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {!loading && paginated.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-16">
                                            <Briefcase className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                            <p className="text-sm text-slate-400">No projects found</p>
                                            {search && (
                                                <button onClick={() => setSearch('')} className="text-xs text-violet-500 mt-1 hover:underline">
                                                    Clear search
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!loading && filtered.length > 0 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                            <p className="text-xs text-slate-400">
                                Showing {Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–
                                {Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
                            </p>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                    className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                    <ChevronLeft className="w-4 h-4 text-slate-500" />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                                    <button key={n} onClick={() => setPage(n)}
                                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors
                                            ${page === n
                                                ? 'bg-gradient-to-r from-[#0B0E92] to-[#69A6F0] text-white'
                                                : 'hover:bg-slate-100 text-slate-600'}`}>
                                        {n}
                                    </button>
                                ))}
                                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                    className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                    <ChevronRight className="w-4 h-4 text-slate-500" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HRProjects;