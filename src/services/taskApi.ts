import apiClient from "./apiClient";

// ✅ CREATE TASK  →  POST /create-task
export const createTask = async (data: any) => {
  const payload = {
    projectId:   data.projectId,
    employeeId:  data.employeeId,
    description: data.description,
    startTime:   data.startTime,   // ISO string e.g. "2026-03-16T09:00:00.000Z"
    endTime:     data.endTime,     // ISO string
    day:         data.day,         // "YYYY-MM-DD"
  };

  const res = await apiClient.post("/create-task", payload);

  return {
    id: res.data?.id || res.data?._id || Math.random().toString(),
    ...payload,
    status:   res.data?.status   || "pending",
    progress: res.data?.progress || null,
    reason:   res.data?.reason   || null,
  };
};

// ✅ GET TASKS BY EMPLOYEE + DATE  →  GET /employee-day?employeeId=&date=
export const getTasksByEmployeeAndDate = async (employeeId: string, date: string) => {
  const res = await apiClient.get(`/employee-day?employeeId=${employeeId}&date=${date}`);

  const list = Array.isArray(res.data)
    ? res.data
    : res.data.tasks || res.data.data || [];

  return list.map((t: any) => normaliseTask(t));
};

// ✅ GET TASKS BY EMPLOYEE (all dates — calls today by default, can be expanded)
//    Since the backend is date-scoped, we fetch a rolling 30-day window
export const getTasksByEmployee = async (employeeId: string): Promise<any[]> => {
  // Build last 30 days of date strings
  const dates: string[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }

  const results = await Promise.allSettled(
    dates.map(date => getTasksByEmployeeAndDate(employeeId, date)),
  );

  const all: any[] = [];
  results.forEach(r => {
    if (r.status === 'fulfilled') all.push(...r.value);
  });

  // Deduplicate by id
  const seen = new Set<string>();
  return all.filter(t => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });
};

// ✅ GET TASK BY ID  →  GET /getprojectsById/:id   (backend naming)
export const getTaskById = async (id: string) => {
  const res = await apiClient.get(`/getprojectsById/${id}`);
  const t = res.data.task || res.data;
  return normaliseTask(t);
};

// ✅ UPDATE PROGRESS  →  PUT /update-progress
//    progress values: "Completed" | "Not Completed" | "In Progress"
export const updateTaskProgress = async (
  taskId: string,
  progress: string,
  reason?: string,
) => {
  const payload: Record<string, string> = { taskId, progress };
  if (reason) payload.reason = reason;
  return apiClient.put("/update-progress", payload);
};

// ✅ UPDATE STATUS shorthand (maps to updateTaskProgress)
export const updateTaskStatus = async (id: string, status: string) => {
  // Map simple status → progress enum the backend expects
  const progressMap: Record<string, string> = {
    completed:  "Completed",
    complete:   "Completed",
    pending:    "Not Completed",
    inprogress: "In Progress",
  };
  const progress = progressMap[status.toLowerCase()] ?? status;
  return updateTaskProgress(id, progress);
};

// ✅ DELETE TASK  →  DELETE /delete/:id
export const deleteTask = async (id: string) => {
  return apiClient.delete(`/delete/${id}`);
};

// ─── Normaliser ───────────────────────────────────────────────────────────────
function normaliseTask(t: any) {
  return {
    id:          t.id || t._id,
    projectId:   t.projectId,
    employeeId:  t.employeeId,
    description: t.description,
    startTime:   t.startTime,
    endTime:     t.endTime,
    day:         t.day,
    status:      t.status   || "pending",
    progress:    t.progress || null,
    reason:      t.reason   || null,
  };
}