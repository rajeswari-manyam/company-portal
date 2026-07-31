// src/hooks/usePageData.ts
// ─────────────────────────────────────────────────────────────────────────────
// Unified data-fetching hook with:
//   - AbortController cleanup (prevents setState on unmounted components)
//   - Single loading state for multiple parallel fetches
//   - Error handling
//   - Optional refetch interval
//
// USAGE EXAMPLE (replaces 4 separate useEffects in EmployeeDashboard):
//
//   const { data, loading, error, refetch } = usePageData({
//     fetchers: {
//       announcements: () => getAnnouncements(),
//       holidays:      () => getHolidays(),
//       leaves:        () => getLeavesForEmployee(user._id),
//       projects:      () => getProjects(),
//     },
//   });
//   // data.announcements, data.holidays, etc.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';

type FetcherMap = Record<string, () => Promise<unknown>>;

type DataMap<T extends FetcherMap> = {
  [K in keyof T]: Awaited<ReturnType<T[K]>> | null;
};

interface UsePageDataOptions<T extends FetcherMap> {
  fetchers: T;
  /** If true, data is not fetched until enabled becomes true */
  enabled?: boolean;
  /** Refetch interval in ms. Omit for one-shot fetch. */
  refetchInterval?: number;
}

interface UsePageDataResult<T extends FetcherMap> {
  data:    DataMap<T>;
  loading: boolean;
  error:   string | null;
  refetch: () => void;
}

export function usePageData<T extends FetcherMap>({
  fetchers,
  enabled = true,
  refetchInterval,
}: UsePageDataOptions<T>): UsePageDataResult<T> {
  // Build initial null state
  const initialData = Object.keys(fetchers).reduce((acc, key) => {
    acc[key as keyof T] = null;
    return acc;
  }, {} as DataMap<T>);

  const [data,    setData]    = useState<DataMap<T>>(initialData);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // Stable ref so interval doesn't re-register when fetchers identity changes
  const fetchersRef = useRef(fetchers);
  useEffect(() => { fetchersRef.current = fetchers; });

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const entries = Object.entries(fetchersRef.current);

      // Run all fetches in parallel
      const results = await Promise.allSettled(
        entries.map(([, fn]) => fn())
      );

      if (signal.aborted) return; // component unmounted — bail out

      const newData = { ...initialData };
      results.forEach((result, i) => {
        const key = entries[i][0] as keyof T;
        if (result.status === 'fulfilled') {
          newData[key] = result.value as DataMap<T>[typeof key];
        } else {
          console.warn(`[usePageData] Fetch failed for key "${String(key)}":`, result.reason);
        }
      });

      setData(newData);
    } catch (err) {
      if (signal.aborted) return;
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    fetchAll(controller.signal);
  }, [fetchAll]);

  // Initial fetch + optional interval
  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    abortRef.current = controller;
    fetchAll(controller.signal);

    let intervalId: ReturnType<typeof setInterval> | null = null;
    if (refetchInterval) {
      intervalId = setInterval(() => {
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        fetchAll(ctrl.signal);
      }, refetchInterval);
    }

    return () => {
      controller.abort();
      if (intervalId) clearInterval(intervalId);
    };
  }, [enabled, refetchInterval, fetchAll]);

  return { data, loading, error, refetch };
}


// ─────────────────────────────────────────────────────────────────────────────
// SIMPLE SINGLE-FETCH VERSION — for fetching one list
// ─────────────────────────────────────────────────────────────────────────────

interface UseFetchOptions<T> {
  fetcher: () => Promise<T>;
  enabled?: boolean;
  refetchInterval?: number;
}

interface UseFetchResult<T> {
  data:    T | null;
  loading: boolean;
  error:   string | null;
  refetch: () => void;
}

export function useFetch<T>({
  fetcher,
  enabled = true,
  refetchInterval,
}: UseFetchOptions<T>): UseFetchResult<T> {
  const [data,    setData]    = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const fetcherRef = useRef(fetcher);
  useEffect(() => { fetcherRef.current = fetcher; });

  const doFetch = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      if (!signal.aborted) setData(result);
    } catch (err) {
      if (!signal.aborted) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    doFetch(ctrl.signal);
  }, [doFetch]);

  useEffect(() => {
    if (!enabled) return;

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    doFetch(ctrl.signal);

    let id: ReturnType<typeof setInterval> | null = null;
    if (refetchInterval) {
      id = setInterval(() => {
        const c = new AbortController();
        abortRef.current = c;
        doFetch(c.signal);
      }, refetchInterval);
    }

    return () => {
      ctrl.abort();
      if (id) clearInterval(id);
    };
  }, [enabled, refetchInterval, doFetch]);

  return { data, loading, error, refetch };
}