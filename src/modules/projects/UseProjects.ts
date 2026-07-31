import { useState, useEffect, useCallback } from 'react';
import { getProjects } from '../../service/projectApi';
import { todayISO, isEndOfDay } from '../../utils/projecthelper';
import { getTasksByEmployee } from '../../service/taskApi';
import type { Project, Task } from './types';

function toDateOnly(value?: string | null): string {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return value.slice(0, 10);
}

function normaliseTask(t: any, fallbackProject: Project, employeeId: string): Task {
  const day = toDateOnly(t.day) || toDateOnly(t.startTime) || '';

  // ✅ Always pull the real MongoDB _id — never use projectId or employeeId as task id
  const mongoId = (t._id || t.id || '') as string;

  return {
    id:          mongoId,          // ← real task _id only
    _id:         mongoId,          // ← same value, always in sync
    projectId:   fallbackProject.id,
    projectName: (t.projectName || fallbackProject.name) as string,
    employeeId:  (t.employeeId || employeeId) as string,
    description: (t.description || '') as string,
    startTime:   (t.startTime || '') as string,
    endTime:     (t.endTime || '') as string,
    day,
    progress:    (t.progress ?? null) as string | null,
    reason:      (t.reason ?? null) as string | null,
  };
}

async function fetchAllTasks(employeeId: string, projects: Project[]): Promise<Task[]> {
  if (!employeeId || projects.length === 0) return [];

  console.log('[useMyProjects] Fetching tasks for', projects.length, 'project(s)…');

  const results = await Promise.allSettled(
    projects.map(async (p) => {
      try {
        const raw = await getTasksByEmployee(employeeId, p.id);
        console.log(`[useMyProjects] "${p.name}" → ${raw.length} task(s):`, raw);
        return raw.map((t) => normaliseTask(t, p, employeeId));
      } catch (err: any) {
        console.error(
          `[useMyProjects] Failed for "${p.name}":`,
          err?.response?.status,
          err?.response?.data || err.message,
        );
        return [] as Task[];
      }
    }),
  );

  const allTasks = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
  console.log(
    '[useMyProjects] Total tasks loaded:', allTasks.length,
    '| Today tasks:', allTasks.filter((t) => t.day === todayISO()).length,
  );

  console.log('[useMyProjects] task ids (should be MongoDB _id):', allTasks.map(t => t.id));
  console.log('[useMyProjects] project ids:', projects.map(p => p.id));

  return allTasks;
}

export function useMyProjects(employeeId: string) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks]       = useState<Task[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const load = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    setError('');

    try {
      const rawProjects = await getProjects();
      console.log('[useMyProjects] Raw projects:', rawProjects);

      const mapped: Project[] = rawProjects.map((raw: any) => ({
        id:        (raw._id || raw.id || '') as string,
        name:      (raw.projectName || raw.name || '(unnamed)') as string,
        status:    (raw.status ?? '') as string,
        createdAt: (raw.createdAt ?? '') as string,
        updatedAt: (raw.updatedAt ?? '') as string,
      }));
      setProjects(mapped);

      const allTasks = await fetchAllTasks(employeeId, mapped);
      setTasks(allTasks);

    } catch (err: any) {
      console.error('[useMyProjects] load error:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => { load(); }, [load]);

  const today = todayISO();

  useEffect(() => {
    if (!isEndOfDay() || editingTask) return;
    const pending = tasks.find(
      (t) => t.day === today && (!t.progress || t.progress === 'In Progress') && !t.reason,
    );
    if (pending) setEditingTask(pending);
  }, [tasks, editingTask, today]);

  const handleTaskSaved = (task: Task) =>
    setTasks((prev) => [task, ...prev.filter((t) => t.id !== task.id)]);

  const handleTaskDeleted = (taskId: string) =>
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

  // ✅ Match by task._id (MongoDB id) — not projectId or employeeId
  const handleProgressUpdated = (id: string, progress: string, reason: string) => {
    setTasks((prev) =>
      prev.map((t) => (t._id === id || t.id === id ? { ...t, progress, reason } : t)),
    );
    setEditingTask(null);

    setTimeout(() => {
      if (!isEndOfDay()) return;
      setTasks((prev) => {
        const next = prev.find(
          (t) =>
            t.id !== id &&
            t.day === today &&
            (!t.progress || t.progress === 'In Progress') &&
            !t.reason,
        );
        if (next) setEditingTask(next);
        return prev;
      });
    }, 600);
  };

  return {
    projects,
    tasks,
    loading,
    error,
    editingTask,
    setEditingTask,
    load,
    handleTaskSaved,
    handleTaskDeleted,
    handleProgressUpdated,
  };
}