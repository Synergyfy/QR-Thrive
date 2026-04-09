import { useState, useEffect } from 'react';
import { 
  Zap, 
  Plus, 
  Edit2, 
  Trash2, 
  Percent, 
  Settings2,
  CheckCircle2,
  Box,
  Save,
  ChevronRight,
  X,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip } from '../../../components/ui/Tooltip';
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
  isUpdatingConfig: boolean;
  onCreatePlan: () => void;
}

export default function PlanEconomics({
  plans,
  tiers,
  pricingConfig,
  onEditPlan,
  onDeletePlan,
  onUpdateConfig,
  isUpdatingConfig,
  onCreatePlan
}: PlanEconomicsProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(plans[0]?.id || null);
  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  // Local state for discounts
  const [localQuarterly, setLocalQuarterly] = useState(pricingConfig.quarterlyDiscount);
  const [localYearly, setLocalYearly] = useState(pricingConfig.yearlyDiscount);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    setLocalQuarterly(pricingConfig.quarterlyDiscount);
    setLocalYearly(pricingConfig.yearlyDiscount);
  }, [pricingConfig]);

  const hasChanges = localQuarterly !== pricingConfig.quarterlyDiscount || localYearly !== pricingConfig.yearlyDiscount;

  const handleSaveConfig = () => {
    onUpdateConfig({
      quarterlyDiscount: localQuarterly,
      yearlyDiscount: localYearly
    });
    setIsConfirmOpen(false);
  };

  const handleCardClick = (planId: string) => {
    setSelectedPlanId(planId);
    setIsDetailOpen(true);
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Configuration Hub & Registry Header */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Global Config Card */}
        <div className="lg:w-96 p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm overflow-hidden relative group">
           <div className="absolute -top-4 -right-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all" />
           
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 text-indigo-600 rounded-xl">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Economics</h4>
                  <p className="text-sm font-black text-slate-900">Discount Protocols</p>
                </div>
              </div>
              
              <button
                disabled={!hasChanges || isUpdatingConfig}
                onClick={() => setIsConfirmOpen(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  hasChanges && !isUpdatingConfig
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 active:scale-95' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isUpdatingConfig ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                {isUpdatingConfig ? 'Saving' : hasChanges ? 'Commit' : 'Saved'}
              </button>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <Tooltip content="Discount applied to 3-month billing cycles.">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 cursor-help">Quarterly (%)</label>
                 </Tooltip>
                 <div className="relative">
                    <input 
                      type="number" min="0" max="99" 
                      value={localQuarterly} 
                      onChange={(e) => setLocalQuarterly(Number(e.target.value))}
                      className="w-full bg-slate-50 border-none rounded-2xl p-4 text-lg font-black text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" 
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs">%</span>
                 </div>
              </div>
              <div className="space-y-2">
                 <Tooltip content="Discount applied to 12-month billing cycles.">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 cursor-help">Yearly (%)</label>
                 </Tooltip>
                 <div className="relative">
                    <input 
                      type="number" min="0" max="99" 
                      value={localYearly} 
                      onChange={(e) => setLocalYearly(Number(e.target.value))}
                      className="w-full bg-slate-50 border-none rounded-2xl p-4 text-lg font-black text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" 
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs">%</span>
                 </div>
              </div>
           </div>
           <p className="text-[9px] font-medium text-slate-400 mt-4 leading-relaxed">
             Updates to these percentages will propagate globally to all checkout sessions immediately after confirmation.
           </p>
        </div>

        {/* Quick Stats / Action */}
        <div className="flex-grow flex items-center justify-between p-8 bg-slate-900 rounded-[2.5rem] text-white relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-32 bg-blue-600/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
           <div className="relative z-10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-2">Master Registry</h4>
              <p className="text-2xl font-black">{plans.length} Functional Plans</p>
              <p className="text-slate-400 text-xs font-medium mt-1">Ready for deployment across worldwide regions.</p>
           </div>
           <button 
             onClick={onCreatePlan}
             className="relative z-10 flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-600/30 active:scale-95"
           >
             <Plus className="w-4 h-4" />
             Forge New Plan
           </button>
        </div>
      </div>

      {/* Plan Grid System */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => handleCardClick(plan.id)}
            className={`group relative flex flex-col p-10 rounded-[3.5rem] text-left transition-all border overflow-hidden ${
              selectedPlanId === plan.id && isDetailOpen
                ? 'bg-white border-blue-600 ring-4 ring-blue-600/5 shadow-2xl'
                : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200 hover:shadow-2xl'
            }`}
          >
            {/* Header Area */}
            <div className="flex items-start justify-between mb-10">
               <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center transition-all ${
                selectedPlanId === plan.id && isDetailOpen ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30 scale-110' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600'
               }`}>
                 <Zap className="w-8 h-8" />
               </div>
               
               <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2 mb-2">
                    {plan.isDefault && (
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[8px] font-black uppercase rounded-full tracking-widest border border-blue-100">Default Registry</span>
                    )}
                    {!plan.isActive && (
                      <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[8px] font-black uppercase rounded-full tracking-widest border border-slate-100">Offline</span>
                    )}
                  </div>
                  <div className="px-4 py-2 bg-slate-900 rounded-xl text-white">
                      <span className="text-[10px] font-black uppercase tracking-widest">{plan.qrCodeLimit} QR code Limit</span>
                  </div>
               </div>
            </div>
            
            <div className="space-y-3 mb-10">
              <h3 className="font-black text-3xl tracking-tighter text-slate-900 group-hover:text-blue-600 transition-colors">
                {plan.name}
              </h3>
              <p className="text-slate-400 text-sm font-medium line-clamp-2 leading-relaxed">
                {plan.description || "Sophisticated pricing architecture for dynamic global deployments."}
              </p>
            </div>

            {/* In-Card Pricing Matrix */}
            <div className="grid grid-cols-3 gap-3 mb-10">
               {[
                 { label: 'High', key: 'highIncome' },
                 { label: 'Mid', key: 'middleIncome' },
                 { label: 'Low', key: 'lowIncome' }
               ].map((tier) => {
                 const price = (plan as any)[`${tier.key}MonthlyUSD`] ?? 0;
                 return (
                   <div key={tier.key} className="bg-slate-50 group-hover:bg-white border border-transparent group-hover:border-slate-100 p-4 rounded-3xl transition-all">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">{tier.label}</span>
                      <div className="flex items-baseline gap-0.5">
                         <span className="text-sm font-black text-slate-900">${price.toFixed(0)}</span>
                         <span className="text-[7px] font-black text-slate-400">/mo</span>
                      </div>
                   </div>
                 );
               })}
            </div>

            <div className="mt-auto pt-8 border-t border-slate-50 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="flex -space-x-2 overflow-hidden">
                    {plan.qrCodeTypes.slice(0, 4).map((_, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-white border-4 border-slate-50 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-slate-200" />
                      </div>
                    ))}
                  </div>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    {plan.qrCodeTypes.length} Capabilities
                  </span>
               </div>
               
               <div className="flex items-center gap-2 group/btn">
                  <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-blue-600 group-hover:text-white transition-all flex items-center justify-center">
                    <ChevronRight className="w-5 h-5" />
                  </div>
               </div>
            </div>
          </button>
        ))}
      </div>

      {/* Plan Details Modal */}
      <AnimatePresence>
        {isDetailOpen && selectedPlan && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-6xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-40 bg-blue-600/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                
                <div className="relative z-10 flex items-center gap-8">
                  <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-slate-900/40">
                    <Zap className="w-10 h-10" />
                  </div>
                  <div>
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-3xl font-black text-slate-900 tracking-tighter">
                        {selectedPlan.name}
                      </h3>
                      {!selectedPlan.isActive && (
                        <span className="px-3 py-1 bg-slate-100 text-slate-400 text-[10px] font-black uppercase rounded-full">Legacy Code</span>
                      )}
                    </div>
                    <p className="text-slate-500 font-medium text-sm max-w-xl">{selectedPlan.description || "No description set for this registry item."}</p>
                  </div>
                </div>

                <div className="relative z-10 flex items-center gap-4">
                   <button 
                    onClick={() => {
                      onEditPlan(selectedPlan);
                      setIsDetailOpen(false);
                    }}
                    className="flex items-center gap-3 px-8 py-4 bg-white hover:bg-slate-900 hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-sm active:scale-95 border border-slate-100"
                   >
                     <Edit2 className="w-4 h-4" />
                     Configure
                   </button>
                   <button 
                    onClick={() => {
                      onDeletePlan(selectedPlan);
                      setIsDetailOpen(false);
                    }}
                    className="p-4 bg-white text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl transition-all border border-slate-100 shadow-sm active:scale-95"
                   >
                     <Trash2 className="w-5 h-5" />
                   </button>
                   <button 
                    onClick={() => setIsDetailOpen(false)}
                    className="p-4 bg-white text-slate-400 hover:text-slate-900 rounded-2xl transition-all border border-slate-100 shadow-sm"
                   >
                     <X className="w-6 h-6" />
                   </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-grow overflow-y-auto p-10 space-y-10 scrollbar-thin">
                {/* Pricing Matrix */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {tiers.map((tier, index) => {
                    let tierPrefix: string;
                    if (tier.name.includes('High')) {
                      tierPrefix = 'highIncome';
                    } else if (tier.name.includes('Middle')) {
                      tierPrefix = 'middleIncome';
                    } else if (tier.name.includes('Low')) {
                      tierPrefix = 'lowIncome';
                    } else {
                      tierPrefix = index === 0 ? 'highIncome' : index === 1 ? 'middleIncome' : 'lowIncome';
                    }
                    
                    const monthlyUSD = (selectedPlan as any)[`${tierPrefix}MonthlyUSD`] ?? 0;
                    const quarterlyUSD = (selectedPlan as any)[`${tierPrefix}QuarterlyUSD`] ?? 0;
                    const yearlyUSD = (selectedPlan as any)[`${tierPrefix}YearlyUSD`] ?? 0;

                    return (
                      <div key={tier.id} className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8 shadow-sm relative group">
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                              <Box className="w-6 h-6" />
                            </div>
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Regional Tier</span>
                              <h4 className="text-lg font-black text-slate-900">{tier.name}</h4>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="relative">
                             <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">$</span>
                             <div className="w-full bg-white border-none rounded-[1.5rem] py-6 pl-12 pr-6 font-black text-slate-900 text-3xl tracking-tighter">
                               {monthlyUSD.toFixed(2)}
                             </div>
                             <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">/ Mo</span>
                          </div>

                          {monthlyUSD > 0 ? (
                            <div className="grid grid-cols-1 gap-3">
                               <div className="bg-white/50 rounded-xl p-4 flex items-center justify-between border border-slate-100">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Quarterly</span>
                                  <span className="text-lg font-black text-slate-700 tracking-tight">${quarterlyUSD.toFixed(2)}</span>
                               </div>
                               <div className="bg-emerald-50/50 rounded-xl p-4 flex items-center justify-between border border-emerald-100">
                                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Yearly</span>
                                  <span className="text-lg font-black text-emerald-700 tracking-tight">${yearlyUSD.toFixed(2)}</span>
                               </div>
                            </div>
                          ) : (
                            <div className="bg-emerald-50/50 border border-dashed border-emerald-200 rounded-[1.5rem] py-6 flex flex-col items-center justify-center gap-3">
                               <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                               <span className="text-[10px] font-black uppercase text-emerald-600">Open Access</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Resource Summary */}
                <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-blue-500/10">
                   <div className="absolute top-0 right-0 p-40 bg-blue-600/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                   <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-8">
                         <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                           <Settings2 className="w-6 h-6 text-white" />
                         </div>
                         <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registry Snapshot</span>
                            <h4 className="text-lg font-black text-white">Resource Allocation Matrix</h4>
                         </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                         {selectedPlan.qrCodeTypes.map((type: string, idx: number) => (
                           <div key={idx} className="bg-white/5 px-6 py-3 rounded-2xl text-[11px] font-black text-slate-300 border border-white/10 shadow-sm uppercase tracking-widest">
                             {type}
                           </div>
                         ))}
                         <div className="bg-blue-600 px-6 py-3 rounded-2xl text-[11px] font-black text-white shadow-xl shadow-blue-600/20 uppercase tracking-widest">
                           {selectedPlan.qrCodeLimit} Dynamic QR codes
                         </div>
                      </div>
                   </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-4">
                 <button 
                  onClick={() => setIsDetailOpen(false)}
                  className="px-10 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-slate-900/20 active:scale-95"
                 >
                   Confirm & Close
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {isConfirmOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConfirmOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[3rem] p-10 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-20 bg-blue-50 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative z-10 text-center">
                 <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner shadow-blue-100">
                   <Percent className="w-10 h-10" />
                 </div>
                 <h3 className="text-2xl font-black text-slate-900 mb-3">Reconfigure Discounts?</h3>
                 <p className="text-slate-500 font-medium text-sm leading-relaxed mb-10">
                   You are about to modify global checkout logic. Quarterly: <span className="text-blue-600 font-black">{localQuarterly}%</span>, Yearly: <span className="text-blue-600 font-black">{localYearly}%</span>. 
                   These rates will take effect immediately.
                 </p>
                 <div className="flex flex-col gap-3">
                   <button
                     onClick={handleSaveConfig}
                     className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-slate-900/20 active:scale-95"
                   >
                     Apply Protocol Changes
                   </button>
                   <button
                     onClick={() => setIsConfirmOpen(false)}
                     className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-colors"
                   >
                     Dismiss
                   </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
