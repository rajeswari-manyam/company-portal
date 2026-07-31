// src/pages/admin/AdminAnnouncements.tsx

import { useState, useMemo, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common';
import Button from '../../components/ui/Button';

import { useAnnouncements } from "../../modules/announcements/useAnnouncements"
import AnnouncementFilters from '../../modules/announcements/components/AnnouncementFilter';
import AnnouncementList from '../../modules/announcements/components/AnnouncementList';
import AnnouncementModal from '../../modules/announcements/components/AnnouncementModal';
export default function AdminAnnouncements() {
  const { user } = useAuth();

  const [dept, setDept] = useState('all');
  const [open, setOpen] = useState(false);

  const {
    filtered,
    loading,
    create,
    remove,
    refresh,
    search,
    setSearch,
    priorityFilter,
    setPriorityFilter
  } = useAnnouncements(dept);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="space-y-6 px-2 sm:px-0">

      <PageHeader
        title="Announcements"
        subtitle="Manage company announcements"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> New
          </Button>
        }
      />

      <AnnouncementFilters
        search={search}
        setSearch={setSearch}
        dept={dept}
        setDept={setDept}
        priority={priorityFilter}
        setPriority={setPriorityFilter}
      />

      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading...</div>
      ) : (
        <AnnouncementList data={filtered} onDelete={remove} />
      )}

      <AnnouncementModal
        open={open}
        onClose={() => setOpen(false)}
        user={user?.name}
        onSubmit={async (data: any) => {
          const ok = await create(data);
          if (ok) setOpen(false);
        }}
      />
    </div>
  );
}