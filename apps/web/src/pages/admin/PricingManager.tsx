import { useState, useMemo, useEffect } from 'react';
import {
  Save,
  Plus,
  Trash2,
  Check,
  Type,
  CreditCard,
  ListTodo,
  HelpCircle,
  Eye,
  Settings,
  Globe,
  ChevronRight,
  TrendingUp,
  Shield,
  Zap,
  Layout,
  Globe2,
  Percent,
  Edit2,
  X,
  Search,
  DollarSign,
  AlertTriangle,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Box,
  CornerDownRight,
  MousePointer2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { 
  useAdminPlans, 
  useUpsertPlan, 
  useSetPlanPrice, 
  useAdminTiers, 
  useAdminCountries, 
  useUpsertCountry, 
  useAdminPricingConfig, 
  useUpdatePricingConfig,
  useSystemConfig,
  useUpdateSystemConfig,
  useDeletePlan
} from '../../hooks/useAdmin';
import type { Plan, Tier, Country, PricingConfig, SystemConfig } from '../../types/api';
import type { QRType } from '../../types/qr';

const QR_TYPES_LIST: { value: QRType; label: string }[] = [
  { value: 'url', label: 'URL / Website' },
  { value: 'text', label: 'Plain Text' },
  { value: 'vcard', label: 'Digital Business Card' },
  { value: 'wifi', label: 'Wi-Fi Access' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'whatsapp', label: 'WhatsApp Message' },
  { value: 'phone', label: 'Call Phone' },
  { value: 'instagram', label: 'Instagram Profile' },
  { value: 'facebook', label: 'Facebook Page' },
  { value: 'linkedin', label: 'LinkedIn Profile' },
  { value: 'twitter', label: 'Twitter / X' },
  { value: 'youtube', label: 'YouTube Video' },
  { value: 'tiktok', label: 'TikTok Profile' },
  { value: 'crypto', label: 'Crypto Address' },
  { value: 'socials', label: 'Social Media Links' },
  { value: 'links', label: 'Link Tree / Bio' },
  { value: 'image', label: 'Image Gallery' },
  { value: 'event', label: 'Event / Calendar' },
  { value: 'pdf', label: 'PDF Document' },
  { value: 'video', label: 'Video Player' },
  { value: 'mp3', label: 'Audio / Podcast' },
  { value: 'app', label: 'App Store Links' },
  { value: 'business', label: 'Business Profile' },
  { value: 'menu', label: 'Digital Menu' },
  { value: 'coupon', label: 'Coupon / Offer' },
  { value: 'form', label: 'Custom Form' },
];

export default function PricingManager() {
  const [activeTab, setActiveTab] = useState('Plans');
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Partial<Plan> & { tempPrices?: Record<string, number> } | null>(null);
  const [countrySearch, setCountrySearch] = useState('');
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
  const [selectedCountries, setSelectedCountries] = useState<Set<string>>(new Set());

  // Local Discount State (Synced with Server)
  const [localQuarterlyDiscount, setLocalQuarterlyDiscount] = useState(10);
  const [localYearlyDiscount, setLocalYearlyDiscount] = useState(20);

  // Data Hooks
  const { data: plans, isLoading: plansLoading } = useAdminPlans();
  const { data: tiers, isLoading: tiersLoading } = useAdminTiers();
  const { data: countries, isLoading: countriesLoading } = useAdminCountries();
  const { data: pricingConfig } = useAdminPricingConfig();
  const { data: cmsConfig } = useSystemConfig();

  // Mutation Hooks
  const upsertPlan = useUpsertPlan();
  const setPlanPrice = useSetPlanPrice();
  const deletePlan = useDeletePlan();
  const upsertCountry = useUpsertCountry();
  const updatePricingConfig = useUpdatePricingConfig();
  const updateCMSConfig = useUpdateSystemConfig();

  // Sync local discounts with server data
  useEffect(() => {
    if (pricingConfig) {
      setLocalQuarterlyDiscount(pricingConfig.quarterlyDiscount);
      setLocalYearlyDiscount(pricingConfig.yearlyDiscount);
    }
  }, [pricingConfig]);

  const tabs = [
    { id: 'Plans', icon: CreditCard, label: 'Plan Registry' },
    { id: 'Pricing', icon: DollarSign, label: 'Tier Pricing' },
    { id: 'Regional', icon: Globe2, label: 'Regional Settings' },
    { id: 'CMS', icon: Layout, label: 'CMS Content' },
  ];

  // Group countries by Tier ID
  const countriesByTier = useMemo(() => {
    if (!countries || !tiers) return {};
    const grouped: Record<string, Country[]> = {};
    
    tiers.forEach(tier => { grouped[tier.id] = []; });
    
    countries.forEach(country => {
      const searchMatch = !countrySearch || 
        country.name.toLowerCase().includes(countrySearch.toLowerCase()) || 
        country.code.toLowerCase().includes(countrySearch.toLowerCase());
      
      if (searchMatch) {
        if (grouped[country.tierId]) {
          grouped[country.tierId].push(country);
        } else {
          // Fallback just in case
          grouped[country.tierId] = [country];
        }
      }
    });

    return grouped;
  }, [countries, tiers, countrySearch]);

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    upsertPlan.mutate(editingPlan, {
      onSuccess: (savedPlan) => {
        if (editingPlan.tempPrices) {
          Object.entries(editingPlan.tempPrices).forEach(([tierId, price]) => {
            setPlanPrice.mutate({ 
              planId: savedPlan.id, 
              tierId, 
              monthlyPriceUSD: price 
            });
          });
        }
        setIsPlanModalOpen(false);
        setEditingPlan(null);
      }
    });
  };

  const handleConfirmDelete = () => {
    if (planToDelete) {
      deletePlan.mutate(planToDelete.id, {
        onSuccess: () => setPlanToDelete(null)
      });
    }
  };

  const handleUpdateCMS = (data: Partial<SystemConfig>) => {
    updateCMSConfig.mutate(data);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const countryCode = result.draggableId;
    const targetTierId = result.destination.droppableId;
    const sourceTierId = result.source.droppableId;

    if (targetTierId !== sourceTierId) {
      upsertCountry.mutate({ code: countryCode, tierId: targetTierId });
    }
  };

  const toggleCountrySelection = (code: string) => {
    const newSelected = new Set(selectedCountries);
    if (newSelected.has(code)) {
      newSelected.delete(code);
    } else {
      newSelected.add(code);
    }
    setSelectedCountries(newSelected);
  };

  const handleBulkMove = (targetTierId: string) => {
    Array.from(selectedCountries).forEach(code => {
      upsertCountry.mutate({ code, tierId: targetTierId });
    });
    setSelectedCountries(new Set());
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-40 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 rounded-[2.5rem] px-8 py-12 text-white relative overflow-hidden group shadow-2xl shadow-blue-500/10">
        <div className="absolute top-0 right-0 p-40 bg-blue-600/20 rounded-full -translate-y-1/2 translate-x-1/2 -z-10 blur-[100px] opacity-50 transition-all duration-700 group-hover:bg-blue-600/30"></div>
        <div className="absolute bottom-0 left-0 p-40 bg-indigo-600/10 rounded-full translate-y-1/2 -translate-x-1/2 -z-10 blur-[100px] opacity-50"></div>

        <div className="flex items-center gap-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-500/50 relative">
             <div className="absolute inset-0 bg-white/20 rounded-[2rem] blur-sm scale-110 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Settings className="w-10 h-10 text-white relative z-10" />
          </div>
          <div>
            <h2 className="text-4xl font-black tracking-tight leading-none mb-3">System Billing</h2>
            <p className="text-slate-400 font-medium text-lg flex items-center gap-3">
              <Shield className="w-5 h-5 text-blue-500" />
              Manage dynamic plans, tiered pricing, and regional localization
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex flex-col items-end mr-4">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Status</span>
             <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-emerald-400 text-[10px] font-black uppercase">Live System</span>
             </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 mt-10">
        {/* Navigation Sidebar */}
        <div className="lg:w-80 flex w-full lg:flex-col gap-3 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-5 px-6 py-6 rounded-[2rem] font-black text-sm tracking-wide transition-all w-full text-left whitespace-nowrap lg:whitespace-normal group relative overflow-hidden ${activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-2xl shadow-blue-900/20'
                : 'bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-slate-100'
                }`}
            >
              <div className={`p-3 rounded-2xl transition-all ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-blue-600'
                }`}>
                <tab.icon className="w-6 h-6" />
              </div>
              <span className="relative z-10">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="tab-active"
                  className="absolute right-6 w-2 h-2 bg-white rounded-full lg:block hidden shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                />
              )}
            </button>
          ))}
        </div>

        {/* Editor Area */}
        <div className="flex-grow bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-8 md:p-12 relative overflow-hidden min-h-[600px]">
          <AnimatePresence mode="wait">
            {activeTab === 'Plans' && (
              <motion.div
                key="plans"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-10"
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Plan Registry</h3>
                    <p className="text-slate-500 font-medium">Define the core capabilities and limits for each plan tier.</p>
                  </div>
                  <button 
                    onClick={() => {
                      setEditingPlan({ 
                        name: '', 
                        qrCodeLimit: 10, 
                        qrCodeTypes: [], 
                        isActive: true,
                        tempPrices: {}
                      });
                      setIsPlanModalOpen(true);
                    }}
                    className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-xl shadow-blue-600/30 active:scale-95"
                  >
                    <Plus className="w-5 h-5" />
                    New Plan
                  </button>
                </div>

                {plansLoading ? (
                   <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">Fetching Plans...</p>
                   </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {plans?.map((plan) => (
                      <div key={plan.id} className="group p-8 rounded-[2.5rem] bg-slate-50 border-2 border-transparent hover:border-blue-500/20 hover:bg-white transition-all duration-300 relative shadow-sm hover:shadow-2xl">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                              <Zap className="w-7 h-7" />
                            </div>
                            <div>
                               <div className="flex items-center gap-3">
                                  <h4 className="text-xl font-black text-slate-900">{plan.name}</h4>
                                  {!plan.isActive && <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[8px] font-black uppercase rounded-md">Draft</span>}
                                  {plan.isDefault && <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[8px] font-black uppercase rounded-md ring-1 ring-blue-500/20">Default</span>}
                               </div>
                               <p className="text-slate-400 font-medium text-sm">{plan.qrCodeLimit} QR Codes Limit</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                                onClick={() => {
                                const initialPrices: Record<string, number> = {};
                                plan.prices?.forEach(p => { initialPrices[p.tierId] = p.monthlyPriceUSD; });
                                setEditingPlan({ ...plan, tempPrices: initialPrices });
                                setIsPlanModalOpen(true);
                                }}
                                className="p-3 bg-white text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm"
                            >
                                <Edit2 className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={() => setPlanToDelete(plan)}
                                className="p-3 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shadow-sm"
                                title="Delete Plan"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                           <p className="text-slate-500 font-medium text-sm line-clamp-2 min-h-[40px] leading-relaxed">
                              {plan.description || "No description provided for this plan tier."}
                           </p>
                           <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between">
                              <div className="flex flex-col">
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{plan.qrCodeTypes.length} Features Enabled</span>
                                 <span className="text-[11px] font-black text-blue-600 mt-1">
                                    {plan.prices?.length ? `Basic: $${plan.prices.find(p => p.tier?.name === 'Tier 1')?.monthlyPriceUSD || '0.00'}/mo` : 'Pricing not set'}
                                 </span>
                              </div>
                              <div className="flex -space-x-2">
                                 {plan.qrCodeTypes.slice(0, 5).map((type, i) => (
                                    <div key={i} className="w-8 h-8 rounded-full bg-white border-2 border-slate-50 flex items-center justify-center shadow-sm" title={type}>
                                       <span className="text-[10px] uppercase font-bold text-slate-400">{type.charAt(0)}</span>
                                    </div>
                                 ))}
                                 {plan.qrCodeTypes.length > 5 && (
                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-black text-white border-2 border-white shadow-sm">
                                       +{plan.qrCodeTypes.length - 5}
                                    </div>
                                 )}
                              </div>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'Pricing' && (
              <motion.div
                key="pricing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12"
              >
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                  <div className="max-w-md">
                    <h3 className="text-2xl font-black text-slate-900 mb-3">Tiered Price Matrix</h3>
                    <p className="text-slate-500 font-medium leading-relaxed">
                        Set baseline monthly prices. Quarterly and Yearly plans are persisted on the backend based on global discounts.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-6 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex-grow max-w-2xl">
                    <div className="flex-grow space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span>Quarterly Discount</span>
                            <span className="text-blue-600 bg-white px-2 py-0.5 rounded-lg shadow-sm">{localQuarterlyDiscount}%</span>
                        </div>
                        <input 
                            type="range"
                            min="0"
                            max="50"
                            value={localQuarterlyDiscount}
                            onChange={(e) => setLocalQuarterlyDiscount(Number(e.target.value))}
                            onMouseUp={() => updatePricingConfig.mutate({ quarterlyDiscount: localQuarterlyDiscount, yearlyDiscount: localYearlyDiscount })}
                            className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>
                    <div className="flex-grow space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span>Yearly Discount</span>
                            <span className="text-indigo-600 bg-white px-2 py-0.5 rounded-lg shadow-sm">{localYearlyDiscount}%</span>
                        </div>
                        <input 
                            type="range"
                            min="0"
                            max="70"
                            value={localYearlyDiscount}
                            onChange={(e) => setLocalYearlyDiscount(Number(e.target.value))}
                            onMouseUp={() => updatePricingConfig.mutate({ quarterlyDiscount: localQuarterlyDiscount, yearlyDiscount: localYearlyDiscount })}
                            className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
                        />
                    </div>
                  </div>
                </div>

                {plansLoading || tiersLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                     <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <table className="w-full text-left border-separate border-spacing-0">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="p-8 text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 sticky left-0 bg-slate-50 z-10">Plan Name</th>
                          {tiers?.map((tier) => (
                            <th key={tier.id} className="p-8 text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 border-l border-slate-100/50">
                              <div className="flex flex-col">
                                 <span className="text-slate-900 mb-1">{tier.name}</span>
                                 <span className="font-medium lowercase text-[9px] tracking-normal text-slate-400">{tier.description}</span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {plans?.map((plan) => (
                          <tr key={plan.id} className="hover:bg-slate-50/20 transition-colors">
                            <td className="p-8 border-b border-slate-100 font-black text-slate-900 sticky left-0 bg-white z-10">{plan.name}</td>
                            {tiers?.map((tier) => {
                              const price = plan.prices?.find(p => p.tierId === tier.id);
                              const monthlyVal = price?.monthlyPriceUSD || 0;
                              const quarterlyVal = price?.quarterlyPriceUSD || 0;
                              const yearlyVal = price?.yearlyPriceUSD || 0;
                              
                              return (
                                <td key={tier.id} className="p-8 border-b border-slate-100 border-l border-slate-100/50">
                                  <div className="space-y-4">
                                    <div className="relative group/input">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">$</div>
                                        <input 
                                            type="number"
                                            key={monthlyVal}
                                            defaultValue={monthlyVal}
                                            onBlur={(e) => {
                                                const val = Number(e.target.value);
                                                if (val !== monthlyVal) {
                                                    setPlanPrice.mutate({ planId: plan.id, tierId: tier.id, monthlyPriceUSD: val });
                                                }
                                            }}
                                            className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-4 py-3 text-sm font-black text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm"
                                        />
                                    </div>

                                    {monthlyVal > 0 && (
                                        <div className="grid grid-cols-1 gap-2 p-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Quarterly</span>
                                                <span className="text-[10px] font-bold text-slate-600">${quarterlyVal.toFixed(2)}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Yearly</span>
                                                <span className="text-[10px] font-bold text-slate-900">${yearlyVal.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    )}

                                    {monthlyVal === 0 && (
                                        <div className="p-3 bg-emerald-50 rounded-xl border border-dashed border-emerald-100 text-center">
                                            <span className="text-[10px] font-black text-emerald-600 uppercase">Always Free</span>
                                        </div>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'Regional' && (
              <motion.div
                key="regional"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-10"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Regional Logic Center</h3>
                    <p className="text-slate-500 font-medium">Drag countries between tiers or bulk move selected regions.</p>
                  </div>
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Search regions..."
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      className="bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold outline-none w-full md:w-80 transition-all focus:ring-4 focus:ring-blue-500/10 focus:bg-white"
                    />
                  </div>
                </div>

                {countriesLoading || tiersLoading ? (
                   <div className="flex items-center justify-center py-20">
                      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                   </div>
                ) : (
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="space-y-10 pb-20">
                      {tiers?.map((tier) => {
                        const tierCountries = countriesByTier[tier.id] || [];
                        const isAllInTierSelected = tierCountries.length > 0 && 
                          tierCountries.every(c => selectedCountries.has(c.code));

                        return (
                          <div key={tier.id} className="bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100/50">
                            <div className="flex items-center justify-between mb-8 px-4">
                               <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                                     <Box className="w-6 h-6 text-blue-600" />
                                  </div>
                                  <div>
                                     <h4 className="text-xl font-black text-slate-900">{tier.name}</h4>
                                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        {tierCountries.length} Countries Linked
                                     </span>
                                  </div>
                               </div>
                               
                               <button 
                                 onClick={() => {
                                    const newSelected = new Set(selectedCountries);
                                    if (isAllInTierSelected) {
                                      tierCountries.forEach(c => newSelected.delete(c.code));
                                    } else {
                                      tierCountries.forEach(c => newSelected.add(c.code));
                                    }
                                    setSelectedCountries(newSelected);
                                 }}
                                 className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 border ${
                                   isAllInTierSelected 
                                     ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' 
                                     : 'bg-white text-slate-400 border-slate-200 hover:text-blue-600'
                                 }`}
                               >
                                  <Check className={`w-3.5 h-3.5 ${isAllInTierSelected ? 'opacity-100' : 'opacity-0'}`} />
                                  {isAllInTierSelected ? 'Deselect All' : 'Select All'}
                               </button>
                            </div>

                            <Droppable droppableId={tier.id}>
                              {(provided, snapshot) => (
                                <div 
                                  ref={provided.innerRef} 
                                  {...provided.droppableProps}
                                  className={`rounded-[2rem] transition-all overflow-hidden border ${
                                    snapshot.isDraggingOver ? 'bg-blue-50/50 border-blue-500/30 ring-4 ring-blue-500/5' : 'bg-white border-slate-100 shadow-sm'
                                  }`}
                                >
                                  <table className="w-full text-left">
                                    <thead className="bg-slate-100/50">
                                      <tr>
                                        <th className="w-16 p-6 text-[10px] font-black uppercase text-slate-400">Move</th>
                                        <th className="w-16 p-6"></th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Region Name</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Code</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Currency</th>
                                        <th className="p-6 text-right"></th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                      {tierCountries.map((country, index) => (
                                        <Draggable key={country.code} draggableId={country.code} index={index}>
                                          {(dragProvided, dragSnapshot) => (
                                            <tr
                                              ref={dragProvided.innerRef}
                                              {...dragProvided.draggableProps}
                                              className={`group transition-all ${
                                                dragSnapshot.isDragging ? 'bg-white shadow-2xl opacity-100' : 'hover:bg-slate-50/50'
                                              }`}
                                            >
                                              <td className="p-6" {...dragProvided.dragHandleProps}>
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 group-hover:text-blue-600 transition-colors">
                                                   <GripVertical className="w-5 h-5" />
                                                </div>
                                              </td>
                                              <td className="p-6">
                                                 <label className="flex items-center justify-center cursor-pointer">
                                                    <input 
                                                      type="checkbox" 
                                                      className="hidden" 
                                                      checked={selectedCountries.has(country.code)}
                                                      onChange={() => toggleCountrySelection(country.code)}
                                                    />
                                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                                      selectedCountries.has(country.code) 
                                                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                                                        : 'bg-white border-slate-200 group-hover:border-blue-400'
                                                    }`}>
                                                       <Check className={`w-3.5 h-3.5 ${selectedCountries.has(country.code) ? 'scale-100' : 'scale-0'} transition-transform`} />
                                                    </div>
                                                 </label>
                                              </td>
                                              <td className="p-6 font-black text-slate-900">{country.name}</td>
                                              <td className="p-6">
                                                 <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-black text-slate-500">{country.code}</span>
                                              </td>
                                              <td className="p-6">
                                                 <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-700">{country.currencyCode}</span>
                                                    <span className="text-slate-400">({country.currencySymbol})</span>
                                                 </div>
                                              </td>
                                              <td className="p-6 text-right">
                                                 <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <CornerDownRight className="w-4 h-4 text-slate-300" />
                                                 </div>
                                              </td>
                                            </tr>
                                          )}
                                        </Draggable>
                                      ))}
                                      {tierCountries.length === 0 && (
                                         <tr>
                                            <td colSpan={6} className="p-12 text-center text-slate-400 font-medium italic">
                                               No regions currently assigned to this tier.
                                            </td>
                                         </tr>
                                      )}
                                    </tbody>
                                  </table>
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </div>
                        );
                      })}
                    </div>
                  </DragDropContext>
                )}

                {/* Bulk Action Bar */}
                <AnimatePresence>
                  {selectedCountries.size > 0 && (
                    <motion.div
                      initial={{ y: 100, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 100, opacity: 0 }}
                      className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[150] w-[90%] max-w-4xl"
                    >
                      <div className="bg-slate-900 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-blue-500/20 border border-white/10 backdrop-blur-xl">
                        <div className="flex items-center gap-6">
                           <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                              <MousePointer2 className="w-7 h-7" />
                           </div>
                           <div>
                              <div className="flex items-center gap-2 text-white">
                                 <span className="text-2xl font-black">{selectedCountries.size}</span>
                                 <span className="text-sm font-bold opacity-60">Regions Selected</span>
                              </div>
                              <button onClick={() => setSelectedCountries(new Set())} className="text-[10px] font-black uppercase text-blue-400 hover:text-blue-300">Deselect All</button>
                           </div>
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto">
                           <div className="relative group flex-grow md:flex-grow-0">
                              <span className="absolute -top-3 left-4 px-2 bg-slate-900 text-[9px] font-black text-blue-500 uppercase tracking-widest z-10">Target Tier</span>
                              <select 
                                className="w-full md:w-64 bg-slate-800 border-2 border-slate-700 text-white rounded-xl px-5 py-3 text-sm font-black outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                                onChange={(e) => {
                                  if (e.target.value) handleBulkMove(e.target.value);
                                }}
                                value=""
                              >
                                <option value="" disabled>Move selection to...</option>
                                {tiers?.map(t => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                           </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {activeTab === 'CMS' && (
              <motion.div
                key="cms"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12"
              >
                <div>
                   <h3 className="text-2xl font-black text-slate-900 mb-2">CMS Content Editor</h3>
                   <p className="text-slate-500 font-medium">Manage how the pricing page looks to the public.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                   {/* Hero Section */}
                   <div className="space-y-8">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Type className="w-5 h-5" />
                         </div>
                         <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">Hero Content</h4>
                      </div>

                      <div className="space-y-6">
                         <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Main Heading (HTML Support)</label>
                            <textarea
                              defaultValue={cmsConfig?.heroTitle}
                              onBlur={(e) => handleUpdateCMS({ heroTitle: e.target.value })}
                              className="w-full bg-slate-50 border-none rounded-[2rem] p-6 text-slate-800 font-black focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-xl min-h-[150px] resize-none"
                              placeholder="Elevate Your <span class='text-blue-600'>Business</span> with Dynamic QR..."
                            />
                         </div>
                         <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Subtitle</label>
                            <textarea
                              defaultValue={cmsConfig?.heroSubtitle}
                              onBlur={(e) => handleUpdateCMS({ heroSubtitle: e.target.value })}
                              className="w-full bg-slate-50 border-none rounded-[2rem] p-6 text-slate-600 font-bold focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-lg min-h-[120px] resize-none"
                              placeholder="Enter sub-heading content..."
                            />
                         </div>
                      </div>
                   </div>

                   {/* FAQs Section */}
                   <div className="space-y-8">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                               <HelpCircle className="w-5 h-5" />
                            </div>
                            <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">Pricing FAQs</h4>
                         </div>
                         <button
                           onClick={() => {
                              const newFaqs = [...(cmsConfig?.faqs || []), { question: "New Question?", answer: "New Answer..." }];
                              handleUpdateCMS({ faqs: newFaqs });
                           }}
                           className="flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] px-5 py-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all"
                         >
                           <Plus className="w-4 h-4" /> Add FAQ
                         </button>
                      </div>

                      <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                        {cmsConfig?.faqs.map((faq, idx) => (
                           <div key={idx} className="bg-slate-50 border border-slate-100 rounded-[2rem] p-8 group relative hover:bg-white hover:border-blue-500/20 transition-all">
                              <button
                                 onClick={() => {
                                    const newFaqs = cmsConfig.faqs.filter((_, i) => i !== idx);
                                    handleUpdateCMS({ faqs: newFaqs });
                                 }}
                                 className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                              >
                                 <Trash2 className="w-4 h-4" />
                              </button>
                              <div className="space-y-4">
                                 <input
                                    defaultValue={faq.question}
                                    onBlur={(e) => {
                                       const newFaqs = [...cmsConfig.faqs];
                                       newFaqs[idx] = { ...newFaqs[idx], question: e.target.value };
                                       handleUpdateCMS({ faqs: newFaqs });
                                    }}
                                    className="w-full bg-transparent border-none p-0 text-sm font-black text-slate-900 outline-none"
                                    placeholder="Question..."
                                 />
                                 <textarea
                                    defaultValue={faq.answer}
                                    onBlur={(e) => {
                                       const newFaqs = [...cmsConfig.faqs];
                                       newFaqs[idx] = { ...newFaqs[idx], answer: e.target.value };
                                       handleUpdateCMS({ faqs: newFaqs });
                                    }}
                                    className="w-full bg-transparent border-none p-0 text-xs font-medium text-slate-500 outline-none resize-none min-h-[60px]"
                                    placeholder="Answer..."
                                 />
                              </div>
                           </div>
                        ))}
                      </div>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Plan Modal */}
      <AnimatePresence>
        {isPlanModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsPlanModalOpen(false)}
               className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/30">
                       <Zap className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900">{editingPlan?.id ? 'Edit Plan Entity' : 'Create New Plan'}</h3>
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Configure Limits, Features & Tiered Pricing</p>
                    </div>
                 </div>
                 <button onClick={() => setIsPlanModalOpen(false)} className="p-3 bg-white text-slate-400 hover:text-slate-900 rounded-2xl transition-all">
                    <X className="w-6 h-6" />
                 </button>
              </div>

              <div className="flex-grow overflow-y-auto p-10 scrollbar-thin">
                 <form id="plan-form" onSubmit={handleSavePlan} className="space-y-12">
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="space-y-8">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Display Name</label>
                              <input 
                                 required
                                 value={editingPlan?.name}
                                 onChange={(e) => setEditingPlan({ ...editingPlan!, name: e.target.value })}
                                 placeholder="e.g., Growth, Enterprise..."
                                 className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-[1.5rem] px-6 py-4 text-sm font-black outline-none transition-all"
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Plan Description</label>
                              <textarea 
                                 value={editingPlan?.description || ''}
                                 onChange={(e) => setEditingPlan({ ...editingPlan!, description: e.target.value })}
                                 className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-[1.5rem] px-6 py-4 text-sm font-medium outline-none min-h-[100px] resize-none"
                              />
                           </div>
                           <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">QR Code Limit</label>
                                    <input 
                                       type="number"
                                       required
                                       value={editingPlan?.qrCodeLimit}
                                       onChange={(e) => setEditingPlan({ ...editingPlan!, qrCodeLimit: Number(e.target.value) })}
                                       className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl px-6 py-4 text-sm font-black outline-none"
                                    />
                              </div>
                              <div className="flex flex-col gap-2 pt-1">
                                 <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={editingPlan?.isActive} onChange={() => setEditingPlan({ ...editingPlan!, isActive: !editingPlan?.isActive })} className="w-4 h-4" />
                                    <span className="text-[10px] font-black text-slate-600 uppercase">Active</span>
                                 </label>
                                 <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={editingPlan?.isPopular} onChange={() => setEditingPlan({ ...editingPlan!, isPopular: !editingPlan?.isPopular })} className="w-4 h-4" />
                                    <span className="text-[10px] font-black text-slate-600 uppercase">Popular</span>
                                 </label>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-4">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Enabled QR Features</label>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-2 overflow-y-auto max-h-[350px] border border-slate-100 rounded-[2rem] p-6 bg-slate-50/30 scrollbar-thin">
                              {QR_TYPES_LIST.map((type) => (
                                 <label key={type.value} className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer border-2 transition-all ${editingPlan?.qrCodeTypes?.includes(type.value) ? 'bg-blue-50 border-blue-500/20 text-blue-700' : 'bg-white border-transparent'}`}>
                                    <input type="checkbox" className="hidden" checked={editingPlan?.qrCodeTypes?.includes(type.value)} onChange={(e) => {
                                       const types = editingPlan?.qrCodeTypes || [];
                                       setEditingPlan({ ...editingPlan!, qrCodeTypes: e.target.checked ? [...types, type.value] : types.filter(t => t !== type.value) });
                                    }} />
                                    <span className="text-xs font-black">{type.label}</span>
                                 </label>
                              ))}
                           </div>
                        </div>
                   </div>

                   <div className="pt-10 border-t border-slate-100 space-y-8">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><DollarSign className="w-6 h-6" /></div>
                        <div>
                           <h4 className="text-lg font-black text-slate-900">Tier Pricing Baseline</h4>
                           <p className="text-xs text-slate-500 font-medium">Interval prices are persisted on the backend based on global discounts</p>
                        </div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {tiers?.map((tier) => (
                           <div key={tier.id} className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{tier.name}</label>
                              <div className="relative mt-2">
                                 <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">$</div>
                                 <input 
                                    type="number" step="0.01" value={editingPlan?.tempPrices?.[tier.id] || ''}
                                    onChange={(e) => setEditingPlan({ ...editingPlan!, tempPrices: { ...editingPlan?.tempPrices, [tier.id]: Number(e.target.value) }})}
                                    className="w-full bg-white border-none rounded-2xl pl-8 pr-6 py-4 text-sm font-black outline-none shadow-sm"
                                 />
                              </div>
                           </div>
                        ))}
                     </div>
                   </div>
                 </form>
              </div>

              <div className="p-8 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <button onClick={() => setIsPlanModalOpen(false)} className="px-8 py-4 rounded-2xl text-slate-500 font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-100">Discard</button>
                 <button type="submit" form="plan-form" className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-600/30 flex items-center gap-3">
                    <Save className="w-5 h-5" /> Commit Changes
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {planToDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setPlanToDelete(null)}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 text-center"
            >
               <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="w-10 h-10" />
               </div>
               <h3 className="text-2xl font-black text-slate-900 mb-2">Delete Plan?</h3>
               <p className="text-slate-500 font-medium mb-8">
                  Are you sure you want to delete <span className="text-slate-900 font-bold">"{planToDelete.name}"</span>? 
                  {planToDelete.isActive && <span className="block mt-2 text-xs text-amber-600">If this plan has active subscribers, it will be soft-deleted to protect their access.</span>}
               </p>
               <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleConfirmDelete}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-rose-600/20 transition-all active:scale-95"
                  >
                     Confirm Deletion
                  </button>
                  <button 
                    onClick={() => setPlanToDelete(null)}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-4 rounded-2xl transition-all"
                  >
                     Cancel
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
