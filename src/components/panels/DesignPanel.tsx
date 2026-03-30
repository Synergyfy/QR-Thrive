import React from 'react';
import type { QRDesignOptions } from '../../types/qr';
import type { DotType, CornerSquareType, CornerDotType } from 'qr-code-styling';
import { Layout, Square, Circle } from 'lucide-react';

interface DesignPanelProps {
  design: QRDesignOptions;
  updateDesign: (updates: Partial<QRDesignOptions>) => void;
}

const DesignPanel: React.FC<DesignPanelProps> = ({ design, updateDesign }) => {
  const dotTypes: { value: DotType; label: string }[] = [
    { value: 'square', label: 'Square' },
    { value: 'dots', label: 'Dots' },
    { value: 'rounded', label: 'Rounded' },
    { value: 'extra-rounded', label: 'Extra' },
    { value: 'classy', label: 'Classy' },
    { value: 'classy-rounded', label: 'Modern' },
  ];

  const cornerSquareTypes: { value: CornerSquareType; label: string }[] = [
    { value: 'square', label: 'Classic' },
    { value: 'dot', label: 'Circle' },
    { value: 'extra-rounded', label: 'Soft' },
  ];

  const cornerDotTypes: { value: CornerDotType; label: string }[] = [
    { value: 'square', label: 'Hard' },
    { value: 'dot', label: 'Soft' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
           <Layout className="w-4 h-4 text-blue-600" />
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Dot Patterns</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {dotTypes.map((t) => (
            <button
              key={t.value}
              onClick={() => updateDesign({ dots: { ...design.dots, type: t.value } })}
              className={`px-3 py-2.5 text-[11px] rounded-xl border transition-all text-center ${
                design.dots.type === t.value
                  ? 'border-blue-600 bg-blue-600 text-white font-bold shadow-lg shadow-blue-100'
                  : 'border-gray-100 bg-white text-gray-500 hover:border-blue-600/10 hover:text-blue-600 font-semibold'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
           <Square className="w-4 h-4 text-blue-600" />
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Eye Outer Shape</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {cornerSquareTypes.map((t) => (
            <button
              key={t.value}
              onClick={() => updateDesign({ cornersSquare: { ...design.cornersSquare, type: t.value } })}
              className={`px-3 py-2.5 text-[11px] rounded-xl border transition-all text-center ${
                design.cornersSquare.type === t.value
                  ? 'border-blue-600 bg-blue-600 text-white font-bold shadow-lg shadow-blue-100'
                  : 'border-gray-100 bg-white text-gray-500 hover:border-blue-600/10 hover:text-blue-600 font-semibold'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
           <Circle className="w-4 h-4 text-blue-600" />
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Eye Inner Shape</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {cornerDotTypes.map((t) => (
            <button
              key={t.value}
              onClick={() => updateDesign({ cornersDot: { ...design.cornersDot, type: t.value } })}
              className={`px-3 py-2.5 text-[11px] rounded-xl border transition-all text-center ${
                design.cornersDot.type === t.value
                  ? 'border-blue-600 bg-blue-600 text-white font-bold shadow-lg shadow-blue-100'
                  : 'border-gray-100 bg-white text-gray-500 hover:border-blue-600/10 hover:text-blue-600 font-semibold'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DesignPanel;
