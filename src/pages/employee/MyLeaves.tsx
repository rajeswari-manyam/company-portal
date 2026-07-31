// src/pages/employee/MyLeaves.tsx
import React, { useState, useEffect } from 'react';
import {
  Plus, Calendar, ChevronDown, Filter,
  Activity, Briefcase, TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLeaves } from '../../modules/leaves/useLeaves';
import { getLeaveBalance } from '../../service/leaveApi';
import LeaveCard from "../../modules/leaves/components/LeaveCard";
import LeaveTable from '../../modules/leaves/components/LeaveTable';
import ApplyModal from "../../modules/leaves/components/ApplyLeaveModal";
import Skeleton from "../../modules/leaves/components/Skelction";

// ─── Balance card config ───────────────────────────────────────────────────────
// API GET /balance/:id returns:
//   { success: true, leaveBalance: { sickLeave: 1, casualLeave: 1, ... } }
// Add earnedLeave here if/when your backend starts returning it.
const BALANCE_CARDS = [
  {
    key: 'sickLeave',
    label: 'Sick',
    sublabel: 'days available',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    icon: <Activity size={16} />,
  },
  {
    key: 'casualLeave',
    label: 'Casual',
    sublabel: 'days available',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    icon: <Briefcase size={16} />,
  },
  {
    key: 'earnedLeave',
    label: 'Earned',
    sublabel: 'days available',
    bg: 'bg-[#EEF0FF]',
    text: 'text-[#0B0E92]',
    icon: <TrendingUp size={16} />,
  },
];

// ─── Skeleton shimmer card ────────────────────────────────────────────────────
function BalanceSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm px-3 py-3 sm:px-4 sm:py-4 flex items-center gap-2 sm:gap-3 animate-pulse"
        >
          <div className="w-9 h-9 rounded-xl bg-slate-100 shrink-0" />
          <div className="space-y-1.5 flex-1">
            <div className="h-5 w-8 bg-slate-100 rounded" />
            <div className="h-3 w-14 bg-slate-100 rounded" />
            <div className="h-2.5 w-10 bg-slate-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Single balance stat card ─────────────────────────────────────────────────
function BalanceCard({
  label, sublabel, value, bg, text, icon,
}: {
  label: string;
  sublabel: string;
  value: number;
  bg: string;
  text: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-3 py-3 sm:px-4 sm:py-4 flex items-center gap-2 sm:gap-3">
      <div className={`${bg} ${text} rounded-xl p-2.5 shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className={`text-xl font-extrabold ${text} leading-none`}>{value}</p>
        <p className="text-xs font-semibold text-slate-600 mt-0.5 truncate">{label}</p>
        <p className="text-[10px] text-slate-400 truncate">{sublabel}</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MyLeaves() {
  const { user } = useAuth();
  const employeeId = (user as any)?._id || (user as any)?.id || '';
  const { filtered, loading, statusFilter, setStatusFilter, apply, stats } =
    useLeaves(employeeId || undefined);

  const [showForm, setShowForm] = useState(false);
  const [balance, setBalance] = useState<Record<string, any> | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);

  useEffect(() => {
    if (!employeeId) { setBalanceLoading(false); return; }
    setBalanceLoading(true);
    getLeaveBalance(employeeId)
      .then(data => {
        // data = { _id, employeeId, sickLeave: 1, casualLeave: 1, ... }
        setBalance(data);
      })
      .catch(() => setBalance(null))
      .finally(() => setBalanceLoading(false));
  }, [employeeId]);

  const monthLabel = new Date().toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  // Only show cards where the key exists in the API response
  const visibleCards = balance
    ? BALANCE_CARDS.filter(c => c.key in balance)
    : BALANCE_CARDS;

  return (
    <div className="min-h-screen bg-[#f4f6fb] font-sans">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
              My Leave
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Apply and track your leave requests
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0B0E92] to-[#69A6F0] text-white text-sm font-semibold shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 shrink-0"
          >
            <Plus size={15} /> Apply Leave
          </button>
        </div>

        {/* ── Request stat cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          {[
            { label: 'Total',    value: stats.total,    bg: 'bg-blue-50',    text: 'text-blue-600'    },
            { label: 'Pending',  value: stats.pending,  bg: 'bg-amber-50',   text: 'text-amber-600'   },
            { label: 'Approved', value: stats.approved, bg: 'bg-emerald-50', text: 'text-emerald-600' },
            { label: 'Rejected', value: stats.rejected, bg: 'bg-rose-50',    text: 'text-rose-600'    },
          ].map(({ label, value, bg, text }) => (
            <div
              key={label}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm px-3 py-3 sm:px-4 sm:py-4 flex items-center gap-2 sm:gap-3"
            >
              <div className={`${bg} ${text} rounded-xl p-2.5 shrink-0`}>
                <Calendar size={16} />
              </div>
              <div>
                <p className={`text-xl font-extrabold ${text}`}>{value}</p>
                <p className="text-xs text-slate-400">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Leave Balance ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 sm:px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-bold text-slate-800 text-sm">Leave Balance</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{monthLabel}</p>
            </div>
            <span
              className={`w-2 h-2 rounded-full transition-colors ${
                balanceLoading ? 'bg-amber-400 animate-pulse'
                : balance ? 'bg-emerald-400'
                : 'bg-rose-400'
              }`}
            />
          </div>

          {balanceLoading ? (
            <BalanceSkeleton />
          ) : balance ? (
            <div className={`grid gap-2 sm:gap-3 ${visibleCards.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {visibleCards.map(({ key, label, sublabel, bg, text, icon }) => (
                <BalanceCard
                  key={key}
                  label={label}
                  sublabel={sublabel}
                  value={Number(balance[key] ?? 0)}
                  bg={bg}
                  text={text}
                  icon={icon}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-50 rounded-xl px-3 py-2.5">
              <Activity size={13} />
              Balance unavailable — please try again later
            </div>
          )}
        </div>

        {/* ── Leave Requests ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-slate-100 gap-3 flex-wrap">
            <div>
              <p className="font-bold text-slate-800 text-sm">My Leave Requests</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {filtered.length} record{filtered.length !== 1 ? 's' : ''} found
              </p>
            </div>
            <div className="relative">
              <Filter
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-8 py-2 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/20 focus:border-[#0B0E92]"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          {loading ? (
            <Skeleton />
          ) : (
            <>
              <div className="hidden sm:block">
                <LeaveTable leaves={filtered} showEmployee={true} canApprove={false} />
              </div>
              <div className="sm:hidden">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-slate-300">
                    <Calendar size={36} strokeWidth={1.5} />
                    <p className="mt-3 text-sm">No leave requests found</p>
                  </div>
                ) : (
                  <div className="p-3 space-y-3">
                    {filtered.map(leave => (
                      <LeaveCard key={leave.id} leave={leave} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

      </div>

      {showForm && (
        <ApplyModal
          user={user}
          onClose={() => setShowForm(false)}
          onSubmit={async data => {
            const ok = await apply(data);
            if (ok) setShowForm(false);
            return ok;
          }}
        />
      )}
    </div>
  );
}