import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Textarea from '../../../components/ui/Textarea';
import { Input, Select } from '../../../components/ui';
import { getDepartments } from '../../../service/departmentApi';
import type { Department } from '../../../service/departmentApi';

interface AnnouncementFormProps {
  createdBy: string;
  onSubmit: (data: any) => Promise<boolean>;
  onCancel: () => void;
}

export default function AnnouncementForm({ createdBy, onSubmit, onCancel }: AnnouncementFormProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isForAll, setIsForAll] = useState(true);
  const [deptId, setDeptId] = useState('');   // ✅ stores id (MongoDB _id mapped to 'id')
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);  // ✅ correct type

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getDepartments();    // returns { id, name }[]
        setDepartments(data);
        if (data.length > 0) setDeptId(data[0].id);  // ✅ pre-select first dept's id
      } catch {
        console.error('Failed to load departments');
      }
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isForAll && !deptId) {
      alert('Please select a department');
      return;
    }

    setLoading(true);
    const ok = await onSubmit({
      title,
      message,
      priority,
      isForAll,
      departments: isForAll ? undefined : deptId,  // ✅ sends MongoDB id, never 'all'
      createdBy,
      createdAt: new Date().toISOString(),
    });
    if (ok) { setTitle(''); setMessage(''); }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      <Input
        label="Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        required
        placeholder="e.g. Server maintenance tonight"
      />

      <Textarea
        label="Message"
        value={message}
        onChange={e => setMessage(e.target.value)}
        required
        rows={4}
        placeholder="Write your announcement…"
      />

      <Select
        label="Priority"
        value={priority}
        onChange={e => setPriority(e.target.value as any)}
        options={[
          { value: 'low', label: '🟢 Low' },
          { value: 'medium', label: '🟡 Medium' },
          { value: 'high', label: '🔴 High' },
        ]}
      />

      {/* ── Toggle: All departments vs specific ── */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Send to
        </label>
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
          {/* Toggle pill */}
          <button
            type="button"
            onClick={() => setIsForAll(v => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0
              ${isForAll ? 'bg-[#0B0E92]' : 'bg-slate-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
              ${isForAll ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>

          <div className="flex-1">
            {isForAll ? (
              <div>
                <p className="text-sm font-medium text-slate-800">All departments</p>
                <p className="text-xs text-slate-500">Every employee will receive this announcement</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-slate-800 mb-1.5">Specific department</p>
                {/* ✅ key/value both use d.id — the MongoDB _id already mapped by getAllDepartments */}
                <select
                  value={deptId}
                  onChange={e => setDeptId(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>Post Announcement</Button>
      </div>
    </form>
  );
}