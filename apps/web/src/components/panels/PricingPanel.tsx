import { useState, useMemo } from 'react';
import { Check, ArrowRight, Zap, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePublicPlans, usePublicConfig } from '../../hooks/usePricing';
import { useCurrentUser, useInitializePayment } from '../../hooks/useApi';
import { useSubscribeFree } from '../../hooks/useSubscribeFree';
import type { PublicPlan } from '../../types/api';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

export default function PricingPanel() {
  const queryClient = useQueryClient();
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<PublicPlan | null>(null);
  
  const { data: userData } = useCurrentUser();
  const user = userData?.user;
  const { data: plans, isLoading: plansLoading, error: plansError } = usePublicPlans();
  const { data: config, isLoading: configLoading } = usePublicConfig();
  const initializePayment = useInitializePayment();
  const subscribeFree = useSubscribeFree();

  const isLoading = plansLoading || configLoading;

  const currentPlans = useMemo(() => {
    if (!plans) return [];
    
    return plans.map((plan: PublicPlan) => {
      const pricePoint = plan.pricing[selectedCycle] || plan.pricing.monthly || {
        amount: 0,
        currency: 'USD',
        currencySymbol: '$',
        priceBookId: '',
        gatewayIds: {}
      };

      return {
        name: plan.name,
        description: plan.description || '',
        price: pricePoint.amount,
        currency: pricePoint.currencySymbol,
        currencyCode: pricePoint.currency,
        highlight: plan.isPopular,
        popular: plan.isPopular,
        isFree: plan.isFree,
        isCurrent: user?.planId === plan.id,
        trialDays: plan.trialDays,
        trial: plan.trialDays > 0,
        cta: plan.isFree ? "Start Free" : (plan.trialDays > 0 ? `Start ${plan.trialDays}-Day Trial` : "Get Started"),
        features: [
          `${plan.qrCodeLimit === -1 ? 'Unlimited' : plan.qrCodeLimit} Dynamic QR Codes`,
          ...((config?.features as string[]) || [])
        ]
      };
    });
  }, [plans, config, selectedCycle, user]);

  const handleJoinPlan = async (plan: PublicPlan) => {
    setSelectedPlan(plan);
    
    if (!user) return;

    if (plan.isFree) {
      try {
        await subscribeFree.mutateAsync({ planId: plan.id });
      } catch (err) {
        // Error handled in hook
      }
      return;
    }

    try {
      const data = await initializePayment.mutateAsync({
        planId: plan.id,
        interval: selectedCycle
      });

      const pricePoint = plan.pricing[selectedCycle] || plan.pricing.monthly || {
        amount: 0,
        currency: 'USD',
        currencySymbol: '$',
        priceBookId: '',
        gatewayIds: {}
      };

      if (data && (data as any).access_code) {
        const handler = (window as any).PaystackPop.setup({
          key: (import.meta as any).env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_b8e2d78705a6e87f87053e87053e87053e8705', 
          email: user.email,
          amount: Math.round(pricePoint.amount * 100),
          access_code: (data as any).access_code,
          onClose: () => {
             toast.error('Payment window closed');
          },
          callback: (_response: any) => {
             toast.success('Payment successful! Upgrading your account...');
             queryClient.invalidateQueries({ queryKey: ['currentUser'] });
          }
        });
        handler.openIframe();
      } else if (data && (data as any).authorization_url) {
        window.location.href = (data as any).authorization_url;
      }
    } catch (err) {}
  };

  if (plansError) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm max-w-md border border-slate-200/60">
           <h2 className="text-lg font-bold text-slate-900 mb-2">Pricing Unavailable</h2>
           <p className="text-sm text-slate-500 mb-6">We couldn't load the plans right now.</p>
           <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl shadow-sm hover:bg-blue-700 transition-all">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center pt-16">
           <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
           <p className="text-slate-400 font-medium text-sm">Loading plans...</p>
        </div>
      ) : (
        <>
            {/* Billing Cycle Toggle */}
            <div className="flex justify-center mb-10">
              <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200/50">
                {(['monthly', 'quarterly', 'yearly'] as const).map((cycle) => (
                  <button
                    key={cycle}
                    onClick={() => setSelectedCycle(cycle)}
                    className={`px-5 py-2 rounded-lg text-[13px] font-semibold capitalize transition-all duration-200 ${
                      selectedCycle === cycle
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {cycle}
                    {cycle === 'yearly' && <span className="ml-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">Save 20%</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start max-w-5xl mx-auto">
            {currentPlans.map((plan, idx) => {
              const isHighlighted = plan.highlight && !plan.isCurrent;
              const isCurrent = plan.isCurrent;

              return (
                <motion.div 
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08, duration: 0.4 }}
                  className={`relative rounded-2xl transition-all duration-300 overflow-hidden flex flex-col ${
                    isHighlighted
                      ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 ring-2 ring-blue-500/50 scale-[1.02] z-10'
                      : isCurrent
                      ? 'bg-white border-2 border-blue-500 shadow-lg shadow-blue-500/10'
                      : 'bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300'
                  }`}
                >
                  {/* Badge */}
                  {isCurrent && (
                    <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white text-center py-1.5 text-[11px] font-semibold tracking-wider uppercase flex items-center justify-center gap-1.5">
                      <Zap className="w-3 h-3 fill-white" /> Current Plan
                    </div>
                  )}
                  {(plan.popular || plan.trial) && !isCurrent && (
                    <div className={`absolute top-0 left-0 right-0 text-center py-1.5 text-[11px] font-semibold tracking-wider uppercase flex items-center justify-center gap-1.5 ${
                      isHighlighted ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'
                    }`}>
                      <Sparkles className="w-3 h-3" />
                      {plan.trial ? `${plan.trialDays}-Day Free Trial` : 'Most Popular'}
                    </div>
                  )}

                  {/* Content */}
                  <div className={`p-7 flex flex-col flex-grow ${(isCurrent || plan.popular || plan.trial) ? 'pt-12' : ''}`}>
                    {/* Plan Name */}
                    <div className="mb-6">
                      <h3 className={`text-lg font-bold mb-1 ${isHighlighted ? 'text-white' : 'text-slate-900'}`}>
                        {plan.name}
                      </h3>
                      <p className={`text-[13px] leading-relaxed ${isHighlighted ? 'text-slate-400' : 'text-slate-500'}`}>
                        {plan.description}
                      </p>
                    </div>
                    
                    {/* Price */}
                    <div className="mb-7">
                      <div className="flex items-baseline gap-1">
                        <span className={`text-sm font-semibold ${isHighlighted ? 'text-slate-400' : 'text-slate-400'}`}>{plan.currency}</span>
                        <span className={`text-5xl font-bold tracking-tight ${isHighlighted ? 'text-white' : 'text-slate-900'}`}>
                           {plan.price === 0 ? '0' : plan.price.toLocaleString()}
                        </span>
                      </div>
                      <p className={`text-[12px] mt-1 font-medium ${isHighlighted ? 'text-slate-500' : 'text-slate-400'}`}>
                        per {selectedCycle === 'yearly' ? 'year' : (selectedCycle === 'quarterly' ? 'quarter' : 'month')}
                      </p>
                    </div>

                    {/* CTA Button */}
                    <button 
                      onClick={() => handleJoinPlan(plans!.find((p: any) => p.name === plan.name)!)}
                      disabled={initializePayment.isPending || isCurrent}
                      className={`w-full py-3 rounded-xl font-semibold text-[13px] transition-all duration-200 active:scale-[0.97] flex justify-center items-center gap-2.5 mb-7 ${
                        isCurrent
                          ? 'bg-slate-100 text-slate-400 cursor-default'
                          : isHighlighted 
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30' 
                            : 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
                      } ${initializePayment.isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {((initializePayment.isPending || subscribeFree.isPending) && selectedPlan?.name === plan.name) ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          {isCurrent ? "Active" : plan.cta}
                          {!isCurrent && <ArrowRight className="w-4 h-4" />}
                        </>
                      )}
                    </button>

                    {/* Feature divider */}
                    <div className={`border-t mb-6 ${isHighlighted ? 'border-white/10' : 'border-slate-100'}`} />

                    {/* Features List */}
                    <div className="space-y-3.5 flex-grow">
                      {plan.features.map((feature, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                            isHighlighted ? 'bg-blue-500/20' : 'bg-blue-50'
                          }`}>
                            <Check className={`w-3 h-3 ${isHighlighted ? 'text-blue-400' : 'text-blue-600'}`} strokeWidth={3} />
                          </div>
                          <span className={`text-[13px] leading-snug font-medium ${isHighlighted ? 'text-slate-300' : 'text-slate-600'}`}>
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
