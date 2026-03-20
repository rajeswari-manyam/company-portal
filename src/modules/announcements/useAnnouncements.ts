import { useState, useCallback } from 'react';
import { AnnouncementService } from './AnnouncementService';
import type { Announcement } from '../../data/store';
import toast from 'react-hot-toast';

export function useAnnouncements(deptId?: string) {
  const load = useCallback(() => AnnouncementService.getAll(deptId), [deptId]);
  const [announcements, setAnnouncements] = useState<Announcement[]>(load);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const refresh = useCallback(() => setAnnouncements(load()), [load]);

  const filtered = announcements.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      a.title.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q);
    const matchPriority = priorityFilter === 'all' || a.priority === priorityFilter;
    return matchSearch && matchPriority;
  });

  const create = async (data: Omit<Announcement, 'id'>) => {
    AnnouncementService.create(data);
    refresh();
    toast.success('Announcement posted');
    return true;
  };

  const remove = async (id: string) => {
    const ok = AnnouncementService.delete(id);
    if (ok) { refresh(); toast.success('Announcement deleted'); }
    return ok;
  };

  return { announcements, filtered, search, setSearch, priorityFilter, setPriorityFilter, create, remove, refresh };
}
