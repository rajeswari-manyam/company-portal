import React, { useState } from 'react';
import { Input, Button } from '../../../components/ui';
import Textarea from '../../../components/ui/Textarea';
import type { Department } from '../../../data/store';

// ── Import the departments JSON directly ──────────────────────────────────────
import departmentsData from '../../../data/departments.json';

interface DepartmentFormProps {
  initial?: Partial<Department>;
  onSubmit: (data: Omit<Department, 'id'>) => Promise<boolean>;
  onCancel: () => void;
}

export default function DepartmentForm({ initial, onSubmit, onCancel }: DepartmentFormProps) {
  const [form, setForm] = useState({
    name:          initial?.name          ?? '',
    head:          initial?.head          ?? '',
    description:   initial?.description   ?? '',
    employeeCount: initial?.employeeCount ?? 0,
    weekOffDays:   initial?.weekOffDays   ?? [],
    createdAt:     initial?.createdAt     ?? new Date().toISOString().slice(0, 10),
  });
  const [loading, setLoading] = useState(false);

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(p => ({
        ...p,
        [k]: k === 'employeeCount' ? Number(e.target.value) : e.target.value,
      }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({ ...form, employeeCount: Number(form.employeeCount) });
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* ── Department Name — populated from JSON ── */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">
          Department Name <span className="text-red-500">*</span>
        </label>
        <select
          value={form.name}
          onChange={set('name')}
          required
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm
                     text-slate-800 shadow-sm outline-none
                     focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200
                     disabled:bg-slate-50 disabled:text-slate-400"
        >
          <option value="" disabled>Select a department…</option>
          {departmentsData.departments.map((dept) => (
            <option key={dept.id} value={dept.name}>
              {dept.name} ({dept.code})
            </option>
          ))}
        </select>
      </div>

      <Input label="Department Head" value={form.head} onChange={set('head')} required />
      <Textarea label="Description" value={form.description} onChange={set('description')} rows={3} />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>
          {initial?.id ? 'Save Changes' : 'Create Department'}
        </Button>
      </div>
    </form>
  );
}