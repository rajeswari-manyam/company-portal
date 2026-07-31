// src/modules/attendance/components/AttendanceTable.tsx

import React from "react";
import { Table, Badge } from "../../../components/ui";
import type { Column } from "../../../components/ui/Table";
import type { AttendanceSummary } from "../useAttendance";

function formatSeconds(s: number) {
  if (!s) return "—";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

const WORK_DAY = 8 * 3600;

function percent(sec: number) {
  return Math.min(Math.round((sec / WORK_DAY) * 100), 100);
}

export default function AttendanceTable({
  records,
}: {
  records: AttendanceSummary[];
}) {
  const columns: Column<AttendanceSummary>[] = [
    {
      key: "userId",
      header: "Employee",
      render: (a) => (
        <span className="font-semibold">{a.userName}</span>
      ),
    },
    {
      key: "date",
      header: "Date",
    },
    {
      key: "checkIn",
      header: "Check In",
      render: (a) => a.checkIn || "—",
    },
    {
      key: "checkOut",
      header: "Check Out",
      render: (a) => a.checkOut || "—",
    },
    {
      key: "workSeconds",
      header: "Hours",
      render: (a) => formatSeconds(a.workSeconds),
    },
    {
      key: "status",
      header: "Status",
      render: (a) => <Badge status={a.status} />,
    },
    {
      key: "completion",
      header: "Completion",
      render: (a) => {
        const p = percent(a.workSeconds);

        return (
          <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-gray-200 rounded">
              <div
                className={`h-full ${
                  p > 80
                    ? "bg-green-500"
                    : p > 50
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${p}%` }}
              />
            </div>
            <span>{p}%</span>
          </div>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      data={records}
      keyExtractor={(a) => a._id}
      emptyMessage="No attendance found"
    />
  );
}