import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getPayslipsByEmployee } from "../../service/payrollApi";
import { MONTHS } from "../../constants";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import MonthSelector from "../../modules/payroll/components/MonthlySelector";
import TabSelector from "../../modules/payroll/components/TabSelector";
import SkeletonRow from "../../modules/payroll/components/SkeletonRow";

export default function HRPayroll() {
  const { user } = useAuth();
  const userId = (user as any)?._id ?? (user as any)?.id ?? "";

  const [myPayslips, setMyPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [month, setMonth] = useState(MONTHS[new Date().getMonth()]);
  const [tab, setTab] = useState<"filtered" | "all">("filtered");

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    setLoading(true);
    setError("");

    getPayslipsByEmployee(userId)
      .then((res) => {
        if (!cancelled) setMyPayslips(res || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load payslips");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Filter
  const filtered = myPayslips.filter(
    (p) => p.month?.toLowerCase() === month.toLowerCase()
  );

  const displayed = tab === "filtered" ? filtered : myPayslips;

  // ✅ PDF Download (NO API)
  const handleDownload = async (id: string) => {
    const element = document.getElementById(`payslip-${id}`);
    if (!element) return;

    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF();
    pdf.addImage(imgData, "PNG", 10, 10, 180, 0);
    pdf.save(`payslip-${id}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      <h1 className="text-3xl font-bold">Payroll</h1>

      <div className="flex gap-4">
        <MonthSelector
          month={month}
          onChange={(m) => setMonth(m as typeof MONTHS[number])}
        />
        <TabSelector
          tab={tab}
          counts={{ filtered: filtered.length, all: myPayslips.length }}
          onChange={setTab}
          month={month}
        />
      </div>

      <div className="space-y-4">
        {loading && [1, 2, 3].map((n) => <SkeletonRow key={n} />)}

        {!loading && error && (
          <div className="text-red-500">{error}</div>
        )}

        {!loading &&
          !error &&
          displayed.map((p, i) => (
            <div
              key={p.id}
              id={`payslip-${p.id}`}
              className="bg-white p-4 rounded shadow"
            >
              {/* Payslip UI */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-semibold text-lg">
                    {p.employeeName || "Employee"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {p.month}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-green-600">
                    ₹{p.amountCredited || 0}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="mt-3 text-sm text-gray-600 space-y-1">
                <p>Basic: ₹{p.basic || 0}</p>
                <p>HRA: ₹{p.hra || 0}</p>
                <p>Deductions: ₹{p.deductions || 0}</p>
              </div>

              {/* Download Button */}
              <button
                onClick={() => handleDownload(p.id)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
              >
                Download PDF
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}