import React, { useState } from 'react';
import { Input, Select, Button } from '../../../components/ui';
import Textarea from '../../../components/ui/Textarea';
import type { Announcement } from '../../../data/store';

interface AnnouncementFormProps {
  createdBy: string;
  onSubmit: (data: Omit<Announcement, 'id'>) => Promise<boolean>;
  onCancel: () => void;
}

export default function AnnouncementForm({ createdBy, onSubmit, onCancel }: AnnouncementFormProps) {
  const [form, setForm] = useState({
    title: '',
    content: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    targetDeptId: 'all',
  });
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({
      ...form,
      createdBy,
      createdAt: new Date().toISOString(),
    });
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Title" value={form.title} onChange={set('title')} required placeholder="Announcement title…" />
      <Textarea label="Content" value={form.content} onChange={set('content')} required rows={5} placeholder="Write announcement content…" />
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Priority"
          value={form.priority}
          onChange={set('priority')}
          options={[
            { value: 'low', label: '🟢 Low' },
            { value: 'medium', label: '🟡 Medium' },
            { value: 'high', label: '🔴 High' },
          ]}
        />
        <Select
          label="Target"
          value={form.targetDeptId}
          onChange={set('targetDeptId')}
          options={[{ value: 'all', label: 'All Employees' }]}
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>Post Announcement</Button>
      </div>
    </form>
  );
}
