// src/pages/hr/HRDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTimeTracking } from '../../context/TimeTrackingContext';
import { Badge } from '../../components/ui';
import { formatDate } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';
import {
  Clock, Coffee, CheckCircle2, Moon,
  ChevronRight, Megaphone, Calendar, Briefcase,
  ArrowUpRight, TrendingUp, Users, UserCheck,
  AlertCircle, XCircle,
} from 'lucide-react';

import { getAnnouncements as fetchAnnouncementsApi } from '../../service/announcementApi';
import { getHolidays as fetchHolidaysApi } from '../../service/holidayApi';
import { getLeaves } from '../../service/leaveApi';
import { getProjects } from '../../service/projectApi';
import axios from 'axios';

const BASE_URL = (import.meta as any).env.VITE_API_BASE_URL;

/* ── Helpers ─────────────────────────────────────────────────── */

const fmt = (s: number) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

const fmtExtra = (workSecs: number): string => {
  const extra = workSecs - 8 * 3600;
  if (extra <= 0) return '--:--:--';
  const h = Math.floor(extra / 3600);
  const m = Math.floor((extra % 3600) / 60);
  const s = extra % 60;
  return `+${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

/* ── Donut Chart ─────────────────────────────────────────────── */

function DonutChart({ percent, size = 120, strokeWidth = 12, color = '#0B0E92' }: {
  percent: number; size?: number; strokeWidth?: number; color?: string;
}) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(percent, 100) / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EEF0FF" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }} />
    </svg>
  );
}

/* ── Metric Box ──────────────────────────────────────────────── */

function MetricBox({ label, value, icon: Icon, iconBg, iconColor, sub }: {
  label: string; value: string | number; icon: any;
  iconBg: string; iconColor: string; sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-200 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</span>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: iconBg }}>
          <Icon size={17} style={{ color: iconColor }} />
        </div>
      </div>
      <p className="text-[28px] font-bold text-slate-800 leading-none">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

/* ── Idle Time Box — reads purely from context, no local state ── */

function IdleTimeBox() {
  // Identical pattern to EmployeeDashboard — all idle data from context
  const { idleSeconds, isIdle, todayIdleSessions, todayIdleSecs } = useTimeTracking();

  const h = Math.floor(idleSeconds / 3600);
  const m = Math.floor((idleSeconds % 3600) / 60);
  const s = idleSeconds % 60;
  const val = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  const isWarning = isIdle && idleSeconds < 10 * 60;
  const isDanger = isIdle && idleSeconds >= 10 * 60;
  const iconBg = isDanger ? '#FEE2E2' : isWarning ? '#FEF9C3' : '#F0FDF4';
  const iconColor = isDanger ? '#DC2626' : isWarning ? '#CA8A04' : '#16A34A';
  const textColor = isDanger ? '#DC2626' : isWarning ? '#B45309' : '#1E293B';

  const idleMinutes = Math.floor(todayIdleSecs / 60);
  const idleSummary = todayIdleSessions > 0
    ? `${todayIdleSessions} session${todayIdleSessions > 1 ? 's' : ''} · ${idleMinutes}m today`
    : 'No idle sessions today';

  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border transition-all duration-300 flex flex-col gap-3
      ${isDanger ? 'border-red-200 shadow-red-100' : isWarning ? 'border-amber-200 shadow-amber-50' : 'border-slate-100'}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">My Idle Time</span>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center relative" style={{ backgroundColor: iconBg }}>
          <Moon size={17} style={{ color: iconColor }} />
          {isIdle && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-white animate-pulse" />
          )}
        </div>
      </div>
      <p className="text-[28px] font-bold leading-none transition-colors" style={{ color: textColor }}>{val}</p>
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isIdle ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
        <span className={`text-xs font-semibold ${isIdle ? 'text-amber-600' : 'text-emerald-600'}`}>
          {isIdle ? (isDanger ? 'Long Idle' : 'Idle') : 'Active'}
        </span>
      </div>
      {todayIdleSessions > 0 && (
        <p className="text-[10px] text-amber-500 font-medium -mt-1">{idleSummary}</p>
      )}
    </div>
  );
}

/* ── Status Pill helpers ─────────────────────────────────────── */

const STATUS_PILL: Record<string, string> = {
  Present: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  Late: 'bg-amber-50 text-amber-700 border border-amber-100',
  Absent: 'bg-red-50 text-red-600 border border-red-100',
  'Half Day': 'bg-blue-50 text-blue-700 border border-blue-100',
  'On Leave': 'bg-purple-50 text-purple-700 border border-purple-100',
};
const STATUS_DOT: Record<string, string> = {
  Present: 'bg-emerald-500', Late: 'bg-amber-400', Absent: 'bg-red-500',
  'Half Day': 'bg-blue-500', 'On Leave': 'bg-purple-500',
};
const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700', 'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700',
  'bg-pink-100 text-pink-700', 'bg-cyan-100 text-cyan-700',
];
function avatarColor(name: string) { return AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length]; }
function getInitials(name: string) { return (name || 'UN').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2); }

/* ── Employee Attendance Row ─────────────────────────────────── */

function EmpAttRow({ emp, status, checkIn, checkOut }: {
  emp: any; status: string; checkIn?: string; checkOut?: string;
}) {
  const name = (typeof emp === 'object' ? emp?.name : null) ?? String(emp ?? 'Unknown');
  const email = typeof emp === 'object' ? (emp?.email ?? '') : '';
  const dept = typeof emp === 'object' ? (emp?.department ?? '') : '';
  return (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors group">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarColor(name)}`}>
        {getInitials(name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{name}</p>
        <p className="text-xs text-slate-400 truncate">{dept || email}</p>
      </div>
      <div className="hidden sm:flex flex-col items-end text-right shrink-0 mr-3">
        {checkIn
          ? <span className="text-xs font-semibold text-emerald-600">▲ {checkIn}</span>
          : <span className="text-xs text-slate-300">No check-in</span>}
        {checkOut
          ? <span className="text-xs text-slate-400">▼ {checkOut}</span>
          : (status === 'Present' || status === 'Late')
            ? <span className="text-[10px] text-amber-500 font-semibold">Active</span>
            : null}
      </div>
      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 flex items-center gap-1.5 ${STATUS_PILL[status] ?? 'bg-slate-100 text-slate-500'}`}>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[status] ?? 'bg-slate-400'}`} />
        {status}
      </span>
    </div>
  );
}

/* ── Att Stat Strip ──────────────────────────────────────────── */

function AttStatStrip({ present, late, absent, halfDay, onLeave, total }: {
  present: number; late: number; absent: number; halfDay: number; onLeave: number; total: number;
}) {
  const items = [
    { label: 'Present', count: present, dot: 'bg-emerald-500', text: 'text-emerald-700' },
    { label: 'Late', count: late, dot: 'bg-amber-400', text: 'text-amber-700' },
    { label: 'Absent', count: absent, dot: 'bg-red-500', text: 'text-red-600' },
    { label: 'Half Day', count: halfDay, dot: 'bg-blue-500', text: 'text-blue-700' },
    { label: 'On Leave', count: onLeave, dot: 'bg-purple-500', text: 'text-purple-700' },
  ];
  return (
    <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex-1 min-w-[160px]">
          <div className="flex gap-0.5 h-2 rounded-full overflow-hidden">
            {total > 0
              ? items.map(item => item.count > 0
                ? <div key={item.label} className={`h-full ${item.dot}`} style={{ width: `${(item.count / total) * 100}%` }} />
                : null)
              : <div className="h-full w-full bg-slate-200 rounded-full" />}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {items.map(item => (
            <div key={item.label} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${item.dot}`} />
              <span className={`text-xs font-bold ${item.text}`}>{item.count}</span>
              <span className="text-[10px] text-slate-400">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Project Row ─────────────────────────────────────────────── */

function ProjectRow({ name, progress, status }: { name: string; progress: number; status: string }) {
  const pct = Math.min(Math.max(progress, 0), 100);
  const isComplete = status === 'completed' || pct === 100;
  return (
    <div className="px-5 py-4 hover:bg-slate-50 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-slate-800 truncate flex-1 mr-2">{name}</p>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0
          ${isComplete ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-[#0B0E92]'}`}>
          {isComplete ? '✓ Done' : '● Active'}
        </span>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-1">
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-all duration-700
            ${isComplete ? 'from-emerald-400 to-teal-400' : 'from-[#0B0E92] to-[#69A6F0]'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-slate-400 font-medium">{pct}% complete</p>
    </div>
  );
}

/* ── Main HR Dashboard ───────────────────────────────────────── */

export default function HRDashboard() {
  const { user } = useAuth();

  // ✅ All idle + work tracking from context — no duplicate logic in this file
  const {
    workSeconds, breakSeconds,
    isIdle, isOnBreak,
    startBreak, resumeWork,
    todayIdleSessions, todayIdleSecs,
  } = useTimeTracking();

  const navigate = useNavigate();

  const [now, setNow] = useState(new Date());
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [allAttendance, setAllAttendance] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [dashLoading, setDashLoading] = useState(true);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Dashboard data
  useEffect(() => {
    setDashLoading(true);
    Promise.allSettled([
      fetchAnnouncementsApi(),
      fetchHolidaysApi(),
      getLeaves(),
      getProjects(),
      axios.get(`${BASE_URL}/getAllAttendance`),
      axios.get(`${BASE_URL}/getEmployees`),
    ]).then(([ann, hol, lv, proj, att, users]) => {
      if (ann.status === 'fulfilled') setAnnouncements((ann as any).value ?? []);
      if (hol.status === 'fulfilled') setHolidays((hol as any).value ?? []);
      if (lv.status === 'fulfilled') setLeaves((lv as any).value ?? []);
      if (proj.status === 'fulfilled') setProjects((proj as any).value ?? []);
      if (att.status === 'fulfilled') setAllAttendance((att as any).value?.data?.data ?? []);
      if (users.status === 'fulfilled') setAllUsers((users as any).value?.data?.data ?? []);
    }).finally(() => setDashLoading(false));
  }, []);

  /* ── Derived ─────────────────────────────────────────────── */

  const today = new Date().toISOString().slice(0, 10);
  const todayAtt = allAttendance.filter((r: any) => r.date?.slice(0, 10) === today);

  const attPresent = todayAtt.filter((r: any) => r.status === 'Present').length;
  const attLate = todayAtt.filter((r: any) => r.status === 'Late').length;
  const attAbsent = todayAtt.filter((r: any) => r.status === 'Absent').length;
  const attHalfDay = todayAtt.filter((r: any) => r.status === 'Half Day').length;
  const attOnLeave = todayAtt.filter((r: any) => r.status === 'On Leave').length;
  const totalEmployees = allUsers.length || todayAtt.length || 0;
  const presentPct = totalEmployees > 0
    ? Math.round(((attPresent + attLate) / totalEmployees) * 100)
    : 0;

  const pendingLeaves = leaves.filter((l: any) => l.status === 'pending' || l.status === 'Pending');
  const upcomingHolidays = holidays.filter((h: any) => (h.date ?? '') >= today).slice(0, 4);

  const WORK_DAY = 8 * 3600;
  const displayCompletion = Math.min(100, Math.round((workSeconds / WORK_DAY) * 100));
  const remainingSecs = Math.max(0, WORK_DAY - workSeconds);
  const hasExtraHours = workSeconds > WORK_DAY;

  // Idle summary — from context (same as EmployeeDashboard)
  const idleMinutesApi = Math.floor(todayIdleSecs / 60);
  const idleSummary = todayIdleSessions > 0
    ? `${todayIdleSessions} session${todayIdleSessions > 1 ? 's' : ''} · ${idleMinutesApi}m today`
    : 'No idle sessions today';

  function fmtIsoTime(iso?: string) {
    if (!iso) return undefined;
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  /* ── Render ──────────────────────────────────────────────── */

  return (
    <div className="space-y-5 pb-8">

      {/* ── Welcome Banner ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 leading-snug">
            {greeting()}, {user?.name?.split(' ')[0] ?? 'there'}! 👋
          </h1>
          <p className="text-sm text-slate-400 font-normal mt-1">Here's your HR workspace overview for today.</p>
          <div className="flex items-center flex-wrap gap-2 mt-2">
            {user?.designation && <span className="text-xs text-slate-500">{user.designation}</span>}
            {(user as any)?.empId && (
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-semibold">
                {(user as any).empId}
              </span>
            )}
            {pendingLeaves.length > 0 && (
              <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100">
                {pendingLeaves.length} leave request{pendingLeaves.length > 1 ? 's' : ''} pending approval
              </span>
            )}
            {todayIdleSessions > 0 && (
              <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100 flex items-center gap-1">
                <Moon size={10} />
                {idleSummary}
              </span>
            )}
          </div>
        </div>
        <div className="hidden sm:block text-right shrink-0">
          <p className="text-base font-semibold text-slate-800">
            {now.toLocaleDateString('en-US', { weekday: 'long' })}
          </p>
          <p className="text-sm text-slate-400 font-normal mt-0.5">
            {now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* ── Donut + Metric Boxes ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

        {/* Donut — team presence */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-slate-700">Today's Presence</span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full
              ${presentPct >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {presentPct >= 80 ? 'Good' : 'Low'}
            </span>
          </div>
          <div className="relative flex items-center justify-center mb-3">
            <DonutChart percent={presentPct} size={120} strokeWidth={12} color="#0B0E92" />
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black text-slate-800">{presentPct}%</span>
              <span className="text-[10px] text-slate-400 font-medium">present</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 text-center mb-4">
            {attPresent + attLate} of {totalEmployees} employees
          </p>
          {isOnBreak ? (
            <div className="space-y-2">
              <div className="w-full py-2.5 rounded-xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <span className="text-sm font-bold text-amber-700">On Break</span>
                <span className="font-mono text-sm font-black text-amber-600">{fmt(breakSeconds)}</span>
              </div>
              <button onClick={resumeWork}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-white text-sm font-bold shadow-md flex items-center justify-center gap-2 hover:opacity-90">
                ▶ Resume Work
              </button>
            </div>
          ) : (
            <button onClick={startBreak}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#0B0E92] to-[#69A6F0] text-white text-sm font-bold shadow-md flex items-center justify-center gap-2 hover:opacity-90">
              <Coffee size={15} /> Take Break
            </button>
          )}
        </div>

        {/* 8 metric boxes */}
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricBox label="Total Employees" value={totalEmployees} icon={Users} iconBg="#EEF0FF" iconColor="#0B0E92" sub="Active headcount" />
          <MetricBox label="Present Today" value={attPresent} icon={CheckCircle2} iconBg="#DCFCE7" iconColor="#16A34A" sub={`${attLate} late`} />
          <MetricBox label="Absent Today" value={attAbsent} icon={XCircle} iconBg="#FEE2E2" iconColor="#DC2626" sub="No check-in" />
          <MetricBox label="On Leave" value={attOnLeave} icon={AlertCircle} iconBg="#F3E8FF" iconColor="#7C3AED" sub="Today" />
          <MetricBox label="My Work Hours" value={fmt(workSeconds)} icon={Clock} iconBg="#EEF0FF" iconColor="#0B0E92" sub={isIdle ? '⏸ Paused (idle)' : '▶ Running'} />
          <MetricBox label="My Break Time" value={fmt(breakSeconds)} icon={Coffee} iconBg="#FFF7ED" iconColor="#EA580C" sub={isOnBreak ? '☕ On break now' : 'Total today'} />
          <MetricBox
            label="My Extra Hours" value={fmtExtra(workSeconds)} icon={TrendingUp}
            iconBg={hasExtraHours ? '#DCFCE7' : '#F1F5F9'}
            iconColor={hasExtraHours ? '#16A34A' : '#94A3B8'}
            sub={hasExtraHours ? 'Overtime logged' : 'Earned after 8 hrs'}
          />
          {/* IdleTimeBox reads everything from context — no props needed */}
          <IdleTimeBox />
        </div>
      </div>

      {/* ── My Daily Progress ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-slate-800">My Daily Progress</h3>
          <div className="flex items-center gap-2">
            {isIdle && (
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" /> Idle — timer paused
              </span>
            )}
            <span className="text-xs text-slate-400">8-hour target</span>
          </div>
        </div>
        <div className="mt-4 w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
          <div
            className={`h-full transition-all duration-700 rounded-l-full ${isIdle ? 'bg-amber-400' : 'bg-gradient-to-r from-[#0B0E92] to-[#69A6F0]'}`}
            style={{ width: `${Math.min(displayCompletion, 100)}%` }}
          />
          {breakSeconds > 0 && (
            <div className="h-full bg-amber-300 transition-all duration-700"
              style={{ width: `${Math.min((breakSeconds / WORK_DAY) * 100, 100 - displayCompletion)}%` }} />
          )}
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
          {['0h', '2h', '4h', '6h', '8h'].map(l => <span key={l}>{l}</span>)}
        </div>
        <div className="mt-4 grid grid-cols-4 gap-3">
          {[
            { dot: isIdle ? 'bg-amber-400' : 'bg-[#0B0E92]', label: 'Working', val: fmt(workSeconds) },
            { dot: 'bg-amber-300', label: 'Break', val: fmt(breakSeconds) },
            { dot: 'bg-slate-200', label: 'Remaining', val: fmt(remainingSecs) },
            { dot: hasExtraHours ? 'bg-emerald-500' : 'bg-slate-100', label: 'Extra', val: fmtExtra(workSeconds) },
          ].map(i => (
            <div key={i.label} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${i.dot} shrink-0`} />
              <div>
                <p className="text-[10px] font-medium text-slate-400">{i.label}</p>
                <p className="font-mono font-bold text-slate-800 text-xs">{i.val}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Today's All Employee Attendance ──────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0B0E92] to-[#69A6F0] flex items-center justify-center">
              <UserCheck size={14} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Today's Attendance</h3>
              <p className="text-[10px] text-slate-400">{todayAtt.length} records · {today}</p>
            </div>
          </div>
          <button onClick={() => navigate('/hr/attendance')}
            className="text-xs text-[#0B0E92] font-semibold flex items-center gap-1 hover:underline">
            View All <ArrowUpRight size={11} />
          </button>
        </div>

        {!dashLoading && todayAtt.length > 0 && (
          <AttStatStrip
            present={attPresent} late={attLate} absent={attAbsent}
            halfDay={attHalfDay} onLeave={attOnLeave} total={todayAtt.length}
          />
        )}

        {dashLoading ? (
          <div className="p-5 space-y-2 animate-pulse">
            {[1, 2, 3, 4, 5].map(n => <div key={n} className="h-12 bg-slate-100 rounded-xl" />)}
          </div>
        ) : todayAtt.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-sm font-medium">No attendance records for today</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
              {todayAtt.slice(0, 8).map((r: any) => {
                const sessions = r.sessions ?? [];
                const sorted = [...sessions].sort((a: any, b: any) =>
                  new Date(a.loginTime).getTime() - new Date(b.loginTime).getTime(),
                );
                const lastLogout = r.lastLogout
                  ?? [...sessions].reverse().find((s: any) => s.logoutTime)?.logoutTime;
                return (
                  <EmpAttRow
                    key={r._id} emp={r.employeeId} status={r.status}
                    checkIn={sorted[0]?.loginTime ? fmtIsoTime(sorted[0].loginTime) : undefined}
                    checkOut={lastLogout ? fmtIsoTime(lastLogout) : undefined}
                  />
                );
              })}
            </div>
            {todayAtt.length > 8 && (
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/40">
                <button onClick={() => navigate('/hr/attendance')}
                  className="text-xs font-semibold text-[#0B0E92] hover:underline flex items-center gap-1">
                  +{todayAtt.length - 8} more employees <ArrowUpRight size={11} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Pending Leaves + All Projects ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Pending Leaves */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock size={14} className="text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Pending Leaves</h3>
                <p className="text-[10px] text-slate-400">{pendingLeaves.length} awaiting approval</p>
              </div>
            </div>
            <button onClick={() => navigate('/hr/leaves')}
              className="text-xs text-[#0B0E92] font-semibold flex items-center gap-1 hover:underline">
              Review <ArrowUpRight size={11} />
            </button>
          </div>
          {dashLoading ? (
            <div className="p-5 space-y-2 animate-pulse">
              {[1, 2, 3].map(n => <div key={n} className="h-12 bg-slate-100 rounded-xl" />)}
            </div>
          ) : pendingLeaves.length === 0 ? (
            <p className="text-center text-slate-400 py-8 text-sm">No pending leave requests 🎉</p>
          ) : (
            <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
              {pendingLeaves.slice(0, 6).map((l: any) => (
                <div key={l.id ?? l._id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-sm shrink-0">🌴</div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{l.userName ?? l.employeeName ?? 'Employee'}</p>
                      <p className="text-xs text-slate-400">{l.leaveType} · {l.days ?? 1} day{l.days !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge status={l.status} />
                    <p className="text-[10px] text-slate-400 mt-0.5">{l.startDate ? formatDate(l.startDate) : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Projects */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                <Briefcase size={14} className="text-violet-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">All Projects</h3>
                <p className="text-[10px] text-slate-400">
                  {projects.filter((p: any) => p.status === 'completed').length}/{projects.length} completed
                </p>
              </div>
            </div>
            <button onClick={() => navigate('/hr/projects')}
              className="text-[10px] font-semibold text-[#0B0E92] flex items-center gap-1 cursor-pointer hover:underline">
              View all <ArrowUpRight size={11} />
            </button>
          </div>
          {dashLoading ? (
            <div className="p-5 space-y-2 animate-pulse">
              {[1, 2, 3].map(n => <div key={n} className="h-14 bg-slate-100 rounded-xl" />)}
            </div>
          ) : projects.length === 0 ? (
            <p className="text-center text-slate-400 py-8 text-sm">No projects found.</p>
          ) : (
            <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
              {projects.slice(0, 6).map((p: any) => (
                <ProjectRow key={p.id ?? p._id} name={p.projectName ?? p.name} progress={p.progress ?? 0} status={p.status ?? 'active'} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Announcements + Holidays ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Announcements */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0B0E92] to-[#69A6F0] flex items-center justify-center">
                <Megaphone size={14} className="text-white" />
              </div>
              <h3 className="font-bold text-slate-800">Announcements</h3>
            </div>
            <button onClick={() => navigate('/hr/announcements')}
              className="text-xs text-[#0B0E92] font-semibold flex items-center gap-1 hover:underline">
              All <ChevronRight size={11} />
            </button>
          </div>
          {dashLoading ? (
            <div className="p-4 space-y-2 animate-pulse">
              {[1, 2, 3].map(n => <div key={n} className="h-10 bg-slate-100 rounded-xl" />)}
            </div>
          ) : announcements.length === 0 ? (
            <p className="text-center text-slate-400 py-8 text-sm">No announcements</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {announcements.slice(0, 4).map((a: any) => (
                <div key={a.id ?? a._id} className="px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-2">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-[#0B0E92] shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800 leading-snug">{a.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{a.createdAt ? formatDate(a.createdAt) : ''}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Holidays */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
              <Calendar size={14} className="text-amber-600" />
            </div>
            <h3 className="font-bold text-slate-800">Upcoming Holidays</h3>
          </div>
          {dashLoading ? (
            <div className="p-4 space-y-2 animate-pulse">
              {[1, 2, 3].map(n => <div key={n} className="h-10 bg-slate-100 rounded-xl" />)}
            </div>
          ) : upcomingHolidays.length === 0 ? (
            <p className="text-center text-slate-400 py-8 text-sm">No upcoming holidays</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {upcomingHolidays.map((h: any) => (
                <div key={h.id ?? h._id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center text-base shrink-0">🎉</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{h.name}</p>
                    <p className="text-xs text-slate-400">{h.type ?? 'Public'}</p>
                  </div>
                  <span className="text-xs bg-amber-50 text-amber-700 font-bold px-2 py-1 rounded-lg shrink-0">
                    {formatDate(h.date)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}