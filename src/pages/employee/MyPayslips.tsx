import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getPayrollByEmployee,
  getPayslipIdsByEmpId,
  downloadPayslipFile,
} from '../../services/payrollApi';
import { MONTHS } from '../../constants';
import { formatCurrency } from '../../utils/helpers';

type Month = typeof MONTHS[number];

// ─── Types ────────────────────────────────────────────────────────────────────
interface Payslip {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  baseSalary: number;
  hra: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: string;
  month: string | null;
  year: number | null;
  createdAt: string | null;
}

// ─── Map API response → Payslip ───────────────────────────────────────────────
function mapApiToPayslip(p: any): Payslip {
  const date = p.createdAt ? new Date(p.createdAt) : new Date();
  const monthName = p.month || MONTHS[date.getMonth()];
  const year = p.year || date.getFullYear();
  const base = Number(p.baseSalary ?? p.basicSalary ?? 0);
  const net = Number(p.amountCredited ?? p.netSalary ?? base);
  const hra = Number(p.hra ?? Math.round(base * 0.2));
  const allow = Number(p.allowances ?? Math.round(base * 0.1));
  const deduct = Number(p.deductions ?? Math.round(base * 0.05));

  return {
    id: p._id || p.id || '',
    employeeId: p.employeeId || '',
    name: p.name || '',
    department: p.department || '—',
    baseSalary: base,
    hra,
    allowances: allow,
    deductions: deduct,
    netSalary: net,
    status: p.status || 'generated',
    month: monthName,
    year,
    createdAt: p.createdAt || null,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return iso; }
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  generated: { bg: '#ede9fe', color: '#7c3aed' },
  paid: { bg: '#dcfce7', color: '#16a34a' },
  pending: { bg: '#fff8e6', color: '#b7791f' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status?.toLowerCase()] ?? { bg: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{
      fontSize: '0.68rem', fontWeight: 700,
      padding: '3px 10px', borderRadius: 20,
      background: s.bg, color: s.color,
      textTransform: 'capitalize' as const,
    }}>
      {status}
    </span>
  );
}

// ─── Summary Stat Card ────────────────────────────────────────────────────────
function SummaryCard({ label, value, icon, accent, accentBg }: {
  label: string; value: string | number;
  icon: string; accent: string; accentBg: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'linear-gradient(to right, #0B0E92, #69A6F0)' : '#ffffff',
        border: hovered ? '1.5px solid transparent' : '1.5px solid #e8ecf4',
        borderRadius: 14, padding: '18px 20px',
        display: 'flex', alignItems: 'center', gap: 14,
        transition: 'all 0.25s cubic-bezier(.4,0,.2,1)',
        boxShadow: hovered
          ? '0 8px 28px rgba(11,14,146,0.15)'
          : '0 1px 6px rgba(30,40,100,0.06)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        cursor: 'default',
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: hovered ? 'rgba(255,255,255,0.18)' : accentBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.2rem', transition: 'background 0.25s',
      }}>
        {icon}
      </div>
      <div>
        <div style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '1.3rem', fontWeight: 800,
          letterSpacing: '-0.5px', lineHeight: 1,
          color: hovered ? '#ffffff' : accent,
          transition: 'color 0.25s',
        }}>
          {value}
        </div>
        <div style={{
          fontSize: '0.73rem', fontWeight: 500, marginTop: 3,
          color: hovered ? 'rgba(255,255,255,0.75)' : '#6b7a9d',
          transition: 'color 0.25s',
        }}>
          {label}
        </div>
      </div>
    </div>
  );
}

// ─── Payslip Card ─────────────────────────────────────────────────────────────
function PayslipCard({ payslip }: { payslip: Payslip }) {
  const [hovered, setHovered] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloading(true);
    try {
      await downloadPayslipFile(
        payslip.id,
        `payslip-${payslip.month ?? ''}-${payslip.year ?? ''}.pdf`,
      );
    } catch {
      alert('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const breakdown = [
    { label: 'Basic', value: payslip.baseSalary, neg: false },
    { label: 'HRA', value: payslip.hra, neg: false },
    { label: 'Allowances', value: payslip.allowances, neg: false },
    { label: 'Deductions', value: payslip.deductions, neg: true },
  ];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? 'linear-gradient(to right, #0B0E92, #69A6F0)'
          : '#ffffff',
        border: hovered ? '1.5px solid transparent' : '1.5px solid #e8ecf4',
        borderRadius: 14, padding: '20px 22px',
        cursor: 'default',
        transition: 'all 0.28s cubic-bezier(.4,0,.2,1)',
        boxShadow: hovered
          ? '0 8px 32px rgba(11,14,146,0.18)'
          : '0 1px 6px rgba(30,40,100,0.06)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        position: 'relative' as const,
        overflow: 'hidden',
      }}
    >
      {hovered && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 3, background: 'rgba(255,255,255,0.35)',
          borderRadius: '14px 14px 0 0',
        }} />
      )}

      {/* Top row */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', gap: 12, marginBottom: 14,
      }}>
        <div>
          <div style={{
            fontWeight: 800, fontSize: '1rem',
            color: hovered ? '#fff' : '#1a2340', transition: 'color 0.25s',
          }}>
            {payslip.month} {payslip.year}
          </div>
          <div style={{
            fontSize: '0.75rem', marginTop: 3,
            color: hovered ? 'rgba(255,255,255,0.65)' : '#a0aec0',
            transition: 'color 0.25s',
          }}>
            Generated {fmtDate(payslip.createdAt)}
            {payslip.department !== '—' && ` · ${payslip.department}`}
          </div>
        </div>
        <StatusBadge status={payslip.status} />
      </div>

      {/* Breakdown grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10,
        background: hovered ? 'rgba(255,255,255,0.1)' : '#f8fafc',
        borderRadius: 10, padding: '12px 14px', marginBottom: 16,
        transition: 'background 0.25s',
      }}>
        {breakdown.map(({ label, value, neg }) => (
          <div key={label} style={{ textAlign: 'center' as const }}>
            <div style={{
              fontSize: '0.7rem', marginBottom: 4,
              color: hovered ? 'rgba(255,255,255,0.6)' : '#a0aec0',
              transition: 'color 0.25s',
            }}>
              {label}
            </div>
            <div style={{
              fontSize: '0.875rem', fontWeight: 700,
              color: neg
                ? (hovered ? '#fca5a5' : '#dc2626')
                : (hovered ? '#ffffff' : '#1a2340'),
              transition: 'color 0.25s',
            }}>
              {neg ? `- ${formatCurrency(value)}` : formatCurrency(value)}
            </div>
          </div>
        ))}
      </div>

      {/* Net + download */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
      }}>
        <div>
          <div style={{
            fontSize: '0.7rem', marginBottom: 2,
            color: hovered ? 'rgba(255,255,255,0.65)' : '#a0aec0',
            transition: 'color 0.25s',
          }}>
            Amount Credited
          </div>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.5px',
            color: hovered ? '#ffffff' : '#0B0E92', transition: 'color 0.25s',
          }}>
            {formatCurrency(payslip.netSalary)}
          </div>
        </div>

        <button
          onClick={handleDownload}
          disabled={downloading}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 18px', borderRadius: 30, border: 'none',
            background: hovered
              ? 'rgba(255,255,255,0.22)'
              : 'linear-gradient(to right, #0B0E92, #69A6F0)',
            color: '#fff', fontSize: '0.78rem', fontWeight: 700,
            cursor: downloading ? 'wait' : 'pointer',
            fontFamily: 'inherit',
            boxShadow: hovered ? 'none' : '0 3px 12px rgba(11,14,146,0.2)',
            transition: 'all 0.2s',
            opacity: downloading ? 0.7 : 1,
          }}
        >
          {downloading ? '⏳ Downloading…' : '⬇ Download PDF'}
        </button>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function PayslipSkeleton() {
  return (
    <div style={{
      background: '#fff', border: '1.5px solid #e8ecf4',
      borderRadius: 14, padding: '20px 22px',
      display: 'flex', flexDirection: 'column' as const, gap: 12,
    }}>
      <style>{`
        @keyframes psShimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        .psk {
          background: linear-gradient(90deg,#f0f4ff 25%,#e2e8f0 50%,#f0f4ff 75%);
          background-size: 400px 100%;
          animation: psShimmer 1.3s infinite linear;
          border-radius: 5px;
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div className="psk" style={{ height: 18, width: '28%' }} />
        <div className="psk" style={{ height: 18, width: '14%' }} />
      </div>
      <div className="psk" style={{ height: 64, width: '100%', borderRadius: 10 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="psk" style={{ height: 24, width: '22%' }} />
        <div className="psk" style={{ height: 38, width: '18%', borderRadius: 30 }} />
      </div>
    </div>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────
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

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MyPayslips() {
  const { user } = useAuth();

  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [month, setMonth] = useState<Month>(MONTHS[new Date().getMonth()]);

  useEffect(() => {
    // empId is the correct field name from AuthUser (LoginSuccessResponse)
    const empIdString = user?.empId ?? null;

    if (!empIdString) {
      setLoading(false);
      setError('No employee ID found. Please contact HR.');
      return;
    }

    let cancelled = false;

    const fetchPayslips = async () => {
      setLoading(true);
      setError('');
      setPayslips([]);

      try {
        // ── Step 1: /getemployees → match empId → get payslips[] array ──────
        // Employee doc: { _id, empId: "EMP003", payslips: ["69bdcfa1..."] }
        // payslips[] contains payslip ObjectIds directly
        console.log('Fetching payslips for employee:', empIdString);
        const result = await getPayslipIdsByEmpId(empIdString);

        if (!result || result.payslipIds.length === 0) {
          console.log('No payslip IDs found for:', empIdString);
          if (!cancelled) { setPayslips([]); setLoading(false); }
          return;
        }

        const { payslipIds } = result;
        console.log(`Found ${payslipIds.length} payslip(s):`, payslipIds);

        // ── Step 2: /getPayslipsById/:payslipId for each payslip _id ────────
        // Payslip doc: { _id: "69bdcfa1...", employeeId: "69bdcfa1...(mongo _id)", month, amountCredited, ... }
        const settled = await Promise.allSettled(
          payslipIds.map((pid) => getPayrollByEmployee(pid))
        );

        const all: Payslip[] = [];
        settled.forEach((res, i) => {
          if (res.status === 'fulfilled') {
            const list = Array.isArray(res.value) ? res.value : [res.value];
            list.forEach((p: any) => { if (p?._id) all.push(mapApiToPayslip(p)); });
          } else {
            console.warn(`Failed to load payslip ${payslipIds[i]}:`, res.reason);
          }
        });

        // Sort newest first
        all.sort((a, b) => {
          const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return db - da;
        });

        if (!cancelled) setPayslips(all);

      } catch (err: any) {
        console.error('Payslip fetch failed:', err);
        if (!cancelled) setError(err?.response?.data?.message || 'Failed to load payslips.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPayslips();
    return () => { cancelled = true; };

  }, [user?.empId]);

  const filtered = payslips.filter(p => p.month === month);
  const totalEarned = payslips.reduce((s, p) => s + p.netSalary, 0);
  const latestSalary = payslips[0]?.netSalary ?? 0;
  const totalDeduct = payslips.reduce((s, p) => s + p.deductions, 0);

  const summaryCards = [
    { label: 'Total Payslips', value: payslips.length, icon: '📄', accent: '#0B0E92', accentBg: '#eff6ff' },
    { label: 'Total Earned (YTD)', value: totalEarned ? formatCurrency(totalEarned) : '₹0', icon: '💰', accent: '#0ea472', accentBg: '#f0fdf4' },
    { label: 'Latest Net Salary', value: latestSalary ? formatCurrency(latestSalary) : '—', icon: '📊', accent: '#7c3aed', accentBg: '#f5f3ff' },
    { label: 'Total Deductions', value: totalDeduct ? formatCurrency(totalDeduct) : '₹0', icon: '📉', accent: '#dc2626', accentBg: '#fff0f0' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .mypay * { box-sizing: border-box; }
        .pay-summary-grid {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px;
        }
        @media (max-width: 1024px) { .pay-summary-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 480px)  { .pay-summary-grid { grid-template-columns: 1fr; } }
        @keyframes payFadeUp {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .pay-item { animation: payFadeUp 0.4s ease both; }
        .pay-item:nth-child(1){animation-delay:.04s}
        .pay-item:nth-child(2){animation-delay:.08s}
        .pay-item:nth-child(3){animation-delay:.12s}
        .pay-item:nth-child(4){animation-delay:.16s}
        .pay-item:nth-child(5){animation-delay:.20s}
      `}</style>

      <div className="mypay space-y-6"
        style={{ fontFamily: "'DM Sans','Plus Jakarta Sans','Segoe UI',sans-serif" }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <h1 style={{
              fontSize: 'clamp(1.3rem,4vw,1.75rem)',
              fontWeight: 800, color: '#1a2340', letterSpacing: '-0.4px',
            }}>My Payslips</h1>
            <p style={{ fontSize: '0.82rem', color: '#a0aec0', marginTop: 3 }}>
              View your salary history and download payslips
            </p>
          </div>
          <select value={month} onChange={e => setMonth(e.target.value as Month)}
            style={{
              padding: '9px 14px', borderRadius: 30,
              border: '1.5px solid #e2e8f0', background: '#fff',
              fontSize: '0.82rem', color: '#1a2340',
              fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
              boxShadow: '0 1px 6px rgba(30,40,100,0.06)',
            }}
          >
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Summary */}
        <div>
          <SectionLabel>Salary Summary</SectionLabel>
          <div className="pay-summary-grid">
            {summaryCards.map(c => <SummaryCard key={c.label} {...c} />)}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[1, 2, 3].map(n => <PayslipSkeleton key={n} />)}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{
            background: '#fff0f0', border: '1.5px solid #fecaca',
            borderRadius: 14, padding: '20px 24px',
            color: '#dc2626', fontSize: '0.875rem', fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: '1.1rem' }}>⚠️</span>
            {error}
          </div>
        )}

        {/* Month filtered */}
        {!loading && !error && (
          <div>
            <SectionLabel>
              {month} Payslips&nbsp;
              <span style={{ color: '#0B0E92' }}>({filtered.length})</span>
            </SectionLabel>
            {filtered.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '48px 24px',
                background: '#fff', borderRadius: 14, border: '1.5px solid #e8ecf4',
              }}>
                <div style={{ fontSize: '2.2rem', marginBottom: 10 }}>📄</div>
                <div style={{ fontWeight: 700, color: '#1a2340', marginBottom: 6 }}>
                  No payslips for {month}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#a0aec0' }}>
                  Try selecting a different month above.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {filtered.map((p, i) => (
                  <div key={p.id} className="pay-item" style={{ animationDelay: `${i * 0.07}s` }}>
                    <PayslipCard payslip={p} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* All history */}
        {!loading && !error && payslips.length > 0 && (
          <div>
            <SectionLabel>
              All Payslips&nbsp;
              <span style={{ color: '#0B0E92' }}>({payslips.length})</span>
            </SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {payslips.map((p, i) => (
                <div key={p.id} className="pay-item" style={{ animationDelay: `${i * 0.05}s` }}>
                  <PayslipCard payslip={p} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && payslips.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '64px 24px',
            background: '#fff', borderRadius: 16, border: '1.5px solid #e8ecf4',
          }}>
            <div style={{ fontSize: '2.8rem', marginBottom: 12 }}>💰</div>
            <div style={{ fontWeight: 700, color: '#1a2340', fontSize: '1rem', marginBottom: 6 }}>
              No payslips yet
            </div>
            <div style={{ fontSize: '0.82rem', color: '#a0aec0' }}>
              Your payslips will appear here once generated by HR.
            </div>
          </div>
        )}
      </div>
    </>
  );
}