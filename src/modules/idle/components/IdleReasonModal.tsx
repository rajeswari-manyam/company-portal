import React, { useState, useEffect } from 'react';
import { Moon, AlertCircle, Loader2 } from 'lucide-react';

export const IDLE_REASONS = [
  "Break",
  "Washroom",
  "Drinking Water",
  "Meeting",
  "Doubts",
  "Others"

] as const;

export type IdleReason = (typeof IDLE_REASONS)[number];

interface IdleReasonModalProps {
  /** How many seconds the user has been idle (shown in header) */
  idleSeconds: number;
  /** Called when the user submits a reason */
  onSubmit: (reason: string) => void;
  /** Called only if the user is allowed to dismiss without a reason (optional) */
  onDismiss?: () => void;
  /** While the API call is in-flight */
  saving?: boolean;
  error?: string;
}

function fmt(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function IdleReasonModal({
  idleSeconds,
  onSubmit,
  onDismiss,
  saving = false,
  error = '',
}: IdleReasonModalProps) {
  const [selected, setSelected] = useState<string>('No activity');
  const [custom, setCustom] = useState('');

  // Pulse the backdrop to draw attention
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setPulse(true), 300);
    return () => clearTimeout(t);
  }, []);

 const handleSubmit = () => {
  const reason =
    selected === 'Other' && custom.trim()
      ? custom.trim()
      : selected;

  // 🔥 Send to Electron (no API needed)
  if ((window as any).electron) {
    (window as any).electron.sendIdleReason(reason);
  }

  onSubmit(reason); // keep your existing logic (optional)
};

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors duration-500
        ${pulse ? 'bg-black/30' : 'bg-black/20'}`}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-amber-500 to-orange-400">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Moon className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest">
              Idle Detected
            </p>
            <p className="text-white font-bold text-sm leading-tight">
              You've been inactive for {fmt(idleSeconds)}
            </p>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="p-5 flex flex-col gap-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Your idle time is being recorded. Please select what you were doing
            so it can be logged correctly.
          </p>

          {error && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl px-3 py-2.5">
              <AlertCircle size={13} className="shrink-0" />
              {error}
            </div>
          )}

          {/* ── Reason grid ── */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
              Reason
            </label>
            <div className="grid grid-cols-2 gap-2">
              {IDLE_REASONS.map((r) => {
                const active = selected === r;
                return (
                  <button
                    key={r}
                    onClick={() => setSelected(r)}
                    className={`px-3 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all text-left
                      ${active
                        ? 'border-amber-400 bg-amber-50 text-amber-700'
                        : 'border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom reason input (only when Other selected) */}
          {selected === 'Other' && (
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                Specify reason
              </label>
              <input
                autoFocus
                type="text"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="Briefly describe what you were doing…"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all"
              />
            </div>
          )}

          {/* ── Actions ── */}
          <div className="flex gap-2 pt-1">
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Dismiss
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={saving || (selected === 'Other' && !custom.trim())}
              className="flex-1 px-5 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-all bg-gradient-to-r from-amber-500 to-orange-400"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Moon size={14} />
              )}
              {saving ? 'Saving…' : 'Resume Work'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}