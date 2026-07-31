import { useAuth } from '../../context/AuthContext';
import { useAnnouncements } from '../../modules/announcements/useAnnouncements';
import AnnouncementList from '../../modules/announcements/components/AnnouncementList';
import { AnnouncementSkeleton } from "../../modules/announcements/components/AnnouncementSkeleton";

export default function MyAnnouncements() {
  const { user } = useAuth();

  const {
    filtered,   // already contains correct department data
    loading,
    error,
  } = useAnnouncements(user?.department); // ✅ only employee dept

  return (
    <div className="p-4 space-y-4">

      <h1 className="text-xl font-bold">Announcements</h1>

      {/* ── Loading ── */}
      {loading && (
        <>
          <AnnouncementSkeleton />
          <AnnouncementSkeleton />
        </>
      )}

      {/* ── Error ── */}
      {error && (
        <p className="text-red-500">{error}</p>
      )}

      {/* ── Data ── */}
      {!loading && !error && (
        <AnnouncementList data={filtered} />
      )}

    </div>
  );
}