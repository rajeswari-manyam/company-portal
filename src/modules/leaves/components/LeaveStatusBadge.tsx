const STYLE: Record<string, string> = {
  approved: 'text-emerald-700 bg-emerald-50 border border-emerald-200',
  rejected:  'text-red-500    bg-red-50    border border-red-200',
  pending:   'text-amber-700  bg-amber-50  border border-amber-200',
};

export default function LeaveStatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize
      ${STYLE[status?.toLowerCase()] ?? 'text-slate-600 bg-slate-100 border border-slate-200'}`}>
      {status}
    </span>
  );
}