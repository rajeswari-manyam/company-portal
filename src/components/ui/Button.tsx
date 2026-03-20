import React from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:   'bg-[#0B0E92] text-white hover:bg-[#0a0d7a] active:bg-[#08095e] shadow-sm',
  secondary: 'bg-[#69A6F0] text-white hover:bg-[#5090d8] active:bg-[#4580c0] shadow-sm',
  danger:    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm',
  ghost:     'bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200',
  outline:   'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 active:bg-slate-100',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-5 py-3 text-base gap-2.5',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-semibold rounded-xl
        transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#69A6F0]/50
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]} ${sizeClasses[size]} ${className}
      `}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon}
      {children}
      {!loading && iconRight}
    </button>
  );
}
