import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from './Button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  maxWidth?: string;
  className?: string;
}

/**
 * Mobile-first modal: fits within the viewport, scrolls internally,
 * closes on backdrop click / Escape, has a clear close control.
 */
export function Modal({ open, onClose, children, title, maxWidth = 'max-w-md', className }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]',
          maxWidth,
          className,
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
            <h2 className="text-base font-bold text-gray-900">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
