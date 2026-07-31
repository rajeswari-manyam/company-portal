// src/pages/employee/MyHolidays.tsx

import { useEffect, useState } from 'react';
import { getHolidays as getHolidaysApi } from '../../service/holidayApi';
import { useAuth } from '../../context/AuthContext';
import { Gift } from 'lucide-react';

interface Holiday { id: string; name: string; date: string; type?: string; }

const MONTHS     = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December'];
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function parseDate(dateStr: string) {
  const d = new Date(dateStr);
  return {
    day:       d.getUTCDate(),
    dayName:   DAYS_SHORT[d.getUTCDay()],
    month:     d.getUTCMonth(),
    monthName: MONTHS[d.getUTCMonth()],
    year:      d.getUTCFullYear(),
  };
}

function groupByMonth(holidays: Holiday[]) {
  const groups: Record<string, { monthName: string; month: number; year: number; items: Holiday[] }> = {};
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

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function MyHolidays() {
  const { user } = useAuth();

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getHolidaysApi();
        setHolidays([...data].sort((a, b) => a.date.localeCompare(b.date)));
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load holidays');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const year    = new Date().getFullYear();
  const display = holidays.filter(h => h.date.startsWith(String(year)));
  const groups  = groupByMonth(display);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Holiday Calendar</h1>
        <p className="text-sm text-slate-400 mt-1">
          {loading ? 'Loading…' : `${display.length} holiday${display.length !== 1 ? 's' : ''} this year`}
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-slate-400 text-sm">Loading…</div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="text-center py-12 text-red-400 text-sm">{error}</div>
      )}

      {/* Empty */}
      {!loading && !error && display.length === 0 && (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0B0E92] to-[#69A6F0]
                          flex items-center justify-center mx-auto mb-3 opacity-20">
            <Gift size={26} className="text-white" />
          </div>
          <p className="text-slate-500 font-medium text-sm">No holidays this year</p>
        </div>
      )}

      {/* Month groups */}
      {!loading && !error && groups.map(group => (
        <div
          key={`${group.year}-${group.month}`}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
        >
          {/* Month header */}
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-50">
            <div className="w-7 h-7 rounded-lg bg-[#EEF0FF] flex items-center justify-center">
              <Gift size={14} className="text-[#0B0E92]" />
            </div>
            <h3 className="text-base font-semibold text-slate-700">{group.monthName}</h3>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-50">
            {group.items.map(h => {
              const { day, dayName } = parseDate(h.date);
              const isWeekend = dayName === 'Sat' || dayName === 'Sun';
              return (
                <div
                  key={h.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 px-4 sm:px-6 py-3.5 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Date box */}
                    <div className={`w-12 text-center flex-shrink-0 rounded-xl py-1.5 ${isWeekend ? 'bg-red-50' : 'bg-slate-50'}`}>
                      <p className={`text-lg font-bold leading-none ${isWeekend ? 'text-red-500' : 'text-slate-700'}`}>{day}</p>
                      <p className={`text-[11px] font-medium mt-0.5 ${isWeekend ? 'text-red-400' : 'text-slate-400'}`}>{dayName}</p>
                    </div>
                    <p className="flex-1 text-sm font-medium text-slate-800">{h.name}</p>
                  </div>

                  {/* National badge */}
                  {h.type === 'National' && (
                    <div className="flex items-center gap-2 flex-shrink-0 pl-[64px] sm:pl-0">
                      <span className="text-xs font-medium px-3 py-1 rounded-full bg-slate-100 text-slate-500">
                        National
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

    </div>
  );
}