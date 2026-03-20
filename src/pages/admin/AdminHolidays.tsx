import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { getHolidays, createHoliday, deleteHoliday, type Holiday } from '../../data/store';
import { Modal, Input, Select, Badge, ConfirmDialog, EmptyState, Card } from '../../components/ui';
import { PageHeader } from '../../components/common';
import Button from '../../components/ui/Button';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const TYPE_COLOR: Record<string, string> = {
  national: 'bg-indigo-100 text-indigo-700',
  regional: 'bg-blue-100 text-blue-700',
  company: 'bg-emerald-100 text-emerald-700',
};

export default function AdminHolidays() {
  const [holidays, setHolidays] = useState<Holiday[]>(() => getHolidays());
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<Holiday | null>(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [form, setForm] = useState({ name: '', date: '', type: 'national' as Holiday['type'], description: '' });

  const today = new Date().toISOString().slice(0, 10);
  const refresh = () => setHolidays(getHolidays());

  const filtered = holidays.filter(h => typeFilter === 'all' || h.type === typeFilter);
  const upcoming = filtered.filter(h => h.date >= today);
  const past = [...filtered.filter(h => h.date < today)].reverse();

  const handleCreate = () => {
    if (!form.name || !form.date) { toast.error('Name and date required'); return; }
    createHoliday(form);
    toast.success('Holiday added!');
    refresh();
    setShowForm(false);
    setForm({ name: '', date: '', type: 'national', description: '' });
  };

  const handleDelete = () => {
    if (!deleting) return;
    deleteHoliday(deleting.id);
    toast.success('Holiday removed');
    refresh();
    setDeleting(null);
  };

  const HolidayRow = ({ h }: { h: Holiday }) => {
    const d = new Date(h.date);
    const isPast = h.date < today;
    return (
      <div className={`flex items-center gap-4 px-5 py-3.5 ${isPast ? 'opacity-50' : ''}`}>
        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex flex-col items-center justify-center flex-shrink-0">
          <p className="text-xs text-indigo-400 font-bold leading-none">{d.toLocaleString('en', { month: 'short' })}</p>
          <p className="text-xl font-black text-indigo-700 leading-tight">{d.getDate()}</p>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-800 text-sm">{h.name}</p>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${TYPE_COLOR[h.type]}`}>{h.type}</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{d.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          {h.description && <p className="text-xs text-slate-500 mt-0.5">{h.description}</p>}
        </div>
        <button onClick={() => setDeleting(h)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
          <Trash2 size={15} />
        </button>
      </div>
    );
  };

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'national', label: 'National' },
    { value: 'regional', label: 'Regional' },
    { value: 'company', label: 'Company' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Holiday Calendar"
        subtitle="Manage company holiday schedule"
        action={<Button icon={<Plus size={16} />} onClick={() => setShowForm(true)}>Add Holiday</Button>}
      />

      <div className="flex flex-wrap gap-3 items-center">
        {typeOptions.map(t => (
          <button
            key={t.value}
            onClick={() => setTypeFilter(t.value)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${typeFilter === t.value ? 'bg-[#0B0E92] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {(['national', 'regional', 'company'] as Holiday['type'][]).map(type => (
          <Card key={type} className="text-center">
            <p className={`text-3xl font-black ${TYPE_COLOR[type].split(' ')[1]}`}>{holidays.filter(h => h.type === type).length}</p>
            <p className="text-sm text-slate-500 mt-1 capitalize font-medium">{type}</p>
          </Card>
        ))}
      </div>

      <Card padding={false}>
        {upcoming.length > 0 && (
          <>
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Upcoming ({upcoming.length})</p>
            </div>
            <div className="divide-y divide-slate-50">
              {upcoming.map(h => <HolidayRow key={h.id} h={h} />)}
            </div>
          </>
        )}
        {past.length > 0 && (
          <>
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Past ({past.length})</p>
            </div>
            <div className="divide-y divide-slate-50">
              {past.map(h => <HolidayRow key={h.id} h={h} />)}
            </div>
          </>
        )}
        {filtered.length === 0 && <EmptyState icon="🎉" message="No holidays found" />}
      </Card>

      {showForm && (
        <Modal title="Add Holiday" onClose={() => setShowForm(false)}>
          <div className="space-y-4">
            <Input label="Holiday Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="e.g. Diwali" />
            <Input label="Date" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
            <Select
              label="Type"
              value={form.type}
              onChange={e => setForm(p => ({ ...p, type: e.target.value as Holiday['type'] }))}
              options={[{ value: 'national', label: 'National' }, { value: 'regional', label: 'Regional' }, { value: 'company', label: 'Company' }]}
            />
            <Input label="Description (optional)" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description" />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Add Holiday</Button>
            </div>
          </div>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          message={`Remove "${deleting.name}" from the holiday calendar?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
