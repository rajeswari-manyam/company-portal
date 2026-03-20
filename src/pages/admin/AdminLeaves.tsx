import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLeaves } from '../../modules/leaves/useLeaves';
import LeaveTable from '../../modules/leaves/components/LeaveTable';
import { Modal, SearchInput, Select, StatCard, Card } from '../../components/ui';
import { PageHeader } from '../../components/common';
import Button from '../../components/ui/Button';
import Textarea from '../../components/ui/Textarea';
import type { LeaveRequest } from '../../types';

export default function AdminLeaves() {
  const { user } = useAuth();
  const { filtered, search, setSearch, statusFilter, setStatusFilter, approve, reject, stats } = useLeaves();
  const [rejecting, setRejecting] = useState<LeaveRequest | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  const statCards = [
    { label: 'Total', value: stats.total, icon: '📋', bg: 'bg-slate-50', text: 'text-slate-700' },
    { label: 'Pending', value: stats.pending, icon: '⏳', bg: 'bg-amber-50', text: 'text-amber-700' },
    { label: 'Approved', value: stats.approved, icon: '✅', bg: 'bg-emerald-50', text: 'text-emerald-700' },
    { label: 'Rejected', value: stats.rejected, icon: '❌', bg: 'bg-red-50', text: 'text-red-700' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Leave Requests" subtitle="Review and manage all employee leave requests" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      <Card padding={false}>
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search employee…" className="flex-1 min-w-[200px]" />
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} options={statusOptions} className="w-40" />
        </div>
        <LeaveTable
          leaves={filtered}
          showEmployee
          canApprove
          onApprove={l => approve(l.id, user?.name ?? 'Admin')}
          onReject={l => { setRejecting(l); setRejectNote(''); }}
        />
      </Card>

      {rejecting && (
        <Modal title="Reject Leave Request" onClose={() => setRejecting(null)}>
          <p className="text-sm text-slate-600 mb-4">
            Rejecting leave for <strong>{rejecting.userName}</strong> ({rejecting.leaveType}, {rejecting.days} days)
          </p>
          <Textarea
            label="Rejection Reason (optional)"
            value={rejectNote}
            onChange={e => setRejectNote(e.target.value)}
            placeholder="Provide a reason…"
            rows={3}
          />
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setRejecting(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => { reject(rejecting.id, user?.name ?? 'Admin', rejectNote); setRejecting(null); }}>
              Reject Leave
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
