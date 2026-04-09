import { useState } from 'react';
import { 
  Save, 
  Plus, 
  Trash2, 
  Check, 
  Type, 
  CreditCard, 
  ListTodo, 
  HelpCircle, 
  Zap,
  Settings,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getPricingConfig, 
  savePricingConfig, 
  DEFAULT_PRICING_CONFIG 
} from '../../config/pricing';
import type { 
  PriceTier, 
  PricingConfig, 
  PlanConfig 
} from '../../config/pricing';

export default function PricingManager() {
  const [activeTab, setActiveTab] = useState('Hero');
  const [selectedTier, setSelectedTier] = useState<'local' | PriceTier>('local');
  const [config, setConfig] = useState<PricingConfig>(getPricingConfig());
  const [loading, setLoading] = useState(false);

  // Helper to get current tier data
  const currentTierData = selectedTier === 'local' ? config.local : config.international[selectedTier];

  const tabs = [
    { id: 'Hero', icon: Type },
    { id: 'Plans', icon: CreditCard },
    { id: 'Features', icon: ListTodo },
    { id: 'Add-ons', icon: Zap },
    { id: 'FAQs', icon: HelpCircle },
  ];

  const handleSave = () => {
    setLoading(true);
    savePricingConfig(config);
    setTimeout(() => {
      setLoading(false);
      alert('Pricing configuration saved successfully! Users will now see the updated prices in their respective regions.');
    }, 800);
  };

  const updateTierCopy = (field: 'badge' | 'title' | 'subtitle', value: string) => {
    const newConfig = { ...config };
    if (selectedTier === 'local') {
      newConfig.local[field] = value;
    } else {
      newConfig.international[selectedTier][field] = value;
    }
    setConfig(newConfig);
  };

  const updatePlan = (idx: number, updates: Partial<PlanConfig>) => {
    const newConfig = { ...config };
    const plans = selectedTier === 'local' ? newConfig.local.plans : newConfig.international[selectedTier].plans;
    plans[idx] = { ...plans[idx], ...updates };
    setConfig(newConfig);
  };

  const updateGlobalFeatures = (idx: number, value: string) => {
    const newConfig = { ...config };
    // Synchronize features across all tiers for consistency
    newConfig.local.plans.forEach((p: PlanConfig) => { if (p.features[idx] !== undefined) p.features[idx] = value; });
    Object.values(newConfig.international).forEach((tier: any) => {
      tier.plans.forEach((p: PlanConfig) => { if (p.features[idx] !== undefined) p.features[idx] = value; });
    });
    setConfig(newConfig);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 rounded-[2rem] px-8 py-10 text-white relative overflow-hidden group shadow-2xl shadow-blue-500/10">
        <div className="absolute top-0 right-0 p-32 bg-blue-600/20 rounded-full -translate-y-1/2 translate-x-1/2 -z-10 blur-3xl opacity-50 transition-all duration-700 group-hover:bg-blue-600/30"></div>
        <div className="absolute bottom-0 left-0 p-32 bg-indigo-600/10 rounded-full translate-y-1/2 -translate-x-1/2 -z-10 blur-3xl opacity-50"></div>
        
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-500/30">
             <Settings className="w-8 h-8 text-white" />
           </div>
           <div>
            <h2 className="text-3xl font-black tracking-tight leading-none mb-2">Global Pricing Manager</h2>
            <p className="text-slate-400 font-medium text-sm flex items-center gap-2">
               <Globe className="w-4 h-4 text-blue-500" />
               Configure regional pricing and tier-based growth strategies
            </p>
           </div>
        </div>

        <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                if (confirm('Are you sure you want to reset ALL pricing data to defaults? This will erase your local changes.')) {
                  setConfig(DEFAULT_PRICING_CONFIG);
                  savePricingConfig(DEFAULT_PRICING_CONFIG);
                }
              }}
              className="px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
            >
              Reset Defaults
            </button>
            <button 
              onClick={handleSave}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-600/30 active:scale-95 flex items-center gap-3 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
        </div>
      </div>

      {/* Tier Selector */}
      <div className="bg-white p-2 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-2 max-w-fit">
         {[
           { id: 'local', label: '🇳🇬 Nigeria (Local)' },
           { id: 'TIER_1', label: '🌍 Tier 1 (High)' },
           { id: 'TIER_2', label: '🌍 Tier 2 (Mid)' },
           { id: 'TIER_3', label: '🌍 Tier 3 (Low)' },
         ].map((tier: { id: string; label: string }) => (
           <button
             key={tier.id}
             onClick={() => setSelectedTier(tier.id as any)}
             className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
               selectedTier === tier.id 
                ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10 scale-105" 
                : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
             }`}
           >
             {tier.label}
           </button>
         ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:w-72 flex w-full lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
          {tabs.map((tab: any) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-4 px-6 py-5 rounded-3xl font-bold text-sm tracking-wide transition-all w-full text-left whitespace-nowrap lg:whitespace-normal group ${
                activeTab === tab.id 
                  ? 'bg-white text-blue-600 shadow-xl shadow-blue-900/5 ring-1 ring-slate-100' 
                  : 'text-slate-400 hover:bg-white hover:text-slate-600'
              }`}
            >
              <div className={`p-2.5 rounded-xl transition-all ${
                 activeTab === tab.id ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
              }`}>
                <tab.icon className="w-5 h-5" />
              </div>
              {tab.id === 'Hero' || tab.id === 'Plans' ? `${tab.id} (Tier)` : tab.id}
              {activeTab === tab.id && <div className="ml-auto w-1.5 h-1.5 bg-blue-500 rounded-full lg:block hidden"></div>}
            </button>
          ))}
        </div>

        {/* Editor Area */}
        <div className="flex-grow bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 md:p-10 relative">
          <AnimatePresence mode="wait">
            {activeTab === 'Hero' && (
              <motion.div
                key="hero"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <Type className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">Regional Messaging</h4>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Editing {selectedTier.toUpperCase()} Market</p>
                      </div>
                   </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Badge Label</label>
                  <input 
                    value={currentTierData.badge}
                    onChange={(e) => updateTierCopy('badge', e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-2xl p-5 text-slate-800 font-bold focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                    placeholder="e.g. For Nigerian Businesses"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Hero Title (HTML supported)</label>
                  <textarea 
                    value={currentTierData.title}
                    onChange={(e) => updateTierCopy('title', e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-2xl p-5 text-slate-800 font-bold focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-lg min-h-[120px]"
                    placeholder="Enter main heading..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Hero Subtitle</label>
                  <textarea 
                    value={currentTierData.subtitle}
                    onChange={(e) => updateTierCopy('subtitle', e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-2xl p-5 text-slate-600 font-medium focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-base min-h-[100px]"
                    placeholder="Enter sub-heading content..."
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'Plans' && (
              <motion.div
                key="plans"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">Regional Pricing Plans</h4>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Rates for {selectedTier.toUpperCase()}</p>
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                  {currentTierData.plans.map((plan: PlanConfig, idx: number) => (
                    <div key={plan.name} className="p-8 rounded-[2rem] bg-slate-50/50 border border-slate-100 group relative">
                      <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-grow space-y-6">
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Plan Name</label>
                              <input 
                                value={plan.name}
                                onChange={(e) => updatePlan(idx, { name: e.target.value })}
                                className="w-full bg-white rounded-2xl px-5 py-3 border border-slate-100 font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                              />
                            </div>
                            <div>
                               <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Price ({selectedTier === 'local' ? '₦' : '$'})</label>
                               <input 
                                 type="number"
                                 value={plan.price}
                                 onChange={(e) => updatePlan(idx, { price: Number(e.target.value) })}
                                 className="w-full bg-white rounded-2xl px-5 py-3 border border-slate-100 font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                               />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Description</label>
                            <input 
                              value={plan.description}
                              onChange={(e) => updatePlan(idx, { description: e.target.value })}
                              className="w-full bg-white rounded-2xl px-5 py-3 border border-slate-100 font-medium text-slate-600 outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-6">
                             <div>
                               <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">QR Limit</label>
                               <input 
                                 type="number"
                                 value={plan.limits?.qrCodes}
                                 onChange={(e) => updatePlan(idx, { limits: { ...plan.limits!, qrCodes: Number(e.target.value) } })}
                                 className="w-full bg-white rounded-2xl px-5 py-3 border border-slate-100 font-bold text-blue-600 outline-none"
                               />
                               <p className="mt-1 text-[8px] text-slate-400 uppercase font-black tracking-widest indent-2">-1 = Unlimited</p>
                             </div>
                             <div>
                               <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Scan Limit</label>
                               <input 
                                 type="number"
                                 value={plan.limits?.scans}
                                 onChange={(e) => updatePlan(idx, { limits: { ...plan.limits!, scans: Number(e.target.value) } })}
                                 className="w-full bg-white rounded-2xl px-5 py-3 border border-slate-100 font-bold text-blue-600 outline-none"
                               />
                             </div>
                             {plan.limits?.leads !== undefined && (
                               <div>
                                 <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Lead Limit</label>
                                 <input 
                                   type="number"
                                   value={plan.limits?.leads}
                                   onChange={(e) => updatePlan(idx, { limits: { ...plan.limits!, leads: Number(e.target.value) } })}
                                   className="w-full bg-white rounded-2xl px-5 py-3 border border-slate-100 font-bold text-blue-600 outline-none"
                                 />
                               </div>
                             )}
                          </div>
                        </div>

                        <div className="w-full md:w-56 space-y-4 pt-1">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Visibility & Badges</label>
                          <label className="flex items-center gap-3 cursor-pointer group/toggle p-3 bg-white rounded-2xl border border-slate-100 transition-all hover:bg-slate-50">
                            <div 
                              onClick={() => updatePlan(idx, { popular: !plan.popular })}
                              className={`w-10 h-5 rounded-full transition-all relative ${plan.popular ? 'bg-blue-600' : 'bg-slate-200'}`}
                            >
                              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${plan.popular ? 'left-6' : 'left-1'}`}></div>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Popular</span>
                          </label>
                          
                          <label className="flex items-center gap-3 cursor-pointer p-3 bg-white rounded-2xl border border-slate-100 transition-all hover:bg-slate-50">
                            <div 
                              onClick={() => updatePlan(idx, { highlight: !plan.highlight })}
                              className={`w-10 h-5 rounded-full transition-all relative ${plan.highlight ? 'bg-indigo-600' : 'bg-slate-200'}`}
                            >
                              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${plan.highlight ? 'left-6' : 'left-1'}`}></div>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Highlight</span>
                          </label>

                          <label className="flex items-center gap-3 cursor-pointer p-3 bg-white rounded-2xl border border-slate-100 transition-all hover:bg-slate-50">
                            <div 
                              onClick={() => updatePlan(idx, { trial: !plan.trial })}
                              className={`w-10 h-5 rounded-full transition-all relative ${plan.trial ? 'bg-emerald-500' : 'bg-slate-200'}`}
                            >
                              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${plan.trial ? 'left-6' : 'left-1'}`}></div>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">7-Day Trial</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'Features' && (
              <motion.div
                key="features"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                 <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <ListTodo className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">Global Feature Set</h4>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Shared across all regional tiers</p>
                      </div>
                   </div>
                   <button 
                    onClick={() => {
                        const newConfig = { ...config };
                        // Simplified: update global lists in state then save will apply to all plans
                        // For this demo, let's just edit the existing ones in the UI
                    }}
                    className="flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Add Global Feature
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentTierData.plans[0].features.map((feature: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 group">
                      <div className="flex-grow flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:bg-white focus-within:border-white">
                        <Check className="w-4 h-4 text-blue-500 flex-shrink-0 mr-3" />
                        <input 
                          value={feature}
                          onChange={(e) => updateGlobalFeatures(idx, e.target.value)}
                          className="w-full bg-transparent border-none p-0 text-sm font-semibold text-slate-700 outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'FAQs' && (
              <motion.div
                key="faqs"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <h3 className="text-lg font-bold text-slate-800">Frequently Asked Questions</h3>
                  <button 
                    className="flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Add FAQ (Global)
                  </button>
                </div>

                <div className="p-12 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                   <HelpCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                   <p className="text-slate-400 font-medium">Global FAQ Management Coming Soon in v2.0</p>
                </div>
              </motion.div>
            )}

            {activeTab === 'Add-ons' && (
              <motion.div
                key="addons"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-[2rem] p-8">
                    <div className="flex items-center gap-6 mb-8">
                       <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/5">
                         <Zap className="w-6 h-6 text-blue-600" />
                       </div>
                       <div>
                         <h4 className="text-xl font-black text-slate-800 tracking-tight">API Integration Add-on</h4>
                         <p className="text-xs text-blue-600/60 font-black uppercase tracking-widest">Global Upsell Opportunity</p>
                       </div>
                    </div>

                    <div className="p-12 text-center bg-white/40 backdrop-blur-sm rounded-[2rem] border border-dashed border-white">
                        <p className="text-slate-400 font-medium">Add-on Pricing is currently tied to Global Market Detection.</p>
                        <button className="mt-4 text-blue-600 font-black text-[10px] uppercase tracking-widest">Request Tier-Based Add-ons</button>
                    </div>
                  </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
