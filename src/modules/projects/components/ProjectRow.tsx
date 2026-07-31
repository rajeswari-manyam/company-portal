// ─── ProjectRow ───────────────────────────────────────────────────────────────
import React from 'react';
import {
  Briefcase,
  Calendar,
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { fmtDate, todayISO } from '../../../utils/projecthelper';
import TasksPanel from './TaskPannel';
import type { Project, Task } from '../types';

interface ProjectRowProps {
  project: Project;
  index: number;
  tasks: Task[];          // already pre-filtered by ProjectsTable for this project
  isExpanded: boolean;
  onToggleExpand: () => void;
  onAddTask: () => void;
  onUpdateTask: (t: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export default function ProjectRow({
  project,
  index,
  tasks,           // ← use directly, already filtered for this project
  isExpanded,
  onToggleExpand,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}: ProjectRowProps) {
  const today = todayISO();

  // ── Use tasks directly — NO re-filter here ──────────────────────────────────
  // ProjectsTable already does: tasks.filter(t => t.projectId === p.id)
  // Re-filtering here with === causes silent mismatches (ObjectId vs string).
  const todayTasks = tasks.filter((t) => t.day === today);
  const todayDone  = todayTasks.filter((t) => t.progress === 'Completed').length;
  const pct = todayTasks.length > 0
    ? Math.round((todayDone / todayTasks.length) * 100)
    : 0;
  const isComplete = project.status === 'completed';

  return (
    <React.Fragment>
      {/* ── Project row ──────────────────────────────────────────────────── */}
      <tr
        className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${
          isExpanded ? 'bg-slate-50/80' : ''
        }`}
      >
        {/* # */}
        <td className="px-4 py-3.5 text-xs text-slate-400 w-10">{index}</td>

        {/* Name */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
              <Briefcase className="w-4 h-4 text-violet-600" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 text-sm truncate max-w-[180px] sm:max-w-none">
                {project.name}
              </p>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isComplete
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-blue-50 text-[#0B0E92]'
                }`}
              >
                {isComplete ? '✓ Done' : '● Active'}
              </span>
            </div>
          </div>
        </td>

        {/* Today's progress — hidden on mobile */}
        <td className="hidden sm:table-cell px-4 py-3.5 min-w-[160px]">
          {todayTasks.length > 0 ? (
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-slate-500 font-medium">
                  {todayDone}/{todayTasks.length} done
                </span>
                <span className="font-bold text-[#0B0E92]">{pct}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden w-32">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background:
                      pct === 100
                        ? 'linear-gradient(to right,#34d399,#2dd4bf)'
                        : 'linear-gradient(to right,#0B0E92,#69A6F0)',
                  }}
                />
              </div>
            </div>
          ) : (
            <span className="text-xs text-slate-400">No tasks today</span>
          )}
        </td>

        {/* Actions */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onAddTask}
              className="flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-1.5 rounded-lg transition-all shadow-sm whitespace-nowrap"
              style={{ background: 'linear-gradient(to right,#0B0E92,#69A6F0)' }}
            >
              <Plus size={12} /> Add Task
            </button>

            <button
              onClick={onToggleExpand}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all border whitespace-nowrap
                ${isExpanded
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                }`}
            >
              {isExpanded ? (
                <><ChevronUp size={12} /> Hide</>
              ) : (
                <>
                  <ChevronDown size={12} /> Tasks
                  {tasks.length > 0 && (
                    <span
                      className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isExpanded
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {tasks.length}
                    </span>
                  )}
                </>
              )}
            </button>
          </div>
        </td>

        {/* Created At — hidden on mobile */}
        <td className="hidden sm:table-cell px-4 py-3.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {fmtDate(project.createdAt)}
          </div>
        </td>

        {/* Last Updated — hidden on mobile */}
        <td className="hidden sm:table-cell px-4 py-3.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {fmtDate(project.updatedAt)}
          </div>
        </td>
      </tr>

      {/* ── Tasks panel ──────────────────────────────────────────────────── */}
      {isExpanded && (
        <tr>
          <td colSpan={6} className="p-0">
            <TasksPanel
              project={project}
              tasks={tasks}        // pass directly — already filtered
              onUpdateTask={onUpdateTask}
              onDeleteTask={onDeleteTask}
            />
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}