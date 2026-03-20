import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLeaves } from '../../modules/leaves/useLeaves';
import LeaveForm from '../../modules/leaves/components/LeaveForm';
import LeaveTable from '../../modules/leaves/components/LeaveTable';
import { Modal, StatCard, Select, Card } from '../../components/ui';
import { PageHeader } from '../../components/common';
import Button from '../../components/ui/Button';
import type { LeaveRequest } from '../../types';

export default function MyLeaves() {
  const { user } = useAuth();
  const { filtered, statusFilter, setStatusFilter, apply, stats } = useLeaves(user?.id);
  const [showForm, setShowForm] = useState(false);

  const statCards = [
    { label: 'Total Applied', value: stats.total, icon: '📋', bg: 'bg-slate-50', text: 'text-slate-700' },
    { label: 'Approved', value: stats.approved, icon: '✅', bg: 'bg-emerald-50', text: 'text-emerald-700' },
    { label: 'Pending', value: stats.pending, icon: '⏳', bg: 'bg-amber-50', text: 'text-amber-700' },
    { label: 'Rejected', value: stats.rejected, icon: '❌', bg: 'bg-red-50', text: 'text-red-700' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Leave"
        subtitle="Apply and track your leave requests"
        action={<Button icon={<Plus size={16} />} onClick={() => setShowForm(true)}>Apply Leave</Button>}
      />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map(s => <StatCard key={s.label} {...s} />)}
      </div>
      <Card padding={false}>
        <div className="p-4 border-b border-slate-100">
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} options={statusOptions} className="w-40" />
        </div>
        <LeaveTable leaves={filtered} showEmployee={false} canApprove={false} />
      </Card>

      {showForm && (
        <Modal title="Apply for Leave" onClose={() => setShowForm(false)}>
          <LeaveForm
            userId={user?.id ?? ''}
            userName={user?.name ?? ''}
            department={user?.department ?? ''}
            onSubmit={async (data) => {
              const ok = await apply(data as Omit<LeaveRequest, 'id'>);
              if (ok) setShowForm(false);
              return ok;
            }}
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      )}
    </div>
  );
}
