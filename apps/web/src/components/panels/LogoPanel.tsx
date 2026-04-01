import React from 'react';
import type { QRConfiguration } from '../../types/qr';
import { Upload, X, ImageIcon, Check } from 'lucide-react';
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

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
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
            <div className="bg-white p-6 rounded-[28px] border border-gray-100 space-y-6 shadow-sm animate-in zoom-in-95 duration-300 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
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
              <div className="flex items-center gap-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-50">
                 <input
                   type="checkbox"
                   id="hideDots"
                   checked={config.design.imageOptions.hideBackgroundDots}
                   onChange={(e) => updateImageOptions({ hideBackgroundDots: e.target.checked })}
                   className="w-4 h-4 rounded border-gray-200 text-blue-600 focus:ring-blue-600 cursor-pointer"
                 />
                 <label htmlFor="hideDots" className="text-[11px] font-bold text-gray-500 cursor-pointer uppercase tracking-tight">Remove dots under logo</label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogoPanel;
