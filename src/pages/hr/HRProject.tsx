import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus, Search, Eye, Edit2, Trash2, AlertCircle,
    ChevronLeft, ChevronRight, X, Check, ChevronDown,
    Briefcase, UserCheck, Loader2, RefreshCw, Calendar,
    CheckCircle2, Clock, PauseCircle,
} from 'lucide-react';

import { getProjects, createProject, updateProject, deleteProject } from "../../services/projectApi";
// adjust path as needed

// ─── Types ────────────────────────────────────────────────────────────────────
type ProjectStatus = 'Active' | 'Overdue' | 'Completed' | 'On Hold' | 'Planning';

/** Exact shape from normaliseProject() in projectApi */
interface Project {
    id: string;
    projectName: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    managerId?: string;
    teamMembers: string[];
    status: string;
    displayStatus: ProjectStatus;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const normaliseStatus = (raw: string): ProjectStatus => {
    const map: Record<string, ProjectStatus> = {
        active: 'Active', planning: 'Planning', completed: 'Completed',
        on_hold: 'On Hold', onhold: 'On Hold', overdue: 'Overdue',
        'in progress': 'Active', pending: 'Planning',
    };
    return map[raw?.toLowerCase()] ?? 'Planning';
};

const toInitials = (s: string) =>
    s ? s.split(/[\s_-]/).map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??';

const PALETTE = [
    'bg-violet-500', 'bg-blue-500', 'bg-orange-400', 'bg-red-500',
    'bg-teal-500', 'bg-green-500', 'bg-pink-500', 'bg-indigo-500',
    'bg-amber-500', 'bg-cyan-500',
];
const avatarColor = (key: string) =>
    PALETTE[(key.charCodeAt(0) + (key.charCodeAt(1) || 0)) % PALETTE.length];

const enrichProject = (raw: any): Project => ({
    id: raw.id || raw._id,
    projectName: raw.projectName || raw.name,
    description: raw.description,
    startDate: raw.startDate,
    endDate: raw.endDate,
    managerId: raw.managerId,
    teamMembers: raw.teamMembers || [],
    status: raw.status || 'planning',
    displayStatus: normaliseStatus(raw.status || 'planning'),
});

const statusConfig: Record<ProjectStatus, { color: string; dot: string }> = {
    Active: { color: 'text-emerald-600 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
    Overdue: { color: 'text-rose-600 bg-rose-50 border-rose-200', dot: 'bg-rose-500' },
    Completed: { color: 'text-blue-600 bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
    'On Hold': { color: 'text-amber-600 bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
    Planning: { color: 'text-purple-600 bg-purple-50 border-purple-200', dot: 'bg-purple-500' },
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ label }: { label: string }) => (
    <div className={`${avatarColor(label)} w-7 h-7 text-xs rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
        {label.slice(0, 2).toUpperCase()}
    </div>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonRow = () => (
    <tr className="animate-pulse">
        {Array(7).fill(0).map((_, i) => (
            <td key={i} className="px-4 py-4">
                <div className="h-4 bg-slate-100 rounded-lg" style={{ width: `${55 + (i * 17) % 35}%` }} />
            </td>
        ))}
    </tr>
);

// ─── Create / Edit Modal ──────────────────────────────────────────────────────
// Fields: projectName, description, startDate, endDate, managerId, teamMembers, status
// (exactly what the backend accepts)

interface ModalProps {
    mode: 'create' | 'edit';
    initial?: Partial<Project>;
    onClose: () => void;
    onDone: () => void;
}

const ProjectModal: React.FC<ModalProps> = ({ mode, initial, onClose, onDone }) => {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        projectName: initial?.projectName ?? '',
        description: initial?.description ?? '',
        startDate: initial?.startDate ?? '',
        endDate: initial?.endDate ?? '',
        managerId: initial?.managerId ?? '',
        teamMembers: (initial?.teamMembers ?? []).join(', '),
        status: normaliseStatus(initial?.status ?? 'planning'),
    });

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async () => {
        if (!form.projectName.trim()) { setError('Project name is required'); return; }
        setSaving(true); setError('');
        try {
            const payload = {
                projectName: form.projectName.trim(),
                description: form.description.trim(),
                startDate: form.startDate,
                endDate: form.endDate,
                managerId: form.managerId.trim(),
                teamMembers: form.teamMembers.split(',').map(s => s.trim()).filter(Boolean),
                status: form.status,
            };
            if (mode === 'create') await createProject(payload);
            else await updateProject(initial!.id!, payload);
            onDone();
            onClose();
        } catch (e: any) {
            setError(e?.response?.data?.message ?? 'Something went wrong. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const inp = 'w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent bg-slate-50';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">

                {/* Header */}
                <div className="flex items-center gap-3 px-6 pt-6 pb-5 border-b border-slate-100">
                    <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                        <Plus className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-slate-800">
                            {mode === 'create' ? 'Create New Project' : 'Edit Project'}
                        </h2>
                        <p className="text-xs text-slate-400">Fill in the project details below</p>
                    </div>
                    <button onClick={onClose} className="ml-auto p-1.5 hover:bg-slate-100 rounded-lg">
                        <X className="w-4 h-4 text-slate-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                    {error && (
                        <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{error}</p>
                    )}

                    {/* Project Name */}
                    <div>
                        <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                            PROJECT NAME <span className="text-rose-500">*</span>
                        </label>
                        <input className={inp} placeholder="e.g. Dashboard Redesign"
                            value={form.projectName} onChange={e => set('projectName', e.target.value)} />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs font-medium text-slate-600 mb-1.5 block">DESCRIPTION</label>
                        <textarea className={inp + ' h-24 resize-none'} placeholder="Briefly describe the project goals, scope, and expected outcomes..."
                            value={form.description} onChange={e => set('description', e.target.value)} />
                    </div>

                    {/* Start Date / End Date */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-slate-600 mb-1.5 block">START DATE</label>
                            <input type="date" className={inp} value={form.startDate} onChange={e => set('startDate', e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 mb-1.5 block">END DATE</label>
                            <input type="date" className={inp} value={form.endDate} onChange={e => set('endDate', e.target.value)} />
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="text-xs font-medium text-slate-600 mb-1.5 block">STATUS</label>
                        <select className={inp + ' cursor-pointer'} value={form.status} onChange={e => set('status', e.target.value)}>
                            {['Planning', 'Active', 'On Hold', 'Completed', 'Overdue'].map(s => (
                                <option key={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    {/* Manager ID */}
                    <div>
                        <label className="text-xs font-medium text-slate-600 mb-1.5 block">MANAGER ID</label>
                        <input className={inp} placeholder="e.g. EMP001"
                            value={form.managerId} onChange={e => set('managerId', e.target.value)} />
                    </div>

                    {/* Team Members */}
                    <div>
                        <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                            TEAM MEMBERS <span className="text-slate-400 font-normal">(comma-separated IDs)</span>
                        </label>
                        <input className={inp} placeholder="e.g. EMP001, EMP002, EMP003"
                            value={form.teamMembers} onChange={e => set('teamMembers', e.target.value)} />
                        <p className="text-xs text-slate-400 mt-1">
                            {form.teamMembers.split(',').map(s => s.trim()).filter(Boolean).length} member(s)
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-60 rounded-xl transition-colors">
                        {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {mode === 'create' ? 'Create Project' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Delete Confirm ───────────────────────────────────────────────────────────
const DeleteConfirmModal: React.FC<{
    name: string; onCancel: () => void; onConfirm: () => void; deleting: boolean;
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
                <button onClick={onCancel} className="flex-1 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors">Cancel</button>
                <button onClick={onConfirm} disabled={deleting}
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-60 rounded-xl transition-colors">
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
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [page, setPage] = useState(1);

    const [showCreate, setShowCreate] = useState(false);
    const [editTarget, setEditTarget] = useState<Project | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
    const [deleting, setDeleting] = useState(false);

    const PER_PAGE = 5;

    // ── Fetch ────────────────────────────────────────────────────────────────
    const fetchProjects = useCallback(async () => {
        setLoading(true); setFetchError('');
        try {
            const raw = await getProjects();
            setProjects(raw.map(enrichProject));
        } catch (e: any) {
            setFetchError(e?.response?.data?.message ?? 'Failed to load projects.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchProjects(); }, [fetchProjects]);

    // ── Delete ───────────────────────────────────────────────────────────────
    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deleteProject(deleteTarget.id);
            setProjects(ps => ps.filter(p => p.id !== deleteTarget.id));
            setDeleteTarget(null);
        } catch (e: any) {
            alert(e?.response?.data?.message ?? 'Delete failed. Please try again.');
        } finally {
            setDeleting(false);
        }
    };

    // ── Stats ────────────────────────────────────────────────────────────────
    const statusCounts = {
        Active: projects.filter(p => p.displayStatus === 'Active').length,
        Overdue: projects.filter(p => p.displayStatus === 'Overdue').length,
        Completed: projects.filter(p => p.displayStatus === 'Completed').length,
        'On Hold': projects.filter(p => p.displayStatus === 'On Hold').length,
        Planning: projects.filter(p => p.displayStatus === 'Planning').length,
    };

    const totalEmployees = new Set(projects.flatMap(p => p.teamMembers)).size;

    // ── Filter & paginate ────────────────────────────────────────────────────
    const filtered = projects.filter(p => {
        const q = search.toLowerCase();
        const matchSearch = !q
            || p.projectName.toLowerCase().includes(q)
            || (p.managerId ?? '').toLowerCase().includes(q)
            || p.teamMembers.some(m => m.toLowerCase().includes(q));
        const matchStatus = statusFilter === 'All Status' || p.displayStatus === statusFilter;
        return matchSearch && matchStatus;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    useEffect(() => { setPage(1); }, [search, statusFilter]);

    return (
        <div className="min-h-screen bg-slate-50">

            {/* Modals */}
            {showCreate && (
                <ProjectModal mode="create" onClose={() => setShowCreate(false)} onDone={fetchProjects} />
            )}
            {editTarget && (
                <ProjectModal mode="edit" initial={editTarget} onClose={() => setEditTarget(null)} onDone={fetchProjects} />
            )}
            {deleteTarget && (
                <DeleteConfirmModal
                    name={deleteTarget.projectName}
                    onCancel={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                    deleting={deleting}
                />
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Project Management</h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {role === 'admin' ? 'Admin' : 'HR Manager'} — Manage all projects and team assignments
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={fetchProjects} title="Refresh"
                            className="p-2.5 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition-colors">
                            <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button onClick={() => setShowCreate(true)}
                            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shadow-sm shadow-violet-200">
                            <Plus className="w-4 h-4" />
                            New Project
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

                {/* Summary Cards — only backend-backed stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3 shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                            <Briefcase className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{loading ? '—' : projects.length}</p>
                            <p className="text-xs text-slate-500">Total Projects</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3 shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                            <UserCheck className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{loading ? '—' : totalEmployees}</p>
                            <p className="text-xs text-slate-500">Unique Employees Assigned</p>
                        </div>
                    </div>
                </div>

                {/* Status Pills */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {(Object.entries(statusCounts) as [string, number][]).map(([s, count]) => {
                        const cfg = statusConfig[s as ProjectStatus];
                        return (
                            <button key={s} onClick={() => setStatusFilter(f => f === s ? 'All Status' : s)}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all
                  ${statusFilter === s
                                        ? cfg.color + ' border-current'
                                        : 'text-slate-500 bg-white border-slate-200 hover:border-slate-300'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${statusFilter === s ? cfg.dot : 'bg-slate-400'}`} />
                                {s} {count}
                            </button>
                        );
                    })}
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

                    {/* Toolbar */}
                    <div className="flex items-center gap-3 p-4 border-b border-slate-100">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                                placeholder="Search by name, manager ID, or team member..."
                                value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <div className="relative">
                            <select
                                className="appearance-none pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer"
                                value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                <option>All Status</option>
                                {Object.keys(statusCounts).map(s => <option key={s}>{s}</option>)}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                                    {/* Only columns backed by real backend fields */}
                                    {['Project Name', 'Description', 'Dates', 'Status', 'Manager ID', 'Team', 'Actions'].map(h => (
                                        <th key={h} className="text-left px-4 py-3 bg-slate-50 border-b border-slate-100 whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading && Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)}

                                {!loading && paginated.map(p => {
                                    const scfg = statusConfig[p.displayStatus];
                                    const vis = p.teamMembers.slice(0, 3);
                                    const extra = p.teamMembers.length - 3;

                                    return (
                                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">

                                            {/* Project Name + ID */}
                                            <td className="px-4 py-3.5">
                                                <div className="font-semibold text-slate-800 text-sm">{p.projectName}</div>
                                                <div className="text-xs text-slate-400 mt-0.5">{p.id}</div>
                                            </td>

                                            {/* Description */}
                                            <td className="px-4 py-3.5 max-w-48">
                                                <p className="text-sm text-slate-500 truncate" title={p.description}>
                                                    {p.description || <span className="text-slate-300 italic">No description</span>}
                                                </p>
                                            </td>

                                            {/* Dates */}
                                            <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                                                {p.startDate
                                                    ? <>
                                                        <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />{p.startDate}</div>
                                                        <div className="flex items-center gap-1 mt-0.5 text-slate-400"><span className="w-3">→</span>{p.endDate || 'TBD'}</div>
                                                    </>
                                                    : <span className="text-slate-300">Not set</span>
                                                }
                                            </td>

                                            {/* Status */}
                                            <td className="px-4 py-3.5">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${scfg.color}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${scfg.dot}`} />
                                                    {p.displayStatus}
                                                </span>
                                            </td>

                                            {/* Manager ID */}
                                            <td className="px-4 py-3.5">
                                                {p.managerId
                                                    ? <div className="flex items-center gap-2">
                                                        <Avatar label={toInitials(p.managerId)} />
                                                        <span className="text-sm text-slate-600">{p.managerId}</span>
                                                    </div>
                                                    : <span className="text-slate-300 text-sm">—</span>
                                                }
                                            </td>

                                            {/* Team Members */}
                                            <td className="px-4 py-3.5">
                                                {p.teamMembers.length === 0
                                                    ? <span className="text-xs text-slate-300">No members</span>
                                                    : <div className="flex items-center gap-2">
                                                        <div className="flex -space-x-1.5">
                                                            {vis.map(mid => <Avatar key={mid} label={toInitials(mid)} />)}
                                                            {extra > 0 && (
                                                                <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-xs font-semibold text-slate-500">
                                                                    +{extra}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-slate-400">{p.teamMembers.length}</span>
                                                    </div>
                                                }
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => setEditTarget(p)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" title="Edit">
                                                        <Edit2 className="w-4 h-4 text-slate-500" />
                                                    </button>
                                                    <button onClick={() => setDeleteTarget(p)} className="p-1.5 hover:bg-rose-50 rounded-lg transition-colors" title="Delete">
                                                        <Trash2 className="w-4 h-4 text-rose-400" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {!loading && paginated.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-16">
                                            <Briefcase className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                            <p className="text-sm text-slate-400">No projects found</p>
                                            {search && <p className="text-xs text-slate-300 mt-1">Try clearing your search</p>}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                        <p className="text-xs text-slate-400">
                            {loading
                                ? 'Loading...'
                                : `Showing ${Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–${Math.min(page * PER_PAGE, filtered.length)} of ${filtered.length}`}
                        </p>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading}
                                className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                <ChevronLeft className="w-4 h-4 text-slate-500" />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                                <button key={n} onClick={() => setPage(n)}
                                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors
                    ${page === n ? 'bg-violet-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}>
                                    {n}
                                </button>
                            ))}
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || loading}
                                className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                <ChevronRight className="w-4 h-4 text-slate-500" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HRProjects;