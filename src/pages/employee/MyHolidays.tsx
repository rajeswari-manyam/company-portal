import React from 'react';
import { getHolidays, type Holiday } from '../../data/store';
import { Card } from '../../components/ui';
import { PageHeader } from '../../components/common';

const TYPE_COLOR: Record<string, string> = {
  national: 'bg-indigo-100 text-indigo-700',
  regional: 'bg-blue-100 text-blue-700',
  company: 'bg-emerald-100 text-emerald-700',
};

export default function MyHolidays() {
  const today = new Date().toISOString().slice(0, 10);
  const holidays = getHolidays();
  const upcoming = holidays.filter(h => h.date >= today);
  const past = [...holidays.filter(h => h.date < today)].reverse().slice(0, 10);

  const HolidayRow = ({ h }: { h: Holiday }) => {
    const d = new Date(h.date);
    const isPast = h.date < today;
    return (
      <div className={`flex items-center gap-4 px-5 py-3.5 ${isPast ? 'opacity-50' : ''}`}>
        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex flex-col items-center justify-center flex-shrink-0">
          <p className="text-xs text-indigo-400 font-bold leading-none">{d.toLocaleString('en', { month: 'short' })}</p>
          <p className="text-xl font-black text-indigo-700 leading-tight">{d.getDate()}</p>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-800 text-sm">{h.name}</p>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${TYPE_COLOR[h.type]}`}>{h.type}</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{d.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Holidays" subtitle={`${upcoming.length} upcoming holidays this year`} />
      <Card padding={false}>
        {upcoming.length > 0 && (
          <>
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Upcoming ({upcoming.length})</p>
            </div>
            <div className="divide-y divide-slate-50">{upcoming.map(h => <HolidayRow key={h.id} h={h} />)}</div>
          </>
        )}
        {past.length > 0 && (
          <>
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Past</p>
            </div>
            <div className="divide-y divide-slate-50">{past.map(h => <HolidayRow key={h.id} h={h} />)}</div>
          </>
        )}
      </Card>
    </div>
  );
}
