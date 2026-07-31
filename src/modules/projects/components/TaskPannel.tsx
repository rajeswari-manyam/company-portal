// ─── TasksPanel ───────────────────────────────────────────────────────────────
// Desktop: full table view  |  Mobile: compact card list
import React, { useState } from 'react';
import {
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  Layers,
  Calendar,
  Clock,
} from 'lucide-react';
import { deleteTask } from '../../../service/taskApi';
import { todayISO, fmtTime, fmtDate, PROGRESS_CFG } from '../../../utils/projecthelper';
import ProgressBadge from './ProgressBadge';
import type { Project, Task } from '../types';

interface TasksPanelProps {
  project: Project;
  tasks: Task[];          // already filtered for this project by ProjectRow
  onUpdateTask: (t: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

// ─── Summary pills ────────────────────────────────────────────────────────────
function SummaryPills({ tasks }: { tasks: Task[] }) {
  const breakdown: Record<string, number> = {};
  tasks.forEach((t) => {
    const k = t.progress ?? 'Pending';
    breakdown[k] = (breakdown[k] ?? 0) + 1;
  });

  const pills = [
    { label: 'Completed', color: 'bg-emerald-50 text-emerald-600' },
    { label: 'In Progress', color: 'bg-blue-50 text-blue-600' },
    { label: 'Not Completed', color: 'bg-rose-50 text-rose-500' },
    { label: 'Pending', color: 'bg-amber-50 text-amber-600' },
  ].filter((s) => breakdown[s.label]);

  return (
    <div className="flex gap-2 flex-wrap px-4 sm:px-6 pt-3 pb-2">
      <div className="rounded-lg px-2.5 py-1 bg-slate-100 text-slate-600 flex items-center gap-1.5">
        <span className="text-xs font-bold">{tasks.length}</span>
        <span className="text-[10px] font-semibold">Total</span>
      </div>
      {pills.map((s) => (
        <div key={s.label} className={`rounded-lg px-2.5 py-1 flex items-center gap-1.5 ${s.color}`}>
          <span className="text-xs font-bold">{breakdown[s.label]}</span>
          <span className="text-[10px] font-semibold">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Mobile task card ─────────────────────────────────────────────────────────
function TaskCard({
  task, index, isToday, onUpdate, onDelete,
}: {
  task: Task; index: number; isToday: boolean; onUpdate: () => void; onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const cfg = PROGRESS_CFG[task.progress ?? 'Pending'] ?? PROGRESS_CFG['Pending'];

  const handleDelete = async () => {
    setDeleting(true);
    try { await onDelete(); }
    finally { setDeleting(false); setConfirming(false); }
  };

  return (
    <div className={`rounded-xl border p-3.5 flex flex-col gap-2 ${isToday ? 'border-blue-100 bg-blue-50/40' : 'border-slate-100 bg-white'
      }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-0.5 ${cfg.dot}`} />
          <span className="text-[10px] text-slate-400 font-medium shrink-0">#{index + 1}</span>
          {isToday && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 shrink-0">
              TODAY
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onUpdate} className="p-1.5 rounded-lg hover:bg-violet-50 transition-colors">
            <Edit2 size={12} className="text-slate-400 hover:text-violet-600" />
          </button>
          <button
            onClick={() => setConfirming(!confirming)}
            disabled={deleting}
            className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${confirming ? 'bg-rose-100 text-rose-500' : 'hover:bg-rose-50 text-slate-400'
              }`}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <p className="text-sm font-medium text-slate-800 leading-snug">{task.description}</p>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Calendar size={10} className="text-slate-400" />
          {task.day}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={10} className="text-slate-400" />
          {fmtTime(task.startTime)} – {fmtTime(task.endTime)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <ProgressBadge value={task.progress} />
        {task.reason && (
          <p className="text-[11px] text-rose-400 italic truncate max-w-[160px]" title={task.reason}>
            📝 {task.reason}
          </p>
        )}
      </div>

      {confirming && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
          <AlertCircle size={12} className="text-rose-500 shrink-0" />
          <p className="text-[11px] text-rose-600 font-medium flex-1">Delete this task?</p>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1 text-[11px] font-semibold text-white bg-rose-500 hover:bg-rose-600 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-60"
          >
            {deleting ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
            {deleting ? 'Deleting…' : 'Yes'}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="text-[11px] font-medium text-slate-500 px-2 py-1 rounded-lg hover:bg-white transition-colors"
          >
            No
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Desktop table row ────────────────────────────────────────────────────────
function TaskTableRow({
  task, index, isToday, onUpdate, onDelete,
}: {
  task: Task; index: number; isToday: boolean; onUpdate: () => void; onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const cfg = PROGRESS_CFG[task.progress ?? 'Pending'] ?? PROGRESS_CFG['Pending'];

  const handleDelete = async () => {
    setDeleting(true);
    try { await onDelete(); }
    finally { setDeleting(false); setConfirming(false); }
  };

  return (
    <React.Fragment>
      <tr className={`group border-b border-slate-100 transition-colors
        ${isToday ? 'bg-blue-50/40' : 'bg-white hover:bg-slate-50/60'}
        ${confirming ? 'bg-rose-50/60' : ''}`}
      >
        <td className="px-3 py-2.5 text-xs text-slate-400 w-8 border-x border-slate-100">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
            {index + 1}
          </div>
        </td>
        <td className="px-3 py-2.5 max-w-[260px]">
          <p className="text-sm font-medium text-slate-800 leading-snug line-clamp-2">
            {task.description}
          </p>
          {isToday && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 mt-1 inline-block">
              TODAY
            </span>
          )}
        </td>
        <td className="px-3 py-2.5 whitespace-nowrap">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Calendar size={10} className="text-slate-400" />
            {task.day}
          </div>
        </td>
        <td className="px-3 py-2.5 whitespace-nowrap">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Clock size={10} className="text-slate-400" />
            {fmtTime(task.startTime)}
          </div>
        </td>
        <td className="px-3 py-2.5 whitespace-nowrap">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Clock size={10} className="text-slate-400" />
            {fmtTime(task.endTime)}
          </div>
        </td>
        <td className="px-3 py-2.5 whitespace-nowrap">
          <ProgressBadge value={task.progress} />
        </td>
        <td className="px-3 py-2.5 max-w-[180px]">
          {task.reason ? (
            <p className="text-[11px] text-rose-400 italic truncate" title={task.reason}>
              📝 {task.reason}
            </p>
          ) : (
            <span className="text-xs text-slate-300">—</span>
          )}
        </td>
        <td className="px-3 py-2.5 border-x border-slate-100">
          <div className="flex items-center gap-1">
            <button
              onClick={onUpdate}
              title="Update progress"
              className="p-1.5 rounded-lg hover:bg-violet-50 transition-colors group/btn"
            >
              <Edit2 size={12} className="text-slate-400 group-hover/btn:text-violet-600" />
            </button>
            <button
              onClick={() => setConfirming(!confirming)}
              disabled={deleting}
              className={`p-1.5 rounded-lg transition-colors disabled:opacity-40
                ${confirming
                  ? 'bg-rose-100 text-rose-500'
                  : 'hover:bg-rose-50 text-slate-400 hover:text-rose-500'
                }`}
            >
              <Trash2 size={12} />
            </button>
          </div>
        </td>
      </tr>

      {confirming && (
        <tr className="bg-rose-50/80">
          <td colSpan={8} className="px-4 py-2">
            <div className="flex items-center gap-3">
              <AlertCircle size={12} className="text-rose-500 shrink-0" />
              <p className="text-[11px] text-rose-600 font-medium flex-1">
                Permanently delete this task?
              </p>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1 text-[11px] font-semibold text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-60 px-3 py-1 rounded-lg transition-colors"
              >
                {deleting ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button
                onClick={() => setConfirming(false)}
                disabled={deleting}
                className="text-[11px] font-medium text-slate-500 hover:text-slate-700 px-2 py-1 rounded-lg hover:bg-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}

// ─── Main TasksPanel ──────────────────────────────────────────────────────────
export default function TasksPanel({
  project,
  tasks,
  onUpdateTask,
  onDeleteTask,
}: TasksPanelProps) {
  const today = todayISO();

  // ── FIX: Do NOT filter by projectId here — tasks are already pre-filtered
  // by ProjectTable → ProjectRow before being passed down.
  // The old filter `tasks.filter(t => t.projectId === project.id)` was silently
  // dropping all tasks when the API returns projectId in a different format
  // (e.g. ObjectId vs string, or missing field entirely).
  // We use the full tasks array directly and trust the parent to pass the right ones.
  const sorted = [...tasks].sort((a, b) => {
    // Today's tasks always first
    if (a.day === today && b.day !== today) return -1;
    if (b.day === today && a.day !== today) return 1;
    // Then most recent first
    return b.day.localeCompare(a.day);
  });

  const handleDelete = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      onDeleteTask(taskId);
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  return (
    <div className="bg-slate-50 border-t border-slate-100">
      {tasks.length > 0 && <SummaryPills tasks={tasks} />}

      {sorted.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <Layers size={24} className="mx-auto mb-2 opacity-30" />
          <p className="text-xs">No tasks logged yet. Click "Add Task" to get started.</p>
        </div>
      ) : (
        <>
          {/* ── Mobile: card list (hidden on sm+) ── */}
          <div className="flex flex-col gap-2 px-4 pb-4 pt-1 sm:hidden">
            {sorted.map((task, idx) => (
              <TaskCard
                key={task.id}
                task={task}
                index={idx}
                isToday={task.day === today}
                onUpdate={() => onUpdateTask(task)}
                onDelete={() => handleDelete(task.id)}
              />
            ))}
          </div>

          {/* ── Desktop: scrollable table (hidden on mobile) ── */}
          <div className="hidden sm:block px-4 pb-4 pt-1 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  {['#', 'Description', 'Date', 'Start Time', 'End Time', 'Status', 'Note / Reason', 'Actions'].map(
                    (h, i) => (
                      <th
                        key={h}
                        className={`text-left px-3 py-2 bg-white border-y border-slate-100
                          ${i === 0 ? 'border-l rounded-tl-lg' : ''}
                          ${i === 7 ? 'border-r rounded-tr-lg' : ''}`}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {sorted.map((task, idx) => (
                  <TaskTableRow
                    key={task.id}
                    task={task}
                    index={idx}
                    isToday={task.day === today}
                    onUpdate={() => onUpdateTask(task)}
                    onDelete={() => handleDelete(task.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}