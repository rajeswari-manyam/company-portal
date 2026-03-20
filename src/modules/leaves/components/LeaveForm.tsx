import React, { useState } from 'react';
import { Input, Select, Button } from '../../../components/ui';
import Textarea from '../../../components/ui/Textarea';
import { LEAVE_TYPES } from '../../../constants';
import { LeaveService } from '../LeaveService';
import type { LeaveRequest } from '../../../types';

interface LeaveFormProps {
  userId: string;       // maps → employeeId
  empNumber: string;    // ✅ added: maps → empNumber
  userName: string;
  department: string;
  onSubmit: (data: Omit<LeaveRequest, 'id'>) => Promise<boolean>;
  onCancel: () => void;
}

export default function LeaveForm({
  userId,
  empNumber,
  userName,
  department,
  onSubmit,
  onCancel,
}: LeaveFormProps) {
  const [form, setForm] = useState({
    leaveType: LEAVE_TYPES[0].value,  // store the backend enum value
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [loading, setLoading] = useState(false);

  const days = LeaveService.countDays(form.startDate, form.endDate);

  const set =
    (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }));

  const isValid =
    form.startDate &&
    form.endDate &&
    form.reason.trim().length > 0 &&
    days > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    const ok = await onSubmit({
      // ✅ Backend-aligned fields
      userId,                      // → employeeId in API payload
      empNumber,                   // → empNumber in API payload
      userName,
      department,
      leaveType: form.leaveType,
      startDate: form.startDate,
      endDate: form.endDate,
      days,
      reason: form.reason,
      status: 'pending',
      appliedOn: new Date().toISOString().slice(0, 10),
    });
    setLoading(false);
    // parent closes modal on success; nothing else needed here
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* ── Leave Type ───────────────────────────────────────── */}
      <Select
        label="Leave Type"
        value={form.leaveType}
        onChange={set('leaveType')}
        options={LEAVE_TYPES.map(t => ({ value: t.value, label: t.label }))}
        required
      />

      {/* ── Date range — stacks on mobile, side-by-side on sm+ ─ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Start Date"
          type="date"
          value={form.startDate}
          onChange={set('startDate')}
          required
        />
        <Input
          label="End Date"
          type="date"
          value={form.endDate}
          onChange={set('endDate')}
          min={form.startDate}
          required
        />
      </div>

      {/* ── Duration badge ───────────────────────────────────── */}
      {days > 0 && (
        <p className="text-sm text-[#0B0E92] font-semibold bg-[#EEF0FF] rounded-lg px-3 py-2">
          Duration: {days} day{days !== 1 ? 's' : ''}
        </p>
      )}

      {/* ── Reason ───────────────────────────────────────────── */}
      <Textarea
        label="Reason"
        value={form.reason}
        onChange={set('reason')}
        required
        placeholder="Briefly describe the reason…"
        rows={3}
      />

      {/* ── Actions — full-width on mobile, right-aligned on sm+ */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={loading}
          disabled={!isValid}
          className="w-full sm:w-auto"
        >
          Submit Request
        </Button>
      </div>
    </form>
  );
}