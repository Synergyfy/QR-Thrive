import type { ReactNode } from 'react';
import { cn } from './Button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/** Compact, action-oriented empty state (mobile-first, no oversized illustration). */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 py-12 text-center',
        className,
      )}
    >
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-base font-bold text-gray-900">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 mt-1.5 max-w-xs mx-auto">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export default EmptyState;
