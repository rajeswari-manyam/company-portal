import { useState, useEffect } from 'react';
import { Plus, Trash2, Gift, PlusCircle, CalendarOff, ChevronDown } from 'lucide-react';
import { useHolidays } from "../../modules/holidays/useHolidays";
import { getDepartments } from '../../service/departmentApi';
import { getDepartmentById } from '../../service/departmentApi';
import { Modal, Input, ConfirmDialog } from '../../components/ui';
import { PageHeader } from '../../components/common';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';  

const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function parseDate(dateStr: string) {
  const d = new Date(dateStr);
  return {
    day:       d.getUTCDate(),
    dayName:   DAYS[d.getUTCDay()],
    month:     d.getUTCMonth(),
    monthName: MONTHS[d.getUTCMonth()],
    year:      d.getUTCFullYear(),
  };
}

function groupByMonth(holidays: any[]) {
  const groups: Record<string, { monthName: string; month: number; year: number; items: any[] }> = {};
  holidays.forEach(h => {
    const { month, monthName, year } = parseDate(h.date);
    const key = `${year}-${String(month).padStart(2, '0')}`;
    if (!groups[key]) groups[key] = { monthName, month, year, items: [] };
    groups[key].items.push(h);
  });
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);
}

const emptyRow = () => ({ name: '', date: '' });

const DAY_COLORS: Record<string, string> = {
  Monday:    'bg-blue-50 text-blue-600 border-blue-100',
  Tuesday:   'bg-purple-50 text-purple-600 border-purple-100',
  Wednesday: 'bg-teal-50 text-teal-600 border-teal-100',
  Thursday:  'bg-amber-50 text-amber-600 border-amber-100',
  Friday:    'bg-green-50 text-green-600 border-green-100',
  Saturday:  'bg-red-50 text-red-500 border-red-100',
  Sunday:    'bg-red-50 text-red-500 border-red-100',
};

export default function AdminHolidays() {
  const { holidays, loading, createHoliday, deleteHoliday } = useHolidays();

  const [showForm,    setShowForm]    = useState(false);
  const [deleting,    setDeleting]    = useState<any>(null);
  const [rows,        setRows]        = useState([emptyRow()]);
  const [saving,      setSaving]      = useState(false);

  // ── Department filter state ──
  const [departments,   setDepartments]   = useState<any[]>([]);
  const [selectedDept,  setSelectedDept]  = useState<any>(null);   // full dept object
  const [weekOffDays,   setWeekOffDays]   = useState<string[]>([]);
  const [deptLoading,   setDeptLoading]   = useState(false);

  // Fetch department list on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await getDepartments();
        setDepartments(res.departments ?? []);
      } catch {
        toast.error('Failed to load departments');
      }
    })();
  }, []);

  // When a dept is selected, fetch its weekOffDays
  const handleDeptChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) {
      setSelectedDept(null);
      setWeekOffDays([]);
      return;
    }
    setDeptLoading(true);
    try {
      const res = await getDepartmentById(id);
      if (res.success && res.department) {
        setSelectedDept(res.department);
        const days = Array.isArray(res.department.weekOffDays)
          ? res.department.weekOffDays
          : typeof res.department.weekOffDays === 'string' && res.department.weekOffDays
            ? [res.department.weekOffDays]
            : [];
        setWeekOffDays(days);
      }
    } catch {
      toast.error('Failed to load department details');
    } finally {
      setDeptLoading(false);
    }
  };

  // ── Row helpers ──
  const updateRow = (i: number, field: 'name' | 'date', value: string) =>
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  const addRow    = () => setRows(prev => [...prev, emptyRow()]);
  const removeRow = (i: number) =>
    setRows(prev => prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i));
  const closeForm = () => { setShowForm(false); setRows([emptyRow()]); };

  const handleCreate = async () => {
    const valid = rows.filter(r => r.name.trim() && r.date);
    if (valid.length === 0) { toast.error('Add at least one holiday with name and date'); return; }
    const invalid = rows.filter(r => (r.name.trim() && !r.date) || (!r.name.trim() && r.date));
    if (invalid.length > 0) { toast.error('Each row needs both a name and a date'); return; }
    setSaving(true);
    try {
      await Promise.all(valid.map(r => createHoliday(r)));
      toast.success(`${valid.length} holiday${valid.length > 1 ? 's' : ''} added!`);
      closeForm();
    } catch {
      toast.error('Failed to add some holidays');
    } finally {
      setSaving(false);
    }
  };

  const groups = groupByMonth(holidays);

  return (
    <div className="space-y-6">

      <PageHeader
        title="Holidays"
        subtitle={`${holidays.length} holiday${holidays.length !== 1 ? 's' : ''} this year`}
        action={
          <Button
            icon={<Plus size={16} />}
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-[#0B0E92] to-[#69A6F0] text-white
                       hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
          >
            Add Holiday
          </Button>
        }
      />

      {/* ── Department filter ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <select
            onChange={handleDeptChange}
            className="appearance-none pl-4 pr-9 py-2.5 rounded-xl border border-slate-200
                       bg-white text-sm text-slate-700 font-medium
                       focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/20
                       focus:border-[#0B0E92]/40 transition cursor-pointer"
          >
            <option value="">All Departments</option>
            {departments.map((d: any) => (
              <option key={d._id} value={d._id}>{d.departmentName}</option>
            ))}
          </select>
          <ChevronDown size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {deptLoading && (
          <span className="text-xs text-slate-400">Loading department…</span>
        )}
      </div>

      {/* ── Department weekOffDays panel ── */}
      {selectedDept && weekOffDays.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
              <CalendarOff size={14} className="text-red-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700">
                {selectedDept.departmentName} — Week Off Days
              </h3>
              <p className="text-xs text-slate-400">
                Regular weekly offs configured for this department
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {weekOffDays.map(day => (
              <span key={day}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border
                  ${DAY_COLORS[day] ?? 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                {day}
              </span>
            ))}
          </div>
        </div>
      )}

      {selectedDept && weekOffDays.length === 0 && !deptLoading && (
        <div className="bg-slate-50 rounded-xl border border-slate-100 px-5 py-4">
          <p className="text-sm text-slate-400">
            No week off days configured for <strong>{selectedDept.departmentName}</strong>
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && <div className="text-center py-12 text-slate-400 text-sm">Loading…</div>}

      {/* Empty */}
      {!loading && holidays.length === 0 && (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0B0E92] to-[#69A6F0]
                          flex items-center justify-center mx-auto mb-3 opacity-20">
            <Gift size={26} className="text-white" />
          </div>
          <p className="text-slate-500 font-medium text-sm">No holidays added yet</p>
          <p className="text-slate-400 text-xs mt-1">Click "Add Holiday" to get started</p>
        </div>
      )}

      {/* Month groups */}
      {!loading && groups.map(group => (
        <div key={`${group.year}-${group.month}`}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-50">
            <div className="w-7 h-7 rounded-lg bg-[#EEF0FF] flex items-center justify-center">
              <Gift size={14} className="text-[#0B0E92]" />
            </div>
            <h3 className="text-base font-semibold text-slate-700">{group.monthName}</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {group.items.map(h => {
              const { day, dayName } = parseDate(h.date);
              const isWeekend = dayName === 'Sat' || dayName === 'Sun';
              const isWeekOff = weekOffDays.some(
                d => d.toLowerCase().startsWith(dayName.toLowerCase())
              );
              return (
                <div key={h.id}
                  className="flex items-center gap-4 px-6 py-3.5
                             hover:bg-slate-50 transition-colors group">
                  <div className={`w-12 text-center flex-shrink-0 rounded-xl py-1.5
                    ${isWeekend || isWeekOff ? 'bg-red-50' : 'bg-slate-50'}`}>
                    <p className={`text-lg font-bold leading-none
                      ${isWeekend || isWeekOff ? 'text-red-500' : 'text-slate-700'}`}>{day}</p>
                    <p className={`text-[11px] font-medium mt-0.5
                      ${isWeekend || isWeekOff ? 'text-red-400' : 'text-slate-400'}`}>{dayName}</p>
                  </div>

                  <p className="flex-1 text-sm font-medium text-slate-800">{h.name}</p>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isWeekOff && (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full
                                       bg-red-50 text-red-500">
                        Week Off
                      </span>
                    )}
                    <span className="text-xs font-medium px-3 py-1 rounded-full
                                     bg-slate-100 text-slate-500">
                      National
                    </span>
                  </div>

                  <button
                    onClick={() => setDeleting(h)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity
                               p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Add Modal */}
      {showForm && (
        <Modal title="Add Holidays" onClose={closeForm}>
          <div className="space-y-3">
            <div className="grid grid-cols-[1fr_160px_32px] gap-3 px-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Holiday Name</p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</p>
              <span />
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {rows.map((row, i) => (
                <div key={i} className="grid grid-cols-[1fr_160px_32px] gap-3 items-center">
                  <input
                    value={row.name}
                    onChange={e => updateRow(i, 'name', e.target.value)}
                    placeholder="e.g. Republic Day"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm
                               text-slate-800 placeholder:text-slate-400
                               focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/20
                               focus:border-[#0B0E92]/40 transition"
                  />
                  <input
                    type="date"
                    value={row.date}
                    onChange={e => updateRow(i, 'date', e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm
                               text-slate-800 focus:outline-none focus:ring-2
                               focus:ring-[#0B0E92]/20 focus:border-[#0B0E92]/40 transition"
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    disabled={rows.length === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg
                               text-slate-400 hover:text-red-500 hover:bg-red-50
                               disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addRow}
              className="flex items-center gap-2 text-sm text-[#0B0E92] font-medium
                         hover:opacity-75 transition mt-1"
            >
              <PlusCircle size={16} /> Add another holiday
            </button>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="outline" onClick={closeForm}>Cancel</Button>
              <Button
                onClick={handleCreate}
                loading={saving}
                className="bg-gradient-to-r from-[#0B0E92] to-[#69A6F0] text-white"
              >
                Add {rows.filter(r => r.name && r.date).length > 1
                  ? `${rows.filter(r => r.name && r.date).length} Holidays`
                  : 'Holiday'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          message={`Delete "${deleting.name}"? This cannot be undone.`}
          onConfirm={async () => { await deleteHoliday(deleting.id); setDeleting(null); }}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}