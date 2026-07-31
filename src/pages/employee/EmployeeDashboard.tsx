// src/pages/employee/EmployeeDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTimeTracking } from '../../context/TimeTrackingContext';
import { Badge } from '../../components/ui';
import { formatDate } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';
import {
  Clock, Coffee, CheckCircle2,
  ChevronRight, Megaphone, Calendar, Briefcase,
  CheckSquare, ArrowUpRight, TrendingUp, Plus, UserCheck,
  Moon, LogIn, LogOut,
} from 'lucide-react';

import { getAnnouncements as fetchAnnouncementsApi } from '../../service/announcementApi';
import { getHolidays as fetchHolidaysApi } from '../../service/holidayApi';
import { getLeaves } from '../../service/leaveApi';
import { getProjects } from '../../service/projectApi';

import {
  getAttendanceByIdApi,
  getAttendanceByEmpIdApi,
  
} from '../../service/Attendance.service';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (s: number) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

const fmtTime = (iso?: string | null): string => {
  if (!iso) return '--:-- --';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '--:-- --';
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
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

// ── Donut Chart ───────────────────────────────────────────────────────────────
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

// ── Metric Box ────────────────────────────────────────────────────────────────
function MetricBox({ label, value, icon: Icon, iconBg, iconColor, sub }: {
  label: string; value: string; icon: any; iconBg: string; iconColor: string; sub?: string;
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

// ── Idle Time Box — reads purely from context, no local state ─────────────────
function IdleTimeBox() {
  const { idleSeconds, isIdle } = useTimeTracking();
  const h = Math.floor(idleSeconds / 3600);
  const m = Math.floor((idleSeconds % 3600) / 60);
  const s = idleSeconds % 60;
  const val = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  const isWarning = isIdle && idleSeconds < 10 * 60;
  const isDanger = isIdle && idleSeconds >= 10 * 60;
  const iconBg = isDanger ? '#FEE2E2' : isWarning ? '#FEF9C3' : '#F0FDF4';
  const iconColor = isDanger ? '#DC2626' : isWarning ? '#CA8A04' : '#16A34A';
  const textColor = isDanger ? '#DC2626' : isWarning ? '#B45309' : '#1E293B';

  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border transition-all duration-300 flex flex-col gap-3
      ${isDanger ? 'border-red-200 shadow-red-100' : isWarning ? 'border-amber-200 shadow-amber-50' : 'border-slate-100'}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Idle Time</span>
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
    </div>
  );
}

// ── Project Row ───────────────────────────────────────────────────────────────
function ProjectRow({ name, progress, status }: {
  name: string; progress: number; status: string;
}) {
  const pct = Math.min(Math.max(progress, 0), 100);
  const isComplete = status === 'completed' || pct === 100;
  const grad = isComplete ? 'from-emerald-400 to-teal-400' : 'from-[#0B0E92] to-[#69A6F0]';
  const badge = isComplete ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-[#0B0E92]';
  return (
    <div className="px-5 py-4 hover:bg-slate-50 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-slate-800 truncate flex-1 mr-2">{name}</p>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${badge}`}>
          {isComplete ? 'Done' : 'Active'}
        </span>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-1">
        <div className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${grad}`}
          style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] text-slate-400 font-medium">{pct}% complete</p>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function EmployeeDashboard() {
  const { user } = useAuth();

  // ✅ Pull everything from context — no duplicate idle logic in dashboard
  const {
    workSeconds, breakSeconds,
    isOnBreak, isIdle,
    startBreak, resumeWork,
    todayIdleSessions, todayIdleSecs,
  } = useTimeTracking();

  const navigate = useNavigate();
  const userId: string = (user as any)?._id ?? (user as any)?.id ?? '';

  const [now, setNow] = useState(new Date());
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [dashLoading, setDashLoading] = useState(true);
  const [todayCheckIn, setTodayCheckIn] = useState('--:-- --');
  const [todayCheckOut, setTodayCheckOut] = useState('--:-- --');
  const [todayStatus, setTodayStatus] = useState('');

  const [localTasks, setLocalTasks] = useState([
    { id: 1, task: 'Review employee onboarding documents', done: false },
    { id: 2, task: 'Submit monthly attendance report', done: true },
    { id: 3, task: 'Schedule team performance reviews', done: false },
    { id: 4, task: 'Update payroll data for March', done: false },
    { id: 5, task: 'Respond to HR policy queries', done: true },
  ]);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Attendance
  const applyAttendanceRecord = (data: any) => {
    if (!data) return;
    const sessions: any[] = data.sessions ?? [];
    const firstLoginIso = sessions[0]?.loginTime ?? data.firstLogin ?? null;
    setTodayCheckIn(fmtTime(firstLoginIso));
    const lastWithLogout = [...sessions].reverse().find((s: any) => s.logoutTime);
    setTodayCheckOut(fmtTime(lastWithLogout?.logoutTime ?? data.lastLogout ?? null));
    setTodayStatus(data.status ?? '');
  };

  useEffect(() => {
    if (!userId) return;
    const todayStr = new Date().toISOString().slice(0, 10);

    const fetchAttendance = async () => {
      const attendanceId =
      localStorage.getItem('att_attendanceId')

      if (attendanceId) {
        try {
          const res = await getAttendanceByIdApi(attendanceId);
          if (res?.data) { applyAttendanceRecord(res.data); return; }
        } catch { /* fall through */ }
      }

      try {
        const records = await getAttendanceByEmpIdApi(userId);
        const todayRecord = records.find(
          (r: any) => (r.date ?? r.createdAt ?? '').slice(0, 10) === todayStr,
        );
        if (todayRecord) {
          applyAttendanceRecord(todayRecord);
          if (todayRecord._id) localStorage.setItem('att_attendanceId', todayRecord._id);
        }
      } catch { /* silently ignore */ }
    };

    fetchAttendance();
    const interval = setInterval(fetchAttendance, 60_000);
    return () => clearInterval(interval);
  }, [userId]);

  // Dashboard data
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!userId) return;
    setDashLoading(true);
    Promise.allSettled([
      fetchAnnouncementsApi(),
      fetchHolidaysApi(),
      getLeaves(),
      getProjects(),
    ]).then(([ann, hol, lv, proj]) => {
      if (ann.status === 'fulfilled') setAnnouncements(ann.value ?? []);
      if (hol.status === 'fulfilled') setHolidays(hol.value ?? []);
      if (lv.status === 'fulfilled') setLeaves(lv.value ?? []);
      if (proj.status === 'fulfilled') setProjects(proj.value ?? []);
    }).finally(() => setDashLoading(false));
  }, [userId]);

  // Derived
  const upcomingHolidays = holidays.filter((h: any) => (h.date ?? '') >= today).slice(0, 4);
  const myLeaves = leaves.filter((l: any) =>
    l.userId === userId ||
    l.empNumber === (user as any)?.empNumber ||
    l.empNumber === (user as any)?.empId,
  );
  const pendingLeaves = myLeaves.filter((l: any) => l.status === 'pending');
  const todayTasks = tasks;
  const doneTodayTasks = todayTasks.filter((t: any) => t.progress === 'Completed');

  const WORK_DAY = 8 * 3600;
  const displayCompletion = Math.min(100, Math.round((workSeconds / WORK_DAY) * 100));
  const remainingSecs = Math.max(0, WORK_DAY - workSeconds);
  const extraHoursLabel = fmtExtra(workSeconds);
  const hasExtraHours = workSeconds > WORK_DAY;

  const isAbsentOnLogin = todayStatus === 'Absent';
  const isHalfDay = todayStatus === 'Half Day';
  const isPresent = todayStatus === 'Present';
  const currentHour = now.getHours();
  const afterCron = currentHour >= 18 && now.getMinutes() >= 30;
  const showLateBadge = isAbsentOnLogin && !afterCron;

  const checkInIconBg = isAbsentOnLogin ? '#FEE2E2' : '#FEF9C3';
  const checkInIconColor = isAbsentOnLogin ? '#DC2626' : '#CA8A04';
  const checkInSub = isAbsentOnLogin ? '⚠ Marked Absent (after 9:40 AM)' : "Today's login time";

  const toggleLocalTask = (id: number) =>
    setLocalTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const doneTasks = localTasks.filter(t => t.done).length;
  const taskPct = Math.round((doneTasks / localTasks.length) * 100);
  const taskCirc = 2 * Math.PI * 15;

  // Idle summary — comes from context now (no separate fetch needed)
  const idleMinutesApi = Math.floor(todayIdleSecs / 60);
  const idleSummary = todayIdleSessions > 0
    ? `${todayIdleSessions} session${todayIdleSessions > 1 ? 's' : ''} · ${idleMinutesApi}m today`
    : 'No idle sessions today';

  return (
    <div className="space-y-5 pb-8">

      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 leading-snug">
            {greeting()}, {user?.name?.split(' ')[0] ?? 'there'}! 👋
          </h1>
          <p className="text-sm text-slate-400 font-normal mt-1">
            Here's what's happening across your workspace today.
          </p>
          <div className="flex items-center flex-wrap gap-2 mt-2">
            {user?.designation && (
              <span className="text-xs text-slate-500">{user.designation}</span>
            )}
            {(user as any)?.empId && (
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-semibold">
                {(user as any).empId}
              </span>
            )}
            {pendingLeaves.length > 0 && (
              <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100">
                {pendingLeaves.length} leave request{pendingLeaves.length > 1 ? 's' : ''} pending
              </span>
            )}
            {showLateBadge && (
              <span className="text-[11px] font-medium text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                Late arrival — marked Absent
              </span>
            )}
            {isHalfDay && (
              <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                Half Day
              </span>
            )}
            {todayStatus && (
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1
                ${isPresent ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                  : isHalfDay ? 'text-blue-700 bg-blue-50 border-blue-100'
                    : isAbsentOnLogin ? 'text-red-700 bg-red-50 border-red-100'
                      : 'text-slate-600 bg-slate-50 border-slate-100'}`}>
                {todayStatus}
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
        <div className="w-full sm:w-auto text-left sm:text-right shrink-0 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 mt-2 sm:mt-0">
          <p className="text-base font-semibold text-slate-800">
            {now.toLocaleDateString('en-US', { weekday: 'long' })}
          </p>
          <p className="text-sm text-slate-400 font-normal mt-0.5">
            {now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Donut + Metric Boxes */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-slate-700">Today</span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full
              ${isIdle ? 'bg-amber-100 text-amber-700'
                : displayCompletion >= 100 ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-blue-100 text-blue-700'}`}>
              {isIdle ? 'Idle' : displayCompletion >= 100 ? 'Complete' : 'In Progress'}
            </span>
          </div>
          <div className="relative flex items-center justify-center mb-3">
            <DonutChart percent={displayCompletion} size={120} strokeWidth={12}
              color={isIdle ? '#F59E0B' : '#0B0E92'} />
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black text-slate-800">{displayCompletion}%</span>
              <span className="text-[10px] text-slate-400 font-medium">
                {isIdle ? 'idle' : 'in office'}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 text-center mb-4">{fmt(remainingSecs)} remaining</p>
          <button
            onClick={() => isOnBreak ? resumeWork() : startBreak()}
            className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2
              ${isOnBreak
                ? 'bg-amber-50 text-amber-700 border-2 border-amber-200'
                : 'bg-gradient-to-r from-[#0B0E92] to-[#69A6F0] text-white shadow-md shadow-blue-900/20'}`}>
            <Coffee size={15} />
            {isOnBreak ? `On Break · ${fmt(breakSeconds)}` : 'Take Break'}
          </button>
        </div>

        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricBox label="Work Hours" value={fmt(workSeconds)} icon={Clock}
            iconBg="#EEF0FF" iconColor="#0B0E92"
            sub={isIdle ? '⏸ Paused (idle)' : '▶ Running'} />
          <MetricBox label="Check-In" value={todayCheckIn} icon={LogIn}
            iconBg={checkInIconBg} iconColor={checkInIconColor} sub={checkInSub} />
          <MetricBox label="Check-Out" value={todayCheckOut} icon={LogOut}
            iconBg="#E0F2FE" iconColor="#0284C7"
            sub={todayCheckOut === '--:-- --'
              ? afterCron ? 'Auto-logged out at 6:30 PM' : 'Still clocked in'
              : "Today's logout time"} />
          <MetricBox label="Extra Hours" value={extraHoursLabel} icon={TrendingUp}
            iconBg={hasExtraHours ? '#DCFCE7' : '#F1F5F9'}
            iconColor={hasExtraHours ? '#16A34A' : '#94A3B8'}
            sub={hasExtraHours ? 'Overtime logged today' : 'Earned after 8 hrs'} />
          <MetricBox label="Break Time" value={fmt(breakSeconds)} icon={Coffee}
            iconBg="#FFF7ED" iconColor="#EA580C" />

          <div className="relative">
            <IdleTimeBox />
            {todayIdleSessions > 0 && (
              <p className="absolute bottom-3 left-5 text-[10px] text-amber-500 font-medium">
                {idleSummary}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Daily Progress */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-slate-800">Daily Progress</h3>
          <div className="flex items-center gap-2">
            {isIdle && (
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
                Idle — timer paused
              </span>
            )}
            <span className="text-xs text-slate-400">8-hour target</span>
          </div>
        </div>
        <div className="mt-4 w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
          <div
            className={`h-full transition-all duration-700 rounded-l-full
              ${isIdle ? 'bg-amber-400' : 'bg-gradient-to-r from-[#0B0E92] to-[#69A6F0]'}`}
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
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { dot: isIdle ? 'bg-amber-400' : 'bg-[#0B0E92]', label: 'Working', val: fmt(workSeconds) },
            { dot: 'bg-amber-300', label: 'Break', val: fmt(breakSeconds) },
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

      {/* Today's Tasks */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0B0E92] to-[#69A6F0] flex items-center justify-center">
              <UserCheck size={14} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Today's Tasks</h3>
              <p className="text-[10px] text-slate-400">
                {doneTodayTasks.length}/{todayTasks.length} completed · {today}
              </p>
            </div>
          </div>
          <button onClick={() => navigate('/employee/tasks')}
            className="text-xs text-[#0B0E92] font-semibold flex items-center gap-1 hover:underline">
            View All <ArrowUpRight size={11} />
          </button>
        </div>
        {dashLoading ? (
          <div className="p-5 space-y-2 animate-pulse">
            {[1, 2, 3].map(n => <div key={n} className="h-9 bg-slate-100 rounded-xl" />)}
          </div>
        ) : todayTasks.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No tasks logged for today.{' '}
            <button onClick={() => navigate('/employee/projects')}
              className="text-[#0B0E92] font-semibold hover:underline">
              Go to My Projects
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {todayTasks.slice(0, 5).map((t: any) => {
              const done = t.progress === 'Completed';
              return (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                    ${done ? 'bg-gradient-to-br from-[#0B0E92] to-[#69A6F0] border-[#0B0E92]' : 'border-slate-300'}`}>
                    {done && <CheckCircle2 size={11} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${done ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}`}>
                      {t.description}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {t.startTime ? `⏰ ${t.startTime?.slice(11, 16)} – ${t.endTime?.slice(11, 16)}` : ''}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0
                    ${done ? 'bg-emerald-50 text-emerald-700'
                      : t.progress === 'In Progress' ? 'bg-blue-50 text-blue-700'
                        : 'bg-amber-50 text-amber-700'}`}>
                    {t.progress ?? 'Pending'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Daily Checklist + Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0B0E92] to-[#69A6F0] flex items-center justify-center">
                <CheckSquare size={14} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Daily Checklist</h3>
                <p className="text-[10px] text-slate-400">{doneTasks}/{localTasks.length} completed</p>
              </div>
            </div>
            <div className="relative w-10 h-10 shrink-0">
              <svg width="40" height="40" viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="20" cy="20" r="15" fill="none" stroke="#EEF0FF" strokeWidth="5" />
                <circle cx="20" cy="20" r="15" fill="none" stroke="#0B0E92" strokeWidth="5"
                  strokeDasharray={taskCirc}
                  strokeDashoffset={taskCirc * (1 - doneTasks / localTasks.length)}
                  strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-[#0B0E92]">
                {taskPct}%
              </span>
            </div>
          </div>
          <div className="px-5 pt-3 pb-1">
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#0B0E92] to-[#69A6F0] rounded-full transition-all duration-500"
                style={{ width: `${taskPct}%` }} />
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {localTasks.map(t => (
              <div key={t.id} onClick={() => toggleLocalTask(t.id)}
                className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors group">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                  ${t.done ? 'bg-gradient-to-br from-[#0B0E92] to-[#69A6F0] border-[#0B0E92]' : 'border-slate-300 group-hover:border-[#0B0E92]'}`}>
                  {t.done && <CheckCircle2 size={11} className="text-white" />}
                </div>
                <span className={`text-sm transition-all select-none
                  ${t.done ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}`}>{t.task}</span>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-slate-100">
            <button className="flex items-center gap-2 text-xs text-[#0B0E92] font-semibold hover:opacity-75 transition-opacity">
              <div className="w-5 h-5 rounded-full border-2 border-dashed border-[#0B0E92] flex items-center justify-center">
                <Plus size={10} />
              </div>
              Add new task
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                <Briefcase size={14} className="text-violet-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Projects</h3>
                <p className="text-[10px] text-slate-400">
                  {projects.filter((p: any) => p.status === 'completed').length}/{projects.length} done
                </p>
              </div>
            </div>
            <button onClick={() => navigate('/employee/projects')}
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
            <div className="divide-y divide-slate-50">
         
{projects.slice(0, 4).map((p: any) => (
  <ProjectRow key={p._id ?? p.id}
                  name={p.projectName ?? p.name ?? 'Unnamed'}
                  progress={0}
                  status={p.status ?? 'active'}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Announcements · Holidays · Recent Leaves */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0B0E92] to-[#69A6F0] flex items-center justify-center">
                <Megaphone size={14} className="text-white" />
              </div>
              <h3 className="font-bold text-slate-800">Announcements</h3>
            </div>
            <button onClick={() => navigate('/employee/announcements')}
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
                 <div key={a._id ?? a.id} className="px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-2">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-[#0B0E92] shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800 leading-snug">{a.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {a.createdAt ? formatDate(a.createdAt) : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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
               <div key={h._id ?? h.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
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

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <TrendingUp size={14} className="text-emerald-600" />
              </div>
              <h3 className="font-bold text-slate-800">Recent Leaves</h3>
            </div>
            <button onClick={() => navigate('/employee/leaves')}
              className="text-xs text-[#0B0E92] font-semibold flex items-center gap-1 hover:underline">
              View all <ChevronRight size={11} />
            </button>
          </div>
          {dashLoading ? (
            <div className="p-4 space-y-2 animate-pulse">
              {[1, 2, 3].map(n => <div key={n} className="h-10 bg-slate-100 rounded-xl" />)}
            </div>
          ) : myLeaves.length === 0 ? (
            <p className="text-center text-slate-400 py-8 text-sm">No leave requests yet</p>
          ) : (
            <div className="divide-y divide-slate-50">
             {myLeaves.slice(0, 4).map((l: any) => (
                 <div key={l._id ?? l.id}className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-sm shrink-0">🌴</div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{l.leaveType}</p>
                      <p className="text-xs text-slate-400">
                        {l.startDate ? formatDate(l.startDate) : '—'}
                      </p>
                    </div>
                  </div>
                  <Badge status={l.status} />
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}