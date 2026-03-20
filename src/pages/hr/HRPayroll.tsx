import React, { useState, useCallback, useRef } from 'react';
import { usePayroll } from '../../modules/payroll/usePayroll';
import PayrollTable from '../../modules/payroll/components/PayrollTable';
import { MONTHS } from '../../constants';
import { formatCurrency } from '../../utils/helpers';
import { Plus, X, DollarSign, Users, FileText, BarChart2, ChevronDown, Loader2 } from 'lucide-react';
import { addEmployee, incrementSalary } from '../../services/payrollApi';
import { getEmployees } from "../../services/Empolyee.service";

// ── Stat Card ─────────────────────────────────────────────────────────────────
const STAT_META = [
  { key: 'total', label: 'Total Payroll', Icon: DollarSign, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500', fmt: (v: any) => formatCurrency(v) },
  { key: 'employees', label: 'Employees', Icon: Users, iconBg: 'bg-blue-50', iconColor: 'text-blue-500', fmt: (v: any) => v },
  { key: 'count', label: 'Payslips', Icon: FileText, iconBg: 'bg-violet-50', iconColor: 'text-violet-500', fmt: (v: any) => v },
  { key: 'avg', label: 'Avg Salary', Icon: BarChart2, iconBg: 'bg-amber-50', iconColor: 'text-amber-500', fmt: (v: any) => v ? formatCurrency(v) : '—' },
];

function StatCard({ label, value, Icon, iconBg, iconColor }: {
  label: string; value: any; Icon: React.ElementType;
  iconBg: string; iconColor: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
        <p className="text-3xl font-bold text-slate-900 leading-none tracking-tight">{value}</p>
      </div>
      <div className={`${iconBg} rounded-full w-11 h-11 flex items-center justify-center`}>
        <Icon size={20} className={iconColor} />
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: {
  title: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({ label, loading = false, ...props }:
  React.InputHTMLAttributes<HTMLInputElement> & { label: string; loading?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">{label}</label>
      <div className="relative">
        <input
          {...props}
          className={`w-full h-10 border rounded-xl px-3 text-sm font-normal transition-all
            placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400
            ${props.readOnly
              ? 'bg-slate-50 border-slate-100 text-slate-500 cursor-not-allowed'
              : 'bg-white border-slate-200 text-slate-800'}
            ${loading ? 'pr-9' : ''}`}
        />
        {loading && (
          <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />
        )}
      </div>
    </div>
  );
}

// ── ID Field with lookup feedback ─────────────────────────────────────────────
function IdField({ label, value, onChange, loading, found, error }: {
  label: string; value: string;
  onChange: (v: string) => void;
  loading: boolean; found: boolean; error: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">{label}</label>
      <div className="relative">
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="e.g. EMP009"
          className="w-full h-10 border border-slate-200 rounded-xl px-3 pr-9 text-sm text-slate-800 bg-white
                     placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10
                     focus:border-slate-400 transition-all font-normal"
        />
        {loading && (
          <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />
        )}
        {found && !loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-sm">✓</span>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {found && !error && <p className="text-xs text-emerald-600">Employee found — details auto-filled below</p>}
    </div>
  );
}

// ── useEmployeeLookup ─────────────────────────────────────────────────────────
function useEmployeeLookup() {
  const [loading, setLoading] = useState(false);
  const [found, setFound] = useState(false);
  const [error, setError] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lookup = useCallback((
    empId: string,
    onFound: (data: { name: string; email: string; department: string }) => void,
    onNotFound: () => void,
  ) => {
    if (timer.current) clearTimeout(timer.current);

    if (!empId.trim()) {
      setLoading(false); setFound(false); setError('');
      onNotFound();
      return;
    }

    setLoading(true); setFound(false); setError('');

    timer.current = setTimeout(async () => {
      try {
        const res = await getEmployees();
        const users = res.users ?? [];
        const match = users.find(
          u => u.empId?.toLowerCase() === empId.trim().toLowerCase()
        );
        if (match) {
          onFound({
            name: match.name ?? '',
            email: match.email ?? '',
            department: match.department ?? '',
          });
          setFound(true);
        } else {
          onNotFound();
          setError('No employee found with this ID');
        }
      } catch {
        setError('Lookup failed — please fill manually');
        onNotFound();
      } finally {
        setLoading(false);
      }
    }, 500);
  }, []);

  const reset = useCallback(() => {
    setLoading(false); setFound(false); setError('');
  }, []);

  return { lookup, reset, loading, found, error };
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function HRPayroll() {
  const { monthPayslips, month, setMonth, stats, generateAll } = usePayroll();

  const [showAdd, setShowAdd] = useState(false);
  const [showIncrement, setShowIncrement] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Add employee fields
  const [empId, setEmpId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dept, setDept] = useState('');
  const [salary, setSalary] = useState('');

  // Increment fields
  const [incId, setIncId] = useState('');
  const [incName, setIncName] = useState('');
  const [incEmail, setIncEmail] = useState('');
  const [incDept, setIncDept] = useState('');
  const [incAmt, setIncAmt] = useState('');

  const addLookup = useEmployeeLookup();
  const incLookup = useEmployeeLookup();

  // ── ID change handlers ────────────────────────────────────────────────────
  const handleEmpIdChange = (val: string) => {
    setEmpId(val);
    setName(''); setEmail(''); setDept('');
    addLookup.lookup(
      val,
      ({ name, email, department }) => { setName(name); setEmail(email); setDept(department); },
      () => { setName(''); setEmail(''); setDept(''); },
    );
  };

  const handleIncIdChange = (val: string) => {
    setIncId(val);
    setIncName(''); setIncEmail(''); setIncDept('');
    incLookup.lookup(
      val,
      ({ name, email, department }) => { setIncName(name); setIncEmail(email); setIncDept(department); },
      () => { setIncName(''); setIncEmail(''); setIncDept(''); },
    );
  };

  // ── Reset ─────────────────────────────────────────────────────────────────
  const resetAdd = () => {
    setEmpId(''); setName(''); setEmail(''); setDept(''); setSalary('');
    addLookup.reset();
  };
  const resetInc = () => {
    setIncId(''); setIncName(''); setIncEmail(''); setIncDept(''); setIncAmt('');
    incLookup.reset();
  };

  // ── Submit handlers ───────────────────────────────────────────────────────
  const handleAddEmployee = async () => {
    if (!empId || !name || !email || !dept || !salary) {
      return alert('Please fill all fields');
    }
    setSubmitting(true);
    try {
      await addEmployee({ employeeId: empId, name, email, department: dept, baseSalary: Number(salary) });
      resetAdd(); setShowAdd(false); await generateAll();
    } catch {
      alert('Failed to add employee. Check console for details.');
    } finally { setSubmitting(false); }
  };

  const handleIncrement = async () => {
    if (!incId || !incAmt) return alert('Please enter Employee ID and Increment Amount');
    setSubmitting(true);
    try {
      await incrementSalary([{ employeeId: incId, increment: Number(incAmt) }]);
      resetInc(); setShowIncrement(false); await generateAll();
    } catch {
      alert('Failed to apply increment. Check console for details.');
    } finally { setSubmitting(false); }
  };

  return (
    <div
      className="space-y-6 pb-8"
      style={{ fontFamily: "'DM Sans', 'Plus Jakarta Sans', 'Segoe UI', sans-serif" }}
    >
      {/* ── Page heading ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[1.75rem] font-bold text-slate-900 tracking-tight leading-tight">
            Payroll
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-normal">Generate and manage employee payroll</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <select
              value={month}
              onChange={e => setMonth(e.target.value as typeof MONTHS[number])}
              className="h-9 pl-3 pr-8 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white
                         focus:outline-none focus:ring-2 focus:ring-slate-900/10 appearance-none cursor-pointer font-medium"
            >
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <button onClick={generateAll}
            className="h-9 px-4 flex items-center gap-2 rounded-xl bg-slate-900 text-white text-sm font-semibold
                       hover:bg-slate-800 active:scale-[0.98] transition-all shadow-sm">
            <Plus size={15} /> Generate All
          </button>

          <button onClick={() => { resetAdd(); setShowAdd(true); }}
            className="h-9 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold
                       hover:bg-slate-50 active:scale-[0.98] transition-all">
            Add Employee
          </button>

          <button onClick={() => { resetInc(); setShowIncrement(true); }}
            className="h-9 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold
                       hover:bg-slate-50 active:scale-[0.98] transition-all">
            Increment
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {STAT_META.map(({ key, label, Icon, iconBg, iconColor, fmt }) => (
          <StatCard key={key} label={label} value={fmt((stats as any)[key])}
            Icon={Icon} iconBg={iconBg} iconColor={iconColor} />
        ))}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Payslips</h2>
          <p className="text-xs text-slate-400 mt-0.5 font-normal">{month} payroll summary</p>
        </div>
        <PayrollTable payslips={monthPayslips} showEmployee />
      </div>

      {/* ════════════════════════════════════════════════
          Add Employee Modal
      ════════════════════════════════════════════════ */}
      {showAdd && (
        <Modal title="Add Employee" onClose={() => { setShowAdd(false); resetAdd(); }}>
          <div className="space-y-3">
            <IdField
              label="Employee ID"
              value={empId}
              onChange={handleEmpIdChange}
              loading={addLookup.loading}
              found={addLookup.found}
              error={addLookup.error}
            />

            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Full Name"
                placeholder={addLookup.loading ? 'Looking up…' : 'Auto-filled'}
                value={name}
                readOnly={addLookup.found}
                onChange={e => setName(e.target.value)}
                loading={addLookup.loading}
              />
              <Field
                label="Department"
                placeholder={addLookup.loading ? 'Looking up…' : 'Auto-filled'}
                value={dept}
                readOnly={addLookup.found}
                onChange={e => setDept(e.target.value)}
                loading={addLookup.loading}
              />
            </div>

            <Field
              label="Email"
              placeholder={addLookup.loading ? 'Looking up…' : 'Auto-filled'}
              value={email}
              readOnly={addLookup.found}
              onChange={e => setEmail(e.target.value)}
              type="email"
              loading={addLookup.loading}
            />

            <Field
              label="Base Salary"
              placeholder="e.g. 450000"
              value={salary}
              onChange={e => setSalary(e.target.value)}
              type="number"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={() => { setShowAdd(false); resetAdd(); }}
              className="flex-1 h-10 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button onClick={handleAddEmployee} disabled={submitting}
              className="flex-1 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold
                         transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {submitting ? 'Adding…' : 'Add Employee'}
            </button>
          </div>
        </Modal>
      )}

      {/* ════════════════════════════════════════════════
          Increment Salary Modal
      ════════════════════════════════════════════════ */}
      {showIncrement && (
        <Modal title="Increment Salary" onClose={() => { setShowIncrement(false); resetInc(); }}>
          <div className="space-y-3">
            <IdField
              label="Employee ID"
              value={incId}
              onChange={handleIncIdChange}
              loading={incLookup.loading}
              found={incLookup.found}
              error={incLookup.error}
            />

            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Name"
                placeholder={incLookup.loading ? 'Looking up…' : 'Auto-filled'}
                value={incName}
                readOnly
                loading={incLookup.loading}
              />
              <Field
                label="Department"
                placeholder={incLookup.loading ? 'Looking up…' : 'Auto-filled'}
                value={incDept}
                readOnly
                loading={incLookup.loading}
              />
            </div>

            <Field
              label="Email"
              placeholder={incLookup.loading ? 'Looking up…' : 'Auto-filled'}
              value={incEmail}
              readOnly
              type="email"
              loading={incLookup.loading}
            />

            <Field
              label="Increment Amount"
              placeholder="e.g. 5000"
              value={incAmt}
              onChange={e => setIncAmt(e.target.value)}
              type="number"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={() => { setShowIncrement(false); resetInc(); }}
              className="flex-1 h-10 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button onClick={handleIncrement} disabled={submitting}
              className="flex-1 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold
                         transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {submitting ? 'Applying…' : 'Apply Increment'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}