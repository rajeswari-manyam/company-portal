// src/pages/hr/HRDashboard.tsx
// HR Dashboard — same visual language as EmployeeDashboard but shows
// all-employee data: attendance overview, leave requests, headcount,
// announcements, holidays, and department breakdown.

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTimeTracking } from '../../context/TimeTrackingContext';
import { Badge } from '../../components/ui';
import { formatDate } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';
import {
  Clock, Coffee, Target, CheckCircle2, Sun, BarChart2,
  ChevronRight, Megaphone, Calendar, Briefcase,
  ArrowUpRight, TrendingUp, Users, UserCheck,
  AlertCircle, XCircle, Building2,
} from 'lucide-react';

import { getAnnouncements as fetchAnnouncementsApi } from '../../services/announcementApi';
import { getHolidays as fetchHolidaysApi } from '../../services/holidayApi';
import { getLeaves } from '../../services/leaveApi';
import { getProjectsByEmployee } from '../../services/projectApi';
import axios from 'axios';

const BASE_URL = (import.meta as any).env.VITE_API_BASE_URL;

/* ── Helpers ─────────────────────────────────────────────────── */

const fmt = (s: number) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

/* ── Donut Chart (reused from employee dashboard) ─────────────── */

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

/* ── Metric Box ───────────────────────────────────────────────── */

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

/* ── Employee Row (for recent activity) ───────────────────────── */

function EmpRow({ name, email, status, dept }: { name: string; email: string; status: string; dept?: string }) {
  const AVATAR_COLORS = [
    'bg-violet-100 text-violet-700', 'bg-blue-100 text-blue-700',
    'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700',
    'bg-pink-100 text-pink-700', 'bg-cyan-100 text-cyan-700',
  ];
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const STATUS_PILL: Record<string, string> = {
    Present: 'bg-emerald-50 text-emerald-700',
    Late: 'bg-amber-50 text-amber-700',
    Absent: 'bg-red-50 text-red-600',
    'Half Day': 'bg-blue-50 text-blue-700',
    'On Leave': 'bg-purple-50 text-purple-700',
  };

  return (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${color}`}>
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{name}</p>
        <p className="text-xs text-slate-400 truncate">{dept ?? email}</p>
      </div>
      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${STATUS_PILL[status] ?? 'bg-slate-100 text-slate-500'}`}>
        {status}
      </span>
    </div>
  );
}

/* ── Project Row ──────────────────────────────────────────────── */

function ProjectRow({ name, progress, status }: { name: string; progress: number; status: string }) {
  const pct = Math.min(Math.max(progress, 0), 100);
  const isComplete = status === 'completed' || pct === 100;
  const grad = isComplete ? 'from-emerald-400 to-teal-400' : 'from-[#0B0E92] to-[#69A6F0]';
  const badge = isComplete ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-[#0B0E92]';
  return (
    <div className="px-5 py-4 hover:bg-slate-50 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-slate-800 truncate flex-1 mr-2">{name}</p>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${badge}`}>
          {isComplete ? '✓ Done' : '✓ Active'}
        </span>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-1">
        <div className={`h-full rounded-full bg-gradient-to-r ${grad} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] text-slate-400 font-medium">{pct}% complete</p>
    </div>
  );
}

/* ── Main HR Dashboard ────────────────────────────────────────── */

export default function HRDashboard() {
  const { user } = useAuth();
  const { workSeconds, completionPercent } = useTimeTracking();
  const navigate = useNavigate();

  const [now, setNow] = useState(new Date());
  const [breakSeconds, setBreak] = useState(0);
  const [onBreak, setOnBreak] = useState(false);

  // API state
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

  // Break timer
  useEffect(() => {
    if (!onBreak) return;
    const t = setInterval(() => setBreak(b => b + 1), 1000);
    return () => clearInterval(t);
  }, [onBreak]);

  // Fetch all
  useEffect(() => {
    const userId = (user as any)?._id ?? (user as any)?.id ?? '';
    if (!userId) return;
    setDashLoading(true);

    Promise.allSettled([
      fetchAnnouncementsApi(),
      fetchHolidaysApi(),
      getLeaves(),
      getProjectsByEmployee(userId),
      axios.get(`${BASE_URL}/getAllAttendance`),
      axios.get(`${BASE_URL}/getEmployees`),
    ]).then(([ann, hol, lv, proj, att, users]) => {
      if (ann.status === 'fulfilled') setAnnouncements(ann.value ?? []);
      if (hol.status === 'fulfilled') setHolidays(hol.value ?? []);
      if (lv.status === 'fulfilled') setLeaves(lv.value ?? []);
      if (proj.status === 'fulfilled') setProjects(proj.value ?? []);
      if (att.status === 'fulfilled') setAllAttendance((att as any).value?.data?.data ?? []);
      if (users.status === 'fulfilled') setAllUsers((users as any).value?.data?.data ?? []);
    }).finally(() => setDashLoading(false));
  }, [(user as any)?._id]);

  /* ── Derived values ─────────────────────────────────────────── */

  const today = new Date().toISOString().slice(0, 10);
  const todayAtt = allAttendance.filter((r: any) => r.date?.slice(0, 10) === today);

  const attPresent = todayAtt.filter((r: any) => r.status === 'Present').length;
  const attLate = todayAtt.filter((r: any) => r.status === 'Late').length;
  const attAbsent = todayAtt.filter((r: any) => r.status === 'Absent').length;
  const attOnLeave = todayAtt.filter((r: any) => ['On Leave', 'Half Day'].includes(r.status)).length;

  const totalEmployees = allUsers.length || todayAtt.length || 0;
  const presentPct = totalEmployees > 0 ? Math.round((attPresent / totalEmployees) * 100) : 0;

  const pendingLeaves = leaves.filter((l: any) => l.status === 'pending' || l.status === 'Pending');
  const upcomingHolidays = holidays.filter((h: any) => (h.date ?? '') >= today).slice(0, 4);

  const WORK_DAY = 8 * 3600;
  const remainingSecs = Math.max(0, WORK_DAY - workSeconds);

  // Department breakdown from today's attendance
  const deptMap: Record<string, number> = {};
  todayAtt.forEach((r: any) => {
    const dept = (typeof r.employeeId === 'object' ? r.employeeId?.department : null) ?? 'Unknown';
    deptMap[dept] = (deptMap[dept] ?? 0) + 1;
  });

  return (
    <div className="space-y-5 pb-8">

      {/* ── Welcome Banner ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 leading-snug">
            {greeting()}, {user?.name?.split(' ')[0] ?? 'there'}! 👋
          </h1>
          <p className="text-sm text-slate-400 font-normal mt-1">
            Here's your HR workspace overview for today.
          </p>
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

      {/* ── Today Donut + 6 Metric Boxes ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

        {/* Donut — today's attendance completion */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-slate-700">Today's Presence</span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${presentPct >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
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
          <p className="text-xs text-slate-400 text-center mb-4">{attPresent} of {totalEmployees} employees</p>
          {/* HR's own break button */}
          <button onClick={() => setOnBreak(b => !b)}
            className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2
              ${onBreak
                ? 'bg-amber-50 text-amber-700 border-2 border-amber-200'
                : 'bg-gradient-to-r from-[#0B0E92] to-[#69A6F0] text-white shadow-md shadow-blue-900/20'}`}>
            <Coffee size={15} />
            {onBreak ? `On Break · ${fmt(breakSeconds)}` : 'Take Break'}
          </button>
        </div>

        {/* 6 metric boxes */}
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-4">
          <MetricBox label="Total Employees" value={totalEmployees} icon={Users} iconBg="#EEF0FF" iconColor="#0B0E92" sub="Active headcount" />
          <MetricBox label="Present Today" value={attPresent} icon={CheckCircle2} iconBg="#DCFCE7" iconColor="#16A34A" sub={`${attLate} late`} />
          <MetricBox label="Absent Today" value={attAbsent} icon={XCircle} iconBg="#FEE2E2" iconColor="#DC2626" sub="No check-in" />
          <MetricBox label="On Leave" value={attOnLeave} icon={AlertCircle} iconBg="#F3E8FF" iconColor="#7C3AED" sub="Today" />
          <MetricBox label="Pending Leaves" value={pendingLeaves.length} icon={Clock} iconBg="#FFF7ED" iconColor="#EA580C" sub="Awaiting approval" />
          <MetricBox label="My Hours" value={fmt(workSeconds)} icon={BarChart2} iconBg="#E0F2FE" iconColor="#0284C7" sub={`${completionPercent}% of 8h`} />
        </div>
      </div>

      {/* ── Daily Progress (HR's own) ──────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-slate-800">My Daily Progress</h3>
          <span className="text-xs text-slate-400">8-hour target</span>
        </div>
        <div className="mt-4 w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
          <div className="h-full bg-gradient-to-r from-[#0B0E92] to-[#69A6F0] transition-all duration-700 rounded-l-full"
            style={{ width: `${Math.min(completionPercent, 100)}%` }} />
          {breakSeconds > 0 && (
            <div className="h-full bg-amber-400 transition-all duration-700"
              style={{ width: `${Math.min((breakSeconds / WORK_DAY) * 100, 100 - completionPercent)}%` }} />
          )}
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
          {['0h', '2h', '4h', '6h', '8h'].map(l => <span key={l}>{l}</span>)}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { dot: 'bg-[#0B0E92]', label: 'Working', val: fmt(workSeconds) },
            { dot: 'bg-amber-400', label: 'Break', val: fmt(breakSeconds) },
            { dot: 'bg-slate-200', label: 'Remaining', val: fmt(remainingSecs) },
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

      {/* ── Today's Attendance Overview + Pending Leaves ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Today's Attendance — all employees */}
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

          {dashLoading ? (
            <div className="p-5 space-y-2 animate-pulse">
              {[1, 2, 3, 4].map(n => <div key={n} className="h-12 bg-slate-100 rounded-xl" />)}
            </div>
          ) : todayAtt.length === 0 ? (
            <p className="text-center text-slate-400 py-8 text-sm">No attendance records for today</p>
          ) : (
            <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
              {todayAtt.slice(0, 8).map((r: any) => {
                const emp = typeof r.employeeId === 'object' ? r.employeeId : null;
                return (
                  <EmpRow
                    key={r._id}
                    name={emp?.name ?? String(r.employeeId)}
                    email={emp?.email ?? ''}
                    dept={emp?.department ?? ''}
                    status={r.status}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Pending Leave Requests */}
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
      </div>

      {/* ── My Projects + Announcements + Holidays ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* My Projects */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                <Briefcase size={14} className="text-violet-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">My Projects</h3>
                <p className="text-[10px] text-slate-400">
                  {projects.filter((p: any) => p.status === 'completed').length}/{projects.length} done
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
            <p className="text-center text-slate-400 py-8 text-sm">No projects assigned yet.</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {projects.slice(0, 4).map((p: any) => (
                <ProjectRow key={p.id ?? p._id} name={p.projectName ?? p.name} progress={0} status={p.status} />
              ))}
            </div>
          )}
        </div>

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