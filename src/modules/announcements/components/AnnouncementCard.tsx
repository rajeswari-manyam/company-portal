// src/modules/announcements/components/AnnouncementCard.tsx

import { Trash2, Megaphone } from 'lucide-react';
import { formatDate } from '../../../utils/helpers';

interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: string;
  departments: string;
  isForAll: boolean;
  createdBy: string;
  createdAt: string;
}

interface AnnouncementCardProps {
  announcement: Announcement;
  onDelete?: () => void;
  canDelete?: boolean;
}

const PRIORITY_STYLES: Record<string, {
  bar: string; iconBg: string; badgeBg: string; badgeText: string;
}> = {
  high: { bar: 'border-l-red-500', iconBg: 'bg-red-100', badgeBg: 'bg-red-100', badgeText: 'text-red-700' },
  medium: { bar: 'border-l-yellow-500', iconBg: 'bg-yellow-100', badgeBg: 'bg-yellow-100', badgeText: 'text-yellow-700' },
  low: { bar: 'border-l-green-500', iconBg: 'bg-green-100', badgeBg: 'bg-green-100', badgeText: 'text-green-700' },
};

export default function AnnouncementCard({ announcement: a, onDelete, canDelete }: AnnouncementCardProps) {
  const p = PRIORITY_STYLES[a.priority] ?? PRIORITY_STYLES.medium;

  // departments is now always a plain string after normalise() in the hook
  const deptLabel =
    a.isForAll || !a.departments || a.departments === 'all'
      ? 'All Departments'
      : a.departments;   // already a clean string like "Software" or "HR, Software"

  return (
    <div className={`bg-white rounded-xl border border-slate-200 border-l-4 ${p.bar} p-4 flex gap-3 shadow-sm hover:shadow-md transition`}>
      {/* Icon */}
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${p.iconBg}`}>
        <Megaphone size={16} className="text-slate-700" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-1">
          <p className="text-sm font-semibold text-slate-900 truncate">{a.title}</p>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.badgeBg} ${p.badgeText}`}>
              {a.priority.charAt(0).toUpperCase() + a.priority.slice(1)}
            </span>

            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {deptLabel}
            </span>

            {canDelete && onDelete && (
              <button onClick={onDelete} className="p-1 text-slate-400 hover:text-red-500">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Message */}
        <p className="text-sm text-slate-600 leading-relaxed mb-1 break-words">{a.message}</p>

        {/* Footer */}
        <p className="text-xs text-slate-400">
          By {a.createdBy || 'Admin'} · {formatDate(a.createdAt)}
        </p>
      </div>
    </div>
  );
}