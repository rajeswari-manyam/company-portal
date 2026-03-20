import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  bg: string;
  text: string;
  onClick?: () => void;
  trend?: { value: number; label?: string };
}

export default function StatCard({ label, value, icon, bg, text, onClick, trend }: StatCardProps) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      onClick={onClick}
      className={`${bg} rounded-2xl p-5 border border-slate-100 text-left w-full transition-all duration-150 ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''}`}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <p className={`text-3xl font-black ${text}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-1 font-medium">{label}</p>
      {trend && (
        <p className={`text-xs mt-2 font-semibold ${trend.value >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label ?? 'vs last month'}
        </p>
      )}
    </Wrapper>
  );
}
