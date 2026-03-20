import React, { useState } from 'react';
import { Input, Button } from '../../../components/ui';
import Textarea from '../../../components/ui/Textarea';
import type { Department } from '../../../data/store';

interface DepartmentFormProps {
  initial?: Partial<Department>;
  onSubmit: (data: Omit<Department, 'id'>) => Promise<boolean>;
  onCancel: () => void;
}

export default function DepartmentForm({ initial, onSubmit, onCancel }: DepartmentFormProps) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    head: initial?.head ?? '',
    description: initial?.description ?? '',
    employeeCount: initial?.employeeCount ?? 0,
    createdAt: initial?.createdAt ?? new Date().toISOString().slice(0, 10),
  });
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({ ...form, employeeCount: Number(form.employeeCount) });
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Department Name" value={form.name} onChange={set('name')} required />
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
