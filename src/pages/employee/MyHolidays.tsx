import { useEffect, useState } from 'react';
import { getHolidays as getHolidaysApi } from '../../services/holidayApi';
import { Card } from '../../components/ui';

interface Holiday {
  id: string;
  name: string;
  date: string;
  type?: string;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getDay(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'long' });
}

export default function MyHolidays() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getHolidaysApi();
        const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
        setHolidays(sorted);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load holidays');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const year = new Date().getFullYear();
  const thisYear = holidays.filter(h => h.date.startsWith(String(year)));
  const displayList = thisYear.length ? thisYear : holidays;
  const count = displayList.length;

  return (
    <div className="space-y-6 p-4 sm:p-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Holiday Calendar</h1>
        <p className="text-sm text-slate-400 mt-1">
          {loading ? 'Loading…' : `${count} holiday${count !== 1 ? 's' : ''} this year`}
        </p>
      </div>

      {/* Table card */}
      <Card padding={false}>
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
            Fetching holidays…
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20 text-red-500 text-sm">
            {error}
          </div>
        ) : displayList.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
            No holidays found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Holiday', 'Date', 'Day', 'Type'].map(col => (
                    <th
                      key={col}
                      className="px-6 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {displayList.map(h => {
                  const type = h.type ?? 'national';
                  return (
                    <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">
                        {h.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatDate(h.date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {getDay(h.date)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border border-slate-200 text-slate-600 bg-white capitalize">
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}