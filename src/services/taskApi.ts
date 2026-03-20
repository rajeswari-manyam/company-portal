import apiClient from "./apiClient";

// ✅ CREATE TASK
export const createTask = async (data: any) => {
  const payload = {
    projectId: data.projectId,
    employeeId: data.employeeId,
    description: data.description,
    startTime: data.startTime,
    endTime: data.endTime,
    day: data.day,
  };

  const res = await apiClient.post("/createTask", payload);

  return {
    id: res.data?.id || res.data?._id || Math.random().toString(),
    ...payload,
    status: res.data?.status || "pending",
  };
};

// ✅ GET ALL TASKS
export const getTasks = async () => {
  const res = await apiClient.get("/getAllTasks");

  const list = Array.isArray(res.data)
    ? res.data
    : res.data.tasks || res.data.data || [];

  return list.map((t: any) => ({
    id: t.id || t._id,
    projectId: t.projectId,
    employeeId: t.employeeId,
    description: t.description,
    startTime: t.startTime,
    endTime: t.endTime,
    day: t.day,
    status: t.status || "pending",
  }));
};

// ✅ GET TASKS BY EMPLOYEE
export const getTasksByEmployee = async (employeeId: string) => {
  const res = await apiClient.get(`/getTasksByEmployee/${employeeId}`);

  const list = res.data.tasks || res.data.data || [];

  return list.map((t: any) => ({
    id: t.id || t._id,
    projectId: t.projectId,
    employeeId: t.employeeId,
    description: t.description,
    startTime: t.startTime,
    endTime: t.endTime,
    day: t.day,
    status: t.status || "pending",
  }));
};

// ✅ UPDATE TASK
export const updateTask = async (id: string, data: any) => {
  const payload = {
    description: data.description,
    startTime: data.startTime,
    endTime: data.endTime,
    day: data.day,
  };

  await apiClient.put(`/updateTask/${id}`, payload);

  return { id, ...payload };
};

// ✅ DELETE TASK
export const deleteTask = async (id: string) => {
  return apiClient.delete(`/deleteTask/${id}`);
};

// ✅ UPDATE STATUS (COMPLETE / PENDING)
export const updateTaskStatus = async (id: string, status: string) => {
  return apiClient.put(`/updateTaskStatus/${id}`, { status });
};