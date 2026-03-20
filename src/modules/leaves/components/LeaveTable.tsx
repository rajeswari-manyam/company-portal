import React from 'react';
import { Check, X } from 'lucide-react';
import { Table, Badge } from '../../../components/ui';
import type { Column } from '../../../components/ui/Table';
import type { LeaveRequest } from '../../../types';
import { formatDate } from '../../../utils/helpers';

interface LeaveTableProps {
  leaves: LeaveRequest[];
  onApprove?: (leave: LeaveRequest) => void;
  onReject?: (leave: LeaveRequest) => void;
  showEmployee?: boolean;
  canApprove?: boolean;
}

export default function LeaveTable({ leaves, onApprove, onReject, showEmployee = true, canApprove = false }: LeaveTableProps) {
  const columns: Column<LeaveRequest>[] = [
    ...(showEmployee ? [{
      key: 'userName',
      header: 'Employee',
      render: (l: LeaveRequest) => (
        <div>
          <p className="font-semibold text-slate-800 text-sm">{l.userName}</p>
          <p className="text-xs text-slate-400">{l.department}</p>
        </div>
      ),
    }] : []),
    { key: 'leaveType', header: 'Type' },
    {
      key: 'startDate',
      header: 'Period',
      render: (l) => (
        <div>
          <p className="text-sm">{formatDate(l.startDate)}</p>
          {l.startDate !== l.endDate && <p className="text-xs text-slate-400">to {formatDate(l.endDate)}</p>}
        </div>
      ),
    },
    { key: 'days', header: 'Days', render: (l) => <span className="font-semibold">{l.days}</span> },
    { key: 'status', header: 'Status', render: (l) => <Badge status={l.status} /> },
    { key: 'appliedOn', header: 'Applied', render: (l) => formatDate(l.appliedOn) },
    ...(canApprove ? [{
      key: 'actions',
      header: 'Actions',
      render: (l: LeaveRequest) => l.status === 'pending' ? (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onApprove?.(l)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-xs font-semibold transition-colors"
          >
            <Check size={12} /> Approve
          </button>
          <button
            onClick={() => onReject?.(l)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold transition-colors"
          >
            <X size={12} /> Reject
          </button>
        </div>
      ) : <span className="text-xs text-slate-400">—</span>,
    }] : []),
  ];

  return (
    <Table<LeaveRequest>
      columns={columns}
      data={leaves}
      keyExtractor={(l) => l.id}
      emptyMessage="No leave requests found"
      emptyIcon="🌴"
    />
  );
}
