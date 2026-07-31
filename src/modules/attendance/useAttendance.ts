// src/modules/attendance/useAttendance.ts

import { useState, useEffect, useMemo } from "react";
import {
  getAttendanceByEmpIdApi,
  getAttendanceByIdApi,
  type AttendanceRecord,
} from "../../service/Attendance.service";

import { getEmployees } from "../../service/Empolyee.service";
import { ATT_KEYS } from "../../service/Attendance.service";

export interface AttendanceSummary {
  _id: string;
  userId: string;
  userName: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workSeconds: number;
  status: AttendanceRecord["status"];
  raw: AttendanceRecord;
}

export function useAttendance(userId?: string) {
  const [records, setRecords] = useState<AttendanceSummary[]>([]);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [mapByMongoId, setMapByMongoId] = useState<Record<string, string>>({});
  const [mapByEmpCode, setMapByEmpCode] = useState<Record<string, string>>({});

  // ───────────────────────────────
  // LOAD EMPLOYEES
  // ───────────────────────────────
  useEffect(() => {
    async function loadEmployees() {
      try {
        const res = await getEmployees();

        const users = res?.users ?? [];

        const byId: Record<string, string> = {};
        const byEmp: Record<string, string> = {};

        users.forEach((emp: any) => {
          if (emp._id) byId[emp._id] = emp.name;
          if (emp.empId) byEmp[emp.empId] = emp.name;
        });

        setMapByMongoId(byId);
        setMapByEmpCode(byEmp);
      } catch (err) {
        console.log("Employee fetch failed", err);
      }
    }

    loadEmployees();
  }, []);

  // ───────────────────────────────
  // LOAD ATTENDANCE
  // ───────────────────────────────
  useEffect(() => {
    let cancel = false;

    async function fetchData() {
      setIsLoading(true);

      try {
        let raw: AttendanceRecord[] = [];

        if (userId) {
          const history = await getAttendanceByEmpIdApi(userId);
          raw = history || [];
        } else {
          raw = await getAttendanceByEmpIdApi("");
        }

        if (!cancel) {
          setRecords(raw.map(normalise));
        }
      } catch (err) {
        console.log(err);
      } finally {
        if (!cancel) setIsLoading(false);
      }
    }

    fetchData();

    return () => {
      cancel = true;
    };
  }, [userId]);

  // ───────────────────────────────
  // NORMALISE (FINAL SAFE VERSION)
  // ───────────────────────────────
  function normalise(rec: AttendanceRecord): AttendanceSummary {
    const empId = rec.employeeId as string;

    const userName =
      mapByMongoId[empId] ||
      mapByEmpCode[empId] ||
      (rec as any).employeeName ||
      "Unknown";

    return {
      _id: rec._id,
      userId: empId,
      userName,

      date: rec.date,
      checkIn: rec.firstLogin
        ? new Date(rec.firstLogin).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : null,

      checkOut: rec.lastLogout
        ? new Date(rec.lastLogout).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : null,

      workSeconds: Math.round(rec.totalWorkHours * 3600),
      status: rec.status,
      raw: rec,
    };
  }

  // ───────────────────────────────
  // FILTER
  // ───────────────────────────────
  const filtered = useMemo(() => {
    let data = records;

    if (dateFilter) {
      data = data.filter((r) => r.date === dateFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (r) =>
          r.userName.toLowerCase().includes(q) ||
          r.userId.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q)
      );
    }

    return data;
  }, [records, search, dateFilter]);

  return {
    records,
    filtered,
    search,
    setSearch,
    dateFilter,
    setDateFilter,
    isLoading,
  };
}