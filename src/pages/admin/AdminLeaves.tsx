import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLeaves } from '../../modules/leaves/useLeaves';
import LeaveTable from '../../modules/leaves/components/LeaveTable';
import {
  Modal,
  SearchInput,
  Select,
  Card,
} from '../../components/ui';
import { PageHeader } from '../../components/common';
import Button from '../../components/ui/Button';
import Textarea from '../../components/ui/Textarea';
import type { LeaveRequest } from '../../types';
import { getEmployees } from '../../service/Empolyee.service';

export default function AdminLeaves() {
  const { user } = useAuth();

  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmp, setSelectedEmp] = useState('');
  const [rejecting, setRejecting] = useState<LeaveRequest | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  const {
    filtered,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    approve,
    reject,
  } = useLeaves(selectedEmp || undefined);

  // ─── LOAD EMPLOYEES ─────────────────────────────
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setLoadingEmployees(true);
        const res = await getEmployees();
        setEmployees(res.users || []);
      } catch (err) {
        console.error('Failed to load employees', err);
        setEmployees([]);
      } finally {
        setLoadingEmployees(false);
      }
    };

    loadEmployees();
  }, []);

  // ─── OPTIONS ────────────────────────────────────
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  const employeeOptions = [
    { value: '', label: 'All Employees' },
    ...employees.map((emp) => ({
      value: emp.empNumber || emp.empId || emp.employeeId,
      label: `${emp.name} (${emp.empId})`,
    })),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Requests"
        subtitle="Review and manage all employee leave requests"
      />

      <Card padding={false}>
        {/* Filters */}
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

     
        </div>

        {/* Table */}
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

      {/* Reject Modal */}
      {rejecting && (
        <Modal
          title="Reject Leave Request"
          onClose={() => setRejecting(null)}
        >
          <p className="text-sm text-slate-600 mb-4">
            Rejecting leave for{' '}
            <strong>{rejecting.userName}</strong> (
            {rejecting.leaveType}, {rejecting.days} days)
          </p>

          <Textarea
            label="Rejection Reason (optional)"
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="Provide a reason…"
            rows={3}
          />

          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setRejecting(null)}
            >
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