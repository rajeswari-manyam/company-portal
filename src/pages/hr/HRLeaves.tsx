import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLeaves } from '../../modules/leaves/useLeaves';
import { Edit2, Trash2, Plus, Search, ChevronLeft, ChevronRight, Clock, Check, X } from 'lucide-react';
import type { LeaveRequest } from '../../types';
import { formatDate } from '../../utils/helpers';

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, string> = {
  approved: 'text-emerald-700 bg-emerald-50 border border-emerald-200',
  rejected: 'text-red-500   bg-red-50   border border-red-200',
  pending: 'text-amber-700 bg-amber-50  border border-amber-200',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_STYLE[status.toLowerCase()] ?? 'text-slate-600 bg-slate-100 border border-slate-200'
        }`}
    >
      {status}
    </span>
  );
}

// ── Stat cards (matches screen 2 style: label top, big number, icon) ──────────
const STAT_CARDS = [
  {
    key: 'pending',
    label: 'Pending',
    icon: <Clock size={22} className="text-amber-400" />,
    iconBg: 'bg-amber-50',
  },
  {
    key: 'approved',
    label: 'Approved',
    icon: <Check size={22} className="text-emerald-500" />,
    iconBg: 'bg-emerald-50',
  },
  {
    key: 'rejected',
    label: 'Rejected',
    icon: <X size={22} className="text-red-400" />,
    iconBg: 'bg-red-50',
  },
];

function LeaveStatCard({
  label,
  value,
  icon,
  iconBg,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
        <p className="text-4xl font-bold text-slate-900 leading-none tracking-tight">{value}</p>
      </div>
      <div className={`${iconBg} rounded-full w-12 h-12 flex items-center justify-center`}>{icon}</div>
    </div>
  );
}

// ── Status filter tabs (pill-style like screen 2) ─────────────────────────────
const STATUS_TABS = ['All', 'Pending', 'Approved', 'Rejected'];

function FilterTabs({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
      {STATUS_TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab.toLowerCase())}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${value === tab.toLowerCase()
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
function Pagination({
  total,
  page,
  perPage,
  onPage,
  onPerPage,
}: {
  total: number;
  page: number;
  perPage: number;
  onPage: (p: number) => void;
  onPerPage: (n: number) => void;
}) {
  const pages = Math.ceil(total / perPage);
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  const visiblePages = () => {
    if (pages <= 5) return Array.from({ length: pages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, '...', pages];
    if (page >= pages - 2) return [1, '...', pages - 2, pages - 1, pages];
    return [1, '...', page, '...', pages];
  };

  return (
    <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 flex-wrap gap-3">
      <span className="text-xs text-slate-400">
        Showing {from} to {to} of {total} entries
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
        {visiblePages().map((p, i) =>
          p === '...' ? (
            <span key={`dot-${i}`} className="w-8 h-8 flex items-center justify-center text-slate-400 text-sm">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${page === p
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPage(Math.min(pages, page + 1))}
          disabled={page === pages}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-400">
        Show
        <select
          value={perPage}
          onChange={(e) => onPerPage(Number(e.target.value))}
          className="border border-slate-200 rounded-lg px-2 py-1 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        >
          {[5, 10, 20, 50].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        entries
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function HRLeaves() {
  const { user } = useAuth();
  const { filtered, search, setSearch, statusFilter, setStatusFilter, approve, reject, stats } =
    useLeaves();

  const [rejecting, setRejecting] = useState<LeaveRequest | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(1);
  };
  const handleStatus = (v: string) => {
    setStatusFilter(v);
    setPage(1);
  };

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div
      className="space-y-6 pb-8"
      style={{ fontFamily: "'DM Sans', 'Plus Jakarta Sans', 'Segoe UI', sans-serif" }}
    >
      {/* ── Page heading (matches screen 2) ── */}
      <div>
        <h1 className="text-[1.75rem] font-bold text-slate-900 tracking-tight leading-tight">
          Leave Management
        </h1>
        <p className="text-sm text-slate-500 mt-1 font-normal">Review and manage leave requests</p>
      </div>

      {/* ── 3 stat cards (pending / approved / rejected like screen 2) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STAT_CARDS.map((card) => (
          <LeaveStatCard
            key={card.key}
            label={card.label}
            value={(stats as any)[card.key] ?? 0}
            icon={card.icon}
            iconBg={card.iconBg}
          />
        ))}
      </div>

      {/* ── Table card ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="px-6 py-4 flex items-center gap-3 flex-wrap border-b border-slate-100">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search employee…"
              className="w-full h-9 pl-8 pr-4 rounded-xl border border-slate-200 text-sm bg-white
                         focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400
                         transition-all placeholder:text-slate-400 font-normal"
            />
          </div>

          {/* Filter tabs */}
          <FilterTabs value={statusFilter} onChange={handleStatus} />

          {/* Spacer */}
          <div className="flex-1" />

          {/* Apply Leave button */}
          <button
            className="h-9 px-4 flex items-center gap-2 rounded-xl bg-slate-900 text-white text-sm font-semibold
                       hover:bg-slate-800 active:scale-[0.98] transition-all shadow-sm"
          >
            <Plus size={15} />
            Apply Leave
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white">
                {['Leave Type', 'From', 'To', 'Days', 'Reason', 'Status', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap border-b border-slate-100"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 text-sm font-normal">
                    No leave requests found
                  </td>
                </tr>
              ) : (
                paginated.map((l: any, i: number) => (
                  <tr
                    key={l.id ?? i}
                    className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-6 py-4 text-slate-800 font-medium whitespace-nowrap capitalize">
                      {l.leaveType ?? l.type ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-normal whitespace-nowrap">
                      {l.startDate ? formatDate(l.startDate) : '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-normal whitespace-nowrap">
                      {l.endDate ? formatDate(l.endDate) : '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-normal">
                      <span className="font-semibold text-slate-800">{l.days ?? '—'}</span>
                      {l.days && (
                        <span className="text-slate-400 ml-1 text-xs">
                          {l.days === 1 ? 'day' : 'days'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-normal max-w-[160px] truncate">
                      {l.reason ?? l.leaveType ?? '—'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={l.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {l.status === 'pending' && (
                          <>
                            <button
                              onClick={() => approve(l.id, user?.name ?? 'HR')}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-emerald-500
                                         hover:bg-emerald-50 hover:text-emerald-600 transition-colors border border-transparent hover:border-emerald-200"
                              title="Approve"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => { setRejecting(l); setRejectNote(''); }}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400
                                         hover:bg-red-50 hover:text-red-500 transition-colors border border-transparent hover:border-red-200"
                              title="Reject"
                            >
                              <X size={14} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => { setRejecting(l); setRejectNote(''); }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400
                                     hover:bg-slate-100 hover:text-slate-600 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400
                                     hover:bg-red-50 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          total={filtered.length}
          page={page}
          perPage={perPage}
          onPage={setPage}
          onPerPage={(n) => { setPerPage(n); setPage(1); }}
        />
      </div>

      {/* ── Reject modal ── */}
      {rejecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setRejecting(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <button
              onClick={() => setRejecting(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
            >
              <X size={16} />
            </button>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Reject Leave Request
              </h3>
              <p className="text-sm text-slate-500 mt-1 font-normal">
                {(rejecting as any).userName} · {(rejecting as any).leaveType} ·{' '}
                {(rejecting as any).days} days
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
                Reason (optional)
              </label>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                rows={3}
                placeholder="Provide a reason…"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 font-normal
                           focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 resize-none placeholder:text-slate-400"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setRejecting(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  reject((rejecting as any).id, user?.name ?? 'HR', rejectNote);
                  setRejecting(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
              >
                Reject Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}