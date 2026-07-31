import React, { useState } from 'react';
import { Input, Button } from '../../../components/ui';
import Textarea from '../../../components/ui/Textarea';
import type { Department } from '../../../service/departmentApi';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
    weekOffDays:   initial?.weekOffDays   ?? [] as string[],
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

  const toggleDay = (day: string) => {
    setForm(p => ({
      ...p,
      weekOffDays: p.weekOffDays.includes(day)
        ? p.weekOffDays.filter((d: string) => d !== day)
        : [...p.weekOffDays, day],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({ ...form, employeeCount: Number(form.employeeCount) });
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      <Input
        label="Department Name"
        value={form.name}
        onChange={set('name')}
        placeholder="e.g. Engineering, Consultancy, Design…"
        required
      />

      <Input
        label="Department Head"
        value={form.head}
        onChange={set('head')}
        placeholder="e.g. Sravan Kumar"
        required
      />

      <Textarea
        label="Description"
        value={form.description}
        onChange={set('description')}
        rows={3}
        placeholder="Brief description of the department…"
      />

      {/* ── Week Off Days ── */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Week Off Days
        </label>
        <div className="flex flex-wrap gap-2">
          {ALL_DAYS.map(day => {
            const selected = form.weekOffDays.includes(day);
            const isWeekend = day === 'Saturday' || day === 'Sunday';
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150
                  ${selected
                    ? isWeekend
                      ? 'bg-red-500 border-red-500 text-white shadow-sm'
                      : 'bg-[#0B0E92] border-[#0B0E92] text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
              >
                {day.slice(0, 3)}  {/* Mon, Tue, Wed… */}
              </button>
            );
          })}
        </div>
        {form.weekOffDays.length > 0 && (
          <p className="text-xs text-slate-400 mt-2">
            Off days: {form.weekOffDays.join(', ')}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>
          {initial?.id ? 'Save Changes' : 'Create Department'}
        </Button>
      </div>
    </form>
  );
}