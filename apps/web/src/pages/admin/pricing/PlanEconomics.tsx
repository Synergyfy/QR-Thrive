import { useState } from 'react';
import { 
  Zap, 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronRight, 
  Percent, 
  Settings2,
  AlertCircle,
  CheckCircle2,
  Box
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Plan, Tier, PricingConfig } from '../../../types/api';

interface PlanEconomicsProps {
  plans: Plan[];
  tiers: Tier[];
  pricingConfig: PricingConfig;
  onEditPlan: (plan: Plan) => void;
  onDeletePlan: (plan: Plan) => void;
  onUpdatePrice?: (planId: string, tierId: string, data: { 
    monthlyPriceUSD: number;
  }) => void;
  onUpdateConfig: (config: Partial<PricingConfig>) => void;
  onCreatePlan: () => void;
}

export default function PlanEconomics({
  plans,
  tiers,
  pricingConfig,
  onEditPlan,
  onDeletePlan,
  onUpdateConfig,
  onCreatePlan
}: PlanEconomicsProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(plans[0]?.id || null);
  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* Plan List Panel */}
      <div className="xl:w-80 flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Registry</h4>
          <button 
            onClick={onCreatePlan}
            className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex xl:flex-col gap-2 overflow-x-auto pb-2 xl:pb-0 scrollbar-hide">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
              className={`flex items-center gap-4 p-4 rounded-2xl text-left transition-all border whitespace-nowrap xl:whitespace-normal group relative overflow-hidden ${
                selectedPlanId === plan.id
                  ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/10'
                  : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                selectedPlanId === plan.id ? 'bg-blue-600' : 'bg-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600'
              }`}>
                <Zap className="w-5 h-5" />
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs truncate">{plan.name}</span>
                  {plan.isDefault && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" title="Default Plan" />}
                </div>
                <p className={`text-[10px] font-bold truncate ${selectedPlanId === plan.id ? 'text-slate-400' : 'text-slate-400'}`}>
                  {plan.qrCodeLimit} QR Codes
                </p>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform ${selectedPlanId === plan.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`} />
            </button>
          ))}
        </div>

        {/* Global Config Card */}
        <div className="mt-4 p-5 rounded-[2rem] bg-indigo-50/50 border border-indigo-100 overflow-hidden relative group">
           <div className="absolute -top-4 -right-4 w-16 h-16 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all" />
           <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-indigo-500/10 text-indigo-600 rounded-lg">
                <Percent className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Discounts</span>
           </div>

           <div className="space-y-4">
              <div>
                 <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                    <span>Quarterly</span>
                    <span className="text-indigo-600">{pricingConfig.quarterlyDiscount}%</span>
                 </div>
                 <input 
                    type="range" min="0" max="50" 
                    value={pricingConfig.quarterlyDiscount} 
                    onChange={(e) => onUpdateConfig({ ...pricingConfig, quarterlyDiscount: Number(e.target.value) })}
                    className="w-full h-1 bg-slate-200 rounded-full appearance-none accent-indigo-600" 
                 />
              </div>
              <div>
                 <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                    <span>Yearly</span>
                    <span className="text-indigo-600">{pricingConfig.yearlyDiscount}%</span>
                 </div>
                 <input 
                    type="range" min="0" max="70" 
                    value={pricingConfig.yearlyDiscount} 
                    onChange={(e) => onUpdateConfig({ ...pricingConfig, yearlyDiscount: Number(e.target.value) })}
                    className="w-full h-1 bg-slate-200 rounded-full appearance-none accent-indigo-600" 
                 />
              </div>
           </div>
        </div>
      </div>

      {/* Details Area */}
      <div className="flex-grow min-w-0">
        <AnimatePresence mode="wait">
          {selectedPlan ? (
            <motion.div
              key={selectedPlan.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Plan Header */}
              <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-900/20">
                    <Zap className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                      {selectedPlan.name}
                      {!selectedPlan.isActive && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-400 text-[10px] font-black uppercase rounded-lg">Draft</span>
                      )}
                    </h3>
                    <p className="text-slate-500 font-medium text-sm mt-1">{selectedPlan.description || "No description set for this registry item."}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                   <button 
                    onClick={() => onEditPlan(selectedPlan)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                   >
                     <Edit2 className="w-3.5 h-3.5" />
                     Configure
                   </button>
                   <button 
                    onClick={() => onDeletePlan(selectedPlan)}
                    className="p-2.5 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
                   >
                     <Trash2 className="w-5 h-5" />
                   </button>
                </div>
              </div>

              {/* Pricing Matrix */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {tiers.map((tier, index) => {
                  // Determine prefix based on tier name
                  let tierPrefix: string;
                  if (tier.name.includes('High')) {
                    tierPrefix = 'highIncome';
                  } else if (tier.name.includes('Middle')) {
                    tierPrefix = 'middleIncome';
                  } else if (tier.name.includes('Low')) {
                    tierPrefix = 'lowIncome';
                  } else {
                    // Fallback: use tier order if name doesn't match
                    tierPrefix = index === 0 ? 'highIncome' : index === 1 ? 'middleIncome' : 'lowIncome';
                  }
                  
                  const monthlyUSD = (selectedPlan as any)[`${tierPrefix}MonthlyUSD`] ?? 0;
                  const quarterlyUSD = (selectedPlan as any)[`${tierPrefix}QuarterlyUSD`] ?? 0;
                  const yearlyUSD = (selectedPlan as any)[`${tierPrefix}YearlyUSD`] ?? 0;

                  return (
                    <div key={tier.id} className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm overflow-hidden relative group">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                            <Box className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Economics</span>
                            <h4 className="text-sm font-black text-slate-900">{tier.name}</h4>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="relative">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">$</span>
                           <div className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-8 pr-4 font-black text-slate-900 text-lg">
                             {monthlyUSD.toFixed(2)}
                           </div>
                           <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-black uppercase tracking-widest pointer-events-none">/ Monthly</span>
                        </div>

                        {monthlyUSD > 0 ? (
                          <div className="grid grid-cols-2 gap-3 pt-2">
                             <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Quarterly</span>
                                <span className="text-sm font-black text-slate-700">${quarterlyUSD.toFixed(2)}</span>
                             </div>
                             <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                                <span className="text-[9px] font-black text-emerald-400 uppercase block mb-1">Yearly</span>
                                <span className="text-sm font-black text-emerald-700">${yearlyUSD.toFixed(2)}</span>
                             </div>
                          </div>
                        ) : (
                          <div className="bg-emerald-50/50 border border-dashed border-emerald-200 rounded-2xl p-4 flex items-center justify-center gap-3">
                             <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                             <span className="text-[10px] font-black uppercase text-emerald-600">Free Tier Enabled</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Resource Summary */}
              <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Settings2 className="w-4 h-4 text-slate-400" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-900">Resource Allocations</span>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {selectedPlan.qrCodeTypes.map((type, idx) => (
                      <div key={idx} className="bg-white px-4 py-2 rounded-xl text-[10px] font-black text-slate-500 border border-slate-200 group-hover:border-blue-500 transition-colors uppercase tracking-wider">
                        {type}
                      </div>
                    ))}
                    <div className="bg-blue-600/5 px-4 py-2 rounded-xl text-[10px] font-black text-blue-600 border border-blue-500/20 uppercase tracking-wider">
                      {selectedPlan.qrCodeLimit} Dynamic Nodes
                    </div>
                 </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-20 text-center opacity-40">
               <AlertCircle className="w-16 h-16 text-slate-300 mb-4" />
               <p className="font-black text-slate-400 uppercase tracking-widest">Select a registry item to view economics</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
