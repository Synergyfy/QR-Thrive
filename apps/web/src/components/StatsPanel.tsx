import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';
import { 
  Download, Globe, MapPin, 
  ArrowUpRight, TrendingUp, Users, QrCode, 
  Zap, Calendar, Clock
} from 'lucide-react';
import type { StoredQR } from '../hooks/useQRStorage';
import { useDashboardStats } from '../hooks/useApi';

interface StatsPanelProps {
  codes: StoredQR[];
}

const StatsPanel: React.FC<StatsPanelProps> = ({ codes }) => {
  const { data: stats, isLoading } = useDashboardStats();

  const getFlagEmoji = (countryCode: string) => {
    if (!countryCode || countryCode === 'Unknown') return '🌍';
    if (countryCode.length === 2) {
      const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
      return String.fromCodePoint(...codePoints);
    }
    return '🌍';
  };

  const chartData = useMemo(() => {
    if (!stats || !stats.chartData) return [];
    return stats.chartData.map(d => {
      // Map ISO date to shorter date e.g., '30 Mar'
      const dateObj = new Date(d.name);
      return { 
        name: dateObj.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }), 
        scans: d.scans, 
        unique: d.unique 
      };
    });
  }, [stats]);

  const osData = useMemo(() => {
    if (!stats || !stats.osDist) return [];
    const colors = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'];
    return Object.entries(stats.osDist).map(([name, value], idx) => ({
      name,
      value,
      color: colors[idx % colors.length]
    })).sort((a,b) => b.value - a.value);
  }, [stats]);

  const countryData = useMemo(() => {
    if (!stats || !stats.countryDist) return [];
    const totalCountriesScans = Object.values(stats.countryDist).reduce((a, b) => a + b, 0);
    return Object.entries(stats.countryDist).map(([name, scans]) => ({
      name,
      scans,
      share: totalCountriesScans ? Math.round((scans / totalCountriesScans) * 100) + '%' : '0%',
      flag: getFlagEmoji(name)
    })).sort((a,b) => b.scans - a.scans);
  }, [stats]);

  const timeData = useMemo(() => {
    if (!stats || !stats.timeDist) return [];
    const data = [];
    for (let i = 0; i < 24; i++) {
        const hourLabel = i === 0 ? '12am' : i < 12 ? `${i}am` : i === 12 ? '12pm' : `${i-12}pm`;
        data.push({ h: hourLabel, v: stats.timeDist[i.toString()] || 0 });
    }
    return data;
  }, [stats]);

  const peakHour = useMemo(() => {
    if (!stats || !stats.timeDist) return { hour: 'N/A', scans: 0 };
    let maxScans = 0;
    let peak = 'N/A';
    Object.entries(stats.timeDist).forEach(([h, scans]) => {
       if (scans > maxScans) {
         maxScans = scans;
         const i = parseInt(h);
         peak = i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i-12}:00 PM`;
       }
    });
    return { hour: peak, scans: maxScans };
  }, [stats]);

  const totalScans = stats ? stats.totalScans : 0;
  const uniqueScans = stats ? stats.uniqueVisitors : 0;
  const conversionRate = totalScans ? Math.round((uniqueScans / totalScans) * 100) + '%' : '0%';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
         <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
          {/* intelligence count, engagements, etc */}
          {[
            { label: 'Intelligence Count', value: codes.length || 0, icon: QrCode, trend: '+12%', color: 'blue' },
            { label: 'Engagements', value: totalScans.toLocaleString(), icon: Zap, trend: '+28%', color: 'emerald' },
            { label: 'Audience Reach', value: uniqueScans.toLocaleString(), icon: Users, trend: '+18%', color: 'purple' },
            { label: 'Conversion Velocity', value: conversionRate, icon: TrendingUp, trend: '+5.2%', color: 'amber' },
          ].map((metric) => (
            <div key={metric.label} className="bg-white p-6 sm:p-10 rounded-3xl sm:rounded-[3rem] border border-slate-100/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] transition-all group relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${metric.color}-400/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000`} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4 sm:mb-8">
                <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-${metric.color}-50 text-${metric.color}-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all shadow-sm`}>
                  <metric.icon className="w-5 h-5 sm:w-7 sm:h-7" />
                </div>
                <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  {metric.trend}
                </div>
              </div>
               <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mb-1 sm:mb-2">{metric.label}</p>
              <h3 className="text-2xl sm:text-4xl font-black text-slate-900 leading-none tracking-tighter">{metric.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Hero Chart & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
             <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">QR Code Performance</h3>
                <p className="text-xs font-medium text-slate-400">Scan activity vs Unique visits over the last 7 days</p>
             </div>
             <select className="bg-slate-50 border-none outline-none text-xs font-black uppercase tracking-widest text-slate-500 py-3 px-6 rounded-xl hover:bg-slate-100 transition-all cursor-pointer">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Last 6 Months</option>
             </select>
          </div>
          <div className="h-[240px] sm:h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorUnique" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} 
                />
                <Tooltip 
                  contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', padding: '16px'}}
                  itemStyle={{fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em'}}
                />
                <Area type="monotone" dataKey="scans" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorScans)" />
                <Area type="monotone" dataKey="unique" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorUnique)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:gap-8 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-600" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Scans</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unique Visits</span>
            </div>
          </div>
        </div>

         {/* Insight Column */}
        <div className="space-y-4 sm:space-y-6">
           <div className="bg-slate-900 rounded-3xl sm:rounded-[40px] p-6 sm:p-8 text-white relative overflow-hidden group">
              <div className="relative z-10 space-y-6">
                 <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Live Pulse</span>
                 </div>
                 <h4 className="text-xl font-bold leading-tight">Your QR Codes were scanned {stats.scansLastHour} times in the last hour.</h4>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                       <Clock className="w-4 h-4 text-blue-400 mb-2" />
                       <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mb-0.5">Peak Hour</p>
                       <p className="text-sm font-bold">{peakHour.hour}</p>
                    </div>
                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                       <Calendar className="w-4 h-4 text-emerald-400 mb-2" />
                       <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mb-0.5">Best Day</p>
                       <p className="text-sm font-bold">Tuesday</p>
                    </div>
                 </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
           </div>

           <div className="bg-white rounded-3xl sm:rounded-[40px] border border-slate-100 p-6 sm:p-8 shadow-sm">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-6">Device Distribution</h4>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={osData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {osData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 mt-4">
                 {osData.map(item => (
                   <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}} />
                         <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{item.name}</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{Math.round((item.value / stats.totalScans) * 100)}%</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* Breakdown Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
         {/* Geographical Breakdown */}
         <div className="bg-white rounded-3xl sm:rounded-[40px] border border-slate-100 p-6 sm:p-10 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-10 relative z-10">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                     <Globe className="w-6 h-6" />
                  </div>
                  <div>
                     <h3 className="text-lg font-black text-slate-900 tracking-tight">Countries</h3>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Scan Reach</p>
                  </div>
               </div>
               <button className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all">
                  <Download className="w-5 h-5" />
               </button>
            </div>
            
            <div className="space-y-6 relative z-10">
               {countryData.map((c, i) => (
                  <div key={c.name} className="space-y-2">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <span className="text-xl">{c.flag}</span>
                           <span className="text-sm font-bold text-slate-900">{c.name}</span>
                        </div>
                        <div className="text-right">
                           <span className="text-sm font-black text-slate-900">{c.scans.toLocaleString()}</span>
                           <span className="text-[10px] font-bold text-slate-400 ml-2">({c.share})</span>
                        </div>
                     </div>
                     <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full animate-in slide-in-from-left duration-1000" 
                          style={{width: c.share, opacity: 1 - (i * 0.2)}} 
                        />
                     </div>
                  </div>
               ))}
            </div>
            {/* Background pattern */}
            <div className="absolute bottom-[-10%] right-[-5%] opacity-[0.03] rotate-12 pointer-events-none">
              <MapPin className="w-64 h-64 text-slate-900" />
            </div>
         </div>

          {/* Scanning Hours Breakdown */}
         <div className="bg-white rounded-3xl sm:rounded-[40px] border border-slate-100 p-6 sm:p-10 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-10">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                     <Clock className="w-6 h-6" />
                  </div>
                  <div>
                     <h3 className="text-lg font-black text-slate-900 tracking-tight">Active Hours</h3>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time-based Activity</p>
                  </div>
               </div>
               <button className="p-3 bg-slate-50 text-slate-400 hover:text-purple-600 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                  <Download className="w-4 h-4" /> CSV
               </button>
            </div>

            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={timeData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="h" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}}/>
                   <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)'}} />
                   <Bar dataKey="v" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={24} />
                 </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-8 p-6 bg-slate-50 rounded-3xl flex items-center gap-5">
               <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-blue-100">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
               </div>
               <div>
                  <p className="text-xs font-bold text-slate-900 leading-tight">Afternoon Surge Detected</p>
                  <p className="text-[10px] font-medium text-slate-400">Most of your scans happen between 2:00 PM and 5:00 PM.</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default StatsPanel;
