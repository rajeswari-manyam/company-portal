import {
  getAnnouncements, createAnnouncement, deleteAnnouncement,
  type Announcement
} from '../../data/store';

export const AnnouncementService = {
  getAll: (deptId?: string) => getAnnouncements(deptId),
  create: (data: Omit<Announcement, 'id'>) => createAnnouncement(data),
  delete: (id: string) => deleteAnnouncement(id),

  filterByPriority: (items: Announcement[], priority: string) =>
    priority === 'all' ? items : items.filter(a => a.priority === priority),

  search: (items: Announcement[], query: string) => {
    const q = query.toLowerCase();
    return items.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q) ||
      a.createdBy.toLowerCase().includes(q)
    );
  },

  priorityColor: (p: string) => ({
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-slate-100 text-slate-600 border-slate-200',
  }[p] ?? 'bg-slate-100 text-slate-600 border-slate-200'),
};
