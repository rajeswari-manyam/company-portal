// ─── MyProjects Feature Types ─────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;          // always = MongoDB _id
  _id: string;         // always = MongoDB _id (same value, both required)
  projectId: string;
  projectName: string;
  employeeId: string;
  description: string;
  startTime: string;
  endTime: string;
  day: string;
  progress: string | null;
  reason: string | null;
}

export type ProgressValue = 'Completed' | 'Not Completed';