import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAnnouncements } from '../../modules/announcements/useAnnouncements';
import AnnouncementCard from '../../modules/announcements/components/AnnouncementCard';
import { SearchInput, EmptyState } from '../../components/ui';
import { PageHeader } from '../../components/common';

export default function MyAnnouncements() {
  const { user } = useAuth();
  const { filtered, search, setSearch } = useAnnouncements(user?.departmentId);

  return (
    <div className="space-y-6">
      <PageHeader title="Announcements" subtitle="Company and department announcements" />
      <SearchInput value={search} onChange={setSearch} placeholder="Search announcements…" className="max-w-sm" />
      {filtered.length === 0 ? (
        <EmptyState icon="📢" message="No announcements yet" description="Check back later for updates from your team." />
      ) : (
        <div className="space-y-4">
          {filtered.map(a => (
            <AnnouncementCard key={a.id} announcement={a} canDelete={false} />
          ))}
        </div>
      )}
    </div>
  );
}
