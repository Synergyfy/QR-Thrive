import { Shield, Zap, Globe, TrendingUp } from 'lucide-react';

interface PricingSummaryProps {
  plansCount: number;
  tiersCount: number;
  countriesCount: number;
  revenueTrend?: number;
}

export default function PricingSummary({ 
  plansCount, 
  tiersCount, 
  countriesCount, 
  revenueTrend = 12.5 
}: PricingSummaryProps) {
  const stats = [
    { 
      label: 'Active Plans', 
      value: plansCount, 
      icon: Zap, 
      color: 'bg-blue-500', 
      textColor: 'text-blue-500' 
    },
    { 
      label: 'Economic Tiers', 
      value: tiersCount, 
      icon: Shield, 
      color: 'bg-indigo-500', 
      textColor: 'text-indigo-500' 
    },
    { 
      label: 'Regions Linked', 
      value: countriesCount, 
      icon: Globe, 
      color: 'bg-emerald-500', 
      textColor: 'text-emerald-500' 
    },
    { 
      label: 'LTV Projection', 
      value: `+${revenueTrend}%`, 
      icon: TrendingUp, 
      color: 'bg-rose-500', 
      textColor: 'text-rose-500' 
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => (
        <div 
          key={idx}
          className="bg-white/50 backdrop-blur-md border border-white/20 p-5 rounded-[1.5rem] flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className={`w-12 h-12 ${stat.color}/10 rounded-2xl flex items-center justify-center`}>
            <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{stat.label}</p>
            <p className="text-xl font-black text-slate-900">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
