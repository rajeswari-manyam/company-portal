import React from 'react';

interface EmpIdFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  resolveError: string;
}

export default function EmpIdField({ label, value, onChange, resolveError }: EmpIdFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="MCT0001"
        className="h-10 px-3 rounded-xl border border-slate-200 text-sm text-slate-800 bg-slate-50
                   focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400
                   placeholder:text-slate-400 transition"
      />
      {resolveError && <p className="text-xs text-rose-500 mt-0.5">{resolveError}</p>}
    </div>
  );
}