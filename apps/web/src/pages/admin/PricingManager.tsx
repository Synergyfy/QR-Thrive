import { useState, useEffect } from 'react';
import {
  Save,
  Info,
  CreditCard,
  Settings,
  Loader2,
  Eye
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useSystemConfig, useUpdateSystemConfig } from '../../hooks/useAdmin';

export default function PricingManager() {
  const { data: config, isLoading } = useSystemConfig();
  const updateConfig = useUpdateSystemConfig();

  const [prices, setPrices] = useState({ monthly: 0, quarterly: 0, yearly: 0 });

  useEffect(() => {
    if (config) {
      setPrices({
        monthly: config.monthlyPrice,
        quarterly: config.quarterlyPrice,
        yearly: config.yearlyPrice
      });
    }
  }, [config]);

  const handleSave = () => {
    updateConfig.mutate({
      monthlyPrice: Number(prices.monthly),
      quarterlyPrice: Number(prices.quarterly),
      yearlyPrice: Number(prices.yearly),
    }, {
      onSuccess: () => toast.success('Subscription plans updated successfully!')
    });
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center text-blue-600">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 rounded-[2rem] px-8 py-10 text-white relative overflow-hidden group shadow-2xl shadow-blue-500/10">
        <div className="absolute top-0 right-0 p-32 bg-blue-600/20 rounded-full -translate-y-1/2 translate-x-1/2 -z-10 blur-3xl opacity-50 transition-all duration-700 group-hover:bg-blue-600/30"></div>
        <div className="absolute bottom-0 left-0 p-32 bg-indigo-600/10 rounded-full translate-y-1/2 -translate-x-1/2 -z-10 blur-3xl opacity-50"></div>

        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-500/30">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight leading-none mb-2">Plan Manager</h2>
            <p className="text-slate-400 font-medium text-sm flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-500" />
              Configure subscription pricing and Paystack sync
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={updateConfig.isPending}
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-600/30 active:scale-95 flex items-center gap-3 disabled:opacity-50"
        >
          {updateConfig.isPending ? 'Syncing...' : (
            <>
              <Save className="w-5 h-5" />
              Sync Plans
            </>
          )}
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 md:p-10">
        <div className="space-y-8">
          <div className="flex items-center justify-between border-b border-slate-50 pb-6">
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Subscription Tiers</h3>
              <p className="text-sm text-slate-400 font-medium">Update prices and automatically sync with Paystack plans.</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Paystack Connected</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { label: 'Monthly (₦)', key: 'monthly', icon: 'M' },
              { label: 'Quarterly (₦)', key: 'quarterly', icon: 'Q' },
              { label: 'Yearly (₦)', key: 'yearly', icon: 'Y' }
            ].map((plan) => (
              <div key={plan.key} className="p-8 rounded-[2rem] bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-blue-900/5 transition-all group">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform">
                  <span className="font-black text-blue-600">{plan.icon}</span>
                </div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{plan.label}</label>
                <input
                  type="number"
                  value={(prices as any)[plan.key]}
                  onChange={(e) => setPrices({ ...prices, [plan.key]: Number(e.target.value) })}
                  className="w-full bg-white rounded-2xl px-6 py-4 border border-slate-100 font-black text-2xl text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                />
                <div className="mt-6 p-4 rounded-xl bg-blue-50/50 border border-blue-100/50">
                  <p className="text-[10px] text-blue-600 font-bold leading-relaxed flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>Plan code: <span className="font-mono text-[9px] bg-white px-1.5 py-0.5 rounded ml-1">
                      {(config as any)?.[`${plan.key}PlanCode`] || 'SYNC_PENDING'}
                    </span></span>
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 rounded-3xl bg-blue-600 text-white flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold">Automated Plan Management</p>
                <p className="text-xs text-white/70">Prices are immutable on Paystack. Changing them will create new plans.</p>
              </div>
            </div>
            <div className="h-px w-full md:w-px md:h-12 bg-white/20"></div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Sync version: v2.0.4</p>
          </div>
        </div>
      </div>
    </div>
  );
}
