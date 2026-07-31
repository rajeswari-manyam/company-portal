import { useState } from 'react';
import { X } from 'lucide-react';
import type { LeaveRequest } from '../../../types';

interface Props {
  leave: LeaveRequest;
  onClose: () => void;
  onReject: (note: string) => void;
}

export default function RejectLeaveModal({ leave, onClose, onReject }: Props) {
  const [note, setNote] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <button onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center
                     rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
          <X size={16} />
        </button>

        <div>
          <h3 className="text-base font-bold text-slate-900">Reject Leave Request</h3>
          <p className="text-sm text-slate-500 mt-1">
            {(leave as any).userName} · {(leave as any).leaveType} · {(leave as any).days} days
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
            Reason (optional)
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
            placeholder="Provide a reason…"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm
                       text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10
                       focus:border-slate-400 resize-none placeholder:text-slate-400"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm
                       font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={() => onReject(note)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600
                       text-white text-sm font-semibold transition-colors">
            Reject Leave
          </button>
        </div>
      </div>
    </div>
  );
}