// ─── AddTaskModal ─────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { Plus, X, AlertCircle, Briefcase, Loader2, CheckCircle2 } from 'lucide-react';
import { createTask, getTaskById } from '../../../service/taskApi';
import { todayISO, toISO } from '../../../utils/projecthelper';
import type { Project, Task } from '../types';

interface AddTaskModalProps {
  project: Project;
  employeeId: string;
  onClose: () => void;
  onSaved: (task: Task) => void;
}

interface FormState {
  description: string;
  startTime: string;
  day: string;
}

export default function AddTaskModal({
  project,
  employeeId,
  onClose,
  onSaved,
}: AddTaskModalProps) {
  const [form, setForm] = useState<FormState>({
    description: '',
    startTime: '09:00',
    day: todayISO(),
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof FormState, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError('');

    // ── Validation ───────────────────────────────────────────────────────────
    if (!form.description.trim()) {
      setError('Description is required.');
      return;
    }

    setSaving(true);
    try {
      // ── Step 1: POST /create-task (no endTime sent) ───────────────────────
      const raw = await createTask({
        projectId: project.id,
        employeeId,
        description: form.description.trim(),
        startTime: toISO(form.day, form.startTime),
        endTime: '',   // not required at creation
        day: form.day,
      }) as Record<string, unknown>;

      const createdId = (raw.id || raw._id) as string;

      // ── Step 2: GET /gettaskById/:id — fetch DB-confirmed task ────────────
      let freshTask: Task;
      try {
        const fetched = await getTaskById(createdId);

        freshTask = {
          id: ((fetched._id || fetched.id) as string) || createdId,
          _id: ((fetched._id || fetched.id) as string) || createdId,
          projectId: project.id,
          projectName: project.name,
          employeeId,
          description: (fetched.description as string) || form.description,
          startTime: (fetched.startTime as string) || toISO(form.day, form.startTime),
          endTime: (fetched.endTime as string) || '',
          day: (fetched.day as string) || form.day,
          progress: (fetched.progress as string) ?? null,
          reason: (fetched.reason as string) ?? null,
        };
      } catch {
        // getTaskById failed — fall back to createTask response + form values
        freshTask = {
          id: createdId,
          _id: createdId,
          projectId: project.id,
          projectName: project.name,
          employeeId,
          description: form.description.trim(),
          startTime: toISO(form.day, form.startTime),
          endTime: '',
          day: form.day,
          progress: (raw.progress as string) ?? null,
          reason: (raw.reason as string) ?? null,
        };
      }

      // ── Step 3: Notify parent → auto-expands the project row ─────────────
      onSaved(freshTask);

      // ── Step 4: Show success flash, then close ────────────────────────────
      setSaved(true);
      setTimeout(() => onClose(), 900);

    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message || 'Failed to create task. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-[480px] overflow-hidden">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div
          className="flex items-center gap-3 px-5 pt-5 pb-4"
          style={{ background: 'linear-gradient(to right, #0B0E92, #69A6F0)' }}
        >
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Briefcase className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">
              Log Daily Task
            </p>
            <p className="text-white font-bold text-sm leading-tight truncate">
              {project.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────────── */}
        <div className="p-5 flex flex-col gap-4">

          {/* Success flash */}
          {saved && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl px-3 py-2.5 flex items-center gap-2">
              <CheckCircle2 size={13} className="shrink-0" />
              Task logged successfully!
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl px-3 py-2.5 flex items-center gap-2">
              <AlertCircle size={13} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Task Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="What did you work on?"
              disabled={saving || saved}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#69A6F0] focus:border-transparent resize-none transition-all disabled:opacity-60"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={form.day}
              onChange={(e) => set('day', e.target.value)}
              disabled={saving || saved}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#69A6F0] focus:border-transparent transition-all disabled:opacity-60"
            />
          </div>

          {/* Start time only */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Start Time
            </label>
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => set('startTime', e.target.value)}
              disabled={saving || saved}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#69A6F0] focus:border-transparent transition-all disabled:opacity-60"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || saved}
              className="flex-1 px-5 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
              style={{ background: 'linear-gradient(to right, #0B0E92, #69A6F0)' }}
            >
              {saving ? (
                <><Loader2 size={14} className="animate-spin" /> Saving…</>
              ) : saved ? (
                <><CheckCircle2 size={14} /> Saved!</>
              ) : (
                <><Plus size={14} /> Add Task</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}