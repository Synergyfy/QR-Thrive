import React from 'react';
import { Globe, ExternalLink, ShieldCheck, MousePointer2 } from 'lucide-react';

interface WebsiteProfilePreviewProps {
  url?: string;
  themeColor?: string;
  title?: string;
  description?: string;
}

const WebsiteProfilePreview: React.FC<WebsiteProfilePreviewProps> = ({ 
  url = "https://example.com",
  themeColor = "#3b82f6",
  title = "Ready to Explore?",
  description = "This QR code will securely take you to the destination below."
}) => {
  const domain = url ? new URL(url.startsWith('http') ? url : `https://${url}`).hostname : '';

  return (
    <div className="w-full h-full flex flex-col font-sans bg-slate-50 overflow-hidden">
      <div className="flex-1 overflow-y-auto scrollbar-hide py-10 px-6 flex flex-col items-center space-y-8">
        {/* Animated Globe/Pulse */}
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-10 animate-pulse" />
          <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center relative shadow-xl border border-white" style={{ color: themeColor }}>
            <Globe className="w-12 h-12 animate-spin-slow" style={{ animationDuration: '10s' }} />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg border-2 border-white">
            <ShieldCheck size={16} />
          </div>
        </div>

        <div className="text-center space-y-2 px-2">
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Website Link Target</p>
           <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">
             {title}
           </h1>
           <p className="text-[11px] font-medium text-gray-500 max-w-[220px] mx-auto leading-relaxed">
             {description}
           </p>
        </div>

        {/* URL Card */}
        <div className="w-full bg-white p-5 rounded-[28px] shadow-sm border border-slate-200 relative group">
           <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-white text-[8px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm" style={{ backgroundColor: themeColor }}>
              Verified Link
           </div>
           
           <div className="flex flex-col items-center gap-1 mt-1">
              <span className="text-[10px] font-medium text-gray-400 truncate max-w-full italic px-4">
                {url}
              </span>
              <div className="h-px w-8 bg-slate-100 my-1" />
              <span className="text-base font-bold text-gray-900">
                {domain}
              </span>
           </div>
        </div>

        <div className="w-full space-y-4">
           <a 
             href={url.startsWith('http') ? url : `https://${url}`}
             target="_blank"
             rel="noopener noreferrer"
             className="w-full py-4 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-3 shadow-lg hover:scale-[1.02] active:scale-95 transition-all group"
             style={{ backgroundColor: themeColor, boxShadow: `0 10px 20px -5px ${themeColor}40` }}
           >
              Open Website
              <ExternalLink size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
           </a>
           
           <div className="flex items-center justify-center gap-2 text-gray-400 font-bold text-[9px] uppercase tracking-widest">
              <MousePointer2 size={10} />
              Tap to visit site
           </div>
        </div>
      </div>
      
      {/* Footer Decoration */}
      <div className="py-5 px-6 flex justify-between items-center bg-white border-t border-slate-100">
         <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
         </div>
         <p className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.2em]">Safe Redirect Active</p>
      </div>
    </div>
  );
};

export default WebsiteProfilePreview;
