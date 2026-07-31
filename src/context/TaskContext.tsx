import { createContext, useContext, useState, type ReactNode } from 'react';

export type TaskStatus = 'To Do' | 'In Progress' | 'Review' | 'Completed';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  // Optional fields used by ProjectTaskReport
  assigneeInitials?: string;
  assigneeColor?: string;
  projectId?: string;
  dueDate?: string;
  due?: string;          // alias used by ProjectTaskReport
  progress?: number;     // 0-100
  createdAt: string;
  incompleteReason?: string;
  reasonDate?: string;   // date when incomplete reason was set
}

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  setIncompleteReason: (id: string, reason: string) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const ASSIGNEE_COLORS: Record<string, string> = {
  Alice:   'bg-indigo-500',
  Bob:     'bg-emerald-500',
  Charlie: 'bg-amber-500',
  Diana:   'bg-pink-500',
  Eve:     'bg-violet-500',
};

function makeInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const INITIAL_TASKS: Task[] = [
  {
    id: 't1', title: 'Design system audit',
    description: 'Review all UI components for consistency',
    status: 'In Progress', priority: 'High',
    assignee: 'Alice', assigneeInitials: 'AL', assigneeColor: 'bg-indigo-500',
    projectId: 'p1', dueDate: '2025-07-30', due: '2025-07-30',
    progress: 45, createdAt: '2025-07-01',
  },
  {
    id: 't2', title: 'API integration testing',
    description: 'Test all REST endpoints',
    status: 'To Do', priority: 'Medium',
    assignee: 'Bob', assigneeInitials: 'BO', assigneeColor: 'bg-emerald-500',
    projectId: 'p1', dueDate: '2025-08-05', due: '2025-08-05',
    progress: 0, createdAt: '2025-07-02',
  },
  {
    id: 't3', title: 'Write unit tests',
    description: 'Cover core business logic',
    status: 'Completed', priority: 'Low',
    assignee: 'Alice', assigneeInitials: 'AL', assigneeColor: 'bg-indigo-500',
    projectId: 'p2', dueDate: '2025-07-20', due: '2025-07-20',
    progress: 100, createdAt: '2025-07-03',
  },
  {
    id: 't4', title: 'Deploy to staging',
    description: 'Push latest build to staging env',
    status: 'Review', priority: 'Critical',
    assignee: 'Charlie', assigneeInitials: 'CH', assigneeColor: 'bg-amber-500',
    projectId: 'p2', dueDate: '2025-07-28', due: '2025-07-28',
    progress: 80, createdAt: '2025-07-04',
  },
];

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);

  const addTask = (task: Task) => {
    // Auto-populate derived fields if not provided
    const enriched: Task = {
      assigneeInitials: makeInitials(task.assignee),
      assigneeColor: ASSIGNEE_COLORS[task.assignee] || 'bg-slate-500',
      due: task.dueDate,
      progress: task.status === 'Completed' ? 100 : task.status === 'Review' ? 75 : task.status === 'In Progress' ? 40 : 0,
      ...task,
    };
    setTasks(prev => [enriched, ...prev]);
  };

  const updateTask = (updated: Task) =>
    setTasks(prev => prev.map(t => t.id === updated.id ? {
      ...updated,
      assigneeInitials: updated.assigneeInitials ?? makeInitials(updated.assignee),
      assigneeColor: updated.assigneeColor ?? (ASSIGNEE_COLORS[updated.assignee] || 'bg-slate-500'),
      due: updated.due ?? updated.dueDate,
      progress: updated.progress ?? (updated.status === 'Completed' ? 100 : updated.status === 'Review' ? 75 : updated.status === 'In Progress' ? 40 : 0),
    } : t));

  const deleteTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));

  const setIncompleteReason = (id: string, reason: string) =>
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, incompleteReason: reason, reasonDate: new Date().toISOString().split('T')[0] } : t
    ));

  return (
    <TaskContext.Provider value={{ tasks, addTask, updateTask, deleteTask, setIncompleteReason }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTaskContext must be used within TaskProvider');
  return ctx;
}
