import { useState } from 'react';
import { 
  Users, 
  QrCode, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAdminStats, useAdminUsers } from '../../hooks/useAdmin';
import { useCurrency } from '../../hooks/useCurrency';
import { formatDistanceToNow } from 'date-fns';


const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  rose: 'bg-rose-50 text-rose-600',
};

export default function Overview() {
  const navigate = useNavigate();
  const [range, setRange] = useState('7d');
  const { data: statsData, isLoading: statsLoading } = useAdminStats(range);
  const { data: usersData, isLoading: usersLoading } = useAdminUsers({ limit: 5 });
  const { currency, convertPrice } = useCurrency();

  if (statsLoading || usersLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center text-blue-600">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const stats = [
    { 
      name: 'Total QR Codes Generated', 
      value: statsData?.totalQRs.toLocaleString() || '0', 
      change: `${(statsData?.trends?.qrs || 0) >= 0 ? '+' : ''}${statsData?.trends?.qrs}%`,
      trend: (statsData?.trends?.qrs || 0) >= 0 ? 'up' : 'down', 
      icon: QrCode, 
      color: 'blue' 
    },
    { 
      name: 'Total Registered Users', 
      value: statsData?.totalUsers.toLocaleString() || '0', 
      change: `${(statsData?.trends?.users || 0) >= 0 ? '+' : ''}${statsData?.trends?.users}%`,
      trend: (statsData?.trends?.users || 0) >= 0 ? 'up' : 'down', 
      icon: Users, 
      color: 'emerald' 
    },
    { 
      name: 'Estimated Monthly Revenue', 
      value: `${currency.symbol}${convertPrice(statsData?.estimatedRevenue || 0)}`, 
      change: `${(statsData?.trends?.revenue || 0) >= 0 ? '+' : ''}${statsData?.trends?.revenue}%`,
      trend: (statsData?.trends?.revenue || 0) >= 0 ? 'up' : 'down', 
      icon: DollarSign, 
      color: 'indigo' 
    },
    { 
      name: 'Active Scans', 
      value: statsData?.totalScans.toLocaleString() || '0', 
      change: `${(statsData?.trends?.scans || 0) >= 0 ? '+' : ''}${statsData?.trends?.scans}%`,
      trend: (statsData?.trends?.scans || 0) >= 0 ? 'up' : 'down', 
      icon: Activity, 
      color: 'rose' 
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm shadow-blue-900/5 group hover:shadow-xl hover:shadow-blue-900/10 transition-all duration-300"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${colorMap[stat.color]}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${
                stat.trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}>
                {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-[0.1em] mb-1">
              {stat.name}
            </h3>
            <p className="text-2xl font-black text-slate-800 tracking-tight">
              {stat.value}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Analytics Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">QR Generation Growth</h3>
              <p className="text-xs text-slate-400 font-medium">Daily statistics of QR codes created across the platform.</p>
            </div>
            <select 
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-bold px-4 py-2 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <div className="h-64 flex items-end justify-between gap-4 px-2">
            {(statsData?.chartData || []).map((day, i: number) => {
              const maxQrs = Math.max(...(statsData?.chartData.map((d) => d.qrs) || []), 10);
              const height = (day.qrs / maxQrs) * 100;
              
              return (
                <div key={i} className="flex-grow flex flex-col items-center gap-4 group cursor-pointer">
                  <div className="relative w-full">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(height, 5)}%` }}
                      transition={{ delay: 0.5 + (i * 0.1), duration: 1, ease: "easeOut" }}
                      className={`w-full max-w-[40px] mx-auto rounded-xl transition-all ${
                        i === ((statsData?.chartData.length || 0) - 1) ? 'bg-blue-600' : 'bg-blue-100 group-hover:bg-blue-200'
                      }`}
                    />
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                      {day.qrs} QRs
                    </div>
                  </div>
                  <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    {range === '30d' 
                      ? (i % 5 === 0 || i === (statsData?.chartData.length || 0) - 1 ? day.name : '')
                      : day.name
                    }
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Users List */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Recent Signups</h3>
            <button 
              onClick={() => navigate('/admin/users')}
              className="text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
            >
              View All
            </button>
          </div>

          <div className="space-y-6 flex-grow">
            {(usersData?.users || []).map((user, idx: number) => (
              <div key={user.id} className="flex items-center gap-4 group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shadow-sm transition-all group-hover:scale-110 ${
                  idx % 3 === 0 ? 'bg-indigo-50 text-indigo-600' : 
                  idx % 3 === 1 ? 'bg-amber-50 text-amber-600' : 
                  'bg-rose-50 text-rose-600'
                }`}>
                  {user.firstName[0]}{user.lastName[0]}
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-sm font-bold text-slate-800 leading-tight truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-400 font-medium truncate">{user.email}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true }).replace('about ', '')}
                  </p>
                  <p className="text-[11px] font-bold text-slate-800">{user.qrs} QRs</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-50">
            <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <p className="text-xs font-bold text-slate-600">Real-time monitoring active</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

