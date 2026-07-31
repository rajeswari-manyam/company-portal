// ─── MyProjects Page ─────────────────────────────────────────────────────────
// Thin orchestration layer — all logic is in useMyProjects, all UI in sub-components.
import React, { useState } from 'react';
import {
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  FolderKanban,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMyProjects } from '../../modules/projects/UseProjects';
import { todayISO, isEndOfDay } from "../../utils/projecthelper";
import AddTaskModal from '../../modules/projects/components/AddTaskModal';
import UpdateProgressModal from '../../modules/projects/components/UpdateProgressModal';
import ProjectsTable from "../../modules/projects/components/ProjectTable";
import type { Project, Task } from "../../modules/projects/types";

export default function MyProjects() {
  const { user } = useAuth();
  const u = user as unknown as Record<string, unknown> | null;
  const employeeId = (u?._id ?? u?.id ?? '') as string;

  const {
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
  } = useMyProjects(employeeId);

  // ── Local UI state ──────────────────────────────────────────────────────────
  const [showTable, setShowTable] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [addTaskFor, setAddTaskFor] = useState<Project | null>(null);

  const today = todayISO();
  const todayTaskCount = tasks.filter((t) => t.day === today).length;
  const todayDoneCount = tasks.filter((t) => t.day === today && t.progress === 'Completed').length;

  const toggleExpand = (projectId: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  const onTaskSaved = (task: Task) => {
    handleTaskSaved(task);
    // Auto-expand the project after adding a task
    setExpandedProjects((prev) => new Set([...prev, task.projectId]));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Modals ── */}
      {addTaskFor && (
        <AddTaskModal
          project={addTaskFor}
          employeeId={employeeId}
          onClose={() => setAddTaskFor(null)}
          onSaved={onTaskSaved}
        />
      )}
      {editingTask && (
        <UpdateProgressModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onUpdated={handleProgressUpdated}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6 gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">My Tasks</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {isEndOfDay() ? (
                <span className="text-amber-500 font-semibold">
                  ⏰ End of day — update pending tasks
                </span>
              ) : (
                'Your assigned projects & daily task log'
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!loading && !error && todayTaskCount > 0 && (
              <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 size={12} />
                {todayDoneCount}/{todayTaskCount} today
              </span>
            )}
            <button
              onClick={load}
              title="Refresh"
              className="p-2.5 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition-colors"
            >
              <RefreshCw
                className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="mb-4 flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
            <button
              onClick={load}
              className="ml-auto text-xs font-medium underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Stat card toggle ── */}
        <div className="mb-6">
          <button
            onClick={() => setShowTable((v) => !v)}
            className={`bg-white rounded-2xl border p-4 flex items-center gap-3 shadow-sm w-56 transition-all duration-200 cursor-pointer
              ${showTable
                ? 'border-[#0B0E92] ring-2 ring-[#0B0E92]/20 shadow-md'
                : 'border-slate-100 hover:border-slate-300 hover:shadow-md'
              }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors
                ${showTable ? 'bg-[#0B0E92]' : 'bg-violet-50'}`}
            >
              <FolderKanban
                className={`w-5 h-5 ${showTable ? 'text-white' : 'text-violet-600'}`}
              />
            </div>
            <div className="text-left flex-1">
              <p className="text-2xl font-bold text-slate-800">
                {loading ? '—' : projects.length}
              </p>
              <p className="text-xs text-slate-500 font-medium">
                {showTable ? '▲ Hide Projects' : 'Total Projects ▼'}
              </p>
            </div>
          </button>
        </div>

        {/* ── Projects table ── */}
        {showTable && (
          <ProjectsTable
            projects={projects}
            tasks={tasks}
            loading={loading}
            expandedProjects={expandedProjects}
            onToggleExpand={toggleExpand}
            onAddTask={setAddTaskFor}
            onUpdateTask={setEditingTask}
            onDeleteTask={handleTaskDeleted}
          />
        )}
      </div>
    </div>
  );
}