import type { ReactNode } from 'react';
import { cn } from './Button';

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
}

/** Consistent section heading: optional eyebrow pill, title, description. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn('space-y-2', align === 'center' && 'text-center', className)}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2 className="section-title">{title}</h2>
      {description && (
        <p
          className={cn(
            'text-sm sm:text-base text-slate-500 font-medium',
            align === 'center' && 'mx-auto max-w-2xl',
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}

export default SectionHeading;
