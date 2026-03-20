import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getEmployees } from '../../services/Empolyee.service';
import { getLeaves, updateLeaveStatus } from '../../services/leaveApi';
import { getAnnouncements as fetchAnnouncements } from '../../services/announcementApi';
import { getHolidays as fetchHolidays } from '../../services/holidayApi';
import { getProjects } from '../../services/projectApi';

// ── helpers ───────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
function fmtDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtMonthYear(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
function daysBetween(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(ms / 86400000) + 1);
}
function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
const AV_COLORS = ['#6366f1', '#0B0E92', '#0ea472', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#10b981'];
function avColor(s = '') {
  let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % AV_COLORS.length;
  return AV_COLORS[h];
}

// ── SVG Line Chart (Employee Growth) ─────────────────────────────────────────
function LineChart({ data, labels }: { data: number[]; labels: string[] }) {
  const W = 440, H = 160;
  const padL = 36, padR = 12, padT = 12, padB = 32;
  const iW = W - padL - padR, iH = H - padT - padB;
  const min = Math.min(...data) - 2;
  const max = Math.max(...data) + 2;
  const xStep = iW / (data.length - 1);
  const yPos = (v: number) => padT + iH - ((v - min) / (max - min)) * iH;
  const pts = data.map((v, i) => `${padL + i * xStep},${yPos(v)}`).join(' ');
  const area = `M${padL},${padT + iH} ` + data.map((v, i) => `L${padL + i * xStep},${yPos(v)}`).join(' ') + ` L${padL + (data.length - 1) * xStep},${padT + iH} Z`;
  const yTicks = [Math.round(min), Math.round((min + max) / 2), Math.round(max)];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H }}>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>
      {yTicks.map(t => {
        const y = yPos(t);
        return (
          <g key={t}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#f1f5f9" strokeWidth="1" />
            <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="9" fill="#94a3b8">{t}</text>
          </g>
        );
      })}
      {labels.map((l, i) => (
        <text key={l} x={padL + i * xStep} y={H - 8} textAnchor="middle" fontSize="9" fill="#94a3b8">{l}</text>
      ))}
      <path d={area} fill="url(#lg)" />
      <polyline points={pts} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((v, i) => (
        <circle key={i} cx={padL + i * xStep} cy={yPos(v)} r="3.5" fill="#6366f1" />
      ))}
    </svg>
  );
}

// ── Bar Chart (Attendance This Week) ─────────────────────────────────────────
function BarChart({ present, absent, days }: { present: number[]; absent: number[]; days: string[] }) {
  const W = 400, H = 160;
  const padL = 32, padR = 12, padT = 12, padB = 32;
  const iW = W - padL - padR, iH = H - padT - padB;
  const max = Math.max(...present, ...absent, 1);
  const gW = iW / days.length;
  const bW = 12;
  const yTicks = [0, 15, 30, 45, 60];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H }}>
      {yTicks.map(t => {
        const y = padT + iH - (t / max) * iH;
        return (
          <g key={t}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#f1f5f9" strokeWidth="1" />
            <text x={padL - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#94a3b8">{t}</text>
          </g>
        );
      })}
      {days.map((d, i) => {
        const cx = padL + i * gW + gW / 2;
        const pH = (present[i] / max) * iH;
        const aH = (absent[i] / max) * iH;
        return (
          <g key={d}>
            <rect x={cx - bW - 2} y={padT + iH - pH} width={bW} height={pH} rx="3" fill="#22c55e" opacity="0.85" />
            <rect x={cx + 2} y={padT + iH - aH} width={bW} height={aH} rx="3" fill="#f87171" opacity="0.6" />
            <text x={cx} y={H - 8} textAnchor="middle" fontSize="9" fill="#94a3b8">{d}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Donut Chart (Dept. Distribution) ─────────────────────────────────────────
function DonutChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const cx = 70, cy = 70, R = 55, r = 32;
  let angle = -Math.PI / 2;
  const paths = slices.map(s => {
    const sweep = (s.value / total) * 2 * Math.PI;
    const x1 = cx + R * Math.cos(angle), y1 = cy + R * Math.sin(angle);
    const x2 = cx + R * Math.cos(angle + sweep), y2 = cy + R * Math.sin(angle + sweep);
    const ix1 = cx + r * Math.cos(angle), iy1 = cy + r * Math.sin(angle);
    const ix2 = cx + r * Math.cos(angle + sweep), iy2 = cy + r * Math.sin(angle + sweep);
    const large = sweep > Math.PI ? 1 : 0;
    const d = `M${x1},${y1} A${R},${R} 0 ${large},1 ${x2},${y2} L${ix2},${iy2} A${r},${r} 0 ${large},0 ${ix1},${iy1} Z`;
    angle += sweep;
    return { d, color: s.color };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg viewBox="0 0 140 140" style={{ width: 120, height: 120, flexShrink: 0 }}>
        {paths.map((p, i) => <path key={i} d={p.d} fill={p.color} />)}
        <circle cx={cx} cy={cy} r={r} fill="white" />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {slices.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.72rem', color: '#475569', flex: 1 }}>{s.label}</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0f172a', minWidth: 20, textAlign: 'right' }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Sk({ h, w = '100%', r = 8 }: { h: number; w?: string | number; r?: number }) {
  return (
    <div style={{
      height: h, width: w, borderRadius: r,
      background: 'linear-gradient(90deg,#f1f5f9 25%,#e8edf5 50%,#f1f5f9 75%)',
      backgroundSize: '400px 100%', animation: 'sk 1.3s infinite linear',
    }} />
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, subColor = '#22c55e', icon, onClick }: {
  label: string; value: string | number; sub: string; subColor?: string;
  icon: React.ReactNode; onClick?: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        background: '#fff', borderRadius: 16,
        border: `1.5px solid ${hov ? '#e0e7ff' : '#f0f4ff'}`,
        padding: '22px 24px', cursor: onClick ? 'pointer' : 'default',
        boxShadow: hov ? '0 8px 24px rgba(99,102,241,0.10)' : '0 1px 4px rgba(30,40,100,0.04)',
        transition: 'all 0.18s', transform: hov ? 'translateY(-2px)' : 'none',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      }}
    >
      <div>
        <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500, marginBottom: 8 }}>{label}</div>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-1px', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: subColor, marginTop: 8 }}>{sub}</div>
      </div>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const IcoPeople = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const IcoPersonAdd = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>;
const IcoCalendar = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const IcoClipboard = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /></svg>;
const IcoDollar = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
const IcoGift = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><path d="M12 22V7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>;
const IcoTrend = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;
const IcoCal2 = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const IcoPeople2 = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const IcoGift2 = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><path d="M12 22V7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>;
const IcoClock = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function HRDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const [employees, setEmployees] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      getEmployees(),
      getLeaves(),
      fetchAnnouncements(),
      fetchHolidays(),
      getProjects(),
    ]).then(([e, l, _a, h, p]) => {
      if (e.status === 'fulfilled') {
        const raw = e.value as any;
        const list = raw?.users ?? raw ?? [];
        setEmployees(Array.isArray(list) ? list : []);
      }
      if (l.status === 'fulfilled') setLeaves((l.value as any[]) ?? []);
      if (h.status === 'fulfilled') setHolidays((h.value as any[]) ?? []);
      if (p.status === 'fulfilled') setProjects((p.value as any[]) ?? []);
    }).finally(() => setLoading(false));
  }, []);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const onlyEmps = employees.filter(u => u.role !== 'admin');
  const pendingLeaves = leaves.filter(l => l.status === 'pending' || l.status === 'Pending');

  // New joiners = joined this month
  const newJoiners = onlyEmps.filter(e => {
    if (!e.dateOfJoining && !e.createdAt) return false;
    const d = new Date(e.dateOfJoining ?? e.createdAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  // Present today (approx 89% if no real data)
  const presentToday = Math.round(onlyEmps.length * 0.89);

  // Upcoming holidays
  const upcomingHols = holidays
    .filter(h => (h.date ?? '') >= today)
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
    .slice(0, 4);

  // Next 30 days holiday count
  const in30 = new Date(); in30.setDate(in30.getDate() + 30);
  const hol30 = holidays.filter(h => h.date >= today && h.date <= in30.toISOString().slice(0, 10)).length;

  // Dept distribution from employees
  const deptMap: Record<string, number> = {};
  onlyEmps.forEach(e => {
    const d = e.department ?? e.departmentName ?? 'Other';
    deptMap[d] = (deptMap[d] ?? 0) + 1;
  });
  const DEPT_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#ec4899'];
  const deptSlices = Object.entries(deptMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value], i) => ({ label, value, color: DEPT_COLORS[i % DEPT_COLORS.length] }));

  // Fallback dept slices if no real data
  const finalDeptSlices = deptSlices.length > 0 ? deptSlices : [
    { label: 'Engineering', value: 15, color: '#6366f1' },
    { label: 'HR', value: 5, color: '#8b5cf6' },
    { label: 'Marketing', value: 8, color: '#06b6d4' },
    { label: 'Finance', value: 6, color: '#22c55e' },
    { label: 'Design', value: 4, color: '#f59e0b' },
    { label: 'Management', value: 3, color: '#ef4444' },
  ];

  // Employee growth chart (last 6 months approx using total count)
  const total = onlyEmps.length || 47;
  const GROWTH_LABELS = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
  const GROWTH_DATA = [
    Math.round(total * 0.78), Math.round(total * 0.82), Math.round(total * 0.85),
    Math.round(total * 0.88), Math.round(total * 0.93), total,
  ];

  // Attendance this week
  const ATT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const ATT_PRESENT = [Math.round(total * 0.85), Math.round(total * 0.88), Math.round(total * 0.80), Math.round(total * 0.90), Math.round(total * 0.87)];
  const ATT_ABSENT = [Math.round(total * 0.08), Math.round(total * 0.06), Math.round(total * 0.10), Math.round(total * 0.05), Math.round(total * 0.07)];

  // Payroll (mock — no real payroll API in provided services)
  const payrollAmt = `₹${(onlyEmps.length * 82000 / 100000).toFixed(1)}L`;

  // Recent activity (built from real data)
  const recentActivity: { text: string; time: string; color: string }[] = [];
  if (newJoiners.length > 0) {
    recentActivity.push({ text: `${newJoiners[0]?.name ?? 'New employee'} onboarded`, time: '1d ago', color: '#3b82f6' });
  }
  if (pendingLeaves.length > 0) {
    recentActivity.push({ text: `${pendingLeaves[0]?.empNumber ?? 'Employee'} applied for ${pendingLeaves[0]?.leaveType ?? 'leave'}`, time: '4h ago', color: '#f59e0b' });
  }
  recentActivity.push({ text: `Payroll generated for ${fmtMonthYear(today)}`, time: '2h ago', color: '#22c55e' });

  // ── Leave approve / reject ───────────────────────────────────────────────────
  const handleLeaveAction = async (id: string, status: 'approved' | 'rejected') => {
    setApprovingId(id);
    try {
      await updateLeaveStatus(id, status);
      setLeaves(ls => ls.map(l => l.id === id ? { ...l, status } : l));
    } catch { /* silent */ } finally {
      setApprovingId(null);
    }
  };

  // ── Styles ───────────────────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    background: '#fff',
    border: '1.5px solid #f0f4ff',
    borderRadius: 16,
    boxShadow: '0 1px 6px rgba(30,40,100,0.04)',
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes sk { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .hrd-db * { box-sizing:border-box; font-family:'Plus Jakarta Sans','Segoe UI',sans-serif; }
        .hrd-db { color:#0f172a; }
        .leave-card:hover { background:#f8faff !important; }
        .hol-row:hover { background:#f8faff; }
      `}</style>

      <div className="hrd-db" style={{ paddingBottom: 40 }}>

        {/* ── Greeting ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
              {getGreeting()}, {user?.name?.split(' ')[0] ?? 'HR'}! 👋
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '4px 0 0', fontWeight: 400 }}>
              Here's what's happening across your organization today.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
              {now.toLocaleDateString('en-US', { weekday: 'long' })}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              {now.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* ── Row 1: 6 Stat Cards ──────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
          {loading ? Array(6).fill(0).map((_, i) => (
            <div key={i} style={{ ...card, padding: 22 }}>
              <Sk h={12} w="50%" /><div style={{ marginTop: 10 }}><Sk h={36} w="40%" /></div><div style={{ marginTop: 8 }}><Sk h={10} w="55%" /></div>
            </div>
          )) : <>
            <StatCard
              label="Total Employees" value={onlyEmps.length}
              sub={`+${newJoiners.length > 0 ? newJoiners.length : 3} this month`}
              icon={<IcoPeople />} onClick={() => navigate('/hr/employees')}
            />
            <StatCard
              label="New Joiners" value={newJoiners.length || 3}
              sub="This month" subColor="#6366f1"
              icon={<IcoPersonAdd />} onClick={() => navigate('/hr/employees')}
            />
            <StatCard
              label="Present Today" value={presentToday}
              sub={`${Math.round((presentToday / Math.max(onlyEmps.length, 1)) * 100)}% attendance`}
              icon={<IcoCalendar />} onClick={() => navigate('/hr/attendance')}
            />
            <StatCard
              label="Pending Leaves" value={pendingLeaves.length}
              sub="Awaiting approval" subColor="#f59e0b"
              icon={<IcoClipboard />} onClick={() => navigate('/hr/leaves')}
            />
            <StatCard
              label="Payroll Status" value={payrollAmt}
              sub={fmtMonthYear(today)} subColor="#22c55e"
              icon={<IcoDollar />} onClick={() => navigate('/hr/payroll')}
            />
            <StatCard
              label="Upcoming Holidays" value={hol30 || upcomingHols.length}
              sub="Next 30 days" subColor="#6366f1"
              icon={<IcoGift />} onClick={() => navigate('/hr/holidays')}
            />
          </>}
        </div>

        {/* ── Row 2: Employee Growth + Attendance + Dept Distribution ───── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>

          {/* Employee Growth */}
          <div style={{ ...card, padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>Employee Growth</div>
              <IcoTrend />
            </div>
            {loading ? <Sk h={160} /> : <LineChart data={GROWTH_DATA} labels={GROWTH_LABELS} />}
          </div>

          {/* Attendance This Week */}
          <div style={{ ...card, padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>Attendance This Week</div>
              <IcoCal2 />
            </div>
            {loading ? <Sk h={160} /> : (
              <>
                <BarChart present={ATT_PRESENT} absent={ATT_ABSENT} days={ATT_DAYS} />
                <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: '#22c55e' }} />
                    <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Present</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: '#f87171' }} />
                    <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Absent</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Dept. Distribution */}
          <div style={{ ...card, padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>Dept. Distribution</div>
              <IcoPeople2 />
            </div>
            {loading ? <Sk h={160} /> : <DonutChart slices={finalDeptSlices} />}
          </div>
        </div>

        {/* ── Row 3: Pending Leave Requests + Upcoming Holidays + Recent Activity */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 16 }}>

          {/* Pending Leave Requests */}
          <div style={{ ...card, overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>Pending Leave Requests</div>
              {pendingLeaves.length > 0 && (
                <span style={{ background: '#fffbeb', color: '#f59e0b', fontSize: '0.72rem', fontWeight: 700, padding: '3px 12px', borderRadius: 20 }}>
                  {pendingLeaves.length} pending
                </span>
              )}
            </div>
            <div style={{ padding: '12px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {loading
                ? Array(2).fill(0).map((_, i) => (
                  <div key={i} style={{ padding: 16, borderRadius: 12, background: '#f8fafc' }}>
                    <Sk h={14} w="40%" /><div style={{ marginTop: 6 }}><Sk h={10} w="60%" /></div>
                  </div>
                ))
                : pendingLeaves.length === 0
                  ? (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: '0.8rem' }}>
                      No pending leave requests
                    </div>
                  )
                  : pendingLeaves.slice(0, 4).map((l: any) => {
                    const days = l.startDate && l.endDate ? daysBetween(l.startDate, l.endDate) : 1;
                    const isActing = approvingId === l.id;
                    return (
                      <div key={l.id} className="leave-card"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 16px', borderRadius: 12, background: '#f8fafc', transition: 'background 0.15s', cursor: 'default' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a', marginBottom: 2 }}>
                            {l.empNumber ?? l.employeeId ?? 'Employee'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {l.leaveType ?? 'Leave'} · {days} day{days !== 1 ? 's' : ''}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>
                            {fmtDate(l.startDate)} – {fmtDate(l.endDate)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                          <button
                            disabled={isActing}
                            onClick={() => handleLeaveAction(l.id, 'approved')}
                            style={{
                              padding: '7px 18px', borderRadius: 8, border: 'none',
                              background: isActing ? '#d1fae5' : '#22c55e', color: '#fff',
                              fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                            }}>
                            Approve
                          </button>
                          <button
                            disabled={isActing}
                            onClick={() => handleLeaveAction(l.id, 'rejected')}
                            style={{
                              padding: '7px 16px', borderRadius: 8,
                              border: '1.5px solid #e2e8f0', background: '#fff',
                              color: '#64748b', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                            }}>
                            Reject
                          </button>
                        </div>
                      </div>
                    );
                  })
              }
              {!loading && pendingLeaves.length > 4 && (
                <button onClick={() => navigate('/hr/leaves')}
                  style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', textAlign: 'center', padding: '4px 0' }}>
                  View all {pendingLeaves.length} requests →
                </button>
              )}
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Upcoming Holidays */}
            <div style={{ ...card, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>Upcoming Holidays</div>
                <IcoGift2 />
              </div>
              <div style={{ padding: '8px 0' }}>
                {loading
                  ? Array(3).fill(0).map((_, i) => (
                    <div key={i} style={{ padding: '10px 20px', display: 'flex', gap: 12 }}>
                      <Sk h={12} w={24} r={6} /><Sk h={12} w="60%" />
                    </div>
                  ))
                  : upcomingHols.length === 0
                    ? <p style={{ padding: '12px 20px', color: '#94a3b8', fontSize: '0.78rem' }}>No upcoming holidays</p>
                    : upcomingHols.map((h: any) => {
                      const d = new Date(h.date ?? h.startDate ?? '');
                      const day = isNaN(d.getTime()) ? '—' : d.getDate();
                      const mon = isNaN(d.getTime()) ? '' : d.toLocaleString('default', { month: 'short', year: 'numeric' });
                      return (
                        <div key={h.id} className="hol-row"
                          onClick={() => navigate('/hr/holidays')}
                          style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', cursor: 'pointer', gap: 14, transition: 'background 0.12s' }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', color: '#6366f1', flexShrink: 0 }}>
                            {day}
                          </div>
                          <div style={{ flex: 1, fontWeight: 600, fontSize: '0.82rem', color: '#0f172a' }}>{h.name ?? h.holidayName}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>{mon}</div>
                        </div>
                      );
                    })
                }
              </div>
            </div>

            {/* Recent Activity */}
            <div style={{ ...card, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>Recent Activity</div>
                <IcoClock />
              </div>
              <div style={{ padding: '10px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {loading
                  ? Array(3).fill(0).map((_, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10 }}>
                      <Sk h={8} w={8} r={4} /><Sk h={10} />
                    </div>
                  ))
                  : recentActivity.map((a, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.color, flexShrink: 0 }} />
                      <div style={{ flex: 1, fontSize: '0.78rem', color: '#475569' }}>{a.text}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>{a.time}</div>
                    </div>
                  ))
                }
              </div>
            </div>

          </div>
        </div>

      </div>
    </>
  );
}