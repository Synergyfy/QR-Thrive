import React from 'react';
import type { QRConfiguration, QRFrameOptions } from '../../types/qr';
import { Upload, X, ImageIcon, Layout, Type as TypeIcon, Palette, Check } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LogoPanelProps {
  config: QRConfiguration;
  updateConfig: (updates: Partial<QRConfiguration>) => void;
}

const LogoPanel: React.FC<LogoPanelProps> = ({ config, updateConfig }) => {
  const popularLogos = [
    { name: 'PayPal', url: 'https://cdn-icons-png.flaticon.com/512/174/174861.png' },
    { name: 'Instagram', url: 'https://cdn-icons-png.flaticon.com/512/174/174855.png' },
    { name: 'Facebook', url: 'https://cdn-icons-png.flaticon.com/512/733/733547.png' },
    { name: 'LinkedIn', url: 'https://cdn-icons-png.flaticon.com/512/174/174857.png' },
    { name: 'Twitter', url: 'https://cdn-icons-png.flaticon.com/512/733/733579.png' },
    { name: 'WhatsApp', url: 'https://cdn-icons-png.flaticon.com/512/733/733585.png' },
    { name: 'YouTube', url: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png' },
    { name: 'TikTok', url: 'https://cdn-icons-png.flaticon.com/512/3046/3046121.png' },
    { name: 'Apple', url: 'https://cdn-icons-png.flaticon.com/512/882/882704.png' },
    { name: 'Shopify', url: 'https://cdn-icons-png.flaticon.com/512/825/825508.png' },
  ];

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateConfig({ logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const selectPopularLogo = (url: string) => {
    updateConfig({ logo: url });
  };

  const removeLogo = () => {
    updateConfig({ logo: undefined });
  };

  const updateImageOptions = (updates: any) => {
    updateConfig({
      design: {
        ...config.design,
        imageOptions: { ...config.design.imageOptions, ...updates }
      }
    });
  };

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
    { type: 'bracket', label: 'Bracket' },
    { type: 'rounded-thick', label: 'Bold' },
    { type: 'shadow', label: 'Glow' },
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Logo Section */}
        <div className="space-y-8">
          <div className="flex items-center gap-2 mb-4">
             <ImageIcon className="w-4 h-4 text-blue-600" />
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Center Identity</p>
          </div>

          <div className="space-y-6">
            <p className="text-xs font-bold text-gray-500">Choose a Presets</p>
            <div className="grid grid-cols-5 gap-3">
              {popularLogos.map((logo) => (
                <button
                  key={logo.name}
                  onClick={() => selectPopularLogo(logo.url)}
                  className={cn(
                    "relative aspect-square rounded-xl border-2 transition-all p-2 flex items-center justify-center group overflow-hidden bg-white",
                    config.logo === logo.url 
                      ? "border-blue-600 shadow-md shadow-blue-100" 
                      : "border-gray-50 hover:border-blue-100"
                  )}
                  title={logo.name}
                >
                  <img src={logo.url} alt={logo.name} className="w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all" />
                  {config.logo === logo.url && (
                    <div className="absolute inset-0 bg-blue-600/10 flex items-center justify-center backdrop-blur-[1px]">
                      <div className="bg-blue-600 text-white rounded-full p-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-100"></span>
              </div>
              <div className="relative flex justify-center text-xs font-bold uppercase tracking-widest">
                <span className="bg-gray-50/50 px-4 text-gray-400">or upload</span>
              </div>
            </div>

            {config.logo && !popularLogos.some(l => l.url === config.logo) ? (
              <div className="relative w-full aspect-video border border-blue-100 rounded-3xl p-6 bg-white shadow-sm flex items-center justify-center group">
                <img src={config.logo} alt="Logo" className="max-w-[120px] max-h-[80px] object-contain" />
                <button
                  onClick={removeLogo}
                  className="absolute -top-2 -right-2 bg-blue-600 text-white p-2 rounded-xl shadow-xl hover:bg-blue-700 transition-all border border-white/20 active:scale-90"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-3xl p-6 hover:border-blue-300 transition-all bg-white group h-[120px] cursor-pointer shadow-sm">
                <div className="bg-gray-50 p-3 rounded-full mb-3 group-hover:scale-110 group-hover:bg-blue-50 transition-all">
                   <Upload className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                </div>
                <span className="text-[10px] text-gray-400 group-hover:text-blue-600 font-bold uppercase tracking-widest transition-colors">Custom Logo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            )}
            
            {config.logo && (
              <div className="bg-white p-6 rounded-[28px] border border-gray-100 space-y-6 shadow-sm animate-in zoom-in-95 duration-300">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Scaling</p>
                    <span className="text-[10px] font-bold text-blue-600 px-2 py-0.5 bg-blue-50 rounded-full">{Math.round(config.design.imageOptions.imageSize * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.5"
                    step="0.05"
                    value={config.design.imageOptions.imageSize}
                    onChange={(e) => updateImageOptions({ imageSize: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
                <div className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-2xl border border-gray-50">
                   <input
                     type="checkbox"
                     id="hideDots"
                     checked={config.design.imageOptions.hideBackgroundDots}
                     onChange={(e) => updateImageOptions({ hideBackgroundDots: e.target.checked })}
                     className="w-4 h-4 rounded border-gray-200 text-blue-600 focus:ring-blue-600 cursor-pointer"
                   />
                   <label htmlFor="hideDots" className="text-[11px] font-semibold text-gray-500 cursor-pointer">Remove dots under logo</label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Frame Section */}
        <div className="space-y-8">
          <div className="flex items-center gap-2 mb-4">
             <Layout className="w-4 h-4 text-blue-600" />
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Frame & Container</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {frames.map((f) => (
              <button
                key={f.type}
                onClick={() => updateFrame({ type: f.type })}
                className={cn(
                  "px-3 py-3 text-[11px] rounded-xl border transition-all text-center",
                  config.frame.type === f.type
                    ? "border-blue-600 bg-blue-600 text-white font-bold shadow-lg shadow-blue-100"
                    : "border-gray-50 bg-white text-gray-500 hover:border-blue-600/10 hover:text-blue-600 font-semibold"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {config.frame.type !== 'none' && (
            <div className="bg-blue-50/30 p-8 rounded-[32px] border border-blue-50 space-y-8 animate-in slide-in-from-top-4 duration-500">
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
                  className="w-full px-5 py-4 border-2 border-white focus:border-blue-600 rounded-2xl outline-none text-gray-900 font-semibold bg-white transition-all shadow-sm"
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Palette className="w-3.5 h-3.5 text-blue-600" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Frame Color</p>
                 </div>
                <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-white shadow-sm transition-all focus-within:border-blue-600">
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
          )}
        </div>
      </div>
    </div>
  );
};

export default LogoPanel;
