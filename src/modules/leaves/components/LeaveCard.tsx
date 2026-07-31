import { Calendar, Clock } from 'lucide-react';
import type { LeaveRequest } from '../../../types';

interface LeaveCardProps {
  leave: LeaveRequest;
}

export default function LeaveCard({ leave }: LeaveCardProps) {
  const statusStyle: Record<string, string> = {
    approved: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    pending: 'bg-amber-50  text-amber-600  border-amber-200',
    rejected: 'bg-rose-50   text-rose-600   border-rose-200',
  };
  const s = leave.status?.toLowerCase() ?? 'pending';

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-800 text-sm">{leave.leaveType}</p>
          <p className="text-xs text-slate-400 mt-0.5">Applied: {leave.appliedOn}</p>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${statusStyle[s] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
          {leave.status}
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
        <span className="flex items-center gap-1">
          <Calendar size={12} />
          {leave.startDate} → {leave.endDate}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={12} />
          {leave.days} day{leave.days !== 1 ? 's' : ''}
        </span>
      </div>
      {leave.reason && (
        <p className="text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2 line-clamp-2">
          {leave.reason}
        </p>
      )}
    </div>
  );
}