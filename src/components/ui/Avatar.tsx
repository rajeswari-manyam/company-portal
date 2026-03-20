import React from 'react';
import { getInitials, getAvatarColor } from '../../utils/helpers';

interface AvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

export default function Avatar({ name, size = 'md', className = '' }: AvatarProps) {
  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ${getAvatarColor(name)} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
