import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLeaves } from '../../modules/leaves/useLeaves';
import LeaveForm from '../../modules/leaves/components/LeaveForm';
import LeaveTable from '../../modules/leaves/components/LeaveTable';
import { Modal, Select, Card } from '../../components/ui';
import { PageHeader } from '../../components/common';
import Button from '../../components/ui/Button';
import type { LeaveRequest } from '../../types';

// ─────────────────────────────────────────────────────────────────────────────
// Leave Balance Card  (matches screenshot style)
// ─────────────────────────────────────────────────────────────────────────────
interface LeaveBalanceCardProps {
  label: string;
  remaining: number;
  used: number;
  total: number;
}

function LeaveBalanceCard({ label, remaining, used, total }: LeaveBalanceCardProps) {
  const [hovered, setHovered] = useState(false);
  const pct = total > 0 ? Math.round((used / total) * 100) : 0;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? 'linear-gradient(to right, #0B0E92, #69A6F0)'
          : '#ffffff',
        border: hovered ? '1.5px solid transparent' : '1.5px solid #e8ecf4',
        borderRadius: 16,
        padding: '28px 24px 20px',
        cursor: 'default',
        transition: 'all 0.28s cubic-bezier(.4,0,.2,1)',
        boxShadow: hovered
          ? '0 8px 32px rgba(11,14,146,0.18)'
          : '0 1px 6px rgba(30,40,100,0.06)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 4,
        position: 'relative' as const,
        overflow: 'hidden',
      }}
    >
      {/* shimmer top line on hover */}
      {hovered && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 3,
          background: 'rgba(255,255,255,0.35)',
          borderRadius: '16px 16px 0 0',
        }} />
      )}

      {/* Big number */}
      <div style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: 'clamp(2rem, 5vw, 2.6rem)',
        fontWeight: 800,
        letterSpacing: '-1.5px',
        lineHeight: 1,
        color: hovered ? '#ffffff' : '#0B0E92',
        transition: 'color 0.25s',
        marginBottom: 6,
      }}>
        {remaining}
      </div>

      {/* Label */}
      <div style={{
        fontSize: '0.9rem',
        fontWeight: 600,
        color: hovered ? 'rgba(255,255,255,0.95)' : '#1a2340',
        transition: 'color 0.25s',
      }}>
        {label}
      </div>

      {/* Used / total */}
      <div style={{
        fontSize: '0.75rem',
        color: hovered ? 'rgba(255,255,255,0.65)' : '#a0aec0',
        transition: 'color 0.25s',
        marginBottom: 12,
      }}>
        {used} used of {total}
      </div>

      {/* Progress bar */}
      <div style={{
        height: 5,
        borderRadius: 10,
        background: hovered ? 'rgba(255,255,255,0.2)' : '#e8ecf4',
        overflow: 'hidden',
        transition: 'background 0.25s',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          borderRadius: 10,
          background: hovered
            ? 'rgba(255,255,255,0.75)'
            : 'linear-gradient(to right, #0B0E92, #69A6F0)',
          transition: 'width 0.6s ease, background 0.25s',
        }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat summary card (Total Applied / Approved / Pending / Rejected)
// ─────────────────────────────────────────────────────────────────────────────
interface StatSummaryCardProps {
  label: string;
  value: number;
  icon: string;
  accent: string;
  accentBg: string;
}

function StatSummaryCard({ label, value, icon, accent, accentBg }: StatSummaryCardProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'linear-gradient(to right, #0B0E92, #69A6F0)' : '#ffffff',
        border: hovered ? '1.5px solid transparent' : '1.5px solid #e8ecf4',
        borderRadius: 14,
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        transition: 'all 0.25s cubic-bezier(.4,0,.2,1)',
        boxShadow: hovered ? '0 8px 28px rgba(11,14,146,0.15)' : '0 1px 6px rgba(30,40,100,0.06)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        cursor: 'default',
      }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 12,
        background: hovered ? 'rgba(255,255,255,0.18)' : accentBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.2rem', flexShrink: 0,
        transition: 'background 0.25s',
      }}>
        {icon}
      </div>
      <div>
        <div style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '1.5rem', fontWeight: 800,
          letterSpacing: '-0.5px', lineHeight: 1,
          color: hovered ? '#ffffff' : accent,
          transition: 'color 0.25s',
        }}>
          {value}
        </div>
        <div style={{
          fontSize: '0.75rem', fontWeight: 500,
          color: hovered ? 'rgba(255,255,255,0.75)' : '#6b7a9d',
          transition: 'color 0.25s',
          marginTop: 2,
        }}>
          {label}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section heading
// ─────────────────────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '0.7rem', fontWeight: 700,
      letterSpacing: '0.13em', textTransform: 'uppercase' as const,
      color: '#a0aec0', marginBottom: 12,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      {children}
      <span style={{ flex: 1, height: 1, background: '#e8ecf4' }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function MyLeaves() {
  const { user } = useAuth();
  const { filtered, statusFilter, setStatusFilter, apply, stats } = useLeaves(user?.id);
  const [showForm, setShowForm] = useState(false);

  // Leave balance cards — driven by stats from the hook
 
  // Summary stat cards — keep all four as required
  const summaryCards = [
    { label: 'Total Applied', value: stats.total, icon: '📋', accent: '#0B0E92', accentBg: '#eff6ff' },
    { label: 'Approved', value: stats.approved, icon: '✅', accent: '#0ea472', accentBg: '#f0fdf4' },
    { label: 'Pending', value: stats.pending, icon: '⏳', accent: '#b7791f', accentBg: '#fff8e6' },
    { label: 'Rejected', value: stats.rejected, icon: '❌', accent: '#dc2626', accentBg: '#fff0f0' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <>
      {/* Global styles + responsive */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .leave-page * { box-sizing: border-box; }

        .leave-balance-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 8px;
        }
        .leave-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }

        @media (max-width: 1024px) {
          .leave-balance-grid  { grid-template-columns: repeat(2, 1fr); }
          .leave-summary-grid  { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 540px) {
          .leave-balance-grid  { grid-template-columns: 1fr 1fr; gap: 12px; }
          .leave-summary-grid  { grid-template-columns: 1fr 1fr; gap: 10px; }
        }
        @media (max-width: 360px) {
          .leave-balance-grid  { grid-template-columns: 1fr; }
          .leave-summary-grid  { grid-template-columns: 1fr; }
        }

        @keyframes leaveFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .leave-animate { animation: leaveFadeUp 0.4s ease both; }
        .leave-animate:nth-child(1) { animation-delay: 0.04s; }
        .leave-animate:nth-child(2) { animation-delay: 0.08s; }
        .leave-animate:nth-child(3) { animation-delay: 0.12s; }
        .leave-animate:nth-child(4) { animation-delay: 0.16s; }
      `}</style>

      <div
        className="leave-page"
        style={{ fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif" }}
      >
        <div className="space-y-6">

          {/* ── Header ── */}
          <PageHeader
            title="Leave"
            subtitle="Apply and track your leave requests"
            action={
              <Button
                icon={<Plus size={16} />}
                onClick={() => setShowForm(true)}
                style={{
                  background: 'linear-gradient(to right, #0B0E92, #69A6F0)',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 600,
                  boxShadow: '0 4px 14px rgba(11,14,146,0.28)',
                  borderRadius: 10,
                  padding: '10px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Apply Leave
              </Button>
            }
          />

       

          {/* ── Summary Stats (Total / Approved / Pending / Rejected) ── */}
          <div>
            <SectionLabel>Request Summary</SectionLabel>
            <div className="leave-summary-grid">
              {summaryCards.map((card, i) => (
                <div key={card.label} className="leave-animate" style={{ animationDelay: `${i * 0.07}s` }}>
                  <StatSummaryCard {...card} />
                </div>
              ))}
            </div>
          </div>

          {/* ── Leave Requests Table ── */}
          <Card padding={false}>
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e8ecf4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1a2340' }}>
                My Leave Requests
              </div>
              <Select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                options={statusOptions}
                className="w-40"
              />
            </div>
            <LeaveTable leaves={filtered} showEmployee={false} canApprove={false} />
          </Card>

          {/* ── Apply Leave Modal ── */}
          {showForm && (
            <Modal title="Apply for Leave" onClose={() => setShowForm(false)}>
              <LeaveForm
                userId={user?.id ?? ''}
                empNumber={user?.empNumber ?? ''}
                userName={user?.name ?? ''}
                department={user?.department ?? ''}
                onSubmit={async (data) => {
                  const ok = await apply(data as Omit<LeaveRequest, 'id'>);
                  if (ok) setShowForm(false);
                  return ok;
                }}
                onCancel={() => setShowForm(false)}
              />
            </Modal>
          )}

        </div>
      </div>
    </>
  );
}