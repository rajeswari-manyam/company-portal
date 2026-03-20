import React from 'react';
import { Trash2, Megaphone } from 'lucide-react';
import { Badge } from '../../../components/ui';
import type { Announcement } from '../../../data/store';
import { formatDate } from '../../../utils/helpers';

interface AnnouncementCardProps {
  announcement: Announcement;
  onDelete?: () => void;
  canDelete?: boolean;
}

const priorityBorder: Record<string, string> = {
  high: 'border-l-red-500',
  medium: 'border-l-amber-500',
  low: 'border-l-slate-300',
};

export default function AnnouncementCard({ announcement: a, onDelete, canDelete }: AnnouncementCardProps) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 border-l-4 ${priorityBorder[a.priority] ?? 'border-l-slate-300'} p-5 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#EEF0FF] flex items-center justify-center flex-shrink-0">
            <Megaphone size={16} className="text-[#0B0E92]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-bold text-slate-800 text-sm">{a.title}</h3>
              <Badge status={a.priority} />
            </div>
            <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{a.content}</p>
            <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
              <span>By {a.createdBy}</span>
              <span>·</span>
              <span>{formatDate(a.createdAt)}</span>
            </div>
          </div>
        </div>
        {canDelete && onDelete && (
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors flex-shrink-0"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
