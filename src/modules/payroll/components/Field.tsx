import React from 'react';

interface FieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}

export default function Field({ label, placeholder, value, onChange, type = 'text' }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 px-3 rounded-xl border border-slate-200 text-sm text-slate-800 bg-slate-50
                   focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400
                   placeholder:text-slate-400 transition"
      />
    </div>
  );
}