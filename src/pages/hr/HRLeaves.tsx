// src/pages/hr/HRLeaves.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLeaves } from '../../modules/leaves/useLeaves';
import LeaveTable from '../../modules/leaves/components/LeaveTable';
import { Modal, SearchInput, Select, Card } from '../../components/ui';
import { PageHeader } from '../../components/common';
import Button from '../../components/ui/Button';
import type { LeaveRequest } from '../../types';
import { getEmployees } from '../../service/Empolyee.service';
import ApplyLeaveModal from '../../modules/leaves/components/ApplyLeaveModal';

export default function HRLeaves() {
  const { user } = useAuth();

  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmp, setSelectedEmp] = useState('');
  const [rejecting, setRejecting] = useState<LeaveRequest | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [showApply, setShowApply] = useState(false);

  const {
    filtered,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    approve,
    reject,
    apply,
    refresh,
  } = useLeaves(selectedEmp || undefined);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  // Load employees
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const res = await getEmployees();
        setEmployees(res.users || []);
      } catch (err) {
        console.error('Failed to load employees', err);
        setEmployees([]);
      }
    };
    loadEmployees();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Requests"
        subtitle="Review and manage employee leaves"
      />

      {/* Filters + Apply Button */}
      <Card padding={false}>
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3">

          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search employee…"
            className="flex-1 min-w-[200px]"
          />

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusOptions}
            className="w-40"
          />

         

          <div className="flex-1" />

          {/* Apply Leave */}
          <Button onClick={() => setShowApply(true)}>
            Apply Leave
          </Button>
        </div>

        {/* Leave Table */}
        <LeaveTable
          leaves={filtered}
          showEmployee
          canApprove
          onApprove={(l) => approve(l.id)}
          onReject={(l) => {
            setRejecting(l);
            setRejectNote('');
          }}
        />
      </Card>

      {/* Apply Leave Modal */}
      {showApply && (
        <ApplyLeaveModal
          user={user}
          onClose={() => setShowApply(false)}
          onSubmit={async (data) => {
            const ok = await apply(data);
            if (ok) {
              refresh();           // refresh table
              setShowApply(false); // close modal
            }
            return ok;
          }}
        />
      )}

      {/* Reject Modal */}
      {rejecting && (
        <Modal title="Reject Leave" onClose={() => setRejecting(null)}>
          <p className="text-sm text-slate-600 mb-4">
            Rejecting leave for <strong>{rejecting.userName}</strong> ({rejecting.leaveType}, {rejecting.days} days)
          </p>

          {/* Optional rejection note */}
          <textarea
            className="w-full p-2 border rounded-md text-sm"
            placeholder="Rejection reason (optional)"
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            rows={3}
          />

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                reject(rejecting.id);
                setRejecting(null);
              }}
            >
              Reject Leave
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}