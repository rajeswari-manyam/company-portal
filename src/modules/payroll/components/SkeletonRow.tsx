import React from "react";

export default function SkeletonRow() {
  return (
    <div className="flex animate-pulse items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4">
      <div className="h-14 w-14 flex-shrink-0 rounded-xl bg-slate-100" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-40 rounded bg-slate-100" />
        <div className="h-3 w-24 rounded bg-slate-100" />
      </div>
      <div className="h-6 w-24 rounded bg-slate-100" />
      <div className="h-9 w-28 rounded-xl bg-slate-100" />
    </div>
  );
}