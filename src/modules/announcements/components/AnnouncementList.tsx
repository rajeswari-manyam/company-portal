// src/modules/announcements/components/AnnouncementList.tsx

import AnnouncementCard from './AnnouncementCard';
import { EmptyState } from '../../../components/ui';
export default function AnnouncementList({ data }: any) {
  if (!data.length) {
    return (
      <EmptyState
        icon="📢"
        message="No announcements yet"
        description="Check back later — new announcements will show up here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {data.map((a: any) => (
        <AnnouncementCard key={a.id} announcement={a} />
      ))}
    </div>
  );
}