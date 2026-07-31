import apiClient from "./apiClient";

// ─── CREATE TASK ──────────────────────────────────────────────────────────────
export const createTask = async (data: {
  projectId: string;
  employeeId: string;
  description: string;
  startTime: string;
  endTime: string;
  day: string;
}) => {
  const urlencoded = new URLSearchParams();
  urlencoded.append("projectId", data.projectId);
  urlencoded.append("employeeId", data.employeeId);
  urlencoded.append("description", data.description);
  urlencoded.append("startTime", data.startTime);
  urlencoded.append("day", data.day);
  // endTime intentionally omitted at creation

  const res = await apiClient.post("/create-task", urlencoded, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const mongoId = res.data?._id || res.data?.id || Math.random().toString();
  return {
    id: mongoId,
    _id: mongoId,
    ...data,
    status: res.data?.status || "pending",
    progress: res.data?.progress || null,
    reason: res.data?.reason || null,
  };
};

// ─── GET TASKS BY EMPLOYEE + PROJECT ─────────────────────────────────────────
export const getTasksByEmployee = async (
  employeeId: string,
  projectId: string
): Promise<any[]> => {
  const res = await apiClient.get(`/getTasksById/${employeeId}`, {
    params: { employeeId, projectId },
  });

  console.log(`[taskApi] getTasksByEmployee raw response:`, res.data);

  let tasks: any[] = [];
  if (Array.isArray(res.data)) tasks = res.data;
  else if (Array.isArray(res.data?.tasks)) tasks = res.data.tasks;
  else if (Array.isArray(res.data?.data)) tasks = res.data.data;
  else if (Array.isArray(res.data?.result)) tasks = res.data.result;
  else if (res.data?._id) tasks = [res.data];

  // ✅ Always normalise id and _id to MongoDB _id
  return tasks.map((t) => {
    const mongoId = t._id || t.id || '';
    return { ...t, id: mongoId, _id: mongoId };
  });
};

export const updateTaskProgress = async (
  taskId: string,
  progress: string,
  reason?: string,
  endTime?: string,
) => {
  const payload: Record<string, string> = {
    taskId, // ✅ correct key
    progress
  };

  if (reason) payload.reason = reason;
  if (endTime) payload.endTime = endTime;

  console.log('[taskApi] updateTaskProgress →', payload);

  return apiClient.put("/update-progress", new URLSearchParams(payload), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
};

// ─── GET TASK BY ID ───────────────────────────────────────────────────────────
export const getTaskById = async (id: string) => {
  const res = await apiClient.get(`/gettaskById/${id}`);
  return res.data.task || res.data;
};

// ─── DELETE TASK ─────────────────────────────────────────────────────────────
export const deleteTask = async (id: string) => {
  return apiClient.delete(`/delete/${id}`);
};