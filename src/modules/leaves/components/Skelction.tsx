export default function Skeleton() {
  return (
    <div className="animate-pulse space-y-3 p-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-16 bg-slate-100 rounded-xl" />
      ))}
    </div>
  );
}