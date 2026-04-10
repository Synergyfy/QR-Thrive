import React from 'react';
import { Wifi, ShieldCheck, Lock, Copy, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface WifiProfilePreviewProps {
  ssid?: string;
  password?: string;
  encryption?: string;
}

const WifiProfilePreview: React.FC<WifiProfilePreviewProps> = ({ 
  ssid = "Guest Network",
  password = "",
  encryption = "WPA"
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    toast.success('Password copied to clipboard!');
  };

  return (
    <div className="w-full h-full flex flex-col font-sans bg-[#F0F4FF] overflow-hidden">
      <div className="flex-1 overflow-y-auto scrollbar-hide py-12 px-8 flex flex-col items-center space-y-10">
        
        {/* Animated Wifi Icon */}
        <div className="relative">
          <div className="absolute inset-0 bg-blue-400 rounded-full blur-3xl opacity-20 animate-pulse" />
          <div className="w-28 h-28 bg-white text-blue-600 rounded-[40px] flex items-center justify-center relative shadow-2xl shadow-blue-100 border border-blue-50">
             <div className="absolute -top-1 -right-1">
                <div className="w-6 h-6 bg-blue-600 rounded-full animate-ping opacity-20" />
             </div>
             <Wifi className="w-14 h-14" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg border-4 border-[#F0F4FF]">
            <Lock size={20} />
          </div>
        </div>

        <div className="space-y-3 px-2">
           <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Wireless Hotspot Access</p>
           <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
             Connect in a Snap
           </h1>
           <p className="text-sm font-medium text-slate-500 max-w-[240px] mx-auto leading-relaxed">
             Join the network with a single tap or use the credentials below.
           </p>
        </div>

        {/* network Card */}
        <div className="w-full bg-white p-8 rounded-[40px] shadow-[0_20px_50px_-10px_rgba(37,99,235,0.1)] border border-blue-100/50 relative">
           <div className="space-y-8">
              <div className="text-center group">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Network Name (SSID)</p>
                 <div className="inline-flex items-center gap-2 px-6 py-2 bg-slate-50 rounded-full border border-slate-100 max-w-full">
                    <span className="text-lg font-black text-slate-900 truncate">{ssid}</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                 </div>
              </div>

              <div className="grid grid-cols-1 gap-6 pt-4 border-t border-slate-50">
                 <div className="space-y-3 relative">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Security Type</p>
                    <div className="w-full px-6 py-4 bg-slate-50 rounded-2xl flex items-center gap-3 border border-slate-100/50">
                       <Lock className="w-4 h-4 text-slate-400" />
                       <span className="text-xs font-bold text-slate-600">
                         {encryption === 'nopass' ? 'No Password (Open)' : encryption === 'WEP' ? 'WEP' : 'WPA/WPA2/WPA3'}
                       </span>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Password</p>
                    <div className="flex gap-2">
                       <div 
                         onClick={() => setShowPassword(!showPassword)}
                         className="flex-1 px-6 py-4 bg-slate-50 rounded-2xl flex items-center justify-between gap-3 border border-slate-100/50 font-mono text-sm font-bold text-slate-800 cursor-pointer"
                       >
                          <span>{showPassword ? password : '••••••••••'}</span>
                          <span className="text-[9px] text-blue-500 uppercase font-black">{showPassword ? 'Hide' : 'Show'}</span>
                       </div>
                       <button 
                         onClick={handleCopy}
                         className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm hover:bg-blue-50 active:scale-90 transition-all"
                       >
                          <Copy size={20} />
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="w-full space-y-6 pt-2">
           <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-50">
                 <CheckCircle2 size={28} />
              </div>
              <p className="text-xs font-bold text-slate-500 max-w-[200px]">
                Scan successful! Use the credentials above if you aren't prompted.
              </p>
           </div>
        </div>
      </div>
      
      {/* Footer Decoration */}
      <div className="py-6 px-10 bg-slate-900 rounded-t-[40px] shadow-2xl">
         <div className="flex items-center justify-between">
            <div className="flex flex-col">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Powered by</span>
               <span className="text-sm font-black text-white tracking-tight">QR Thrive Hotspot</span>
            </div>
            <div className="flex gap-1.5">
               {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: `${i*0.2}s` }} />)}
            </div>
         </div>
      </div>
    </div>
  );
};

export default WifiProfilePreview;
