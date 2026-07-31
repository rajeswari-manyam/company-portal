import React from "react";
import { Download, Loader2 } from "lucide-react";
import { formatCurrency } from "../../../utils/helpers";

export default function PayrollTable({
  payslips,
  onDownload,
  downloadingId,
}: any) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">

        <thead>
          <tr className="bg-slate-50 border-b">
            <th className="px-4 py-3">Employee</th>
            <th className="px-4 py-3">Emp ID</th>
            <th className="px-4 py-3">Period</th>
            <th className="px-4 py-3">Net</th>
            <th className="px-4 py-3">Download</th>
          </tr>
        </thead>

        <tbody>
          {payslips.map((p: any) => (
            <tr key={p.id} className="border-b">

              {/* Employee Name */}
              <td className="px-4 py-3">
                <p className="font-semibold">
                  {p.employee?.name || "Unknown Employee"}
                </p>
                <p className="text-xs text-gray-400">
                  {p.employee?.email || "—"}
                </p>
              </td>

              {/* Employee ID */}
              <td className="px-4 py-3">
                {p.employee?.employeeId || "—"}
              </td>

              {/* Period */}
              <td className="px-4 py-3">
                {p.month} {p.year}
              </td>

              {/* Net Salary */}
              <td className="px-4 py-3 font-bold text-green-600">
                {formatCurrency(p.amountCredited)}
              </td>

              {/* Download */}
              <td className="px-4 py-3">
                <button
                  onClick={() => onDownload?.(p.id)}
                  className="px-3 py-1 bg-black text-white rounded"
                >
                  {downloadingId === p.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Download size={14} />
                  )}
                </button>
              </td>

            </tr>
          ))}
        </tbody>

      </table>
    </div>
  );
}