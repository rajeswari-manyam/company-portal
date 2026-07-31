import React, { useState } from "react";
import { formatCurrency } from "../../../utils/helpers";
import type { MyPayslip } from "../payRoll.types";

interface PayslipRowProps {
  payslip: MyPayslip;
  index: number;
onDownload?: () => void; // ✅ new (frontend PDF)
}

export default function PayslipRow({ payslip, index, onDownload }: PayslipRowProps) {
  const [downloading, setDownloading] = useState(false);
  const [dlError, setDlError] = useState("");

  const { id, name, department, baseSalary, month, year, status, amountCredited } = payslip;

  const hra        = Math.round(baseSalary * 0.2);
  const allowances = Math.round(baseSalary * 0.1);
  const deductions = Math.round(baseSalary * 0.05);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDownload) return;

    setDownloading(true);
    setDlError("");
    try {
    await onDownload();
    } catch (err: any) {
      setDlError(err?.message ?? "Download failed.");
    } finally {
      setDownloading(false);
    }
  };

  // ─── Month Badge ─────────────────────────────────────────────────────────────
  const MonthBadge = () => (
    <div className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-400 text-white shadow-md shadow-indigo-200">
      <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
        {month.slice(0, 3).toUpperCase()}
      </span>
      <span className="text-lg font-black leading-none">{year.toString().slice(2)}</span>
    </div>
  );

  // ─── Payslip Info ───────────────────────────────────────────────────────────
  const Info = () => (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-bold text-slate-800">{name}</span>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-500">
          {department}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
            status === "paid"
              ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"
              : "bg-violet-50 text-violet-600 ring-1 ring-violet-100"
          }`}
        >
          {status || "Generated"}
        </span>
      </div>

      {/* Breakdown */}
      <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-400">
        <span>Base: {formatCurrency(baseSalary)}</span>
        <span>HRA: {formatCurrency(hra)}</span>
        <span>Allowances: {formatCurrency(allowances)}</span>
        <span>Deductions: −{formatCurrency(deductions)}</span>
      </div>

      {dlError && (
        <span className="mt-1 text-xs font-medium text-red-500">⚠ {dlError}</span>
      )}
    </div>
  );

  // ─── Amount Credited ───────────────────────────────────────────────────────
  const Amount = () => (
    <div className="hidden text-right sm:block">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Credited</p>
      <p className="text-lg font-black text-indigo-700">{formatCurrency(amountCredited)}</p>
    </div>
  );

  // ─── Download Button ───────────────────────────────────────────────────────
  const DownloadBtn = () => (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="flex flex-shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-200 transition-all duration-200 hover:opacity-90 hover:shadow-lg disabled:cursor-wait disabled:opacity-60"
    >
      {downloading ? (
        <>
          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="hidden sm:inline">Downloading…</span>
        </>
      ) : (
        <>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 4v12m-4-4l4 4 4-4" />
          </svg>
          <span className="hidden sm:inline">Download</span>
        </>
      )}
    </button>
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="group flex flex-wrap items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-md"
      style={{ animationDelay: `${index * 60}ms`, animation: "fadeUp 0.4s ease both" }}
    >
      <MonthBadge />
      <Info />
      <Amount />
      <DownloadBtn />
    </div>
  );
}