// src/components/ui/TablePagination.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Reusable pagination component for all tables.
// Fixes the "render all 10,000 rows at once" problem.
//
// USAGE:
//   const { page, pageSize, paginated, Pagination } = useTablePagination(rows);
//   return (
//     <>
//       <table>
//         <tbody>
//           {paginated.map(row => <tr key={row.id}>...</tr>)}
//         </tbody>
//       </table>
//       <Pagination />
//     </>
//   );
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo, useCallback, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ── Hook ─────────────────────────────────────────────────────────────────────

interface UseTablePaginationOptions {
  defaultPageSize?: number;
  pageSizeOptions?: number[];
}

interface UseTablePaginationResult<T> {
  page:       number;
  pageSize:   number;
  totalPages: number;
  paginated:  T[];
  setPage:    (page: number) => void;
  setPageSize:(size: number) => void;
  /** Drop-in <Pagination /> component — render it below your table */
  Pagination: () => ReactNode;
}

export function useTablePagination<T>(
  rows: T[],
  options: UseTablePaginationOptions = {},
): UseTablePaginationResult<T> {
  const {
    defaultPageSize = 20,
    pageSizeOptions = [10, 20, 50, 100],
  } = options;

  const [page,     setPageRaw]     = useState(1);
  const [pageSize, setPageSizeRaw] = useState(defaultPageSize);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

  // Reset to page 1 when rows length changes (e.g. after filter/search)
  const rowCount = rows.length;
  React.useEffect(() => { setPageRaw(1); }, [rowCount]);

  const setPage = useCallback((p: number) => {
    setPageRaw(Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const setPageSize = useCallback((size: number) => {
    setPageSizeRaw(size);
    setPageRaw(1);
  }, []);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize]);

  const Pagination = useCallback(() => (
    <TablePagination
      page={page}
      totalPages={totalPages}
      pageSize={pageSize}
      totalRows={rows.length}
      pageSizeOptions={pageSizeOptions}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
    />
  ), [page, totalPages, pageSize, rows.length, pageSizeOptions, setPage, setPageSize]);

  return { page, pageSize, totalPages, paginated, setPage, setPageSize, Pagination };
}

// ── Component ─────────────────────────────────────────────────────────────────

interface TablePaginationProps {
  page:               number;
  totalPages:         number;
  pageSize:           number;
  totalRows:          number;
  pageSizeOptions?:   number[];
  onPageChange:       (page: number) => void;
  onPageSizeChange:   (size: number) => void;
}

export function TablePagination({
  page,
  totalPages,
  pageSize,
  totalRows,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  const start = Math.min((page - 1) * pageSize + 1, totalRows);
  const end   = Math.min(page * pageSize, totalRows);

  // Build visible page numbers (max 5 visible)
  const pages = buildPageList(page, totalPages);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 bg-white rounded-b-xl">

      {/* ── Left: Rows info + page size selector ── */}
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span>
          Showing <span className="font-semibold text-slate-700">{start}–{end}</span> of{' '}
          <span className="font-semibold text-slate-700">{totalRows.toLocaleString()}</span>
        </span>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 text-xs">Rows:</span>
          <select
            value={pageSize}
            onChange={e => onPageSizeChange(Number(e.target.value))}
            className="border border-slate-200 rounded-lg text-xs px-2 py-1 text-slate-600 bg-white focus:outline-none focus:border-[#1a2a5e] cursor-pointer"
          >
            {pageSizeOptions.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Right: Page buttons ── */}
      <div className="flex items-center gap-1">
        {/* Prev */}
        <PageBtn
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </PageBtn>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-1.5 py-1 text-slate-400 text-sm select-none">…</span>
          ) : (
            <PageBtn
              key={p}
              onClick={() => onPageChange(p as number)}
              active={p === page}
            >
              {p}
            </PageBtn>
          )
        )}

        {/* Next */}
        <PageBtn
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </PageBtn>
      </div>
    </div>
  );
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function PageBtn({
  children,
  onClick,
  disabled,
  active,
  'aria-label': ariaLabel,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  'aria-label'?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={[
        'min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center',
        disabled
          ? 'text-slate-300 cursor-not-allowed'
          : active
          ? 'bg-[#1a2a5e] text-white shadow-sm'
          : 'text-slate-600 hover:bg-slate-100',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function buildPageList(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '...')[] = [];

  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, '...', total);
  } else if (current >= total - 3) {
    pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, '...', current - 1, current, current + 1, '...', total);
  }

  return pages;
}