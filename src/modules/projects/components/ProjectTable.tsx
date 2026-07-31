// ─── ProjectsTable ────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { Search, FolderKanban, ChevronLeft, ChevronRight } from 'lucide-react';
import ProjectRow from './ProjectRow';
import type { Project, Task } from '../types';

const PER_PAGE = 10;

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[8, 35, 20, 20, 12, 15].map((w, i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-4 bg-slate-100 rounded-lg" style={{ width: `${w + 15}%` }} />
        </td>
      ))}
    </tr>
  );
}

interface ProjectsTableProps {
  projects: Project[];
  tasks: Task[];
  loading: boolean;
  expandedProjects: Set<string>;
  onToggleExpand: (projectId: string) => void;
  onAddTask: (project: Project) => void;
  onUpdateTask: (t: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export default function ProjectsTable({
  projects,
  tasks,
  loading,
  expandedProjects,
  onToggleExpand,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}: ProjectsTableProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = projects.filter(
    (p) => !search || p.name.toLowerCase().includes(search.toLowerCase()),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => setPage(1), [search]);

  // ── DEBUG: log whenever tasks change ──────────────────────────────────────
  useEffect(() => {
    console.log('[ProjectsTable] tasks received:', tasks.length);
    console.log('[ProjectsTable] projects received:', projects.length);
    projects.forEach(p => {
      const matched = tasks.filter(t => String(t.projectId) === String(p.id));
      console.log(`[ProjectsTable] "${p.name}" id=${p.id} → matched ${matched.length} tasks`);
      if (tasks.length > 0 && matched.length === 0) {
        console.warn(`[ProjectsTable] MISMATCH SAMPLE — task.projectId="${tasks[0]?.projectId}" vs project.id="${p.id}"`);
      }
    });
  }, [tasks, projects]);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Search */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-100">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#69A6F0] focus:border-transparent"
            placeholder="Search projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <p className="text-xs text-slate-400 ml-auto whitespace-nowrap">
          {filtered.length} project{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              <th className="text-left px-4 py-3 bg-slate-50 border-b border-slate-100">#</th>
              <th className="text-left px-4 py-3 bg-slate-50 border-b border-slate-100">Project Name</th>
              <th className="hidden sm:table-cell text-left px-4 py-3 bg-slate-50 border-b border-slate-100 whitespace-nowrap">
                Today's Progress
              </th>
              <th className="text-left px-4 py-3 bg-slate-50 border-b border-slate-100">Actions</th>
              <th className="hidden sm:table-cell text-left px-4 py-3 bg-slate-50 border-b border-slate-100 whitespace-nowrap">
                Created At
              </th>
              <th className="hidden sm:table-cell text-left px-4 py-3 bg-slate-50 border-b border-slate-100 whitespace-nowrap">
                Last Updated
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && Array(3).fill(0).map((_, i) => <SkeletonRow key={i} />)}

            {!loading && paginated.map((p, idx) => {
              // ── String-coerce BOTH sides to handle ObjectId vs string ──────
              const projectTasks = tasks.filter(
                (t) => String(t.projectId) === String(p.id)
              );

              console.log(`[ProjectsTable] rendering "${p.name}" with ${projectTasks.length} tasks`);

              return (
                <ProjectRow
                  key={p.id}
                  project={p}
                  index={(page - 1) * PER_PAGE + idx + 1}
                  tasks={projectTasks}
                  isExpanded={expandedProjects.has(p.id)}
                  onToggleExpand={() => onToggleExpand(p.id)}
                  onAddTask={() => onAddTask(p)}
                  onUpdateTask={onUpdateTask}
                  onDeleteTask={onDeleteTask}
                />
              );
            })}

            {!loading && paginated.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-16">
                  <FolderKanban className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">
                    {search ? 'No projects match your search.' : 'No projects assigned yet.'}
                  </p>
                  {search && (
                    <button onClick={() => setSearch('')} className="text-xs text-violet-500 mt-1 hover:underline">
                      Clear search
                    </button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && filtered.length > PER_PAGE && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 flex-wrap gap-2">
          <p className="text-xs text-slate-400">
            Showing {Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–
            {Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                  page === n
                    ? 'bg-gradient-to-r from-[#0B0E92] to-[#69A6F0] text-white'
                    : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}