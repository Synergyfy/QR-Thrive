import React from 'react';
import type { QRDesignOptions } from '../../types/qr';
import { Palette, MousePointer2 } from 'lucide-react';

interface ColorsPanelProps {
  design: QRDesignOptions;
  updateDesign: (updates: Partial<QRDesignOptions>) => void;
}

const ColorsPanel: React.FC<ColorsPanelProps> = ({ design, updateDesign }) => {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
           <Palette className="w-4 h-4 text-blue-600" />
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">QR Pattern Color</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm transition-all focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-gray-100">
            <input
              type="color"
              value={design.dots.color}
              onChange={(e) => updateDesign({ dots: { ...design.dots, color: e.target.value } })}
              className="absolute inset-0 w-full h-full cursor-pointer scale-150"
            />
          </div>
          <div className="flex-1 space-y-1">
             <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Hex Code</p>
             <input
                type="text"
                value={design.dots.color.toUpperCase()}
                onChange={(e) => updateDesign({ dots: { ...design.dots, color: e.target.value } })}
                className="w-full text-sm font-semibold text-gray-900 outline-none uppercase"
             />
          </div>
          <MousePointer2 className="w-4 h-4 text-gray-300" />
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
           <Palette className="w-4 h-4 text-blue-600" />
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Background Color</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm transition-all focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-gray-100">
            <input
              type="color"
              value={design.background.color}
              onChange={(e) => updateDesign({ background: { ...design.background, color: e.target.value } })}
              className="absolute inset-0 w-full h-full cursor-pointer scale-150"
            />
          </div>
          <div className="flex-1 space-y-1">
             <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Hex Code</p>
             <input
                type="text"
                value={design.background.color.toUpperCase()}
                onChange={(e) => updateDesign({ background: { ...design.background, color: e.target.value } })}
                className="w-full text-sm font-semibold text-gray-900 outline-none uppercase"
             />
          </div>
          <MousePointer2 className="w-4 h-4 text-gray-300" />
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
           <Palette className="w-4 h-4 text-blue-600" />
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Eye Color Settings</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm transition-all focus-within:border-blue-600">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-gray-100 shrink-0">
                <input
                  type="color"
                  value={design.cornersSquare.color}
                  onChange={(e) => updateDesign({ cornersSquare: { ...design.cornersSquare, color: e.target.value } })}
                  className="absolute inset-0 w-full h-full cursor-pointer scale-150"
                />
              </div>
              <div className="flex-1 min-w-0">
                 <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest truncate">Outer Eye</p>
                 <input
                    type="text"
                    value={design.cornersSquare.color.toUpperCase()}
                    onChange={(e) => updateDesign({ cornersSquare: { ...design.cornersSquare, color: e.target.value } })}
                    className="w-full text-[11px] font-semibold text-gray-900 outline-none bg-transparent uppercase"
                 />
              </div>
           </div>
           <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm transition-all focus-within:border-blue-600">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-gray-100 shrink-0">
                <input
                  type="color"
                  value={design.cornersDot.color}
                  onChange={(e) => updateDesign({ cornersDot: { ...design.cornersDot, color: e.target.value } })}
                  className="absolute inset-0 w-full h-full cursor-pointer scale-150"
                />
              </div>
              <div className="flex-1 min-w-0">
                 <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest truncate">Inner Eye</p>
                 <input
                    type="text"
                    value={design.cornersDot.color.toUpperCase()}
                    onChange={(e) => updateDesign({ cornersDot: { ...design.cornersDot, color: e.target.value } })}
                    className="w-full text-[11px] font-semibold text-gray-900 outline-none bg-transparent uppercase"
                 />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ColorsPanel;
