import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import { getEmployees } from '../../service/Empolyee.service';
import { getLeaves, updateLeaveStatus } from '../../service/leaveApi';
import { getHolidays as fetchHolidays } from '../../service/holidayApi';
import { getProjects } from '../../service/projectApi';
import { getAnnouncements as fetchAnnouncements } from '../../service/announcementApi';
import { getDepartments } from '../../service/departmentApi';

// ── Helpers ───────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
function fmtDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtMonthYear(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
function daysBetween(a: string, b: string) {
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000) + 1);
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

// ── SVG Line Chart ────────────────────────────────────────────────────────────
function LineChart({ data, labels }: { data: number[]; labels: string[] }) {
  const W = 440, H = 180;
  const padL = 36, padR = 12, padT = 12, padB = 32;
  const iW = W - padL - padR, iH = H - padT - padB;
  const min = Math.min(...data) - 2, max = Math.max(...data) + 2;
  const xStep = iW / Math.max(data.length - 1, 1);
  const yPos = (v: number) => padT + iH - ((v - min) / (max - min)) * iH;
  const pts = data.map((v, i) => `${padL + i * xStep},${yPos(v)}`).join(' ');
  const area = `M${padL},${padT + iH} ` +
    data.map((v, i) => `L${padL + i * xStep},${yPos(v)}`).join(' ') +
    ` L${padL + (data.length - 1) * xStep},${padT + iH} Z`;
  const yTicks = Array.from({ length: 4 }, (_, i) => Math.round(min + (i * (max - min)) / 3));
  const [tip, setTip] = useState<number | null>(null);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H }} onMouseLeave={() => setTip(null)}>
      <defs>
        <linearGradient id="admlg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.12" />
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
      <path d={area} fill="url(#admlg)" />
      <polyline points={pts} fill="none" stroke="#6366f1" strokeWidth="2.5"
        strokeLinejoin="round" strokeLinecap="round" />
      {data.map((v, i) => (
        <circle key={i}
          cx={padL + i * xStep} cy={yPos(v)} r={tip === i ? 5.5 : 4}
          fill={tip === i ? '#4f46e5' : '#6366f1'}
          stroke="#fff" strokeWidth="2"
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => setTip(i)}
        />
      ))}
      {tip !== null && (() => {
        const tx = padL + tip * xStep;
        const ty = yPos(data[tip]);
        const boxW = 80, boxH = 38, boxX = Math.min(Math.max(tx - boxW / 2, padL), W - padR - boxW);
        return (
          <g style={{ pointerEvents: 'none' }}>
            <rect x={boxX} y={ty - boxH - 10} width={boxW} height={boxH} rx="7" fill="#1e293b" />
            <polygon
              points={`${tx - 5},${ty - 11} ${tx + 5},${ty - 11} ${tx},${ty - 4}`}
              fill="#1e293b"
            />
            <text x={boxX + boxW / 2} y={ty - boxH - 10 + 14}
              textAnchor="middle" fontSize="9.5" fill="#fff" fontWeight="700">
              {labels[tip]}
            </text>
            <text x={boxX + boxW / 2} y={ty - boxH - 10 + 28}
              textAnchor="middle" fontSize="9" fill="#a5b4fc">
              count : {data[tip]}
            </text>
          </g>
        );
      })()}
    </svg>
  );
}

// ── Bar Chart ─────────────────────────────────────────────────────────────────
function BarChart({ present, absent, days }: { present: number[]; absent: number[]; days: string[] }) {
  const W = 400, H = 180;
  const padL = 32, padR = 12, padT = 12, padB = 32;
  const iW = W - padL - padR, iH = H - padT - padB;
  const max = Math.max(...present, ...absent, 60);
  const gW = iW / days.length, bW = 10;
  const yTicks = [0, 15, 30, 45, 60];
  const [tip, setTip] = useState<number | null>(null);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H }} onMouseLeave={() => setTip(null)}>
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
        const isHov = tip === i;
        const boxW = 86, boxH = 52;
        const boxX = Math.min(Math.max(cx - boxW / 2, padL), W - padR - boxW);
        const boxY = padT + iH - pH - boxH - 10;
        return (
          <g key={d} onMouseEnter={() => setTip(i)} style={{ cursor: 'pointer' }}>
            {isHov && (
              <rect x={cx - gW / 2 + 2} y={padT} width={gW - 4} height={iH}
                rx="4" fill="#6366f1" opacity="0.05" />
            )}
            <rect x={cx - bW - 2} y={padT + iH - pH} width={bW} height={pH}
              rx="3" fill="#22c55e" opacity={isHov ? 1 : 0.85} />
            <rect x={cx + 2} y={padT + iH - aH} width={bW} height={aH}
              rx="3" fill="#f87171" opacity={isHov ? 0.9 : 0.6} />
            <text x={cx} y={H - 8} textAnchor="middle" fontSize="9"
              fill={isHov ? '#6366f1' : '#94a3b8'}
              fontWeight={isHov ? '700' : '400'}>{d}</text>
            {isHov && (
              <g style={{ pointerEvents: 'none' }}>
                <rect x={boxX} y={boxY} width={boxW} height={boxH} rx="7" fill="#1e293b" />
                <polygon
                  points={`${cx - 5},${padT + iH - pH - 11} ${cx + 5},${padT + iH - pH - 11} ${cx},${padT + iH - pH - 4}`}
                  fill="#1e293b"
                />
                <text x={boxX + boxW / 2} y={boxY + 16}
                  textAnchor="middle" fontSize="9.5" fill="#fff" fontWeight="700">{d}</text>
                <text x={boxX + boxW / 2} y={boxY + 30}
                  textAnchor="middle" fontSize="9" fill="#86efac">present : {present[i]}</text>
                <text x={boxX + boxW / 2} y={boxY + 44}
                  textAnchor="middle" fontSize="9" fill="#fca5a5">absent : {absent[i]}</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Donut Chart ───────────────────────────────────────────────────────────────
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
            <span style={{ fontSize: '0.72rem', color: '#475569', flex: 1 }}>
              {s.label.length > 10 ? s.label.slice(0, 10) + '..' : s.label}
            </span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0f172a', minWidth: 18, textAlign: 'right' }}>
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  sub: string;
  subColor?: string;
  icon: React.ReactNode;
  accentColor: string;
  onClick?: () => void;
  loading?: boolean;
}
function StatCard({ label, value, sub, subColor = '#22c55e', icon, accentColor, onClick, loading }: StatCardProps) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        background: hov ? `${accentColor}07` : '#fff',
        borderRadius: 16,
        border: `1.5px solid ${hov ? accentColor + '55' : '#f0f4ff'}`,
        padding: '22px 24px',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: hov
          ? `0 8px 28px ${accentColor}28, 0 2px 8px ${accentColor}10`
          : '0 1px 4px rgba(30,40,100,0.04)',
        transition: 'all 0.2s ease',
        transform: hov ? 'translateY(-3px)' : 'translateY(0)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: accentColor,
        borderRadius: '16px 16px 0 0',
        opacity: hov ? 1 : 0,
        transition: 'opacity 0.2s ease',
      }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500, marginBottom: 8 }}>
          {label}
        </div>
        {loading ? (
          <>
            <Sk h={32} w="55%" />
            <div style={{ marginTop: 8 }}><Sk h={10} w="65%" /></div>
          </>
        ) : (
          <>
            <div style={{
              fontSize: '2rem', fontWeight: 800, color: '#0f172a',
              letterSpacing: '-1px', lineHeight: 1,
            }}>
              {value}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: subColor, marginTop: 8 }}>
              {sub}
            </div>
          </>
        )}
      </div>

      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: hov ? `${accentColor}18` : '#f0f4ff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginLeft: 12,
        transition: 'all 0.2s ease',
        boxShadow: hov ? `0 0 0 4px ${accentColor}14` : 'none',
      }}>
        {icon}
      </div>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const IcoPeople = () => <svg width="20" height="20" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const IcoCalendar = () => <svg width="20" height="20" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const IcoClip = () => <svg width="20" height="20" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /></svg>;
const IcoGift = () => <svg width="20" height="20" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><path d="M12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>;
const IcoTrend = () => <svg width="18" height="18" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;
const IcoCal2 = () => <svg width="18" height="18" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const IcoPeople2 = () => <svg width="18" height="18" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const IcoGift2 = () => <svg width="18" height="18" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><path d="M12 22V7" /></svg>;
const IcoClock = () => <svg width="16" height="16" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const [employees, setEmployees] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      getEmployees(), getLeaves(), fetchHolidays(),
      getProjects(), fetchAnnouncements(), getDepartments(),
    ]).then(([e, l, h, p, a, d]) => {
      if (e.status === 'fulfilled') {
        const raw = e.value as any;
        setEmployees(raw?.users ?? (Array.isArray(raw) ? raw : []));
      }
      if (l.status === 'fulfilled') setLeaves((l.value as any[]) ?? []);
      if (h.status === 'fulfilled') setHolidays((h.value as any[]) ?? []);
      if (p.status === 'fulfilled') setProjects((p.value as any[]) ?? []);
      if (a.status === 'fulfilled') setAnnouncements((a.value as any[]) ?? []);
      if (d.status === 'fulfilled') {
        const raw = d.value as any;
        setDepartments(raw?.departments ?? (Array.isArray(raw) ? raw : []));
      }
    }).finally(() => setLoading(false));
  }, []);

  // ── Derived stats ───────────────────────────────────────────────────────────
  const onlyEmps = employees.filter(u => u.role !== 'admin');

  // Present today: count employees whose attendance status is "Present" for today
  // Since we don't have a bulk attendance endpoint here, we approximate from leaves:
  // employees not on approved leave today are considered potentially present
  const approvedLeaveToday = leaves.filter(l => {
    const status = (l.status ?? '').toLowerCase();
    const start = l.startDate ?? '';
    const end = l.endDate ?? '';
    return status === 'approved' && today >= start && today <= end;
  });
  const onLeaveCount = approvedLeaveToday.length;
  const presentToday = Math.max(0, onlyEmps.length - onLeaveCount);
  const attendancePct = onlyEmps.length > 0
    ? Math.round((presentToday / onlyEmps.length) * 100)
    : 0;

  const pendingLeaves = leaves.filter(l => (l.status ?? '').toLowerCase() === 'pending');

  const in30 = new Date(); in30.setDate(in30.getDate() + 30);
  const upcomingHols = holidays
    .filter(h => (h.date ?? '') >= today && (h.date ?? '') <= in30.toISOString().slice(0, 10))
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
    .slice(0, 4);

  // Dept slices — from real API data only
  const DEPT_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444'];
  let deptSlices: { label: string; value: number; color: string }[] = [];
  if (departments.length > 0) {
    const cnt: Record<string, number> = {};
    onlyEmps.forEach(e => {
      const d = e.department ?? 'Other';
      cnt[d] = (cnt[d] ?? 0) + 1;
    });
    deptSlices = departments.slice(0, 6).map((dept: any, i: number) => ({
      label: dept.departmentName ?? dept.name ?? 'Dept',
      value: dept.employeeCount ?? cnt[dept._id ?? dept.id] ?? 0,
      color: DEPT_COLORS[i % DEPT_COLORS.length],
    })).filter(s => s.value > 0);
  }

  // Employee growth: build from actual employee join dates, last 6 months
  const MONTHS: string[] = [];
  const growthData: number[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    MONTHS.push(d.toLocaleString('default', { month: 'short' }));
    const count = onlyEmps.filter(e => {
      const joined = new Date(e.dateOfJoining ?? e.createdAt ?? 0);
      return joined <= new Date(d.getFullYear(), d.getMonth() + 1, 0);
    }).length;
    growthData.push(count);
  }

  // Attendance this week: use leaves data to derive absent counts per weekday
  const ATT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday
  const ATT_P: number[] = [];
  const ATT_A: number[] = [];
  ATT_DAYS.forEach((_, i) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    const dayStr = day.toISOString().slice(0, 10);
    const absentOnDay = leaves.filter(l => {
      const status = (l.status ?? '').toLowerCase();
      return status === 'approved' && (l.startDate ?? '') <= dayStr && (l.endDate ?? '') >= dayStr;
    }).length;
    const absent = Math.min(absentOnDay, onlyEmps.length);
    const present = Math.max(0, onlyEmps.length - absent);
    ATT_P.push(present);
    ATT_A.push(absent);
  });

  const recentActivity: { text: string; time: string; color: string }[] = [];
  if (announcements[0]) {
    recentActivity.push({ text: `New announcement: ${announcements[0].title}`, time: fmtDate(announcements[0].createdAt), color: '#22c55e' });
  }
  if (pendingLeaves[0]) {
    recentActivity.push({
      text: `${pendingLeaves[0].empNumber ?? pendingLeaves[0].employeeId ?? 'Employee'} applied for ${pendingLeaves[0].leaveType ?? 'leave'}`,
      time: fmtDate(pendingLeaves[0].appliedOn),
      color: '#f59e0b',
    });
  }
  if (projects.length > 0) {
    recentActivity.push({
      text: `${projects.length} active project${projects.length !== 1 ? 's' : ''} running`,
      time: 'Today',
      color: '#3b82f6',
    });
  }
  if (recentActivity.length === 0) {
    recentActivity.push({ text: 'No recent activity', time: '', color: '#94a3b8' });
  }

  const handleLeave = async (id: string, status: 'approved' | 'rejected') => {
    setApprovingId(id);
    try {
      await updateLeaveStatus(id, status);
      setLeaves(ls => ls.map(l => l.id === id ? { ...l, status } : l));
    } catch { } finally { setApprovingId(null); }
  };

  const card: React.CSSProperties = {
    background: '#fff', border: '1.5px solid #f0f4ff',
    borderRadius: 16, boxShadow: '0 1px 6px rgba(30,40,100,0.04)',
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes sk { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .adm-db * { box-sizing: border-box; font-family: 'Plus Jakarta Sans', 'Segoe UI', sans-serif; }
        .hov-leave:hover { background: #f8faff !important; }
        .hov-row:hover   { background: #f8faff !important; cursor: pointer; }
        .btn-approve { transition: all 0.15s; }
        .btn-approve:hover { filter: brightness(1.06); transform: translateY(-1px); }
        .btn-reject  { transition: all 0.15s; }
        .btn-reject:hover  { background: #f8fafc !important; border-color: #cbd5e1 !important; }

        /* ── Mobile overrides ── */
        @media (max-width: 639px) {
          .adm-stat-grid  { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
          .adm-chart-grid { grid-template-columns: 1fr !important; }
          .adm-bottom-grid { grid-template-columns: 1fr !important; }
          .adm-stat-value { font-size: 1.45rem !important; }
          .adm-greeting h2 { font-size: 1.2rem !important; }
          .adm-card-pad { padding: 14px 14px !important; }
          .adm-leave-item { flex-direction: column !important; align-items: flex-start !important; }
          .adm-leave-btns { width: 100% !important; justify-content: flex-start !important; }
          .adm-leave-btns button { flex: 1 !important; }
        }
        @media (min-width: 640px) and (max-width: 1023px) {
          .adm-stat-grid  { grid-template-columns: repeat(2, 1fr) !important; }
          .adm-chart-grid { grid-template-columns: 1fr 1fr !important; }
          .adm-bottom-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="adm-db" style={{ paddingBottom: 40 }}>

        {/* ── Greeting ──────────────────────────────────────────────── */}
        <div className="adm-greeting flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
              {getGreeting()}, {(() => {
                const first = user?.name?.split(' ')[0];
                return first && first.toLowerCase() !== 'super' ? first : 'Admin';
              })()}! 👋
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '4px 0 0' }}>
              Here's what's happening across your organization today.
            </p>
          </div>
          <div className="text-left sm:text-right" style={{ flexShrink: 0 }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
              {now.toLocaleDateString('en-US', { weekday: 'long' })}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              {now.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* ── 4 Stat Cards (removed New Joiners + Payroll) ──────────── */}
        <div
          className="adm-stat-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 16,
            marginBottom: 20,
          }}
        >
          <StatCard
            label="Total Employees" value={loading ? '—' : onlyEmps.length}
            sub={`${departments.length} department${departments.length !== 1 ? 's' : ''}`}
            subColor="#6366f1"
            icon={<IcoPeople />} accentColor="#6366f1"
            loading={loading} onClick={() => navigate('/admin/employees')}
          />
          <StatCard
            label="Present Today" value={loading ? '—' : presentToday}
            sub={onlyEmps.length > 0 ? `${attendancePct}% attendance` : 'No employees yet'}
            subColor="#22c55e"
            icon={<IcoCalendar />} accentColor="#06b6d4"
            loading={loading} onClick={() => navigate('/admin/attendance')}
          />
          <StatCard
            label="Pending Leaves" value={loading ? '—' : pendingLeaves.length}
            sub="Awaiting approval" subColor="#f59e0b"
            icon={<IcoClip />} accentColor="#f59e0b"
            loading={loading} onClick={() => navigate('/admin/leaves')}
          />
          <StatCard
            label="Upcoming Holidays" value={loading ? '—' : upcomingHols.length}
            sub="Next 30 days" subColor="#6366f1"
            icon={<IcoGift />} accentColor="#f43f5e"
            loading={loading} onClick={() => navigate('/admin/holidays')}
          />
        </div>

        {/* ── 3 Charts ──────────────────────────────────────────────── */}
        <div
          className="adm-chart-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
            marginBottom: 20,
          }}
        >
          {/* Employee Growth */}
          <div style={{ ...card, padding: '20px 22px' }} className="adm-card-pad">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>Employee Growth</div>
              <IcoTrend />
            </div>
            {loading ? (
              <Sk h={180} />
            ) : growthData.every(v => v === 0) ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180, color: '#94a3b8', fontSize: '0.8rem' }}>
                No data yet
              </div>
            ) : (
              <LineChart data={growthData} labels={MONTHS} />
            )}
          </div>

          {/* Attendance This Week */}
          <div style={{ ...card, padding: '20px 22px' }} className="adm-card-pad">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>Attendance This Week</div>
              <IcoCal2 />
            </div>
            {loading ? (
              <Sk h={180} />
            ) : onlyEmps.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180, color: '#94a3b8', fontSize: '0.8rem' }}>
                No employees yet
              </div>
            ) : (
              <>
                <BarChart present={ATT_P} absent={ATT_A} days={ATT_DAYS} />
                <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
                  {[{ c: '#22c55e', l: 'Present' }, { c: '#f87171', l: 'Absent' }].map(x => (
                    <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: x.c }} />
                      <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{x.l}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Dept Distribution */}
          <div style={{ ...card, padding: '20px 22px' }} className="adm-card-pad">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>Dept. Distribution</div>
              <IcoPeople2 />
            </div>
            {loading ? (
              <Sk h={160} />
            ) : deptSlices.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, color: '#94a3b8', fontSize: '0.8rem' }}>
                No department data
              </div>
            ) : (
              <DonutChart slices={deptSlices} />
            )}
          </div>
        </div>

        {/* ── Leaves + Right column ─────────────────────────────────── */}
        <div
          className="adm-bottom-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.45fr 1fr',
            gap: 16,
          }}
        >
          {/* Pending Leave Requests */}
          <div style={{ ...card, overflow: 'hidden' }}>
            <div style={{
              padding: '18px 22px 14px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>Pending Leave Requests</div>
              {!loading && pendingLeaves.length > 0 && (
                <span style={{ background: '#fffbeb', color: '#f59e0b', fontSize: '0.72rem', fontWeight: 700, padding: '3px 12px', borderRadius: 20 }}>
                  {pendingLeaves.length} pending
                </span>
              )}
            </div>
            <div style={{ padding: '12px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {loading ? Array(2).fill(0).map((_, i) => (
                <div key={i} style={{ padding: 16, borderRadius: 12, background: '#f8fafc' }}>
                  <Sk h={14} w="40%" /><div style={{ marginTop: 6 }}><Sk h={10} w="60%" /></div>
                </div>
              )) : pendingLeaves.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '28px 0', color: '#94a3b8', fontSize: '0.8rem' }}>
                  ✅ No pending leave requests
                </div>
              ) : pendingLeaves.slice(0, 4).map((l: any) => {
                const days = l.startDate && l.endDate ? daysBetween(l.startDate, l.endDate) : 1;
                const acting = approvingId === l.id;
                return (
                  <div
                    key={l.id}
                    className="hov-leave adm-leave-item border border-slate-100"
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '14px 16px',
                      borderRadius: 12,
                      background: '#f8fafc',
                      transition: 'background 0.15s',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: '1 1 160px' }}>
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
                    <div
                      className="adm-leave-btns"
                      style={{ display: 'flex', gap: 8, flexShrink: 0 }}
                    >
                      <button
                        className="btn-approve"
                        disabled={acting}
                        onClick={() => handleLeave(l.id, 'approved')}
                        style={{
                          padding: '7px 18px', borderRadius: 8, border: 'none',
                          background: acting ? '#d1fae5' : '#22c55e',
                          color: '#fff', fontSize: '0.78rem', fontWeight: 700,
                          cursor: acting ? 'wait' : 'pointer',
                        }}
                      >
                        Approve
                      </button>
                      <button
                        className="btn-reject"
                        disabled={acting}
                        onClick={() => handleLeave(l.id, 'rejected')}
                        style={{
                          padding: '7px 16px', borderRadius: 8,
                          border: '1.5px solid #e2e8f0', background: '#fff',
                          color: '#64748b', fontSize: '0.78rem', fontWeight: 700,
                          cursor: acting ? 'wait' : 'pointer',
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
              {!loading && pendingLeaves.length > 4 && (
                <button
                  onClick={() => navigate('/admin/leaves')}
                  style={{
                    background: 'none', border: 'none', color: '#6366f1',
                    fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                    textAlign: 'center', padding: '4px 0',
                  }}
                >
                  View all {pendingLeaves.length} requests →
                </button>
              )}
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Upcoming Holidays */}
            <div style={{ ...card, overflow: 'hidden' }}>
              <div style={{
                padding: '16px 20px 12px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>Upcoming Holidays</div>
                <IcoGift2 />
              </div>
              <div style={{ padding: '4px 0' }}>
                {loading ? Array(3).fill(0).map((_, i) => (
                  <div key={i} style={{ padding: '10px 20px', display: 'flex', gap: 12 }}>
                    <Sk h={32} w={32} r={8} />
                    <div style={{ flex: 1 }}><Sk h={12} /><div style={{ marginTop: 6 }}><Sk h={10} w="60%" /></div></div>
                  </div>
                )) : upcomingHols.length === 0 ? (
                  <p style={{ padding: '16px 20px', color: '#94a3b8', fontSize: '0.78rem', margin: 0 }}>No upcoming holidays in the next 30 days</p>
                ) : upcomingHols.map((h: any) => {
                  const d = new Date(h.date ?? '');
                  const day = isNaN(d.getTime()) ? '—' : d.getDate();
                  const mon = isNaN(d.getTime()) ? '' : d.toLocaleString('default', { month: 'short', year: 'numeric' });
                  return (
                    <div
                      key={h.id}
                      className="hov-row"
                      onClick={() => navigate('/admin/holidays')}
                      style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', gap: 14, transition: 'background 0.12s' }}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: '#f0f4ff', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem',
                        color: '#6366f1', flexShrink: 0,
                      }}>
                        {day}
                      </div>
                      <div style={{ flex: 1, fontWeight: 600, fontSize: '0.82rem', color: '#0f172a', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {h.name ?? h.holidayName ?? '—'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap', flexShrink: 0 }}>{mon}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Activity */}
            <div style={{ ...card, overflow: 'hidden' }}>
              <div style={{
                padding: '16px 20px 12px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>Recent Activity</div>
                <IcoClock />
              </div>
              <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {loading ? Array(3).fill(0).map((_, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <Sk h={8} w={8} r={4} /><Sk h={10} />
                  </div>
                )) : recentActivity.map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.color, flexShrink: 0, marginTop: 3 }} />
                    <div style={{ flex: 1, fontSize: '0.78rem', color: '#475569', lineHeight: 1.4 }}>{a.text}</div>
                    {a.time && (
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', whiteSpace: 'nowrap', flexShrink: 0 }}>{a.time}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}