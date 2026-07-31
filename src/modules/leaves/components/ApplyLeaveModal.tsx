// src/modules/leaves/components/ApplyLeaveModal.tsx
import LeaveForm from "./LeaveForm"; // ✅ import form, not card
import type { LeaveRequest } from "../../../types";

interface ApplyModalProps {
  user: {
    _id?: string;
    id?: string;
    empNumber?: string;
    empId?: string;
    name?: string;
    department?: string;
  } | null;
  onClose: () => void;
  onSubmit: (data: Omit<LeaveRequest, 'id'>) => Promise<boolean>;
}

export default function ApplyModal({ user, onClose, onSubmit }: ApplyModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-800 text-base">Apply for Leave</h2>
            <p className="text-xs text-slate-400 mt-0.5">Fill in the details below</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors text-slate-500 font-bold text-sm"
          >
            ✕
          </button>
        </div>
        <div className="p-5">
          <LeaveForm
            userId={user?._id ?? user?.id ?? ''}
            empNumber={user?.empNumber ?? user?.empId ?? ''}
            userName={user?.name ?? ''}
            department={user?.department ?? ''}
            onSubmit={onSubmit}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}