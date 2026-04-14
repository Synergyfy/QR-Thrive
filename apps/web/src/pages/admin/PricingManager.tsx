import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  CreditCard,
  Globe2,
  Layout,
  Trash2,
  X,
  Settings,
  Settings2,
  Activity,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  useAdminPlans, 
  useUpsertPlan, 
  useAdminCountries, 
  useUpdateCountry, 
  useAdminPricingConfig, 
  useUpdatePricingConfig,
  useSystemConfig,
  useUpdateSystemConfig,
  useDeletePlan
} from '../../hooks/useAdmin';
import type { Plan, PricingTier } from '../../types/api';
import type { QRType } from '../../types/qr';

// Sub-components
import { Tooltip } from '../../components/ui/Tooltip';
import PricingSummary from './pricing/PricingSummary';
import PlanEconomics from './pricing/PlanEconomics';
import RegionalLogic from './pricing/RegionalLogic';
import CMSEditor from './pricing/CMSEditor';

const STATIC_TIERS: { id: PricingTier; name: string }[] = [
  { id: 'HIGH', name: 'High Income' },
  { id: 'MIDDLE', name: 'Middle Income' },
  { id: 'LOW', name: 'Low Income' },
];

const QR_TYPES_LIST: { value: QRType; label: string }[] = [
  { value: 'url', label: 'Website' },
  { value: 'pdf', label: 'PDF' },
  { value: 'links', label: 'List of Links' },
  { value: 'vcard', label: 'vCard' },
  { value: 'business', label: 'Business' },
  { value: 'video', label: 'Video' },
  { value: 'image', label: 'Images' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'socials', label: 'Social Media' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'mp3', label: 'MP3' },
  { value: 'menu', label: 'Menu' },
  { value: 'app', label: 'Apps' },
  { value: 'coupon', label: 'Coupon' },
  { value: 'wifi', label: 'WiFi' },
];

export default function PricingManager() {
  const [activeTab, setActiveTab] = useState('Economics');
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Partial<Plan> | null>(null);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);

  // Data Hooks
  const { data: plans, isLoading: plansLoading } = useAdminPlans();
  const { data: countries, isLoading: countriesLoading } = useAdminCountries();
  const { data: pricingConfig } = useAdminPricingConfig();
  const { data: cmsConfig } = useSystemConfig();

  // Mutation Hooks
  const upsertPlan = useUpsertPlan();
  const deletePlan = useDeletePlan();
  const upsertCountry = useUpdateCountry();
  const updatePricingConfig = useUpdatePricingConfig();
  const updateCMSConfig = useUpdateSystemConfig();

  const tabs = [
    { id: 'Economics', icon: CreditCard, label: 'Plans & Prices' },
    { id: 'Regional', icon: Globe2, label: 'Geo-Logic' },
    { id: 'CMS', icon: Layout, label: 'Marketing' },
  ];

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    const promise = new Promise((resolve, reject) => {
      upsertPlan.mutate(editingPlan, {
        onSuccess: () => {
          setIsPlanModalOpen(false);
          setEditingPlan(null);
          resolve(true);
        },
        onError: (err) => reject(err)
      });
    });

    toast.promise(promise, {
      loading: 'Updating registry...',
      success: 'Plan configuration saved!',
      error: 'Failed to save plan.'
    });
  };

  const handleConfirmDelete = () => {
    if (planToDelete) {
      const promise = new Promise((resolve, reject) => {
        deletePlan.mutate(planToDelete.id, {
          onSuccess: () => {
             setPlanToDelete(null);
             resolve(true);
          },
          onError: (err) => reject(err)
        });
      });

      toast.promise(promise, {
        loading: 'Decommissioning asset...',
        success: 'Plan removed from registry.',
        error: 'Failed to delete plan.'
      });
    }
  };

  const isLoading = plansLoading || countriesLoading;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-40 px-4 sm:px-6 lg:px-8">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-indigo-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto pt-10 space-y-8">
        {/* Compact Command Header */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-blue-500/10">
           <div className="absolute top-0 right-0 p-40 bg-blue-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
           
           <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/50">
                    <Settings className="w-8 h-8 text-white" />
                 </div>
                 <div>
                    <h2 className="text-3xl font-black tracking-tight leading-none mb-2">Billing Command</h2>
                    <div className="flex items-center gap-3">
                       <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase text-emerald-400">
                          <Activity className="w-3 h-3 animate-pulse" />
                          Live Status
                       </span>
                       <p className="text-slate-400 text-sm font-medium">Global Economic Tiering System</p>
                    </div>
                 </div>
              </div>

              {/* Summary Component */}
              {!isLoading && (
                 <div className="w-full lg:w-auto">
                    <PricingSummary 
                       plansCount={plans?.length || 0}
                       tiersCount={STATIC_TIERS.length}
                       countriesCount={countries?.length || 0}
                    />
                 </div>
              )}
           </div>
        </div>

        {/* Global Navigation Hub */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/70 backdrop-blur-md border border-white/20 p-2 rounded-[2rem] shadow-sm">
           <div className="flex p-1 bg-slate-100/50 rounded-2xl w-full md:w-auto overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'bg-white text-blue-600 shadow-lg shadow-blue-500/10' 
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'}`} />
                  {tab.label}
                </button>
              ))}
           </div>

           <div className="flex items-center gap-2 px-6 py-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Environment</span>
              <span className="px-2 py-1 bg-indigo-500/10 text-indigo-600 rounded-lg text-[10px] font-black uppercase ring-1 ring-indigo-500/20">Production</span>
           </div>
        </div>

        {/* Main Interface Content */}
        <div className="min-h-[600px] relative">
          <AnimatePresence mode="wait">
             {isLoading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-40 gap-6"
                >
                   <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                   <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Synchronizing Data Matrix...</p>
                </motion.div>
             ) : (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                    {activeTab === 'Economics' && (
                       <PlanEconomics 
                           plans={plans || []}
                          tiers={STATIC_TIERS}
                          pricingConfig={pricingConfig || { quarterlyDiscount: 10, yearlyDiscount: 20 }}
                          onEditPlan={(plan) => {
                             setEditingPlan(JSON.parse(JSON.stringify({
                               ...plan,
                               isFree: plan.isFree || false,
                               trialDays: plan.trialDays || 0
                             })));
                             setIsPlanModalOpen(true);
                          }}
                          onDeletePlan={setPlanToDelete}
                          onUpdateConfig={(config) => {
                            const promise = new Promise((resolve, reject) => {
                              updatePricingConfig.mutate(config, {
                                onSuccess: () => resolve(true),
                                onError: (err) => reject(err)
                              });
                            });
                            toast.promise(promise, {
                              loading: 'Propagating logic updates...',
                              success: 'Global rules updated!',
                              error: 'Failed to update protocols.'
                            });
                          }}
                          isUpdatingConfig={updatePricingConfig.isPending}
                          onCreatePlan={() => {
                             setEditingPlan({ 
                               name: '', 
                               qrCodeLimit: 50, 
                               qrCodeTypes: [], 
                               isActive: true,
                               isFree: false,
                               isDefault: false,
                               trialDays: 0
                             });
                             setIsPlanModalOpen(true);
                          }}
                       />
                   )}

                   {activeTab === 'Regional' && (
                      <RegionalLogic 
                         countries={countries || []}
                         tiers={STATIC_TIERS}
                         onUpdateCountryTier={(code, tier) => upsertCountry.mutate({ code, tier })}
                         onBulkMove={(codes, tier) => codes.forEach(code => upsertCountry.mutate({ code, tier }))}
                      />
                   )}

                   {activeTab === 'CMS' && cmsConfig && (
                      <CMSEditor 
                         config={cmsConfig}
                         onUpdate={(data) => updateCMSConfig.mutate(data)}
                      />
                   )}
                </motion.div>
             )}
          </AnimatePresence>
        </div>
      </div>

      {/* Plan Configuration Modal */}
      <AnimatePresence>
        {isPlanModalOpen && editingPlan && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPlanModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-6">
                   <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                      <Settings2 className="w-7 h-7" />
                   </div>
                   <div>
                      <h3 className="text-2xl font-black text-slate-900">{editingPlan.id ? 'Refine Registry' : 'New Plan Asset'}</h3>
                      <p className="text-slate-400 text-xs font-medium">Configure core capabilities and resource limits.</p>
                   </div>
                </div>
                <button onClick={() => setIsPlanModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <form id="plan-form" onSubmit={handleSavePlan} className="flex-grow overflow-y-auto p-10 space-y-10 scrollbar-thin">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div>
                      <Tooltip content="Unique name for identifying this plan tier.">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 pl-2 cursor-help">System Name</label>
                      </Tooltip>
                      <input
                        type="text"
                        required
                        value={editingPlan.name}
                        onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                        className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-black text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-300"
                        placeholder="e.g. Enterprise Tier"
                      />
                    </div>
                    <div>
                      <Tooltip content="A short marketing pitch shown to potential subscribers.">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 pl-2 cursor-help">Descriptive Pitch</label>
                      </Tooltip>
                      <textarea
                        value={editingPlan.description || ''}
                        onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                        className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium text-slate-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all min-h-[120px] resize-none placeholder:text-slate-300"
                        placeholder="Explain value proposition..."
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Tooltip content="The total number of dynamic QR codes allowed for this tier.">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 pl-2 cursor-help">Max Dynamic QR code</label>
                      </Tooltip>
                      <input
                        type="number"
                        required
                        value={editingPlan.qrCodeLimit}
                        onChange={(e) => setEditingPlan({ ...editingPlan, qrCodeLimit: Number(e.target.value) })}
                        className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-black text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      />
                    </div>
                    <div>
                       <Tooltip content="Number of trial days before first payment. Only for paid plans.">
                         <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 pl-2 cursor-help">Trial Period (Days)</label>
                       </Tooltip>
                       <input
                         type="number"
                         required
                         disabled={editingPlan.isFree}
                         value={editingPlan.trialDays}
                         onChange={(e) => setEditingPlan({ ...editingPlan, trialDays: Number(e.target.value) })}
                         className={`w-full border-none rounded-2xl p-4 text-sm font-black focus:ring-4 focus:ring-blue-500/10 outline-none transition-all ${
                            editingPlan.isFree ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-slate-50 text-slate-900'
                         }`}
                       />
                     </div>
                    <div className="flex gap-4">
                       <label className="flex-grow flex items-center justify-between p-4 bg-slate-50 rounded-2xl cursor-pointer group">
                          <div>
                             <Tooltip content="Displays a 'Most Popular' ribbon on this plan in the frontend.">
                                <p className="text-[10px] font-black uppercase text-slate-900 cursor-help">Show as Popular</p>
                             </Tooltip>
                             <p className="text-[9px] text-slate-400 font-medium tracking-tight">Highlight in front-end</p>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={editingPlan.isPopular} 
                            onChange={(e) => setEditingPlan({ ...editingPlan, isPopular: e.target.checked })}
                            className="w-5 h-5 rounded-lg text-blue-600 focus:ring-blue-500" 
                          />
                       </label>
                       <label className="flex-grow flex items-center justify-between p-4 bg-slate-50 rounded-2xl cursor-pointer group">
                          <div>
                             <Tooltip content="The default plan automatically assigned to new signups.">
                                <p className="text-[10px] font-black uppercase text-slate-900 cursor-help">System Default</p>
                             </Tooltip>
                             <p className="text-[9px] text-slate-400 font-medium tracking-tight">Self-onboarding plan</p>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={editingPlan.isDefault} 
                            onChange={(e) => setEditingPlan({ ...editingPlan, isDefault: e.target.checked })}
                            className="w-5 h-5 rounded-lg text-blue-600 focus:ring-blue-500" 
                          />
                       </label>
                    </div>
                    <div className="flex gap-4">
                        <label className="flex-grow flex items-center justify-between p-4 bg-slate-50 rounded-2xl cursor-pointer group">
                           <div>
                              <Tooltip content="Mark this plan as completely free (no pricing).">
                                 <p className="text-[10px] font-black uppercase text-slate-900 cursor-help">Is Free Plan</p>
                              </Tooltip>
                              <p className="text-[9px] text-slate-400 font-medium tracking-tight">Overrides all price books</p>
                           </div>
                           <input 
                             type="checkbox" 
                             checked={editingPlan.isFree} 
                             onChange={(e) => {
                                const isFree = e.target.checked;
                                setEditingPlan({ 
                                    ...editingPlan, 
                                    isFree,
                                    trialDays: isFree ? 0 : editingPlan.trialDays
                                });
                             }}
                             className="w-5 h-5 rounded-lg text-blue-600 focus:ring-blue-500" 
                           />
                        </label>
                     </div>
                  </div>
                </div>

                {!editingPlan.isFree && !editingPlan.id && (
                  <div>
                    <Tooltip content="Set starting prices for the three economic groups. You can add more regional prices after creation.">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 pl-2 cursor-help">Quick Setup: Tier Pricing (USD)</label>
                    </Tooltip>
                    <div className="bg-blue-50/50 p-6 rounded-[3rem] border border-blue-100/50">
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-white rounded-2xl p-4 shadow-sm border border-blue-100/50">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">High Income</span>
                            </div>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-black text-[10px]">$</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={(editingPlan as any).highTierPrice || ''}
                                onChange={(e) => setEditingPlan({ ...editingPlan, highTierPrice: Number(e.target.value) } as any)}
                                className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-5 pr-2 text-xs font-black focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                placeholder="0.00"
                              />
                            </div>
                          </div>

                          <div className="bg-white rounded-2xl p-4 shadow-sm border border-blue-100/50">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 rounded-full bg-amber-500" />
                              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Middle Income</span>
                            </div>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-black text-[10px]">$</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={(editingPlan as any).middleTierPrice || ''}
                                onChange={(e) => setEditingPlan({ ...editingPlan, middleTierPrice: Number(e.target.value) } as any)}
                                className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-5 pr-2 text-xs font-black focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                placeholder="0.00"
                              />
                            </div>
                          </div>

                          <div className="bg-white rounded-2xl p-4 shadow-sm border border-blue-100/50">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 rounded-full bg-rose-500" />
                              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Low Income</span>
                            </div>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-black text-[10px]">$</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={(editingPlan as any).lowTierPrice || ''}
                                onChange={(e) => setEditingPlan({ ...editingPlan, lowTierPrice: Number(e.target.value) } as any)}
                                className="w-full bg-slate-50 border-none rounded-2xl py-2.5 pl-5 pr-2 text-xs font-black focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                       </div>
                       <p className="text-[9px] font-medium text-blue-400 mt-4 pl-2 leading-relaxed">
                         Enter the monthly price for each tier. The system will automatically calculate local equivalents (like Naira or Euro) based on current exchange rates.
                       </p>
                    </div>
                  </div>
                )}

                <div>
                  <Tooltip content="Toggle specific QR features available for this tier.">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 pl-2 cursor-help">Capability Matrix</label>
                  </Tooltip>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 bg-slate-50 p-6 rounded-[2.5rem]">
                    {QR_TYPES_LIST.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => {
                          const current = editingPlan.qrCodeTypes || [];
                          const next = current.includes(type.value)
                            ? current.filter((t) => t !== type.value)
                            : [...current, type.value];
                          setEditingPlan({ ...editingPlan, qrCodeTypes: next });
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-[10px] font-black transition-all ${
                          editingPlan.qrCodeTypes?.includes(type.value)
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'
                            : 'bg-white border-white text-slate-500 hover:border-slate-200'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${editingPlan.qrCodeTypes?.includes(type.value) ? 'bg-white' : 'bg-slate-200'}`} />
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              </form>

              <div className="p-10 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-6">
                <button 
                  type="button" 
                  onClick={() => setEditingPlan({ ...editingPlan, isActive: !editingPlan.isActive })}
                  className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
                    editingPlan.isActive ? 'text-emerald-500' : 'text-slate-400'
                  }`}
                >
                   <div className={`w-3 h-3 rounded-full ${editingPlan.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                   {editingPlan.isActive ? 'Registry Active' : 'Registry Frozen'}
                </button>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsPlanModalOpen(false)}
                    className="px-8 py-3.5 rounded-2xl font-black text-xs text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="plan-form"
                    onClick={handleSavePlan}
                    disabled={upsertPlan.isPending}
                    className={`flex items-center gap-3 px-10 py-3.5 rounded-2xl font-black text-xs transition-all shadow-xl active:scale-95 ${
                      upsertPlan.isPending 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30'
                    }`}
                  >
                    {upsertPlan.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                    {upsertPlan.isPending ? 'Propagating...' : 'Commit Changes'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {planToDelete && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPlanToDelete(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner shadow-rose-200">
                <Trash2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">Decommission Asset?</h3>
              <p className="text-slate-500 font-medium text-sm leading-relaxed mb-10">
                You are about to delete <span className="text-slate-900 font-black">"{planToDelete.name}"</span>. 
                Users currently on this plan will remain until their next billing cycle.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleConfirmDelete}
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white py-4 rounded-2xl font-black text-sm transition-all shadow-xl shadow-rose-500/30 active:scale-95"
                >
                  Confirm Decommission
                </button>
                <button
                  onClick={() => setPlanToDelete(null)}
                  className="w-full py-4 text-slate-400 font-black text-sm hover:text-slate-900 transition-colors"
                >
                  Abort Action
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
