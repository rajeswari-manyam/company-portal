export function AnnouncementSkeleton() {
  return (
    <div className="bg-white border rounded-xl p-4 animate-pulse">
      <div className="h-4 bg-gray-200 w-1/3 mb-2 rounded" />
      <div className="h-3 bg-gray-200 w-full mb-1 rounded" />
      <div className="h-3 bg-gray-200 w-5/6 rounded" />
    </div>
  );
}