// ✅ Use type-only import for types
import React from 'react';
import type { ReactNode, FC } from 'react';

interface EmptyStateProps {
  icon?: string;
  message?: string;
  description?: string;
  action?: ReactNode;
}

// Optional: you can declare as FC if you like
const EmptyState: FC<EmptyStateProps> = ({
  icon = '📭',
  message = 'No data found',
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <span className="text-5xl mb-4">{icon}</span>
      <p className="text-slate-600 font-semibold text-base">{message}</p>
      {description && <p className="text-slate-400 text-sm mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;