import React from 'react';
import EmptyState from './EmptyState';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Column<T = any> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
  emptyIcon?: string;
  loading?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function Table<T = any>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No records found',
  emptyIcon = '📋',
  loading = false,
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-[#0B0E92] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className={`text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3.5 ${col.className ?? ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <EmptyState icon={emptyIcon} message={emptyMessage} />
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={keyExtractor(row)} className="hover:bg-slate-50/60 transition-colors">
                {columns.map(col => (
                  <td key={col.key} className={`px-5 py-3.5 text-sm text-slate-700 ${col.className ?? ''}`}>
                    {col.render
                      ? col.render(row)
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      : String((row as any)[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
