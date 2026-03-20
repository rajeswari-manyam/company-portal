import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAnnouncements } from '../../modules/announcements/useAnnouncements';
import AnnouncementCard from '../../modules/announcements/components/AnnouncementCard';
import AnnouncementForm from '../../modules/announcements/components/AnnouncementForm';
import { Modal, SearchInput, Select, EmptyState } from '../../components/ui';
import { PageHeader } from '../../components/common';
import Button from '../../components/ui/Button';

export default function AdminAnnouncements() {
  const { user } = useAuth();
  const { filtered, search, setSearch, priorityFilter, setPriorityFilter, create, remove } = useAnnouncements();
  const [showForm, setShowForm] = useState(false);

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'high', label: '🔴 High' },
    { value: 'medium', label: '🟡 Medium' },
    { value: 'low', label: '🟢 Low' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        subtitle="Post and manage company-wide announcements"
        action={<Button icon={<Plus size={16} />} onClick={() => setShowForm(true)}>New Announcement</Button>}
      />

      <div className="flex flex-wrap gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search announcements…" className="flex-1 min-w-[200px]" />
        <Select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} options={priorityOptions} className="w-44" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="📢" message="No announcements found" />
      ) : (
        <div className="space-y-4">
          {filtered.map(a => (
            <AnnouncementCard
              key={a.id}
              announcement={a}
              canDelete
              onDelete={() => remove(a.id)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <Modal title="New Announcement" onClose={() => setShowForm(false)} size="lg">
          <AnnouncementForm
            createdBy={user?.name ?? 'Admin'}
            onSubmit={async (data) => { const ok = await create(data); if (ok) setShowForm(false); return ok; }}
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      )}
    </div>
  );
}
