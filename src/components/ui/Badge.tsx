import React from 'react';
import { getStatusColor } from '../../utils/helpers';

interface BadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export default function Badge({ status, label, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${getStatusColor(status)} ${className}`}>
      {label ?? status.replace(/-/g, ' ')}
    </span>
  );
}
