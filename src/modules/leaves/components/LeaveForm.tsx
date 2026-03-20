import React, { useState } from 'react';
import { Input, Select, Button } from '../../../components/ui';
import Textarea from '../../../components/ui/Textarea';
import { LEAVE_TYPES } from '../../../constants';
import { LeaveService } from '../LeaveService';
import type { LeaveRequest } from '../../../types';

interface LeaveFormProps {
  userId: string;
  userName: string;
  department: string;
  onSubmit: (data: Omit<LeaveRequest, 'id'>) => Promise<boolean>;
  onCancel: () => void;
}

export default function LeaveForm({ userId, userName, department, onSubmit, onCancel }: LeaveFormProps) {
  const [form, setForm] = useState({ leaveType: LEAVE_TYPES[0], startDate: '', endDate: '', reason: '' });
  const [loading, setLoading] = useState(false);

  const days = LeaveService.countDays(form.startDate, form.endDate);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate || !form.reason.trim()) return;
    if (days <= 0) return;
    setLoading(true);
    await onSubmit({
      userId, userName, department,
      leaveType: form.leaveType,
      startDate: form.startDate,
      endDate: form.endDate,
      days,
      reason: form.reason,
      status: 'pending',
      appliedOn: new Date().toISOString().slice(0, 10),
    });
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Leave Type"
        value={form.leaveType}
        onChange={set('leaveType')}
        options={LEAVE_TYPES.map(t => ({ value: t, label: t }))}
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Start Date" type="date" value={form.startDate} onChange={set('startDate')} required />
        <Input label="End Date" type="date" value={form.endDate} onChange={set('endDate')} min={form.startDate} required />
      </div>
      {days > 0 && (
        <p className="text-sm text-[#0B0E92] font-semibold bg-[#EEF0FF] rounded-lg px-3 py-2">
          Duration: {days} day{days !== 1 ? 's' : ''}
        </p>
      )}
      <Textarea label="Reason" value={form.reason} onChange={set('reason')} required placeholder="Briefly describe the reason…" rows={3} />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading} disabled={!form.startDate || !form.endDate || days <= 0}>
          Submit Request
        </Button>
      </div>
    </form>
  );
}
