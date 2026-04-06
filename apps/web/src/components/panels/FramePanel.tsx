import React from 'react';
import type { QRConfiguration, QRFrameOptions } from '../../types/qr';
import { X, Layout, Type as TypeIcon, Palette } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FramePanelProps {
  config: QRConfiguration;
  updateConfig: (updates: Partial<QRConfiguration>) => void;
}

const FramePanel: React.FC<FramePanelProps> = ({ config, updateConfig }) => {
  const updateFrame = (updates: Partial<QRFrameOptions>) => {
    updateConfig({
      frame: { ...config.frame, ...updates }
    });
  };

  const frames: { type: QRFrameOptions['type']; label: string }[] = [
    { type: 'none', label: 'Plain' },
    { type: 'simple', label: 'Simple' },
    { type: 'text-below', label: 'Text' },
    { type: 'bubble', label: 'Bubble' },
    { type: 'ribbon', label: 'Ribbon' },
    { type: 'phone', label: 'Phone' },
    { type: 'circular', label: 'Circular' },
    { type: 'tag', label: 'Tag' },
    { type: 'minimal', label: 'Minimal' },
    { type: 'bracket', label: 'Bracket' },
    { type: 'rounded-thick', label: 'Bold' },
    { type: 'shadow', label: 'Glow' },
  ];

  const FramePreviewIcon = ({ type, active }: { type: QRFrameOptions['type'], active: boolean }) => {
    const borderColor = active ? '#ffffff' : '#94a3b8';
    
    const renderIcon = () => {
      switch (type) {
        case 'none': return <div className="h-6 w-6 border-2 border-dashed border-gray-400 flex items-center justify-center rounded-sm"><X className="w-3 h-3 text-gray-400" /></div>;
        case 'simple': return <div className="h-6 w-6 border-2 rounded-sm" style={{ borderColor }} />;
        case 'bubble': return <div className="h-6 w-6 border-[3px] rounded-full" style={{ borderColor }} />;
        case 'rounded-thick': return <div className="h-6 w-6 border-[4px] rounded-md" style={{ borderColor }} />;
        case 'shadow': return <div className="h-6 w-6 border-2 rounded-lg shadow-sm" style={{ borderColor, boxShadow: `0 4px 6px ${borderColor}44` }} />;
        case 'bracket': return <div className="h-6 w-6 border-x-2 border-y-[1px] rounded-sm" style={{ borderColor }} />;
        case 'ribbon': return <div className="h-6 w-6 border-t-2 border-x-2 rounded-sm relative"><div className="absolute bottom-0 left-[-2px] right-[-2px] h-2 bg-current" style={{ color: borderColor }} /></div>;
        case 'text-below': return <div className="h-6 w-6 flex flex-col items-center justify-between"><div className="h-4 w-6 border-2 rounded-sm" style={{ borderColor }} /><div className="h-1 w-4 bg-current rounded-full" style={{ color: borderColor }} /></div>;
        case 'phone': return <div className="h-8 w-5 border-2 rounded-lg relative flex flex-col items-center" style={{ borderColor }}><div className="h-0.5 w-2 bg-current mt-1 rounded-full" style={{ color: borderColor }} /><div className="mt-1 h-3 w-3 border-[1px] rounded-sm" style={{ borderColor }} /><div className="absolute bottom-0.5 h-1 w-1 bg-current rounded-full" style={{ color: borderColor }} /></div>;
        case 'circular': return <div className="h-8 w-8 border-2 rounded-full flex items-center justify-center p-1" style={{ borderColor }}><div className="h-full w-full border-[1px] rounded-full" style={{ borderColor }} /></div>;
        case 'tag': return <div className="h-8 w-6 border-2 rounded-md flex flex-col pt-1" style={{ borderColor }}><div className="h-0.5 w-1 bg-current self-center rounded-full" style={{ color: borderColor }} /><div className="mx-0.5 mb-0.5 flex-1 border-[1px]" style={{ borderColor }} /></div>;
        case 'minimal': return <div className="h-6 w-6 flex flex-col"><div className="h-1 w-full bg-current rounded-full mb-1" style={{ color: borderColor }} /><div className="flex-1 border-2" style={{ borderColor }} /></div>;
        default: return <div className="h-6 w-6 border-2 rounded-sm" style={{ borderColor }} />;
      }
    };

    return (
      <div className="flex items-center justify-center w-full h-full">
        {renderIcon()}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 max-w-full overflow-hidden">
      <div className="space-y-8">
        <div className="flex items-center gap-2 mb-4">
           <Layout className="w-4 h-4 text-blue-600" />
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Frame & Container</p>
        </div>
        <div className="relative group">
          <div className="flex overflow-x-auto pb-6 gap-4 no-scrollbar -mx-2 px-2 scroll-smooth">
            {frames.map((f) => (
              <button
                key={f.type}
                onClick={() => updateFrame({ type: f.type })}
                className={cn(
                  "flex-shrink-0 w-24 h-24 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2",
                  config.frame.type === f.type
                    ? "border-blue-600 bg-blue-50/50 shadow-inner"
                    : "border-gray-50 bg-white hover:border-blue-100 shadow-sm"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                  config.frame.type === f.type ? "bg-blue-600 shadow-lg shadow-blue-200" : "bg-gray-50"
                )}>
                  <FramePreviewIcon type={f.type} active={config.frame.type === f.type} />
                </div>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-widest",
                  config.frame.type === f.type ? "text-blue-600 font-black" : "text-gray-400"
                )}>
                   {f.label}
                </span>
              </button>
            ))}
          </div>
          
          <div className="h-1 bg-gray-50 rounded-full w-full relative overflow-hidden mt-[-16px]">
             <div className="absolute top-0 left-0 h-full bg-blue-100 rounded-full w-1/3 transition-all" />
          </div>
        </div>

        {config.frame.type !== 'none' && (
          <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                 <div className="flex items-center gap-2">
                    <TypeIcon className="w-3.5 h-3.5 text-blue-600" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Call to Action</p>
                 </div>
                 <input
                  type="text"
                  value={config.frame.text || ''}
                  onChange={(e) => updateFrame({ text: e.target.value })}
                  placeholder="SCAN ME"
                  className="w-full px-5 py-4 border-2 border-gray-100 focus:border-blue-600 rounded-2xl outline-none text-gray-900 font-semibold bg-white transition-all shadow-sm"
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Palette className="w-3.5 h-3.5 text-blue-600" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Frame Color</p>
                 </div>
                <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm transition-all focus-within:border-blue-600">
                  <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-gray-100 shrink-0">
                    <input
                      type="color"
                      value={config.frame.color || '#000000'}
                      onChange={(e) => updateFrame({ color: e.target.value })}
                      className="absolute inset-0 w-full h-full cursor-pointer scale-150"
                    />
                  </div>
                  <input
                    type="text"
                    value={(config.frame.color || '#000000').toUpperCase()}
                    onChange={(e) => updateFrame({ color: e.target.value })}
                    className="w-full text-sm font-semibold text-gray-900 outline-none bg-transparent uppercase"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                  <Palette className="w-3.5 h-3.5 text-blue-600" />
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Text Color</p>
               </div>
              <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm transition-all focus-within:border-blue-600 max-w-[240px]">
                <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-gray-100 shrink-0">
                  <input
                    type="color"
                    value={config.frame.textColor || '#ffffff'}
                    onChange={(e) => updateFrame({ textColor: e.target.value })}
                    className="absolute inset-0 w-full h-full cursor-pointer scale-150"
                  />
                </div>
                <input
                  type="text"
                  value={(config.frame.textColor || '#ffffff').toUpperCase()}
                  onChange={(e) => updateFrame({ textColor: e.target.value })}
                  className="w-full text-sm font-semibold text-gray-900 outline-none bg-transparent uppercase"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FramePanel;
