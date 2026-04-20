import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Check, ArrowRight, Zap, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePublicPlans, usePublicConfig } from '../../hooks/usePricing';
import { useCurrentUser, useInitializePayment } from '../../hooks/useApi';
import { paymentsApi } from '../../services/api';
import { useSubscribeFree } from '../../hooks/useSubscribeFree';
import type { PublicPlan } from '../../types/api';
import toast from 'react-hot-toast';

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
        cta: plan.isFree ? "Start Now" : (plan.trialDays > 0 ? `Start ${plan.trialDays}-Day Free Trial` : "Get Started"),
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

      console.log('Payment init response:', data);

      if (!data) {
        toast.error('No response from payment service');
        return;
      }

      if (!(data as any).access_code && !(data as any).authorization_url) {
        console.error('Unexpected payment response:', data);
        toast.error('Unable to initialize payment. Please try again.');
        return;
      }

      const pricePoint = plan.pricing?.[selectedCycle] || plan.pricing?.monthly || {
        amount: 0,
        currency: 'USD',
        currencySymbol: '$',
        priceBookId: '',
        gatewayIds: {}
      };
      
      const checkPaystack = async () => {
        const PaystackPop = (window as any).PaystackPop;
        if (!PaystackPop) {
          window.location.href = (data as any).authorization_url;
          return;
        }
        
        const verifyPayment = async (ref: string) => {
          const verifyingToast = toast.loading('Payment successful! Verifying your access...');
          try {
            await paymentsApi.verifyPaymentWithPlanId(ref, plan.id, selectedCycle);
            queryClient.invalidateQueries({ queryKey: ['currentUser'] });
            toast.dismiss(verifyingToast);
            toast.success('Account upgraded successfully!');
          } catch (err) {
            toast.dismiss(verifyingToast);
            toast.error('Failed to verify payment. Please contact support.');
          }
        };
        
        try {
          const handler = PaystackPop.setup({
            key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_b8e2d78705a6e87f87053e87053e87053e8705',
            email: user.email,
            amount: Math.round(pricePoint.amount * 100),
            access_code: (data as any).access_code,
            callback: function(response: any) {
              verifyPayment(response.reference);
            },
          });
          
          handler.openIframe();
        } catch (setupError) {
          console.error('Paystack setup error:', setupError);
          window.location.href = (data as any).authorization_url;
        }
      };
      
      setTimeout(checkPaystack, 100);
    } catch (err: any) {
      console.error('Payment initialization error:', err);
      toast.error(err.response?.data?.message || 'Failed to initialize payment');
    }
  };

  if (plansError) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl max-w-md border border-slate-100">
           <h2 className="text-2xl font-black text-slate-900 mb-4">Pricing Unavailable</h2>
           <p className="text-slate-500 mb-8">We couldn't load the plans. Please try again.</p>
           <button onClick={() => window.location.reload()} className="px-8 py-3 bg-blue-600 text-white font-black rounded-2xl shadow-lg">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center pt-20">
           <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
           <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading plans...</p>
        </div>
      ) : (
        <>
            <div className="flex justify-center mb-16">
              <div className="bg-white p-2 rounded-[2rem] shadow-sm border border-slate-100 flex gap-2">
                {(['monthly', 'quarterly', 'yearly'] as const).map((cycle) => (
                  <button
                    key={cycle}
                    onClick={() => setSelectedCycle(cycle)}
                    className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      selectedCycle === cycle
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {cycle}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-stretch">
            {currentPlans.map((plan, idx) => (
              <motion.div 
                key={`${plan.name}-${selectedCycle}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`flex flex-col relative rounded-[3rem] p-10 transition-all duration-500 overflow-hidden group ${
                  plan.isCurrent
                    ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-2xl shadow-blue-500/20 z-30'
                    : plan.highlight 
                      ? 'bg-slate-900 text-white shadow-2xl scale-105 z-20 xl:-translate-y-4 border border-blue-500/30' 
                      : 'bg-white border border-slate-100 shadow-xl shadow-blue-900/5 z-10'
                }`}
              >
                {plan.isCurrent && (
                  <div className="absolute top-8 left-10">
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                      <Zap className="w-3 h-3 fill-white" />
                      Current Plan
                    </div>
                  </div>
                )}

                {(plan.popular || plan.trial) && !plan.isCurrent && (
                  <div className="absolute top-8 right-10">
                      <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-5 py-2.5 rounded-full shadow-lg transition-transform group-hover:scale-110 ${
                        plan.highlight ? 'bg-blue-600 text-white shadow-blue-500/40' : 'bg-slate-900 text-white'
                     }`}>
                        {plan.trial ? `${plan.trialDays}-Day Trial` : 'Most Popular'}
                     </span>
                  </div>
                )}

                <div className="mb-10 pt-4">
                  <h3 className={`text-2xl font-black tracking-tight mb-2 ${plan.isCurrent ? 'text-blue-700' : (plan.highlight ? 'text-blue-400' : 'text-slate-900')}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm font-medium leading-relaxed mb-10 ${plan.isCurrent ? 'text-blue-600' : (plan.highlight ? 'text-slate-400' : 'text-slate-500')}`}>
                    {plan.description}
                  </p>
                  
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className={`text-3xl font-bold ${plan.isCurrent ? 'text-blue-600' : 'text-slate-400'}`}>{plan.currency}</span>
                    <span className={`text-7xl font-black tracking-tighter ${plan.isCurrent ? 'text-slate-800' : (plan.highlight ? 'text-white' : 'text-slate-900')}`}>
                       {plan.price === 0 ? '0' : plan.price.toLocaleString()}
                    </span>
                    <span className={`text-sm font-bold opacity-60 ml-2 ${plan.isCurrent ? 'text-blue-600' : (plan.highlight ? 'text-white' : 'text-slate-500')}`}>
                      / {selectedCycle === 'yearly' ? 'year' : (selectedCycle === 'quarterly' ? 'quarter' : 'month')}
                    </span>
                  </div>
                </div>

                <div className="space-y-6 mb-12 flex-grow">
                  {plan.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-4">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                        plan.isCurrent ? 'bg-emerald-100' : (plan.highlight ? 'bg-blue-600/20' : 'bg-blue-50')
                      }`}>
                        <Check className={`w-3.5 h-3.5 font-bold ${plan.isCurrent ? 'text-emerald-600' : (plan.highlight ? 'text-blue-400' : 'text-blue-600')}`} />
                      </div>
                      <span className={`text-sm font-bold tracking-tight ${plan.isCurrent ? 'text-slate-700' : (plan.highlight ? 'text-slate-200' : 'text-slate-700')}`}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => handleJoinPlan(plans!.find((p: any) => p.name === plan.name)!)}
                    disabled={initializePayment.isPending || plan.isCurrent}
                    className={`w-full py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 flex justify-center items-center gap-3 group/btn ${
                      plan.isCurrent
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 cursor-default'
                        : plan.highlight 
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/30' 
                          : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/10'
                    } ${initializePayment.isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {((initializePayment.isPending || subscribeFree.isPending) && selectedPlan?.name === plan.name) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        {plan.isCurrent ? "Active Plan" : plan.cta}
                        {!plan.isCurrent && <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform" />}
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
