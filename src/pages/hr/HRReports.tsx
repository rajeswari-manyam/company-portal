import { useEffect, useState, useMemo } from 'react';
import {
  Users, Calendar, FileText, DollarSign, Building2,
  Download, CheckCircle2, AlertCircle, TrendingUp,
} from 'lucide-react';
import apiClient from '../../service/apiClient';
import { getDepartments } from '../../service/departmentApi';
import { getLeaves } from '../../service/leaveApi';
import { getEmployees } from '../../service/Empolyee.service';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Employee {
  _id: string; name: string; empId?: string; empNumber?: string;
  email?: string; phone?: string; department?: string; departmentId?: string;
  designation?: string; createdAt?: string; dateOfJoining?: string;
  baseSalary?: number; salary?: number; role?: string;
}

interface Department {
  _id: string; departmentName?: string; name?: string; employeeCount?: number;
}

interface Leave {
  _id?: string; id?: string; userId?: string; employeeId?: string; status?: string;
}

interface Attendance {
  _id?: string; employeeId?: string | { _id: string };
  date?: string; status?: string; createdAt?: string;
}

interface DeptRow {
  id: string; name: string; color: string;
  employees: number; avgAttendance: string;
  pendingLeaves: number; avgSalary: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEPT_COLORS = [
  '#6366F1', '#8B5CF6', '#06B6D4', '#10B981',
  '#F59E0B', '#EF4444', '#EC4899', '#14B8A6',
];

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtINR(n: number) {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

function exportCSV(headers: string[], rows: (string | number)[][], filename: string) {
  const csv = [headers, ...rows]
    .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── Line Chart ───────────────────────────────────────────────────────────────

function LineChart({ data }: { data: { label: string; value: number }[] }) {
  if (data.length < 2) return (
    <div className="flex items-center justify-center h-32 text-slate-300 text-sm">
      Not enough data
    </div>
  );

  const W = 500, H = 130, PAD = 16;
  const vals = data.map(d => d.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals, min + 1);

  const pts = data.map((d, i) => ({
    x: PAD + (i / (data.length - 1)) * (W - PAD * 2),
    y: PAD + ((max - d.value) / (max - min)) * (H - PAD * 2),
    ...d,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H + 28}`} className="w-full" style={{ overflow: 'visible' }}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(t => (
        <line key={t}
          x1={PAD} x2={W - PAD}
          y1={PAD + t * (H - PAD * 2)}
          y2={PAD + t * (H - PAD * 2)}
          stroke="#F1F5F9" strokeWidth={1} />
      ))}

      {/* Area fill */}
      <path d={areaPath} fill="url(#lineGrad)" opacity={0.15} />

      {/* Gradient def */}
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Line */}
      <path d={linePath} fill="none" stroke="#6366F1" strokeWidth={2.5}
        strokeLinejoin="round" strokeLinecap="round" />

      {/* Points + labels */}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={5}
            fill={i === pts.length - 1 ? '#6366F1' : '#fff'}
            stroke="#6366F1" strokeWidth={2.5} />
          {p.value > 0 && (
            <text x={p.x} y={p.y - 10} textAnchor="middle"
              fontSize={10} fill="#6366F1" fontWeight="600">
              {p.value}
            </text>
          )}
          <text x={p.x} y={H + 20} textAnchor="middle"
            fontSize={10} fill="#94A3B8">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────

function BarChart({ data }: { data: { label: string; present: number; absent: number }[] }) {
  const W = 500, H = 130, PAD = 16;
  const max = Math.max(...data.map(d => d.present + d.absent), 1);
  const slotW = (W - PAD * 2) / data.length;
  const barW = Math.min(slotW * 0.35, 22);

  return (
    <svg viewBox={`0 0 ${W} ${H + 28}`} className="w-full" style={{ overflow: 'visible' }}>
      {[0, 0.25, 0.5, 0.75, 1].map(t => (
        <line key={t}
          x1={PAD} x2={W - PAD}
          y1={PAD + t * (H - PAD * 2)}
          y2={PAD + t * (H - PAD * 2)}
          stroke="#F1F5F9" strokeWidth={1} />
      ))}

      {data.map((d, i) => {
        const cx = PAD + i * slotW + slotW / 2;
        const ph = ((d.present) / max) * (H - PAD * 2);
        const ah = ((d.absent) / max) * (H - PAD * 2);
        const bH = H - PAD;

        return (
          <g key={d.label}>
            {/* Present bar */}
            <rect
              x={cx - barW - 2} y={bH - ph} width={barW} height={Math.max(ph, 2)}
              fill="#10B981" rx={3}
            />
            {/* Absent bar */}
            <rect
              x={cx + 2} y={bH - ah} width={barW} height={Math.max(ah, 2)}
              fill="#FCA5A5" rx={3}
            />
            <text x={cx} y={H + 20} textAnchor="middle" fontSize={10} fill="#94A3B8">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-100 rounded-xl ${className ?? ''}`} />;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminReports() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [empRes, deptRes, leaveRes] = await Promise.allSettled([
          getEmployees(),
          getDepartments(),
          getLeaves(),
        ]);
        if (empRes.status === 'fulfilled') setEmployees(empRes.value.users ?? []);
        if (deptRes.status === 'fulfilled') setDepartments(deptRes.value.departments ?? []);
        if (leaveRes.status === 'fulfilled') setLeaves(leaveRes.value ?? []);

        // Attendance — best-effort (endpoint may vary)
        try {
          const attRes = await apiClient.get('/getAllAttendance');
          const list = Array.isArray(attRes.data)
            ? attRes.data
            : attRes.data?.attendance ?? attRes.data?.data ?? [];
          setAttendance(list);
        } catch { /* no endpoint — charts stay empty */ }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Derived stats ──────────────────────────────────────────────────────────

  const totalPresent = useMemo(() =>
    attendance.filter(a =>
      a.status === 'Present' || a.status === 'present'
    ).length, [attendance]);

  const pendingLeaves = useMemo(() =>
    leaves.filter(l => l.status === 'pending').length, [leaves]);

  // ── Employee growth (last 6 months) ───────────────────────────────────────

  const growthData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const cutoff = new Date(d.getFullYear(), d.getMonth() + 1, 0); // end of month
      const count = employees.filter(e => {
        const joined = new Date(e.dateOfJoining ?? e.createdAt ?? '2000-01-01');
        return joined <= cutoff;
      }).length;
      return { label: MONTHS_SHORT[d.getMonth()], value: count };
    });
  }, [employees]);

  // ── Weekly attendance (Mon–Fri) ────────────────────────────────────────────

  const weeklyData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const dayMap = Object.fromEntries(days.map(d => [d, { present: 0, absent: 0 }]));

    attendance.forEach(a => {
      const date = new Date(a.date ?? a.createdAt ?? '');
      const dayIdx = date.getDay(); // 0 = Sun
      if (dayIdx >= 1 && dayIdx <= 5) {
        const key = days[dayIdx - 1];
        if (a.status === 'Present' || a.status === 'present') dayMap[key].present++;
        else dayMap[key].absent++;
      }
    });

    return days.map(d => ({ label: d, ...dayMap[d] }));
  }, [attendance]);

  // ── Department summary rows ────────────────────────────────────────────────

  const deptRows: DeptRow[] = useMemo(() =>
    departments.map((d, i) => {
      const id = d._id;
      const name = d.departmentName ?? d.name ?? '';

      const deptEmps = employees.filter(e =>
        e.department === id ||
        e.departmentId === id ||
        e.department?.toLowerCase() === name.toLowerCase()
      );

      const pendingLeavesCount = leaves.filter(l =>
        l.status === 'pending' &&
        deptEmps.some(e => e._id === l.userId || e._id === l.employeeId)
      ).length;

      const deptAtt = attendance.filter(a => {
        const empId = typeof a.employeeId === 'object'
          ? a.employeeId?._id : a.employeeId;
        return deptEmps.some(e => e._id === empId);
      });
      const presentPct = deptAtt.length > 0
        ? Math.round((deptAtt.filter(a =>
          a.status === 'Present' || a.status === 'present'
        ).length / deptAtt.length) * 100)
        : null;

      const salaryVals = deptEmps
        .map(e => Number(e.baseSalary ?? e.salary ?? 0))
        .filter(v => v > 0);
      const avgSal = salaryVals.length > 0
        ? salaryVals.reduce((a, b) => a + b, 0) / salaryVals.length
        : null;

      return {
        id,
        name,
        color: DEPT_COLORS[i % DEPT_COLORS.length],
        employees: d.employeeCount ?? deptEmps.length,
        avgAttendance: presentPct !== null ? `${presentPct}%` : '—',
        pendingLeaves: pendingLeavesCount,
        avgSalary: avgSal !== null ? fmtINR(avgSal) : '—',
      };
    }),
    [departments, employees, leaves, attendance]);

  // ── Export helpers ─────────────────────────────────────────────────────────

  function exportEmployees() {
    exportCSV(
      ['Name', 'Emp ID', 'Department', 'Designation', 'Email', 'Phone'],
      employees.map(e => [
        e.name, e.empId ?? e.empNumber ?? '—',
        e.department ?? '—', e.designation ?? '—',
        e.email ?? '—', e.phone ?? '—',
      ]),
      'employee-report.csv',
    );
  }

  function exportDepartments() {
    exportCSV(
      ['Department', 'Employees', 'Avg Attendance', 'Pending Leaves', 'Avg Salary'],
      deptRows.map(r => [r.name, r.employees, r.avgAttendance, r.pendingLeaves, r.avgSalary]),
      'department-report.csv',
    );
  }

  function exportLeaves() {
    exportCSV(
      ['Employee', 'Status', 'Leave Type', 'Start Date', 'End Date'],
      leaves.map((l: any) => [
        l.userName ?? l.empNumber ?? '—',
        l.status ?? '—', l.leaveType ?? '—',
        l.startDate ?? '—', l.endDate ?? '—',
      ]),
      'leave-report.csv',
    );
  }

  // ── Report cards config ────────────────────────────────────────────────────

  const reportCards = [
    {
      title: 'Employee Report',
      desc: 'Full employee list with details',
      icon: <Users size={20} />,
      bg: '#EEF2FF', grad: 'from-indigo-500 to-blue-400',
      onClick: exportEmployees,
    },
    {
      title: 'Attendance Report',
      desc: 'Monthly attendance summary',
      icon: <Calendar size={20} />,
      bg: '#ECFDF5', grad: 'from-emerald-500 to-teal-400',
      onClick: () => { },
    },
    {
      title: 'Leave Report',
      desc: 'Leave statistics by department',
      icon: <FileText size={20} />,
      bg: '#FFFBEB', grad: 'from-amber-500 to-orange-400',
      onClick: exportLeaves,
    },
    {
      title: 'Payroll Report',
      desc: 'Salary and deductions breakdown',
      icon: <DollarSign size={20} />,
      bg: '#F5F3FF', grad: 'from-violet-500 to-purple-400',
      onClick: () => { },
    },
    {
      title: 'Department Report',
      desc: 'Department-wise analytics',
      icon: <Building2 size={20} />,
      bg: '#ECFEFF', grad: 'from-cyan-500 to-sky-400',
      onClick: exportDepartments,
    },
  ];

  const statCards = [
    {
      label: 'Total Employees',
      value: employees.length,
      icon: <Users size={18} />,
      grad: 'from-[#0B0E92] to-[#69A6F0]',
    },
    {
      label: 'Departments',
      value: departments.length,
      icon: <Building2 size={18} />,
      grad: 'from-violet-500 to-purple-400',
    },
    {
      label: 'Present (total)',
      value: totalPresent,
      icon: <CheckCircle2 size={18} />,
      grad: 'from-emerald-500 to-teal-400',
    },
    {
      label: 'Pending Leaves',
      value: pendingLeaves,
      icon: <AlertCircle size={18} />,
      grad: 'from-amber-500 to-orange-400',
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-4 sm:p-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
        <p className="text-sm text-slate-400 mt-1">
          Generate and export business intelligence reports
        </p>
      </div>

      {/* ── Report type cards ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportCards.map(card => (
            <button
              key={card.title}
              onClick={card.onClick}
              className="flex items-center gap-4 bg-white rounded-2xl border border-slate-100
                         shadow-sm p-4 sm:p-5 text-left
                         hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]
                         transition-all duration-200 group w-full"
            >
              {/* Icon */}
              <div
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center
                           justify-content-center flex-shrink-0 p-2.5"
                style={{ background: card.bg }}
              >
                <div className={`w-full h-full rounded-lg bg-gradient-to-br ${card.grad}
                                 flex items-center justify-center text-white`}>
                  {card.icon}
                </div>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 text-sm truncate
                              group-hover:text-[#0B0E92] transition-colors">
                  {card.title}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{card.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Stat cards ── */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {statCards.map(s => (
            <div key={s.label}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm
                         p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
              <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${s.grad}
                               flex items-center justify-center flex-shrink-0`}>
                <span className="text-white">{s.icon}</span>
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-xl font-bold text-slate-800 leading-none">
                  {s.value}
                </p>
                <p className="text-xs text-slate-500 mt-1 leading-tight">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Charts ── */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">

          {/* Employee Growth */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6">
            <div className="flex items-start justify-between mb-4 gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Employee Growth Trend
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Headcount over last 6 months
                </p>
              </div>
              <button
                onClick={exportEmployees}
                className="flex items-center gap-1.5 text-xs text-slate-500 font-medium
                           px-3 py-1.5 rounded-lg border border-slate-200
                           hover:bg-slate-50 transition flex-shrink-0"
              >
                <Download size={11} /> Export
              </button>
            </div>
            <LineChart data={growthData} />
          </div>

          {/* Weekly Attendance */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6">
            <div className="flex items-start justify-between mb-4 gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Weekly Attendance
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Present vs absent this week
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 flex-shrink-0">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" />
                  Present
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-red-300 inline-block" />
                  Absent
                </span>
              </div>
            </div>
            <BarChart data={weeklyData} />
          </div>
        </div>
      )}

      {/* ── Department Summary table ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 sm:px-6 py-4
                        border-b border-slate-100 gap-3">
          <h3 className="text-sm font-semibold text-slate-800">Department Summary</h3>
          <button
            onClick={exportDepartments}
            className="flex items-center gap-1.5 text-xs text-slate-500 font-medium
                       px-3 py-1.5 rounded-lg border border-slate-200
                       hover:bg-slate-50 transition flex-shrink-0"
          >
            <Download size={11} /> Export
          </button>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : deptRows.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">
            No departments found
          </div>
        ) : (
          <>
            {/* ── Desktop table ── */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    {['Department', 'Employees', 'Avg Attendance',
                      'Pending Leaves', 'Avg Salary'].map(h => (
                        <th key={h}
                          className="px-6 py-3.5 text-left text-xs font-bold text-slate-400
                                   uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {deptRows.map(row => (
                    <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ background: row.color }} />
                          <span className="font-medium text-slate-800">{row.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{row.employees}</td>
                      <td className="px-6 py-4">
                        <span className={`font-semibold ${row.avgAttendance === '—' ? 'text-slate-400' :
                            parseInt(row.avgAttendance) >= 90 ? 'text-emerald-600' :
                              parseInt(row.avgAttendance) >= 75 ? 'text-amber-500' :
                                'text-red-500'
                          }`}>
                          {row.avgAttendance}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-semibold ${row.pendingLeaves === 0 ? 'text-slate-400' :
                            row.pendingLeaves === 1 ? 'text-amber-500' : 'text-red-500'
                          }`}>
                          {row.pendingLeaves}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {row.avgSalary}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Mobile cards ── */}
            <div className="sm:hidden divide-y divide-slate-50">
              {deptRows.map(row => (
                <div key={row.id} className="p-4 space-y-3">
                  {/* Dept name */}
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: row.color }} />
                    <span className="font-semibold text-slate-800 text-sm">{row.name}</span>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Employees', value: row.employees, color: 'text-slate-700' },
                      { label: 'Avg Salary', value: row.avgSalary, color: 'text-slate-700' },
                      {
                        label: 'Attendance',
                        value: row.avgAttendance,
                        color: row.avgAttendance === '—' ? 'text-slate-400' :
                          parseInt(row.avgAttendance) >= 90 ? 'text-emerald-600' :
                            parseInt(row.avgAttendance) >= 75 ? 'text-amber-500' :
                              'text-red-500',
                      },
                      {
                        label: 'Pending Leaves',
                        value: row.pendingLeaves,
                        color: row.pendingLeaves === 0 ? 'text-slate-400' :
                          row.pendingLeaves === 1 ? 'text-amber-500' : 'text-red-500',
                      },
                    ].map(s => (
                      <div key={s.label}
                        className="bg-slate-50 rounded-xl p-3">
                        <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}