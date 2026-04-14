import { useState, useEffect } from 'react';
import { 
  Zap, 
  Plus, 
  Edit2, 
  Trash2, 
  Percent, 
  Settings2,
  Box,
  Save,
  ChevronRight,
  X,
  Loader2,
  Calendar,
  Clock,
  Circle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip } from '../../../components/ui/Tooltip';
import type { Plan, PricingTier, PricingConfig, PriceBook, BillingCycle, PriceStatus } from '../../../types/api';
import { usePlanPrices, useCreatePriceBook, useUpdatePriceBook, useSuggestPrice } from '../../../hooks/useAdmin';
import toast from 'react-hot-toast';

interface PlanEconomicsProps {
  plans: Plan[];
  tiers: { id: PricingTier; name: string }[];
  pricingConfig: PricingConfig;
  onEditPlan: (plan: Plan) => void;
  onDeletePlan: (plan: Plan) => void;
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

  // Price Management State
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<Partial<PriceBook> | null>(null);

  const { data: prices, isLoading: pricesLoading } = usePlanPrices(selectedPlanId);
  const createPrice = useCreatePriceBook();
  const updatePrice = useUpdatePriceBook();
  const suggestPrice = useSuggestPrice();

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

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrice || !selectedPlanId) return;

    // Ensure dates are valid ISO strings for Prisma
    const dataToSave = {
      ...editingPrice,
      activeFrom: editingPrice.activeFrom ? new Date(editingPrice.activeFrom).toISOString() : null,
      activeTo: editingPrice.activeTo ? new Date(editingPrice.activeTo).toISOString() : null,
    };

    const promise = editingPrice.id 
      ? updatePrice.mutateAsync({ id: editingPrice.id, planId: selectedPlanId, data: dataToSave as any })
      : createPrice.mutateAsync({ planId: selectedPlanId, data: dataToSave as any });

    toast.promise(promise, {
      loading: 'Updating price matrix...',
      success: 'Price updated successfully!',
      error: 'Failed to update price.'
    });

    await promise;
    setIsPriceModalOpen(false);
    setEditingPrice(null);
  };

  const getStatusColor = (status: PriceStatus) => {
    switch (status) {
      case 'ACTIVE': return 'text-emerald-500 bg-emerald-500/10';
      case 'DRAFT': return 'text-amber-500 bg-amber-500/10';
      case 'ARCHIVED': return 'text-slate-400 bg-slate-400/10';
      default: return 'text-slate-400 bg-slate-400/10';
    }
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
                  <p className="text-sm font-black text-slate-900">Discount Rules</p>
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
                 <Tooltip content="Discount for 3-month subscriptions.">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 cursor-help">3 Months (%)</label>
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
                 <Tooltip content="Discount for 12-month subscriptions.">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 cursor-help">Full Year (%)</label>
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
             These discounts are applied automatically when a user selects a longer billing cycle.
           </p>
        </div>

        {/* Quick Action */}
        <div className="flex-grow flex items-center justify-between p-8 bg-slate-900 rounded-[2.5rem] text-white relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-32 bg-blue-600/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
           <div className="relative z-10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-2">Plan Management</h4>
              <p className="text-2xl font-black">{plans.length} Active Subscription Tiers</p>
              <p className="text-slate-400 text-xs font-medium mt-1">Manage features, limits, and regional pricing books.</p>
           </div>
           <button 
             onClick={onCreatePlan}
             className="relative z-10 flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-600/30 active:scale-95"
           >
             <Plus className="w-4 h-4" />
             Create New Plan
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
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[8px] font-black uppercase rounded-full tracking-widest border border-blue-100">Starter Plan</span>
                    )}
                    {!plan.isActive && (
                      <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[8px] font-black uppercase rounded-full tracking-widest border border-slate-100">Draft</span>
                    )}
                  </div>
                  <div className="px-4 py-2 bg-slate-900 rounded-xl text-white">
                      <span className="text-[10px] font-black uppercase tracking-widest">{plan.qrCodeLimit} QRs Allowed</span>
                  </div>
               </div>
            </div>
            
            <div className="space-y-3 mb-10">
              <h3 className="font-black text-3xl tracking-tighter text-slate-900 group-hover:text-blue-600 transition-colors">
                {plan.name}
              </h3>
              <p className="text-slate-400 text-sm font-medium line-clamp-2 leading-relaxed">
                {plan.description || "Localized pricing and feature controls for this subscription tier."}
              </p>
            </div>

            {/* In-Card Pricing Matrix */}
            <div className="grid grid-cols-3 gap-3 mb-10">
               {tiers.map((tier) => {
                 // Show baseline USD monthly price if available
                 const price = plan.priceBooks?.find(pb => pb.tier === tier.id && pb.currencyCode === 'USD' && pb.billingCycle === 'MONTHLY' && pb.status === 'ACTIVE')?.price ?? 0;
                 return (
                   <div key={tier.id} className="bg-slate-50 group-hover:bg-white border border-transparent group-hover:border-slate-100 p-4 rounded-3xl transition-all">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">{tier.name.split(' ')[0]}</span>
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
                    {plan.qrCodeTypes.length} Features
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
                        <span className="px-3 py-1 bg-slate-100 text-slate-400 text-[10px] font-black uppercase rounded-full">Inactive</span>
                      )}
                    </div>
                    <p className="text-slate-500 font-medium text-sm max-w-xl">{selectedPlan.description || "Modify the core attributes and pricing books for this plan."}</p>
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
                     Edit Core
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
                {/* Advanced Pricing Matrix */}
                <div className="space-y-6">
                   <div className="flex items-center justify-between">
                      <div>
                         <h4 className="text-xl font-black text-slate-900">Regional Price Books</h4>
                         <p className="text-slate-400 text-xs font-medium">Manage localized pricing, status, and scheduled updates.</p>
                      </div>
                      <button 
                        onClick={() => {
                          setEditingPrice({ 
                            planId: selectedPlan.id, 
                            tier: 'HIGH', 
                            currencyCode: 'USD', 
                            billingCycle: 'MONTHLY', 
                            price: 0, 
                            status: 'DRAFT',
                            stripePriceId: '',
                            paystackPlanCode: ''
                          });
                          setIsPriceModalOpen(true);
                        }}
                        className="flex items-center gap-2.5 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Price Entry
                      </button>
                   </div>

                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {pricesLoading ? (
                        <div className="col-span-2 py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
                           <Loader2 className="w-8 h-8 animate-spin" />
                           <span className="text-[10px] font-black uppercase tracking-widest">Loading Price Matrix...</span>
                        </div>
                      ) : prices?.length === 0 ? (
                        <div className="col-span-2 py-20 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-slate-100 rounded-[2.5rem] text-slate-400">
                           <Box className="w-8 h-8 opacity-20" />
                           <span className="text-[10px] font-black uppercase tracking-widest">No Price Books Configured</span>
                        </div>
                      ) : prices?.map((price) => (
                        <div key={price.id} className="bg-slate-50 border border-slate-100 rounded-3xl p-6 flex items-center justify-between group hover:bg-white hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                           <div className="flex items-center gap-5">
                              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm">
                                 <Circle className={`w-3 h-3 ${price.status === 'ACTIVE' ? 'fill-emerald-500 text-emerald-500' : 'fill-slate-200 text-slate-200'}`} />
                              </div>
                              <div>
                                 <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-black uppercase text-slate-900 tracking-tighter">{price.tier} Tier</span>
                                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${getStatusColor(price.status)}`}>{price.status}</span>
                                 </div>
                                 <div className="flex items-center gap-3">
                                    <span className="text-xl font-black text-slate-900">{price.currencyCode} {price.price.toFixed(2)}</span>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">/ {price.billingCycle}</span>
                                 </div>
                                 {(price.activeFrom || price.activeTo) && (
                                   <div className="flex items-center gap-3 mt-2">
                                      {price.activeFrom && (
                                        <div className="flex items-center gap-1 text-[8px] font-black text-slate-400 uppercase">
                                           <Calendar className="w-2.5 h-2.5" />
                                           Starts: {new Date(price.activeFrom).toLocaleDateString()}
                                        </div>
                                      )}
                                      {price.activeTo && (
                                        <div className="flex items-center gap-1 text-[8px] font-black text-slate-400 uppercase">
                                           <Clock className="w-2.5 h-2.5" />
                                           Ends: {new Date(price.activeTo).toLocaleDateString()}
                                        </div>
                                      )}
                                   </div>
                                 )}
                              </div>
                           </div>
                           <button 
                             onClick={() => {
                               setEditingPrice(price);
                               setIsPriceModalOpen(true);
                             }}
                             className="p-3 bg-white text-slate-400 hover:text-blue-600 hover:shadow-md rounded-xl transition-all opacity-0 group-hover:opacity-100"
                           >
                              <Edit2 className="w-4 h-4" />
                           </button>
                        </div>
                      ))}
                   </div>
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
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Allocated Features</span>
                            <h4 className="text-lg font-black text-white">Capability Matrix</h4>
                         </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                         {selectedPlan.qrCodeTypes.map((type: string, idx: number) => (
                           <div key={idx} className="bg-white/5 px-6 py-3 rounded-2xl text-[11px] font-black text-slate-300 border border-white/10 shadow-sm uppercase tracking-widest">
                             {type}
                           </div>
                         ))}
                         <div className="bg-blue-600 px-6 py-3 rounded-2xl text-[11px] font-black text-white shadow-xl shadow-blue-600/20 uppercase tracking-widest">
                           Up to {selectedPlan.qrCodeLimit} Codes
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

      {/* Price Editor Modal */}
      <AnimatePresence>
        {isPriceModalOpen && editingPrice && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPriceModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden p-10"
            >
               <h3 className="text-2xl font-black text-slate-900 mb-2">{editingPrice.id ? 'Edit Price Entry' : 'New Price Book'}</h3>
               <p className="text-slate-400 text-xs font-medium mb-10">Configure how much users in this tier will be charged.</p>

               <form onSubmit={handleSavePrice} className="space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Tooltip content="Which economic grouping should this price apply to?">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 cursor-help">Target Tier</label>
                        </Tooltip>
                        <select 
                          value={editingPrice.tier}
                          onChange={(e) => setEditingPrice({ ...editingPrice, tier: e.target.value as PricingTier })}
                          className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-black text-slate-900 outline-none"
                        >
                           {tiers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                     </div>
                     <div className="space-y-2">
                        <Tooltip content="How often should the user be billed?">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 cursor-help">Billing Cycle</label>
                        </Tooltip>
                        <select 
                          value={editingPrice.billingCycle}
                          onChange={(e) => setEditingPrice({ ...editingPrice, billingCycle: e.target.value as BillingCycle })}
                          className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-black text-slate-900 outline-none"
                        >
                           <option value="MONTHLY">Monthly</option>
                           <option value="QUARTERLY">Quarterly (3 Months)</option>
                           <option value="YEARLY">Yearly (12 Months)</option>
                           <option value="LIFETIME">Lifetime Access</option>
                        </select>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Tooltip content="The 3-letter currency code (e.g. USD, EUR, NGN).">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 cursor-help">Currency Code</label>
                        </Tooltip>
                        <input 
                          type="text"
                          value={editingPrice.currencyCode}
                          onChange={(e) => setEditingPrice({ ...editingPrice, currencyCode: e.target.value.toUpperCase() })}
                          placeholder="USD, NGN, etc."
                          className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-black text-slate-900 outline-none"
                        />
                     </div>
                     <div className="space-y-2">
                        <Tooltip content="The base price in the target currency. Use the helper for regional suggestions.">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 cursor-help">Price Amount</label>
                        </Tooltip>
                        <div className="relative">
                           <input 
                             type="number"
                             step="0.01"
                             value={editingPrice.price}
                             onChange={(e) => setEditingPrice({ ...editingPrice, price: Number(e.target.value) })}
                             className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-black text-slate-900 outline-none"
                           />
                           
                           {editingPrice.currencyCode && editingPrice.currencyCode !== 'USD' && (
                             <div className="mt-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between">
                                <div className="flex flex-col">
                                   <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">PPP Helper (Live Rate)</span>
                                   <span className="text-[10px] text-blue-400 font-medium">Use 20.00 USD baseline</span>
                                </div>
                                <button
                                  type="button"
                                  disabled={suggestPrice.isPending}
                                  onClick={async () => {
                                    const result = await suggestPrice.mutateAsync({ 
                                      basePriceUSD: 20, 
                                      targetCurrencyCode: editingPrice.currencyCode || '',
                                      tier: editingPrice.tier
                                    });
                                    if (result.suggestedAmount) {
                                      const amountStr = String(result.suggestedAmount);
                                      setEditingPrice({ ...editingPrice, price: parseFloat(amountStr.replace(/[^0-9.]/g, '')) });
                                      toast.success(`Suggested: ${result.suggestedAmount}`);
                                    }
                                  }}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20"
                                >
                                  {suggestPrice.isPending ? 'Calculating...' : 'Get Suggestion'}
                                </button>
                             </div>
                           )}
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Tooltip content="The 'price_...' ID from your Stripe dashboard for this exact amount.">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 cursor-help">Stripe Price ID (Optional)</label>
                        </Tooltip>
                        <input 
                          type="text"
                          value={editingPrice.stripePriceId || ''}
                          onChange={(e) => setEditingPrice({ ...editingPrice, stripePriceId: e.target.value })}
                          placeholder="price_..."
                          className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-black text-slate-900 outline-none"
                        />
                     </div>
                     <div className="space-y-2">
                        <Tooltip content="The 'PLN_...' code from your Paystack dashboard for this exact amount.">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 cursor-help">Paystack Plan Code (Optional)</label>
                        </Tooltip>
                        <input 
                          type="text"
                          value={editingPrice.paystackPlanCode || ''}
                          onChange={(e) => setEditingPrice({ ...editingPrice, paystackPlanCode: e.target.value })}
                          placeholder="PLN_..."
                          className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-black text-slate-900 outline-none"
                        />
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Tooltip content="Optional: When should this price become effective?">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 cursor-help">Starts At (Optional)</label>
                        </Tooltip>
                        <input 
                          type="datetime-local"
                          value={editingPrice.activeFrom ? new Date(editingPrice.activeFrom).toISOString().slice(0, 16) : ''}
                          onChange={(e) => setEditingPrice({ ...editingPrice, activeFrom: e.target.value })}
                          className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-black text-slate-900 outline-none"
                        />
                     </div>
                     <div className="space-y-2">
                        <Tooltip content="Control visibility. DRAFT is hidden, ACTIVE is live, ARCHIVED is for history.">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 cursor-help">Status</label>
                        </Tooltip>
                        <select 
                          value={editingPrice.status}
                          onChange={(e) => setEditingPrice({ ...editingPrice, status: e.target.value as PriceStatus })}
                          className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-black text-slate-900 outline-none"
                        >
                           <option value="DRAFT">Draft (Staged)</option>
                           <option value="ACTIVE">Active (Live)</option>
                           <option value="ARCHIVED">Archived (Old)</option>
                        </select>
                     </div>
                  </div>

                  <div className="flex gap-4 pt-6">
                     <button
                       type="button"
                       onClick={() => setIsPriceModalOpen(false)}
                       className="flex-grow py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                     >
                       Cancel
                     </button>
                     <button
                       type="submit"
                       className="flex-grow py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                     >
                       Save Price Book
                     </button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Discount Confirmation */}
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
                 <h3 className="text-2xl font-black text-slate-900 mb-3">Save Discount Rules?</h3>
                 <p className="text-slate-500 font-medium text-sm leading-relaxed mb-10">
                   Propagate these new discount rates to all users. Quarterly: <span className="text-blue-600 font-black">{localQuarterly}%</span>, Yearly: <span className="text-blue-600 font-black">{localYearly}%</span>.
                 </p>
                 <div className="flex flex-col gap-3">
                   <button
                     onClick={handleSaveConfig}
                     className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-slate-900/20 active:scale-95"
                   >
                     Apply Globally
                   </button>
                   <button
                     onClick={() => setIsConfirmOpen(false)}
                     className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-colors"
                   >
                     Cancel
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
