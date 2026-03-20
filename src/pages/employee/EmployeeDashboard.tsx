import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTimeTracking } from '../../context/TimeTrackingContext';
import { Badge } from '../../components/ui';
import { formatDate } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';
import {
  Clock, Coffee, Target, CheckCircle2, Sun, BarChart2,
  ChevronRight, Megaphone, Calendar, Briefcase,
  CheckSquare, ArrowUpRight, TrendingUp, Plus, UserCheck,
} from 'lucide-react';

// ── Real API imports ───────────────────────────────────────────────────────────
import { getAnnouncements as fetchAnnouncementsApi } from '../../services/announcementApi';
import { getHolidays as fetchHolidaysApi } from '../../services/holidayApi';
import { getLeaves } from '../../services/leaveApi';
import { getProjectsByEmployee } from '../../services/projectApi';
import { getTasksByEmployee } from '../../services/taskApi';

// ── Helpers ────────────────────────────────────────────────────────────────────
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

// ── Donut Chart ────────────────────────────────────────────────────────────────
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
function MetricBox({ label, value, icon: Icon, iconBg, iconColor }: {
  label: string; value: string; icon: any; iconBg: string; iconColor: string;
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
    </div>
  );
}

// ── Task Item ──────────────────────────────────────────────────────────────────
function TaskItem({ task, done, onToggle }: { task: string; done: boolean; onToggle: () => void }) {
  return (
    <div onClick={onToggle}
      className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors group">
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
        ${done ? 'bg-gradient-to-br from-[#0B0E92] to-[#69A6F0] border-[#0B0E92]' : 'border-slate-300 group-hover:border-[#0B0E92]'}`}>
        {done && <CheckCircle2 size={11} className="text-white" />}
      </div>
      <span className={`text-sm transition-all select-none
        ${done ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}`}>{task}</span>
    </div>
  );
}

// ── Project Row ────────────────────────────────────────────────────────────────
function ProjectRow({ name, progress, status }: {
  name: string; progress: number; status: 'active' | 'completed' | 'inactive';
}) {
  const pct = Math.min(Math.max(progress, 0), 100);
  const isComplete = status === 'completed' || pct === 100;
  const grad = isComplete ? 'from-emerald-400 to-teal-400' : 'from-[#0B0E92] to-[#69A6F0]';
  const badge = isComplete ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-[#0B0E92]';
  const label = isComplete ? '✓ Done' : '✓ Active';
  return (
    <div className="px-5 py-4 hover:bg-slate-50 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-slate-800 truncate flex-1 mr-2">{name}</p>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${badge}`}>{label}</span>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-1">
        <div className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${grad}`}
          style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] text-slate-400 font-medium">{pct}% complete</p>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function EmployeeDashboard() {
  const { user } = useAuth();
  const { workSeconds, completionPercent } = useTimeTracking();
  const navigate = useNavigate();

  const [now, setNow] = useState(new Date());
  const [breakSeconds, setBreak] = useState(0);
  const [onBreak, setOnBreak] = useState(false);

  // ── Real API state ──────────────────────────────────────────────────────────
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [dashLoading, setDashLoading] = useState(true);

  // ── Local task checklist (dashboard only) ───────────────────────────────────
  const [localTasks, setLocalTasks] = useState([
    { id: 1, task: 'Review employee onboarding documents', done: false },
    { id: 2, task: 'Submit monthly attendance report', done: true },
    { id: 3, task: 'Schedule team performance reviews', done: false },
    { id: 4, task: 'Update payroll data for March', done: false },
    { id: 5, task: 'Respond to HR policy queries', done: true },
  ]);

  // ── Clock tick ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Break timer ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!onBreak) return;
    const t = setInterval(() => setBreak(b => b + 1), 1000);
    return () => clearInterval(t);
  }, [onBreak]);

  // ── Fetch all dashboard data ─────────────────────────────────────────────────
  useEffect(() => {
    const userId = (user as any)?._id ?? (user as any)?.id ?? '';
    const empId = (user as any)?.empId ?? '';

    if (!userId) return;
    setDashLoading(true);

    Promise.allSettled([
      fetchAnnouncementsApi(),
      fetchHolidaysApi(),
      getLeaves(),
      empId ? getProjectsByEmployee(userId) : Promise.resolve([]),
      empId ? getTasksByEmployee(userId) : Promise.resolve([]),
    ]).then(([ann, hol, lv, proj, tsk]) => {
      if (ann.status === 'fulfilled') setAnnouncements(ann.value ?? []);
      if (hol.status === 'fulfilled') setHolidays(hol.value ?? []);
      if (lv.status === 'fulfilled') setLeaves(lv.value ?? []);
      if (proj.status === 'fulfilled') setProjects(proj.value ?? []);
      if (tsk.status === 'fulfilled') setTasks(tsk.value ?? []);
    }).finally(() => setDashLoading(false));
  }, [(user as any)?._id, (user as any)?.empId]);

  // ── Derived values ──────────────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);

  // Filter upcoming holidays
  const upcomingHolidays = holidays
    .filter((h: any) => (h.date ?? '') >= today)
    .slice(0, 4);

  // My leaves — filter by employee
  const myLeaves = leaves.filter(
    (l: any) =>
      l.employeeId === ((user as any)?._id ?? (user as any)?.id) ||
      l.empNumber === (user as any)?.empId,
  );
  const pendingLeaves = myLeaves.filter((l: any) => l.status === 'pending');

  // Today's tasks
  const todayTasks = tasks.filter(t => t.day === today);
  const doneTodayTasks = todayTasks.filter(t => t.progress === 'Completed');

  const WORK_DAY = 8 * 3600;
  const remainingSecs = Math.max(0, WORK_DAY - workSeconds);

  const toggleLocalTask = (id: number) =>
    setLocalTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const doneTasks = localTasks.filter(t => t.done).length;
  const taskPct = Math.round((doneTasks / localTasks.length) * 100);
  const taskCirc = 2 * Math.PI * 15;

  const DOT_COLOR: Record<string, string> = {
    present: '#22C55E', late: '#F59E0B', absent: '#EF4444', 'work-from-home': '#3B82F6',
  };
  const PILL_CLS: Record<string, string> = {
    present: 'bg-emerald-50 text-emerald-700',
    late: 'bg-amber-50 text-amber-700',
    absent: 'bg-red-50 text-red-600',
    'work-from-home': 'bg-blue-50 text-blue-700',
  };

  return (
    <div className="space-y-5 pb-8">

      {/* ── Welcome Banner ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5 flex items-center justify-between gap-4">
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
            {user?.designation && user?.department && !/^[a-f0-9]{24}$/i.test(user.department) && (
              <span className="text-slate-300 text-xs">·</span>
            )}
            {user?.department && !/^[a-f0-9]{24}$/i.test(user.department) && (
              <span className="text-xs text-slate-500">{user.department}</span>
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

      {/* ── Today Donut + 6 Metric Boxes ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-slate-700">Today</span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full
              ${completionPercent >= 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {completionPercent >= 100 ? 'Complete' : 'In Progress'}
            </span>
          </div>
          <div className="relative flex items-center justify-center mb-3">
            <DonutChart percent={completionPercent} size={120} strokeWidth={12} color="#0B0E92" />
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black text-slate-800">{completionPercent}%</span>
              <span className="text-[10px] text-slate-400 font-medium">in office</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 text-center mb-4">{fmt(remainingSecs)} remaining</p>
          <button onClick={() => setOnBreak(b => !b)}
            className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2
              ${onBreak
                ? 'bg-amber-50 text-amber-700 border-2 border-amber-200'
                : 'bg-gradient-to-r from-[#0B0E92] to-[#69A6F0] text-white shadow-md shadow-blue-900/20'}`}>
            <Coffee size={15} />
            {onBreak ? `On Break · ${fmt(breakSeconds)}` : 'Take Break'}
          </button>
        </div>
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-4">
          <MetricBox label="Average Hours" value="7h 17m" icon={Clock} iconBg="#EEF0FF" iconColor="#0B0E92" />
          <MetricBox label="Avg Check-In" value="09:15 AM" icon={Sun} iconBg="#FEF9C3" iconColor="#CA8A04" />
          <MetricBox label="Avg Check-Out" value="06:10 PM" icon={Target} iconBg="#E0F2FE" iconColor="#0284C7" />
          <MetricBox label="On-Time Arrival" value="94.5%" icon={CheckCircle2} iconBg="#DCFCE7" iconColor="#16A34A" />
          <MetricBox label="Break Time" value={fmt(breakSeconds)} icon={Coffee} iconBg="#FFF7ED" iconColor="#EA580C" />
          <MetricBox label="Completion" value={`${completionPercent}%`} icon={BarChart2} iconBg="#F3E8FF" iconColor="#7C3AED" />
        </div>
      </div>

      {/* ── Daily Progress ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-slate-800">Daily Progress</h3>
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

      {/* ── Today's Tasks (from real task API) ──────────────────────────────── */}
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
                    <p className="text-[10px] text-slate-400">⏰ {t.startTime?.slice(11, 16)} – {t.endTime?.slice(11, 16)}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0
                    ${done ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {t.progress ?? 'Pending'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Daily Tasks checklist + My Projects ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Checklist */}
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
              <TaskItem key={t.id} task={t.task} done={t.done} onToggle={() => toggleLocalTask(t.id)} />
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

        {/* My Projects — real data */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                <Briefcase size={14} className="text-violet-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">My Projects</h3>
                <p className="text-[10px] text-slate-400">
                  {projects.filter(p => p.status === 'completed').length}/{projects.length} done
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
            <p className="text-center text-slate-400 py-8 text-sm">No projects assigned yet.</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {projects.slice(0, 4).map(p => (
                <ProjectRow key={p.id} name={p.projectName} progress={0} status={p.status} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Announcements · Holidays · Recent Leaves ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Announcements */}
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
                <div key={a.id} className="px-5 py-3.5 hover:bg-slate-50 transition-colors">
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
                <div key={h.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
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

        {/* Recent Leaves — filtered to this employee */}
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
                <div key={l.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
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