import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
}

export default function Textarea({ label, error, wrapperClassName = '', className = '', id, ...props }: TextareaProps) {
  const textId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={`flex flex-col gap-1.5 ${wrapperClassName}`}>
      {label && (
        <label htmlFor={textId} className="text-sm font-semibold text-slate-700">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        id={textId}
        className={`
          w-full rounded-xl border px-4 py-2.5 text-sm text-slate-800 bg-white
          placeholder:text-slate-400 resize-none transition-all duration-150
          focus:outline-none focus:ring-2 focus:ring-[#69A6F0]/50 focus:border-[#69A6F0]
          ${error ? 'border-red-400' : 'border-slate-200'}
          ${className}
        `}
        rows={props.rows ?? 3}
        {...props}
      />
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}
