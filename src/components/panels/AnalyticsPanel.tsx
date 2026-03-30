import React from 'react';
import { 
  TrendingUp, 
  Smartphone, 
  Users, 
  MousePointer2, 
  Globe, 
  Calendar, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';

const AnalyticsPanel: React.FC = () => {
  const stats = [
    { label: 'Total Scans', value: '1,284', icon: <MousePointer2 className="w-5 h-5" />, change: '+12.5%', color: 'blue' },
    { label: 'Unique Users', value: '842', icon: <Users className="w-5 h-5" />, change: '+8.2%', color: 'purple' },
    { label: 'Avg. Scan Time', value: '2.4s', icon: <Calendar className="w-5 h-5" />, change: '-0.3s', color: 'green' },
  ];

  const devices = [
    { name: 'Mobile', value: 85, color: 'bg-blue-500' },
    { name: 'Tablet', value: 10, color: 'bg-blue-300' },
    { name: 'Desktop', value: 5, color: 'bg-blue-100' },
  ];

  const locations = [
    { country: 'United States', scans: 450, flag: '🇺🇸' },
    { country: 'United Kingdom', scans: 280, flag: '🇬🇧' },
    { country: 'Germany', scans: 190, flag: '🇩🇪' },
    { country: 'France', scans: 150, flag: '🇫🇷' },
    { country: 'Japan', scans: 120, flag: '🇯🇵' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
          <p className="text-sm text-gray-500">Real-time performance of your QR codes.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-xl text-xs font-bold text-gray-600 border border-gray-200">
           Last 30 Days <ChevronRight className="w-3 h-3" />
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-${s.color}-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110`} />
            <div className="relative">
              <div className={`w-10 h-10 bg-${s.color}-50 text-${s.color}-600 rounded-xl flex items-center justify-center mb-4`}>
                {s.icon}
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
              <div className="flex items-baseline gap-3">
                <h3 className="text-3xl font-black text-gray-900">{s.value}</h3>
                <span className="text-xs font-bold text-green-500 flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> {s.change}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Device Distribution */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-gray-400" />
            <h3 className="font-bold text-gray-900">Device Types</h3>
          </div>
          <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full">Primary: Mobile</span>
        </div>
        <div className="space-y-4">
          <div className="h-4 w-full bg-gray-50 rounded-full flex overflow-hidden">
             {devices.map(d => (
               <div key={d.name} className={`${d.color} h-full transition-all`} style={{ width: `${d.value}%` }} />
             ))}
          </div>
          <div className="flex items-center justify-between gap-4">
             {devices.map(d => (
               <div key={d.name} className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${d.color}`} />
                 <span className="text-[10px] font-bold text-gray-500 uppercase">{d.name}</span>
                 <span className="text-sm font-bold text-gray-900">{d.value}%</span>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Top Locations */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-gray-400" />
            <h3 className="font-bold text-gray-900">Top Locations</h3>
          </div>
          <button className="text-[10px] font-bold text-blue-600 hover:underline">View Map</button>
        </div>
        <div className="space-y-4">
          {locations.map((loc) => (
            <div key={loc.country} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">{loc.flag}</span>
                <span className="text-sm font-medium text-gray-700">{loc.country}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 h-1.5 bg-gray-50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full" 
                    style={{ width: `${(loc.scans / 450) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-900 w-8">{loc.scans}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Advanced Insights Banner */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 text-white overflow-hidden relative group cursor-pointer hover:shadow-xl transition-all">
         <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-32 h-32 rotate-12" />
         </div>
         <div className="relative">
            <h4 className="text-lg font-bold mb-1">Upgrade for Live-Track</h4>
            <p className="text-xs text-gray-400 mb-6 max-w-[200px]">Get pinpoint GPS locations of every scan with historical heatmaps.</p>
            <button className="flex items-center gap-2 text-xs font-bold bg-white text-gray-900 px-4 py-2 rounded-xl active:scale-95 transition-all">
               Explore Premium Analytics <ExternalLink className="w-3 h-3" />
            </button>
         </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;
