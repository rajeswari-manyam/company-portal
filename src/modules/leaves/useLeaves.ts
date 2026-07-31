import { useState, useEffect, useCallback, useMemo } from "react";
import toast from "react-hot-toast";

import {
  getLeaves,
  getLeavesByEmployee,
  createLeave,
  updateLeaveStatus,
} from "../../service/leaveApi";

import type { LeaveRequest } from "../../types";

export function useLeaves(employeeId?: string) {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = employeeId
        ? await getLeavesByEmployee(employeeId)
        : await getLeaves();
      setLeaves(data);
    } catch (err) {
      toast.error("Failed to load leaves");
    } finally {
      setLoading(false);
    }
  }, [employeeId]);
  useEffect(() => {
    refresh();
  }, [refresh]);

  // ─── FILTERED DATA ─────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();

    return leaves.filter((l) => {
      const matchSearch =
        !q ||
        l.userName?.toLowerCase().includes(q) ||
        l.department?.toLowerCase().includes(q) ||
        l.leaveType?.toLowerCase().includes(q);

      const matchStatus =
        statusFilter === "all" || l.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [leaves, search, statusFilter]);

  // ─── APPLY LEAVE ───────────────────
  const apply = async (data: Omit<LeaveRequest, "id">) => {
    try {
      await createLeave(data);
      await refresh();
      toast.success("Leave applied");
      return true;
    } catch {
      toast.error("Failed to apply leave");
      return false;
    }
  };

  // ─── APPROVE ───────────────────────
  const approve = async (id: string) => {
    try {
      await updateLeaveStatus(id, "approved");
      await refresh();
      toast.success("Approved");
    } catch {
      toast.error("Failed");
    }
  };

  // ─── REJECT ────────────────────────
  const reject = async (id: string) => {
    try {
      await updateLeaveStatus(id, "rejected");
      await refresh();
      toast.success("Rejected");
    } catch {
      toast.error("Failed");
    }
  };

  const stats = useMemo(
    () => ({
      total: leaves.length,
      pending: leaves.filter((l) => l.status === "pending").length,
      approved: leaves.filter((l) => l.status === "approved").length,
      rejected: leaves.filter((l) => l.status === "rejected").length,
    }),
    [leaves]
  );

  return {
    leaves,
    filtered,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    apply,
    approve,
    reject,
    refresh,
    stats,
  };
}