import React, { useState, useMemo, useEffect } from 'react';
import { Input, Select, Button } from '../../../components/ui';
import Textarea from '../../../components/ui/Textarea';
import { LEAVE_TYPES } from '../../../constants';
import type { LeaveRequest } from '../../../types';
import { countLeaveDays } from "../../../utils/dateutils";

interface LeaveFormProps {
  userId: string;
  empNumber: string;
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
    leaveType: LEAVE_TYPES[0].value,
    startDate: '',
    endDate: '',
    reason: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [balance, setBalance] = useState<any>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);


  const days = useMemo(() => {
    return countLeaveDays(form.startDate, form.endDate);
  }, [form.startDate, form.endDate]);



  // ─── TYPE SAFE INPUT HANDLER ───────────────────────────
  const handleChange =
    (key: keyof typeof form) =>
      (
        e: React.ChangeEvent<
          HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
      ) => {
        setForm((prev) => ({
          ...prev,
          [key]: e.target.value,
        }));
      };

  const isValid =
    form.startDate &&
    form.endDate &&
    form.reason.trim().length > 0 &&
    days > 0;

  // ─── SUBMIT ─────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) return;

    setLoading(true);
    setError('');

    try {
      const ok = await onSubmit({
        userId,
        empNumber,
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

      if (!ok) {
        setError('Failed to submit leave request');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Error message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
      <div className="bg-[#EEF0FF] border border-[#d6dbff] rounded-xl p-3 text-sm">
        {balanceLoading ? (
          <p className="text-slate-400">Loading leave balance...</p>
        ) : balance ? (
          <div className="flex flex-wrap gap-4 text-[#0B0E92] font-semibold">
            <p>Earned: {balance.earnedLeave ?? 0}</p>
            <p>Sick: {balance.sickLeave ?? 0}</p>
            <p>Casual: {balance.casualLeave ?? 0}</p>
          </div>
        ) : (
          <p className="text-red-500">No balance data</p>
        )}
      </div>
      {/* Leave Type */}
      <Select
        label="Leave Type"
        value={form.leaveType}
        onChange={handleChange('leaveType')}
        options={LEAVE_TYPES.map((t) => ({
          value: t.value,
          label: t.label,
        }))}
        required
      />

      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Start Date"
          type="date"
          value={form.startDate}
          onChange={handleChange('startDate')}
          required
        />
        <Input
          label="End Date"
          type="date"
          value={form.endDate}
          onChange={handleChange('endDate')}
          min={form.startDate}
          required
        />
      </div>

      {/* Duration */}
      {days > 0 && (
        <p className="text-sm text-[#0B0E92] font-semibold bg-[#EEF0FF] rounded-lg px-3 py-2">
          Duration: {days} day{days !== 1 ? 's' : ''}
        </p>
      )}

      {/* Reason */}
      <Textarea
        label="Reason"
        value={form.reason}
        onChange={handleChange('reason')}
        required
        placeholder="Briefly describe the reason…"
        rows={3}
      />

      {/* Actions */}
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