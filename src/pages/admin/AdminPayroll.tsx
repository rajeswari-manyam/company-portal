import React, { useState, useEffect, useCallback } from 'react';
import {
  getAllPayslips,
  addEmployee,
  incrementSalary,
  getPayslipsByEmployee,
  type Payslip,
} from '../../service/payrollApi';

import { getEmployees } from '../../service/Empolyee.service';
import {
  UserPlus, TrendingUp, X, Loader2,
  CheckCircle2, AlertCircle, Calendar,
  IndianRupee, RefreshCw, FileText,
  ChevronDown, ChevronUp, Search,
} from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

// ✅ FIX: Updated regex to match actual employee ID format used in the system.
// Accepts: MCTS0001, MCT0001, MCTS00001 — i.e. "MCT" + optional "S" + 4-5 digits.
// Change this one line if your format ever changes.
const isValidEmpId = (id: string) => /^MCTS?\d{4,5}$/i.test(id.trim());

// ── Helpers ───────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  { bg: '#e0e7ff', text: '#4338ca' },
  { bg: '#fce7f3', text: '#be185d' },
  { bg: '#d1fae5', text: '#065f46' },
  { bg: '#fef3c7', text: '#92400e' },
  { bg: '#ede9fe', text: '#6d28d9' },
  { bg: '#ffedd5', text: '#9a3412' },
  { bg: '#dbeafe', text: '#1e40af' },
  { bg: '#fce7e7', text: '#991b1b' },
];

function getInitials(name: string) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getColor(name: string) {
  const code  = name?.charCodeAt(0);
  const index = !code || isNaN(code) ? 0 : code % AVATAR_COLORS.length;
  return AVATAR_COLORS[index] ?? AVATAR_COLORS[0];
}

// ── Modal Wrapper ─────────────────────────────────────────────────────────────
function Modal({
  title, icon: Icon, onClose, children,
}: {
  title: string;
  icon: React.ElementType;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center">
              <Icon size={16} className="text-white" />
            </div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400
                       hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ── Input Field ───────────────────────────────────────────────────────────────
function Field({
  label, placeholder, value, onChange, type = 'text',
}: {
  label: string; placeholder: string; value: string;
  onChange: (v: string) => void; type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 px-3 rounded-xl border border-slate-200 text-sm text-slate-800 bg-slate-50
                   focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400
                   placeholder:text-slate-400 transition"
      />
    </div>
  );
}

function EmpIdField({
  label, value, onChange, resolveError,
}: {
  label: string; value: string;
  onChange: (v: string) => void; resolveError: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="MCTS0001"
        className="h-10 px-3 rounded-xl border border-slate-200 text-sm text-slate-800 bg-slate-50
                   focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400
                   placeholder:text-slate-400 transition"
      />
      {/* Show format hint below the field */}
      <p className="text-[11px] text-slate-400">Format: MCTS0001</p>
      {resolveError && <p className="text-xs text-rose-500">{resolveError}</p>}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, color,
}: {
  label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Payslip Table Row ─────────────────────────────────────────────────────────
function PayslipRow({ p }: { p: Payslip }) {
  const hasEmployee = !!p.employee?.name && p.employee.name !== 'Unknown';
  const color       = getColor(p.employee?.name ?? p.id ?? '');

  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">

      {/* Employee name + email */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: color.bg, color: color.text }}
          >
            {hasEmployee ? getInitials(p.employee.name!) : <FileText size={13} />}
          </div>
          <div>
            {hasEmployee ? (
              <>
                <p className="text-sm font-semibold text-slate-800">{p.employee.name}</p>
                <p className="text-xs text-slate-400">{p.employee.email}</p>
              </>
            ) : (
              <p className="text-sm text-slate-400 italic">No employee info</p>
            )}
          </div>
        </div>
      </td>

      {/* MCT#### id */}
      <td className="px-5 py-3.5">
        <span className="text-xs font-mono text-slate-500">
          {p.employee?.employeeId || '—'}
        </span>
      </td>

      {/* Period */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-1.5">
          <Calendar size={13} className="text-slate-400" />
          <span className="text-sm text-slate-700 font-medium">{p.month} {p.year}</span>
        </div>
      </td>

      {/* Amount credited */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-1">
          <IndianRupee size={13} className="text-emerald-600" />
          <span className="text-sm font-bold text-emerald-700">
            {formatCurrency(p.amountCredited)}
          </span>
        </div>
      </td>

      {/* Base salary */}
      <td className="px-5 py-3.5">
        {p.employee?.baseSalary ? (
          <span className="text-xs text-slate-500">{formatCurrency(p.employee.baseSalary)}</span>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )}
      </td>

      {/* Short payslip _id */}
      <td className="px-5 py-3.5">
        <span className="text-xs font-mono text-slate-300">
          {p.id ? p.id.slice(-8) : '—'}
        </span>
      </td>
    </tr>
  );
}

// ── Skeleton Row ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-slate-50">
      {[160, 80, 100, 100, 80, 80].map((w, i) => (
        <td key={i} className="px-5 py-3.5">
          <div className="h-3 bg-slate-100 rounded animate-pulse" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

// ── View Employee Payslips Modal ──────────────────────────────────────────────
function EmployeePayslipsModal({
  empId, empName, onClose,
}: {
  empId: string; empName: string; onClose: () => void;
}) {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const color = getColor(empName);

  useEffect(() => {
    setLoading(true);
    setError('');
    getPayslipsByEmployee(empId)
      .then(data => setPayslips(data))
      .catch(err  => setError(err?.response?.data?.message ?? err?.message ?? 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, [empId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold"
              style={{ background: color.bg, color: color.text }}
            >
              {getInitials(empName)}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{empName}</h2>
              <p className="text-xs font-mono text-slate-400">{empId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center
              text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-2">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
              <Loader2 size={16} className="animate-spin" /> Loading payslips…
            </div>
          )}
          {error && !loading && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
              <AlertCircle size={14} className="text-rose-500 shrink-0" />
              <p className="text-sm text-rose-600">{error}</p>
            </div>
          )}
          {!loading && !error && payslips.length === 0 && (
            <div className="text-center py-10">
              <div className="text-3xl mb-2">📄</div>
              <p className="text-sm text-slate-500">No payslips found</p>
            </div>
          )}
          {!loading && !error && payslips.map((p, i) => (
            <div
              key={p.id ?? i}
              className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-100
                         bg-slate-50 hover:bg-white hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
                  <Calendar size={15} className="text-violet-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{p.month} {p.year}</p>
                  <p className="text-xs text-slate-400 font-mono">{p.id ? p.id.slice(-8) : '—'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-emerald-600">
                  {formatCurrency(p.amountCredited)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminPayroll() {

  const [payslips,      setPayslips]      = useState<Payslip[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [fetchError,    setFetchError]    = useState('');
  const [allEmployees,  setAllEmployees]  = useState<any[]>([]);

  const [search,          setSearch]          = useState('');
  const [sortField,       setSortField]       = useState<'month' | 'amountCredited'>('amountCredited');
  const [sortDir,         setSortDir]         = useState<'asc' | 'desc'>('desc');
  const [viewPayslipsFor, setViewPayslipsFor] = useState<{ empId: string; name: string } | null>(null);

  const [showAdd,       setShowAdd]       = useState(false);
  const [showIncrement, setShowIncrement] = useState(false);

  const [empId,           setEmpId]           = useState('');
  const [salary,          setSalary]          = useState('');
  const [empIdResolveErr, setEmpIdResolveErr] = useState('');
  const [incId,           setIncId]           = useState('');
  const [incAmt,          setIncAmt]          = useState('');
  const [incIdResolveErr, setIncIdResolveErr] = useState('');
  const [msg,             setMsg]             = useState('');
  const [formError,       setFormError]       = useState('');
  const [submitting,      setSubmitting]      = useState(false);

  // ── Fetch ──
  const fetchPayslips = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const data = await getAllPayslips();
      setPayslips(data);
    } catch (err: any) {
      setFetchError(err?.response?.data?.message ?? err?.message ?? 'Failed to load payslips');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPayslips(); }, [fetchPayslips]);

  useEffect(() => {
    getEmployees()
      .then(res => setAllEmployees((res as any).users || []))
      .catch(() => {});
  }, []);

  // Resolve MCTS0001 → MongoDB _id for API calls
  const resolveMongoId = (empIdInput: string): string | null => {
    const needle = empIdInput.trim().toLowerCase();
    const match = allEmployees.find(
      e => (e.empId ?? e.employeeId ?? '').toLowerCase() === needle
    );
    return match?._id ?? null;
  };

  // ── Derived stats ──
  const totalPaid = payslips.reduce((s, p) => s + p.amountCredited, 0);
  const withEmployee = payslips.filter(p => !!p.employee?.name && p.employee.name !== 'Unknown');
  const uniqueEmployees = new Set(
    withEmployee.map(p => p.employee.employeeId).filter(Boolean)
  ).size;

  // ── Filtered + sorted ──
  const q = search.toLowerCase();
  const filtered = payslips
    .filter(p => {
      if (!q) return true;
      return (
        p.employee?.name?.toLowerCase().includes(q)       ||
        p.employee?.email?.toLowerCase().includes(q)      ||
        p.employee?.employeeId?.toLowerCase().includes(q) ||
        p.month?.toLowerCase().includes(q)                ||
        String(p.year).includes(q)
      );
    })
    .sort((a, b) => {
      let diff = 0;
      if (sortField === 'amountCredited') diff = a.amountCredited - b.amountCredited;
      if (sortField === 'month')
        diff = `${a.year}${a.month}` > `${b.year}${b.month}` ? 1 : -1;
      return sortDir === 'asc' ? diff : -diff;
    });

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  // ── Add employee ──
  const handleAdd = async () => {
    setFormError(''); setMsg(''); setEmpIdResolveErr('');
    if (!isValidEmpId(empId)) {
      setFormError('Invalid Employee ID format (e.g. MCTS0001)');
      return;
    }
    if (!salary || Number(salary) <= 0) return setFormError('Enter a valid salary amount');

    const mongoId = resolveMongoId(empId);
    if (!mongoId) { setEmpIdResolveErr(`Employee "${empId}" not found in the system.`); return; }

    setSubmitting(true);
    try {
      const res = await addEmployee(mongoId, Number(salary));
      const backendMsg: string = res.message ?? '';
      const isAlready = ['already', 'exists', 'duplicate'].some(
        k => backendMsg.toLowerCase().includes(k)
      );
      if (isAlready) { setFormError(backendMsg); return; }
      setMsg(res.message || 'Employee added to payroll successfully');
      await fetchPayslips();
      setEmpId(''); setSalary('');
    } catch (err: any) {
      setFormError(err?.response?.data?.message ?? err?.message ?? 'Failed to add employee');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Increment ──
  const handleIncrement = async () => {
    setFormError(''); setMsg(''); setIncIdResolveErr('');
    if (!isValidEmpId(incId)) {
      setFormError('Invalid Employee ID format (e.g. MCTS0001)');
      return;
    }
    if (!incAmt || Number(incAmt) <= 0) return setFormError('Enter a valid increment amount');

    const mongoId = resolveMongoId(incId);
    if (!mongoId) { setIncIdResolveErr(`Employee "${incId}" not found in the system.`); return; }

    setSubmitting(true);
    try {
      const res = await incrementSalary(mongoId, Number(incAmt));
      setMsg(res.message || 'Increment applied successfully');
      await fetchPayslips();
      setIncId(''); setIncAmt('');
    } catch (err: any) {
      setFormError(err?.response?.data?.message ?? err?.message ?? 'Failed to apply increment');
    } finally {
      setSubmitting(false);
    }
  };

  const closeAdd = () => {
    setShowAdd(false); setFormError(''); setMsg('');
    setEmpId(''); setSalary(''); setEmpIdResolveErr('');
  };
  const closeInc = () => {
    setShowIncrement(false); setFormError(''); setMsg('');
    setIncId(''); setIncAmt(''); setIncIdResolveErr('');
  };

  const SortIcon = ({ field }: { field: typeof sortField }) =>
    sortField === field
      ? sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
      : <ChevronDown size={12} className="opacity-30" />;

  return (
    <div
      className="space-y-6 pb-8"
      style={{ fontFamily: "'DM Sans','Plus Jakarta Sans','Segoe UI',sans-serif" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[1.75rem] font-bold text-slate-900 tracking-tight leading-tight">
            Payroll Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            All payslips generated across the organisation
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => { setShowAdd(true); setFormError(''); setMsg(''); }}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-slate-900 text-white text-sm
                       font-semibold hover:bg-slate-700 transition-colors shadow-sm"
          >
            <UserPlus size={15} /> Add Employee
          </button>
          <button
            onClick={() => { setShowIncrement(true); setFormError(''); setMsg(''); }}
            className="flex items-center gap-2 h-9 px-4 rounded-xl border border-slate-200 bg-white
                       text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <TrendingUp size={15} /> Increment
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Payslips"      value={payslips.length}           color="text-slate-900"   />
        <StatCard label="Total Disbursed"     value={formatCurrency(totalPaid)}  color="text-emerald-700" />
        <StatCard
          label="With Employee Info"
          value={withEmployee.length}
          sub={`${payslips.length - withEmployee.length} missing`}
          color="text-violet-700"
        />
        <StatCard label="Unique Employees" value={uniqueEmployees} color="text-blue-700" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 h-9 border border-slate-200 w-64">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, email, ID, month…"
              className="bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 w-full"
            />
          </div>
          <div className="flex items-center gap-3">
            {filtered.length > 0 && (
              <span className="text-xs text-slate-400 font-semibold">
                {filtered.length} payslip{filtered.length !== 1 ? 's' : ''}
              </span>
            )}
            <button
              onClick={fetchPayslips}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600
                         transition-colors disabled:opacity-50"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {fetchError && !loading && (
          <div className="flex items-center gap-2 bg-rose-50 border-b border-rose-100 px-5 py-3">
            <AlertCircle size={14} className="text-rose-500 shrink-0" />
            <p className="text-sm text-rose-600">{fetchError}</p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Employee</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Emp ID</th>
                <th
                  className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide
                             cursor-pointer hover:text-slate-600 transition-colors select-none"
                  onClick={() => toggleSort('month')}
                >
                  <span className="flex items-center gap-1">Period <SortIcon field="month" /></span>
                </th>
                <th
                  className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide
                             cursor-pointer hover:text-slate-600 transition-colors select-none"
                  onClick={() => toggleSort('amountCredited')}
                >
                  <span className="flex items-center gap-1">Amount <SortIcon field="amountCredited" /></span>
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Base Salary</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Payslip ID</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : filtered.length === 0
                ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="text-center py-16">
                        <div className="text-3xl mb-2">📋</div>
                        <p className="text-sm text-slate-400 font-semibold">
                          {search ? 'No payslips match your search' : 'No payslips found'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )
                : filtered.map((p, i) => <PayslipRow key={p.id ?? i} p={p} />)
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAdd && (
        <Modal title="Add Employee to Payroll" icon={UserPlus} onClose={closeAdd}>
          <div className="space-y-4">
            <EmpIdField
              label="Employee ID" value={empId}
              onChange={v => { setEmpId(v); setEmpIdResolveErr(''); setFormError(''); }}
              resolveError={empIdResolveErr}
            />
            <Field
              label="Base Salary (₹)" placeholder="e.g. 50000"
              value={salary} onChange={setSalary} type="number"
            />
            {formError && (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                <AlertCircle size={14} className="text-rose-500 shrink-0" />
                <p className="text-sm text-rose-600">{formError}</p>
              </div>
            )}
            {msg && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                <p className="text-sm text-emerald-600">{msg}</p>
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <button
                onClick={handleAdd} disabled={submitting}
                className="flex-1 h-10 rounded-xl bg-slate-900 text-white text-sm font-semibold
                           hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-wait
                           flex items-center justify-center gap-2"
              >
                {submitting ? <><Loader2 size={14} className="animate-spin" /> Adding…</> : 'Add to Payroll'}
              </button>
              <button
                onClick={closeAdd}
                className="h-10 px-4 rounded-xl border border-slate-200 text-slate-600 text-sm
                           font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Increment Modal */}
      {showIncrement && (
        <Modal title="Increment Salary" icon={TrendingUp} onClose={closeInc}>
          <div className="space-y-4">
            <EmpIdField
              label="Employee ID" value={incId}
              onChange={v => { setIncId(v); setIncIdResolveErr(''); setFormError(''); }}
              resolveError={incIdResolveErr}
            />
            <Field
              label="Increment Amount (₹)" placeholder="e.g. 5000"
              value={incAmt} onChange={setIncAmt} type="number"
            />
            {formError && (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                <AlertCircle size={14} className="text-rose-500 shrink-0" />
                <p className="text-sm text-rose-600">{formError}</p>
              </div>
            )}
            {msg && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                <p className="text-sm text-emerald-600">{msg}</p>
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <button
                onClick={handleIncrement} disabled={submitting}
                className="flex-1 h-10 rounded-xl bg-slate-900 text-white text-sm font-semibold
                           hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-wait
                           flex items-center justify-center gap-2"
              >
                {submitting ? <><Loader2 size={14} className="animate-spin" /> Applying…</> : 'Apply Increment'}
              </button>
              <button
                onClick={closeInc}
                className="h-10 px-4 rounded-xl border border-slate-200 text-slate-600 text-sm
                           font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* View Employee Payslips Modal */}
      {viewPayslipsFor && (
        <EmployeePayslipsModal
          empId={viewPayslipsFor.empId}
          empName={viewPayslipsFor.name}
          onClose={() => setViewPayslipsFor(null)}
        />
      )}
    </div>
  );
}