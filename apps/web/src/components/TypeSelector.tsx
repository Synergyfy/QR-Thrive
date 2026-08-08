import { useState } from 'react';
import { ChevronDown, CheckCircle2, Lock } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface QrTypeOption {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  category: 'dynamic' | 'static';
}

interface TypeSelectorProps {
  qrTypes: QrTypeOption[];
  selected?: string | null;
  onHover?: (id: string | null) => void;
  onSelect: (id: string) => void;
  isLocked?: (id: string) => boolean;
}

export default function TypeSelector({ qrTypes, selected, onHover, onSelect, isLocked }: TypeSelectorProps) {
  const [open, setOpen] = useState(false);
  const selectedType = qrTypes.find(t => t.id === selected);

  const handleSelect = (id: string) => {
    if (isLocked?.(id)) return;
    setOpen(false);
    onSelect(id);
  };

  return (
    <div className="relative">
      {/* Desktop: compact grid */}
      <div className="hidden lg:grid grid-cols-2 xl:grid-cols-4 gap-2">
        {qrTypes.map(type => {
          const locked = isLocked?.(type.id);
          return (
            <button
              key={type.id}
              type="button"
              onMouseEnter={() => onHover?.(type.id)}
              onMouseLeave={() => onHover?.(null)}
              onClick={() => handleSelect(type.id)}
              className={cn(
                "flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all group relative",
                selected === type.id
                  ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-100"
                  : locked
                    ? "border-gray-100 bg-gray-50/50 opacity-70 cursor-not-allowed"
                    : "border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50/40"
              )}
              aria-pressed={selected === type.id}
            >
              <div className={cn(
                "w-9 h-9 shrink-0 rounded-lg flex items-center justify-center transition-colors",
                selected === type.id
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                  : locked
                    ? "bg-gray-100 text-gray-300"
                    : "bg-gray-50 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600"
              )}>
                <type.icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className={cn(
                  "block text-xs font-semibold leading-tight truncate",
                  selected === type.id ? "text-blue-600" : "text-gray-900"
                )}>{type.title}</span>
                <span className="block text-[10px] text-gray-400 leading-tight truncate">{type.description}</span>
              </div>
              {locked ? (
                <Lock className="w-3.5 h-3.5 text-gray-300 shrink-0" />
              ) : selected === type.id ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              ) : type.category === 'dynamic' ? (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Mobile: dropdown */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center gap-3 p-3 rounded-2xl border border-gray-200 bg-white shadow-sm transition-all active:scale-[0.99]"
          aria-expanded={open}
        >
          {selectedType ? (
            <>
              <div className={cn(
                "w-10 h-10 shrink-0 rounded-xl flex items-center justify-center",
                selected ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "bg-gray-100 text-gray-500"
              )}>
                <selectedType.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <span className="block text-sm font-semibold text-gray-900 truncate">{selectedType.title}</span>
                <span className="block text-[11px] text-gray-400 truncate">{selectedType.description}</span>
              </div>
            </>
          ) : (
            <span className="flex-1 text-left text-sm font-medium text-gray-500">Select a QR type...</span>
          )}
          <ChevronDown className={cn("w-5 h-5 text-gray-400 transition-transform shrink-0", open && "rotate-180")} />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-30 bg-slate-900/10" onClick={() => setOpen(false)} />
            <div className="absolute z-40 mt-2 w-full max-h-80 overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-2xl shadow-slate-200/60 py-1">
              {qrTypes.map(type => {
                const locked = isLocked?.(type.id);
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleSelect(type.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                      selected === type.id ? "bg-blue-50/60" : locked ? "opacity-60" : "hover:bg-gray-50"
                    )}
                  >
                    <div className={cn(
                      "w-9 h-9 shrink-0 rounded-lg flex items-center justify-center",
                      selected === type.id ? "bg-blue-600 text-white" : locked ? "bg-gray-100 text-gray-300" : "bg-gray-100 text-gray-500"
                    )}>
                      <type.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={cn(
                        "block text-sm font-medium leading-tight truncate",
                        selected === type.id ? "text-blue-600" : "text-gray-900"
                      )}>{type.title}</span>
                      <span className="block text-[11px] text-gray-400 leading-tight truncate">{type.description}</span>
                    </div>
                    {locked ? (
                      <Lock className="w-4 h-4 text-gray-300 shrink-0" />
                    ) : selected === type.id ? (
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
