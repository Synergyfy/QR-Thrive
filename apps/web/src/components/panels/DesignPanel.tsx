import React from 'react';
import type { QRDesignOptions } from '../../types/qr';
import type { DotType, CornerSquareType, CornerDotType } from 'qr-code-styling';
import { Layout, Square, Circle, Palette, MousePointer2 } from 'lucide-react';

interface DesignPanelProps {
  design: QRDesignOptions;
  updateDesign: (updates: Partial<QRDesignOptions>) => void;
}

const DesignPanel: React.FC<DesignPanelProps> = ({ design, updateDesign }) => {
  const dotTypes: { value: DotType; label: string }[] = [
    { value: 'square', label: 'Classic' },
    { value: 'dots', label: 'Dots' },
    { value: 'rounded', label: 'Soft' },
    { value: 'extra-rounded', label: 'Curve' },
    { value: 'classy', label: 'Classy' },
    { value: 'classy-rounded', label: 'Modern' },
  ];

  const cornerSquareTypes: { value: CornerSquareType; label: string }[] = [
    { value: 'square', label: 'Square' },
    { value: 'dot', label: 'Circle' },
    { value: 'extra-rounded', label: 'Rounded' },
  ];

  const cornerDotTypes: { value: CornerDotType; label: string }[] = [
    { value: 'square', label: 'Square' },
    { value: 'dot', label: 'Circle' },
  ];

  const DotPreview = ({ type, active }: { type: DotType, active: boolean }) => {
    const color = active ? '#ffffff' : '#1e293b';
    const viewBox = "0 0 24 24";
    
    switch (type) {
      case 'dots':
        return (
          <svg viewBox={viewBox} className="w-8 h-8">
            <circle cx="6" cy="6" r="2.5" fill={color} />
            <circle cx="18" cy="6" r="2.5" fill={color} />
            <circle cx="6" cy="18" r="2.5" fill={color} />
            <circle cx="18" cy="18" r="2.5" fill={color} />
          </svg>
        );
      case 'rounded':
        return (
          <svg viewBox={viewBox} className="w-8 h-8">
            <rect x="3.5" y="3.5" width="6" height="6" rx="2" fill={color} />
            <rect x="14.5" y="3.5" width="6" height="6" rx="2" fill={color} />
            <rect x="3.5" y="14.5" width="6" height="6" rx="2" fill={color} />
            <rect x="14.5" y="14.5" width="6" height="6" rx="2" fill={color} />
          </svg>
        );
      case 'extra-rounded':
        return (
          <svg viewBox={viewBox} className="w-8 h-8">
            <rect x="3.5" y="3.5" width="6" height="6" rx="3" fill={color} />
            <rect x="14.5" y="3.5" width="6" height="6" rx="3" fill={color} />
            <rect x="3.5" y="14.5" width="6" height="6" rx="3" fill={color} />
            <rect x="14.5" y="14.5" width="6" height="6" rx="3" fill={color} />
          </svg>
        );
      case 'classy':
        return (
          <svg viewBox={viewBox} className="w-8 h-8">
            <path d="M4 4h4v4H4zM16 4h4v4h-4zM4 16h4v4H4z" fill={color} />
            <circle cx="18" cy="18" r="3" fill={color} />
          </svg>
        );
      case 'classy-rounded':
        return (
          <svg viewBox={viewBox} className="w-8 h-8">
            <rect x="4" y="4" width="6" height="6" rx="3" fill={color} />
            <path d="M16 4h4a0 0 0 0 1 0 0v4a0 0 0 0 1 0 0h-4a3 3 0 0 1-3-3v0a3 3 0 0 1 3-3z" fill={color} transform="rotate(90 18 6)" />
            <circle cx="6" cy="18" r="3" fill={color} />
            <rect x="15" y="15" width="6" height="6" rx="2" fill={color} />
          </svg>
        );
      default:
        return (
          <svg viewBox={viewBox} className="w-8 h-8">
            <rect x="4" y="4" width="6" height="6" fill={color} />
            <rect x="14" y="4" width="6" height="6" fill={color} />
            <rect x="4" y="14" width="6" height="6" fill={color} />
            <rect x="14" y="14" width="6" height="6" fill={color} />
          </svg>
        );
    }
  };

  const EyeOuterPreview = ({ type, active }: { type: CornerSquareType, active: boolean }) => {
    const color = active ? '#ffffff' : '#1e293b';
    switch (type) {
      case 'dot':
        return <div className="w-6 h-6 rounded-full border-[3px]" style={{ borderColor: color }} />;
      case 'extra-rounded':
        return <div className="w-6 h-6 rounded-lg border-[3px]" style={{ borderColor: color }} />;
      default:
        return <div className="w-6 h-6 border-[3px]" style={{ borderColor: color }} />;
    }
  };

  const EyeInnerPreview = ({ type, active }: { type: CornerDotType, active: boolean }) => {
    const color = active ? '#ffffff' : '#1e293b';
    switch (type) {
      case 'dot':
        return <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />;
      default:
        return <div className="w-4 h-4" style={{ backgroundColor: color }} />;
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500 max-w-full overflow-hidden">
      {/* Dot Patterns & Colors */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
           <Layout className="w-4 h-4 text-blue-600" />
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Dot Patterns & Base Colors</p>
        </div>
        <div className="flex overflow-x-auto pb-4 gap-4 no-scrollbar -mx-2 px-2">
          {dotTypes.map((t) => (
            <button
              key={t.value}
              onClick={() => updateDesign({ dots: { ...design.dots, type: t.value } })}
              className={`flex-shrink-0 w-20 h-24 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                design.dots.type === t.value
                  ? 'border-blue-600 bg-blue-50/50'
                  : 'border-gray-50 bg-white hover:border-blue-100'
              }`}
            >
               <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                 design.dots.type === t.value ? 'bg-blue-600 shadow-lg shadow-blue-200' : 'bg-gray-50'
               }`}>
                  <DotPreview type={t.value} active={design.dots.type === t.value} />
               </div>
               <span className={`text-[10px] font-bold uppercase tracking-widest ${
                 design.dots.type === t.value ? 'text-blue-600' : 'text-gray-400'
               }`}>
                  {t.label}
               </span>
            </button>
          ))}
        </div>

        {/* Integrated Color Pickers for Pattern and Background */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
           <div className="space-y-2">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Pattern Color</label>
              <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm transition-all focus-within:border-blue-600">
                <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-gray-100 shrink-0">
                  <input
                    type="color"
                    value={design.dots.color}
                    onChange={(e) => updateDesign({ dots: { ...design.dots, color: e.target.value } })}
                    className="absolute inset-0 w-full h-full cursor-pointer scale-150"
                  />
                </div>
                <input
                  type="text"
                  value={design.dots.color.toUpperCase()}
                  onChange={(e) => updateDesign({ dots: { ...design.dots, color: e.target.value } })}
                  className="flex-1 text-[11px] font-semibold text-gray-900 outline-none uppercase"
                />
                <Palette className="w-3.5 h-3.5 text-gray-300" />
              </div>
           </div>
           <div className="space-y-2">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Background Color</label>
              <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm transition-all focus-within:border-blue-600">
                <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-gray-100 shrink-0">
                  <input
                    type="color"
                    value={design.background.color}
                    onChange={(e) => updateDesign({ background: { ...design.background, color: e.target.value } })}
                    className="absolute inset-0 w-full h-full cursor-pointer scale-150"
                  />
                </div>
                <input
                  type="text"
                  value={design.background.color.toUpperCase()}
                  onChange={(e) => updateDesign({ background: { ...design.background, color: e.target.value } })}
                  className="flex-1 text-[11px] font-semibold text-gray-900 outline-none uppercase"
                />
                <Palette className="w-3.5 h-3.5 text-gray-300" />
              </div>
           </div>
        </div>
      </div>

      {/* Eye Outer Shape & Color */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
           <Square className="w-4 h-4 text-blue-600" />
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Eye Outer Shape & Color</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {cornerSquareTypes.map((t) => (
            <button
              key={t.value}
              onClick={() => updateDesign({ cornersSquare: { ...design.cornersSquare, type: t.value } })}
              className={`h-20 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                design.cornersSquare.type === t.value
                  ? 'border-blue-600 bg-blue-50/50'
                  : 'border-gray-50 bg-white hover:border-blue-100'
              }`}
            >
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                 design.cornersSquare.type === t.value ? 'bg-blue-600 shadow-lg shadow-blue-200' : 'bg-gray-50'
               }`}>
                  <EyeOuterPreview type={t.value} active={design.cornersSquare.type === t.value} />
               </div>
               <span className={`text-[9px] font-bold uppercase tracking-widest ${
                 design.cornersSquare.type === t.value ? 'text-blue-600' : 'text-gray-400'
               }`}>
                  {t.label}
               </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm transition-all focus-within:border-blue-600 mt-4 max-w-[200px]">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-gray-100 shrink-0">
            <input
              type="color"
              value={design.cornersSquare.color}
              onChange={(e) => updateDesign({ cornersSquare: { ...design.cornersSquare, color: e.target.value } })}
              className="absolute inset-0 w-full h-full cursor-pointer scale-150"
            />
          </div>
          <div className="flex-1">
             <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Outer Color</p>
             <input
                type="text"
                value={design.cornersSquare.color.toUpperCase()}
                onChange={(e) => updateDesign({ cornersSquare: { ...design.cornersSquare, color: e.target.value } })}
                className="w-full text-[11px] font-semibold text-gray-900 outline-none uppercase"
             />
          </div>
        </div>
      </div>

      {/* Eye Inner Shape & Color */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
           <Circle className="w-4 h-4 text-blue-600" />
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Eye Inner Shape & Color</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {cornerDotTypes.map((t) => (
            <button
              key={t.value}
              onClick={() => updateDesign({ cornersDot: { ...design.cornersDot, type: t.value } })}
              className={`h-20 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                design.cornersDot.type === t.value
                  ? 'border-blue-600 bg-blue-50/50'
                  : 'border-gray-50 bg-white hover:border-blue-100'
              }`}
            >
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                 design.cornersDot.type === t.value ? 'bg-blue-600 shadow-lg shadow-blue-200' : 'bg-gray-50'
               }`}>
                  <EyeInnerPreview type={t.value} active={design.cornersDot.type === t.value} />
               </div>
               <span className={`text-[9px] font-bold uppercase tracking-widest ${
                 design.cornersDot.type === t.value ? 'text-blue-600' : 'text-gray-400'
               }`}>
                  {t.label}
               </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm transition-all focus-within:border-blue-600 mt-4 max-w-[200px]">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-gray-100 shrink-0">
            <input
              type="color"
              value={design.cornersDot.color}
              onChange={(e) => updateDesign({ cornersDot: { ...design.cornersDot, color: e.target.value } })}
              className="absolute inset-0 w-full h-full cursor-pointer scale-150"
            />
          </div>
          <div className="flex-1">
             <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Inner Color</p>
             <input
                type="text"
                value={design.cornersDot.color.toUpperCase()}
                onChange={(e) => updateDesign({ cornersDot: { ...design.cornersDot, color: e.target.value } })}
                className="w-full text-[11px] font-semibold text-gray-900 outline-none uppercase"
             />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignPanel;
