import React from 'react';
import { Globe, ExternalLink, ShieldCheck, ArrowRight, MousePointer2 } from 'lucide-react';

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
    <div className="w-full h-full flex flex-col font-sans bg-gray-50/50 overflow-hidden">
      <div className="flex-1 overflow-y-auto scrollbar-hide py-12 px-8 flex flex-col items-center space-y-10">
        {/* Animated Globe/Pulse */}
        <div className="relative">
          <div className="absolute inset-0 bg-blue-400 rounded-full blur-3xl opacity-20 animate-pulse" />
          <div className="w-28 h-28 bg-white rounded-[40px] flex items-center justify-center relative shadow-2xl shadow-blue-100 border border-blue-50" style={{ color: themeColor }}>
            <Globe className="w-14 h-14 animate-spin-slow" style={{ animationDuration: '10s' }} />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 text-white rounded-2xl flex items-center justify-center shadow-lg border-4 border-white">
            <ShieldCheck size={20} />
          </div>
        </div>

        <div className="space-y-3 px-2">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Direct Website Access</p>
           <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">
             {title}
           </h1>
           <p className="text-sm font-medium text-gray-500 max-w-[240px] mx-auto leading-relaxed">
             {description}
           </p>
        </div>

        {/* URL Card */}
        <div className="w-full bg-white p-6 rounded-[32px] shadow-xl shadow-blue-50/50 border border-blue-100/20 relative group">
           <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-[9px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-lg" style={{ backgroundColor: themeColor }}>
              Secure Link
           </div>
           
           <div className="flex flex-col items-center gap-2 mt-2">
              <span className="text-xs font-bold text-gray-400 truncate max-w-full italic">
                {url}
              </span>
              <div className="h-[1px] w-12 bg-gray-100 my-1" />
              <span className="text-lg font-black" style={{ color: themeColor }}>
                {domain}
              </span>
           </div>
        </div>

        <div className="w-full space-y-4">
           <a 
             href={url.startsWith('http') ? url : `https://${url}`}
             target="_blank"
             rel="noopener noreferrer"
             className="w-full py-5 text-white rounded-[24px] font-black text-lg flex items-center justify-center gap-3 shadow-2xl shadow-blue-200 hover:scale-[1.02] active:scale-95 transition-all group"
             style={{ backgroundColor: themeColor }}
           >
              Open Website
              <ExternalLink size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
           </a>
           
           <div className="flex items-center justify-center gap-2 text-gray-400 font-bold text-[10px] uppercase tracking-widest">
              <MousePointer2 size={12} />
              Tap to redirect
           </div>
        </div>
      </div>
      
      {/* Footer Decoration */}
      <div className="py-6 px-8 flex justify-between items-center bg-white/50 backdrop-blur-sm border-t border-gray-100">
         <div className="flex gap-1.5 align-center">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
         </div>
         <p className="text-[10px] font-black text-gray-300 uppercase letter tracking-widest">QR Thrive Safe Browsing</p>
      </div>
    </div>
  );
};

export default WebsiteProfilePreview;
