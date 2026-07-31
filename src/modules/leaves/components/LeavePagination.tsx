import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  total: number; page: number; perPage: number;
  onPage: (p: number) => void;
  onPerPage: (n: number) => void;
}

export default function LeavePagination({ total, page, perPage, onPage, onPerPage }: Props) {
  const pages = Math.ceil(total / perPage);
  const from  = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to    = Math.min(page * perPage, total);

  const visible = () => {
    if (pages <= 5) return Array.from({ length: pages }, (_, i) => i + 1);
    if (page <= 3)         return [1, 2, 3, '...', pages];
    if (page >= pages - 2) return [1, '...', pages - 2, pages - 1, pages];
    return [1, '...', page, '...', pages];
  };

  return (
    <div className="flex items-center justify-between px-6 py-3.5
                    border-t border-slate-100 flex-wrap gap-3">
      <span className="text-xs text-slate-400">
        Showing {from} to {to} of {total} entries
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border
                     border-slate-200 text-slate-500 hover:bg-slate-50
                     disabled:opacity-40 transition-colors"
        >
          <ChevronLeft size={14} />
        </button>

        {visible().map((p, i) =>
          p === '...' ? (
            <span key={`dot-${i}`}
              className="w-8 h-8 flex items-center justify-center text-slate-400 text-sm">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg
                          text-sm font-semibold transition-colors
                ${page === p
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPage(Math.min(pages, page + 1))}
          disabled={page === pages || pages === 0}
          className="w-8 h-8 flex items-center justify-center rounded-lg border
                     border-slate-200 text-slate-500 hover:bg-slate-50
                     disabled:opacity-40 transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        Show
        <select
          value={perPage}
          onChange={e => onPerPage(Number(e.target.value))}
          className="border border-slate-200 rounded-lg px-2 py-1 text-sm
                     text-slate-700 bg-white focus:outline-none
                     focus:ring-2 focus:ring-slate-900/10"
        >
          {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        entries
      </div>
    </div>
  );
}