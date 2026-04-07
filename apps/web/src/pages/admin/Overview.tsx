import { 
  Users, 
  QrCode, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';

const stats = [
  { 
    name: 'Total QR Codes Generated', 
    value: '124,592', 
    change: '+14.5%', 
    trend: 'up', 
    icon: QrCode, 
    color: 'blue' 
  },
  { 
    name: 'Total Registered Users', 
    value: '18,241', 
    change: '+8.2%', 
    trend: 'up', 
    icon: Users, 
    color: 'emerald' 
  },
  { 
    name: 'Monthly Revenue', 
    value: '₦1,420,000', 
    change: '+22.4%', 
    trend: 'up', 
    icon: DollarSign, 
    color: 'indigo' 
  },
  { 
    name: 'Active Scans (Last 24h)', 
    value: '45,291', 
    change: '-2.1%', 
    trend: 'down', 
    icon: Activity, 
    color: 'rose' 
  },
];

const recentUsers = [
  { id: 1, name: "Adeola Johnson", email: "adeola.j@gmail.com", plan: "Standard", qrs: 12, joined: "2 mins ago", avatar: "AJ" },
  { id: 2, name: "John Smith", email: "john_smith@corp.com", plan: "Annual", qrs: 45, joined: "14 mins ago", avatar: "JS" },
  { id: 3, name: "Chidi Okafor", email: "chidi.okafor@tech.io", plan: "Quarterly", qrs: 28, joined: "45 mins ago", avatar: "CO" },
  { id: 4, name: "Maria Garcia", email: "m.garcia@outlook.com", plan: "Standard", qrs: 5, joined: "1 hr ago", avatar: "MG" },
  { id: 5, name: "Ibrahim Lawal", email: "i.lawal@fintech.ng", plan: "Annual", qrs: 112, joined: "2 hrs ago", avatar: "IL" },
];

const colorMap: any = {
  blue: 'bg-blue-50 text-blue-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  rose: 'bg-rose-50 text-rose-600',
};

export default function Overview() {
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
        {/* Analytics Chart Mockup */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">QR Generation Growth</h3>
              <p className="text-xs text-slate-400 font-medium">Daily statistics of QR codes created across the platform.</p>
            </div>
            <select className="bg-slate-50 border border-slate-200 text-xs font-bold px-4 py-2 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>All Time</option>
            </select>
          </div>

          {/* Simple CSS Chart Mockup */}
          <div className="h-64 flex items-end justify-between gap-4 px-2">
            {[45, 60, 40, 85, 55, 75, 95].map((height, i) => (
              <div key={i} className="flex-grow flex flex-col items-center gap-4 group cursor-pointer">
                <div className="relative w-full">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: 0.5 + (i * 0.1), duration: 1, ease: "easeOut" }}
                    className={`w-full max-w-[40px] mx-auto rounded-xl transition-all ${
                      i === 6 ? 'bg-blue-600' : 'bg-blue-100 group-hover:bg-blue-200'
                    }`}
                  />
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                    {Math.round(height * 2.5)} QRs
                  </div>
                </div>
                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Users List */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Recent Signups</h3>
            <button className="text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all">
              View All
            </button>
          </div>

          <div className="space-y-6 flex-grow">
            {recentUsers.map((user, idx) => (
              <div key={user.id} className="flex items-center gap-4 group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shadow-sm transition-all group-hover:scale-110 ${
                  idx % 3 === 0 ? 'bg-indigo-50 text-indigo-600' : 
                  idx % 3 === 1 ? 'bg-amber-50 text-amber-600' : 
                  'bg-rose-50 text-rose-600'
                }`}>
                  {user.avatar}
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-sm font-bold text-slate-800 leading-tight truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-400 font-medium truncate">{user.email}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{user.joined}</p>
                  <p className="text-[11px] font-bold text-slate-800">{user.qrs} QRs</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-50">
            <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <p className="text-xs font-bold text-slate-600">854 users online</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
