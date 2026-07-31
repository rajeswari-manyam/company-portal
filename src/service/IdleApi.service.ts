// src/service/IdleApi.service.ts
import axios from "axios";

const api = axios.create({
    baseURL: (import.meta as unknown as { env: { VITE_API_BASE_URL: string } }).env
        .VITE_API_BASE_URL,
});

export interface IdleSession {
    _id: string;
    employeeId: string;
    startTime: string;   // normalized from API's "start"
    endTime?: string;    // normalized from API's "end"
    reason?: string;
    duration?: number;
}

// POST /startIdleTime → body: { employeeId }
export const startIdleApi = async (
    employeeId: string,
): Promise<{ idleId: string | null }> => {
    const res = await api.post(
        "/startIdleTime",
        { employeeId },                                          // ← plain object → JSON
        { headers: { "Content-Type": "application/json" } },
    );

    const idleId: string | null =
        res.data?.idle?._id ??
        res.data?.idleId ??
        res.data?._id ??
        null;

    return { idleId };
};

// POST /endIdleTime → body: { employeeId, idleId, reason }
export const endIdleApi = async (
    employeeId: string,
    reason: string,
    idleId?: string,                                             // ← optional idleId
): Promise<unknown> => {
    const res = await api.post(
        "/endIdleTime",
        {
            employeeId,
            reason,
            ...(idleId ? { idleId } : {}),                     // ← include only when present
        },
        { headers: { "Content-Type": "application/json" } },   // ← JSON, not url-encoded
    );
    return res.data;
};

// GET /getIdleLogs/:employeeId → normalizes start→startTime, end→endTime
export const getIdleLogsApi = async (
    employeeId: string,
): Promise<IdleSession[]> => {
    const res = await api.get(`/getIdleLogs/${employeeId}`);

    let raw: any[] = [];
    if (Array.isArray(res.data)) raw = res.data;
    else if (Array.isArray(res.data?.idleLogs)) raw = res.data.idleLogs;
    else if (Array.isArray(res.data?.data)) raw = res.data.data;

    // Normalize API fields (start→startTime, end→endTime)
    return raw.map(s => ({
        ...s,
        _id: s._id ?? '',
        startTime: s.startTime ?? s.start ?? '',
        endTime: s.endTime ?? s.end ?? undefined,
    })) as IdleSession[];
};

// GET /idle/:idleId → single idle record
export const getIdleByEmployeeApi = async (
    idleId: string,
): Promise<IdleSession | null> => {
    const res = await api.get(`/idle/${idleId}`);
    const raw = res.data?.idle ?? res.data?.data ?? res.data;
    if (!raw?._id) return null;
    return {
        ...raw,
        startTime: raw.startTime ?? raw.start ?? '',
        endTime: raw.endTime ?? raw.end ?? undefined,
    } as IdleSession;
};

// POST /update-Activity (heartbeat ping)
// POST /update-Activity (heartbeat ping)
export const updateActivityApi = async (
    employeeId: string,
): Promise<void> => {
    // Backend /update-Activity endpoint is currently unavailable.
    // Do nothing to avoid repeated 404 errors.
    return;
};
        // non-fatal
 