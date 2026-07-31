// ─── UpdateProgressModal ──────────────────────────────────────────────────────
import React, { useState } from 'react';
import { Edit2, X, AlertCircle, Loader2 } from 'lucide-react';
import { updateTaskProgress } from '../../../service/taskApi';
import { isEndOfDay, PROGRESS_CFG } from "../../../utils/projecthelper";
import type { Task, ProgressValue } from "../types";

interface UpdateProgressModalProps {
  task: Task;
  onClose: () => void;
  onUpdated: (id: string, progress: string, reason: string) => void;
}

const OPTIONS: ProgressValue[] = ['Completed', 'Not Completed'];

export default function UpdateProgressModal({
  task,
  onClose,
  onUpdated,
}: UpdateProgressModalProps) {
  const [progress, setProgress] = useState<ProgressValue>(
    (task.progress as ProgressValue) ?? 'Completed',
  );
  const [reason, setReason]   = useState(task.reason ?? '');
  const [endTime, setEndTime] = useState('');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const isNotCompleted = progress === 'Not Completed';

  const handleSubmit = async () => {
    setError('');

    // ── Validation ────────────────────────────────────────────────────────────
    if (isNotCompleted && !reason.trim()) {
      setError('Please provide a reason.');
      return;
    }

    const taskId = task._id || task.id;
    if (!taskId) {
      setError('Invalid task ID. Please close and try again.');
      return;
    }

    setSaving(true);
    try {
      if (isNotCompleted) {
        // ✅ Not Completed → send taskId + progress + reason + endTime
        const resolvedEndTime = endTime
          ? new Date(endTime).toISOString()
          : new Date().toISOString();
        await updateTaskProgress(taskId, progress, reason, resolvedEndTime);
      } else {
        // ✅ Completed → send ONLY taskId + progress (no endTime, no reason)
        await updateTaskProgress(taskId, progress);
      }

      onUpdated(taskId, progress, reason);
      onClose();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message || 'Failed to update. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-[420px] overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
            <Edit2 size={14} className="text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">Update Progress</p>
            <p className="text-xs text-slate-400 truncate">{task.description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={14} className="text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4">

          {isEndOfDay() && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
              <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                End of day — please update your task status.
              </p>
            </div>
          )}

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          {/* Status selector */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
              Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {OPTIONS.map((opt) => {
                const cfg = PROGRESS_CFG[opt];
                const active = progress === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => setProgress(opt)}
                    className={`flex flex-col items-center gap-1.5 px-1 py-3 rounded-xl border-2 text-[11px] font-semibold transition-all
                      ${active
                        ? `${cfg.bg} ${cfg.text} ${cfg.border}`
                        : 'border-slate-100 text-slate-400 hover:border-slate-200'
                      }`}
                  >
                    <span className={active ? cfg.text : 'text-slate-300'}>
                      {cfg.icon}
                    </span>
                    <span className="text-center leading-tight">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Not Completed only fields ─────────────────────────────────── */}
          {isNotCompleted && (
            <>
              {/* End Time */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                  End Time{' '}
                  <span className="text-slate-300 font-normal normal-case">
                    (optional — defaults to now)
                  </span>
                </label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                  Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why was this not completed?"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 resize-none transition-all"
                />
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
            >
              {saving && <Loader2 size={13} className="animate-spin" />}
              Save
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}