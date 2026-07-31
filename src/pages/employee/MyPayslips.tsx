import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getPayslipsByEmployee } from "../../service/payrollApi";
import { MONTHS } from "../../constants";

import SummaryCard from "../../modules/payroll/components/SummaryCard";
import MonthSelector from "../../modules/payroll/components/MonthlySelector";
import TabSelector from "../../modules/payroll/components/TabSelector";
import PayslipRow from "../../modules/payroll/components/PaySlipRow";
import SkeletonRow from "../../modules/payroll/components/SkeletonRow";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function MyPayslips() {
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
      .then(res => {
        if (!cancelled) setMyPayslips(res || []);
      })
      .catch(err => {
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
    (p) => p.month.toLowerCase() === month.toLowerCase()
  );

  const displayed = tab === "filtered" ? filtered : myPayslips;

  // ✅ PDF DOWNLOAD FUNCTION (NO API)
  const handleDownload = async (payslip: any) => {
    const element = document.getElementById(`payslip-${payslip.id}`);
    if (!element) return;

    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF();
    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
    pdf.save(`payslip-${payslip.month}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 sm:p-6 lg:p-8 space-y-8">
      <h1 className="text-3xl font-black text-slate-900">Payroll</h1>
      <p className="text-sm text-slate-500">
        View and download your payslips
      </p>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <MonthSelector
          month={month}
          onChange={(m) => setMonth(m as typeof MONTHS[number])}
        />
        <TabSelector
          tab={tab}
          counts={{
            filtered: filtered.length,
            all: myPayslips.length,
          }}
          onChange={setTab}
          month={month}
        />
      </div>

      {/* Payslips */}
      <div className="space-y-3">
        {loading &&
          [1, 2, 3].map((n) => <SkeletonRow key={n} />)}

        {!loading && error && (
          <div className="text-red-500">{error}</div>
        )}

        {!loading &&
          !error &&
          displayed.map((p, i) => (
            <div
              key={p.id}
              id={`payslip-${p.id}`}
              className="bg-white p-4 rounded-xl shadow"
            >
              <PayslipRow
                payslip={p}
                index={i}
                onDownload={() => handleDownload(p)} // ✅ use local download
              />
            </div>
          ))}
      </div>
    </div>
  );
}