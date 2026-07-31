import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  getAnnouncements,
  getAnnouncementsByDept,
  createAnnouncement as apiCreate,
  deleteAnnouncement as apiDelete,
} from '../../service/announcementApi';
import { getDepartments } from '../../service/departmentApi';
import type { Announcement } from '../../service/announcementApi';
import toast from 'react-hot-toast';

const MONGO_ID_RE = /^[a-f\d]{24}$/i;

// ─── Extract a readable dept name from any shape ──────────────────────────────
function extractDeptName(dept: any, deptMap: Record<string, string>): string {
  if (!dept) return '';

  if (typeof dept === 'string') {
    if (MONGO_ID_RE.test(dept)) return deptMap[dept] || '';
    return dept;
  }

  if (typeof dept === 'object') {
    const name = dept.departmentName || dept.name || '';
    const id = dept._id || dept.id || '';
    if (name) return name;
    if (id && deptMap[id]) return deptMap[id];
  }

  return '';
}

// ─── Normalize raw API data → typed Announcement ──────────────────────────────
function normalise(a: any, deptMap: Record<string, string>): Announcement {
  const rawPriority = (a.priority ?? 'medium').toLowerCase();

  let departments: string;
  if (a.isForAll || !a.departments || a.departments === 'all') {
    departments = 'all';
  } else if (Array.isArray(a.departments)) {
    const names = a.departments
      .map((d: any) => extractDeptName(d, deptMap))
      .filter(Boolean);
    departments = names.length > 0 ? names.join(', ') : 'all';
  } else {
    departments = extractDeptName(a.departments, deptMap) || 'all';
  }

  return {
    id: a._id ?? a.id ?? '',
    title: a.title ?? '',
    message: a.message ?? a.content ?? '',
    departments,
    isForAll: a.isForAll ?? (departments === 'all'),
    priority: rawPriority === 'high' || rawPriority === 'low'
      ? rawPriority
      : 'medium',
    createdBy: a.createdBy ?? '',
    createdAt: a.createdAt ?? new Date().toISOString(),
  };
}

// ─── Build id → name map from departments API ─────────────────────────────────
async function buildDeptMap(): Promise<Record<string, string>> {
  try {
    const { departments } = await getDepartments();
    const map: Record<string, string> = {};
    departments.forEach((d: any) => {
      const id = d._id || d.id || '';
      const name = d.departmentName || d.name || '';
      if (id && name) map[id] = name;
    });
    console.log('[deptMap] built:', map);
    return map;
  } catch (e) {
    console.error('[deptMap] failed to build:', e);
    return {};
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAnnouncements(departmentInput?: string) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [deptId, setDeptId] = useState<string>('all');
  const [deptMap, setDeptMap] = useState<Record<string, string>>({});
  const [mapReady, setMapReady] = useState(false);

  const cacheRef = useRef<Record<string, Announcement[]>>({});

  // ── Step 1: Build deptMap first, before anything else ────────────────────
  useEffect(() => {
    buildDeptMap().then((map) => {
      setDeptMap(map);
      setMapReady(true);
    });
  }, []);

  // ── Step 2: Resolve departmentInput → deptId (after map is ready) ────────
  useEffect(() => {
    if (!mapReady) return;
    if (!departmentInput || departmentInput === 'all') {
      setDeptId('all');
      return;
    }

    // Already a Mongo ID — use directly
    if (MONGO_ID_RE.test(departmentInput)) {
      setDeptId(departmentInput);
      return;
    }

    // It's a name — look it up in the map we already have (no extra API call)
    const found = Object.entries(deptMap).find(
      ([, name]) => name.toLowerCase() === departmentInput.toLowerCase()
    );
    setDeptId(found ? found[0] : 'all');
  }, [departmentInput, deptMap, mapReady]);

  // ── Step 3: Fetch announcements (gated on mapReady) ───────────────────────
  const refresh = useCallback(async () => {
    if (!mapReady) return;

    try {
      setLoading(true);
      setError(null);

      // Always clear cache so we re-normalise with latest deptMap
      delete cacheRef.current[deptId];

      const data: any[] =
        !deptId || deptId === 'all'
          ? await getAnnouncements()
          : await getAnnouncementsByDept(deptId);

      console.log('[useAnnouncements] raw data[0]:', data[0]);

      // normalise() receives raw API objects + deptMap to resolve IDs → names
      const normalized = data.map((a) => normalise(a, deptMap));
      console.log('[useAnnouncements] normalized[0]:', normalized[0]);

      cacheRef.current[deptId] = normalized;
      setAnnouncements(normalized);
    } catch (err: any) {
      console.error('[useAnnouncements] fetch error:', err);
      setError(err?.message ?? 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }, [deptId, deptMap, mapReady]);

  useEffect(() => { refresh(); }, [refresh]);

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!search && priorityFilter === 'all') return announcements;
    const q = search.toLowerCase();
    return announcements.filter(a => {
      if (
        q &&
        !a.title.toLowerCase().includes(q) &&
        !a.message.toLowerCase().includes(q)
      ) return false;
      if (priorityFilter !== 'all' && a.priority !== priorityFilter)
        return false;
      return true;
    });
  }, [announcements, search, priorityFilter]);

  // ── Create (optimistic) ───────────────────────────────────────────────────
  const create = async (data: Omit<Announcement, 'id'>) => {
    try {
      const temp: Announcement = { ...data, id: 'temp-' + Date.now() };
      setAnnouncements(prev => [temp, ...prev]);
      await apiCreate(data);
      cacheRef.current = {};
      await refresh();
      toast.success('Announcement posted');
      return true;
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to post');
      await refresh();
      return false;
    }
  };

  // ── Delete (optimistic) ───────────────────────────────────────────────────
  const remove = async (id: string) => {
    const backup = announcements;
    try {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      await apiDelete(id);
      cacheRef.current = {};
      toast.success('Deleted');
      return true;
    } catch (err: any) {
      setAnnouncements(backup);
      toast.error(err?.message ?? 'Delete failed');
      return false;
    }
  };

  return {
    announcements,
    filtered,
    loading,
    error,
    search,
    setSearch,
    priorityFilter,
    setPriorityFilter,
    deptId,
    deptMap,
    create,
    remove,
    refresh,
  };
}