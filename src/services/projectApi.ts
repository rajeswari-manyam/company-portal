import apiClient from "./apiClient";

// ✅ CREATE PROJECT  →  POST /addProject
export const createProject = async (data: any) => {
  const payload = {
    name: data.projectName ?? data.name,   // backend field is "name"
    description: data.description,
    startDate: data.startDate,
    endDate: data.endDate,
    managerId: data.managerId,
    teamMembers: data.teamMembers || [],
  };

  const res = await apiClient.post("/addProject", payload);

  return {
    id: res.data?.id || res.data?._id || Math.random().toString(),
    projectName: payload.name,
    ...payload,
    status: res.data?.status || "active",
  };
};

// ✅ GET ALL PROJECTS  →  GET /getAllProjects
export const getProjects = async () => {
  const res = await apiClient.get("/getAllProjects");

  const list = Array.isArray(res.data)
    ? res.data
    : res.data.projects || res.data.data || [];

  return list.map((p: any) => normaliseProject(p));
};

// ✅ GET PROJECTS FOR A SPECIFIC EMPLOYEE  (client-side filter — backend has no employee route)
//    Filters by teamMembers array OR managerId matching the employeeId
export const getProjectsByEmployee = async (employeeId: string) => {
  const all = await getProjects();
  return all.filter(
    (p: any) =>
      p.managerId === employeeId ||
      (Array.isArray(p.teamMembers) && p.teamMembers.includes(employeeId)),
  );
};

// ✅ GET PROJECT BY ID  →  GET /getProjectById/:id
export const getProjectById = async (id: string) => {
  const res = await apiClient.get(`/getProjectById/${id}`);
  const p = res.data.project || res.data;
  return normaliseProject(p);
};

// ✅ UPDATE PROJECT  →  PUT /updateProjectById/:id
export const updateProject = async (id: string, data: any) => {
  const payload = {
    name: data.projectName ?? data.name,
    description: data.description,
    startDate: data.startDate,
    endDate: data.endDate,
    managerId: data.managerId,
    teamMembers: data.teamMembers,
  };

  await apiClient.put(`/updateProjectById/${id}`, payload);
  return { id, projectName: payload.name, ...payload };
};

// ✅ DELETE PROJECT  →  DELETE /deleteProject/:id
export const deleteProject = async (id: string) => {
  return apiClient.delete(`/deleteProject/${id}`);
};

// ✅ UPDATE STATUS  →  PUT /updateProjectStatus/:id   (if endpoint exists)
export const updateProjectStatus = async (id: string, status: string) => {
  return apiClient.put(`/updateProjectStatus/${id}`, { status });
};

// ─── Normaliser ───────────────────────────────────────────────────────────────
function normaliseProject(p: any) {
  return {
    id:          p.id || p._id,
    projectName: p.projectName || p.name,   // backend sends "name"
    description: p.description,
    startDate:   p.startDate,
    endDate:     p.endDate,
    managerId:   p.managerId,
    teamMembers: p.teamMembers || [],
    status:      p.status || "active",
  };
}