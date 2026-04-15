import { useState, useMemo } from 'react';
import { Check, ArrowRight, Plus, Minus, Zap, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useNavigate } from 'react-router-dom';
import PublicNav from '../components/PublicNav';
import PublicFooter from '../components/PublicFooter';
import AuthModal from '../components/AuthModal';
import { usePublicPlans, usePublicConfig } from '../hooks/usePricing';
import { useCurrentUser, useInitializePayment, useStartTrial } from '../hooks/useApi';
import { useSubscribeFree } from '../hooks/useSubscribeFree';
import { getDashboardPath } from '../utils/auth';
import type { PublicPlan } from '../types/api';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

export default function PricingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PublicPlan | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  
  const { data: userData } = useCurrentUser();
  const user = userData?.user;
  const { data: plans, isLoading: plansLoading, error: plansError } = usePublicPlans();
  const { data: config, isLoading: configLoading } = usePublicConfig();
  const initializePayment = useInitializePayment();
  const subscribeFree = useSubscribeFree();
  const startTrial = useStartTrial();

  const isLoading = plansLoading || configLoading;

  // Process plans to fit the UI model
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

      const isCurrentPlan = user?.planId === plan.id;
      const isSameCycle = plan.isFree || user?.billingCycle === selectedCycle;
      const isActive = user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trialing' || user?.subscriptionStatus === 'non-renewing';
      const isCurrent = isCurrentPlan && isSameCycle && isActive;

      return {
        name: plan.name,
        description: plan.description || '',
        price: pricePoint.amount,
        currency: pricePoint.currencySymbol,
        currencyCode: pricePoint.currency,
        highlight: plan.isPopular,
        popular: plan.isPopular,
        isFree: plan.isFree,
        isCurrent,
        trialDays: plan.trialDays,
        trial: plan.trialDays > 0,
        cta: plan.isFree ? "Start Now" : (plan.trialDays > 0 ? `Start ${plan.trialDays}-Day Free Trial` : "Get Started"),
        features: [
          `${plan.qrCodeLimit === -1 ? 'Unlimited' : plan.qrCodeLimit} Dynamic QR Codes`,
          ...((config?.features as string[]) || [])
        ]
      };
    });
  }, [plans, config, selectedCycle]);

  const handleJoinPlan = async (plan: PublicPlan) => {
    setSelectedPlan(plan);
    
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    if (plan.isFree) {
      try {
        await subscribeFree.mutateAsync({ planId: plan.id });
        navigate(getDashboardPath(user.role));
      } catch (err) {
        // Error handled in hook
      }
      return;
    }

    // Initialize payment for paid plans
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
            const verifyingToast = toast.loading('Payment successful! Verifying your premium access...');
            
            // Invalidate user query to reflect new plan
            queryClient.invalidateQueries({ queryKey: ['currentUser'] });
            
            // Redirect to dashboard after a longer delay to allow webhook to process
            setTimeout(() => {
              toast.dismiss(verifyingToast);
              toast.success('Account upgraded successfully!');
              navigate('/dashboard');
            }, 3000);
          }

        });
        handler.openIframe();
      } else if (data && (data as any).authorization_url) {
        // Fallback to redirect if access_code is missing but url exists
        window.location.href = (data as any).authorization_url;
      }
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleStartTrial = async (plan: PublicPlan) => {
    if (!user) {
      setSelectedPlan(plan);
      setIsAuthModalOpen(true);
      return;
    }

    try {
      await startTrial.mutateAsync({ planId: plan.id });
      navigate(getDashboardPath(user.role));
    } catch (err) {
      // Error handled in hook
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    if (selectedPlan) {
      handleJoinPlan(selectedPlan);
    }
  };

  const displayFaqs = (config?.faqs as Array<{ question: string; answer: string }>) || [];

  if (plansError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl max-w-md border border-slate-100">
           <h2 className="text-2xl font-black text-slate-900 mb-4">Something went wrong</h2>
           <p className="text-slate-500 mb-8">We couldn't load the pricing information. Please try again later.</p>
           <button 
             onClick={() => window.location.reload()}
             className="px-8 py-3 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all"
           >
             Retry
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-blue-500/30 flex flex-col font-['Poppins']">
      <PublicNav />

      <main className="flex-grow pt-24 pb-24">
        {/* Hero Section */}
        <section className="pt-8 pb-12 px-4 text-center max-w-4xl mx-auto relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/20 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-block px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-blue-100 mb-6"
          >
             {configLoading ? "..." : (plans?.[0]?.pricing?.monthly?.currency === 'NGN' ? "Custom Pricing Detected" : "Global Pricing")}
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 text-slate-900 leading-[1.1]"
          >
             {config?.heroTitle || "Turn Every Scan Into a Customer"}
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-slate-600 mb-6 leading-relaxed max-w-2xl mx-auto"
          >
            {config?.heroSubtitle || "Join thousands of businesses using QR codes to grow their customer base."}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-3 mb-12"
          >
              <div className="px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 flex items-center gap-2 shadow-sm">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Try our premium features with a risk-free trial</span>
              </div>
          </motion.div>
        </section>

        {/* Pricing Cards Section */}
        <section className="max-w-7xl mx-auto px-4 mb-24 relative z-10 min-h-[400px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center pt-20">
               <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
               <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Locating best prices for you...</p>
            </div>
          ) : (
            <>
              {/* Billing Switcher */}
              <div className="flex justify-center mb-16">
                <div className="bg-white p-2 rounded-[2rem] shadow-xl shadow-blue-900/5 border border-slate-100 flex gap-2">
                  {(['monthly', 'quarterly', 'yearly'] as const).map((cycle) => (
                    <button
                      key={cycle}
                      onClick={() => setSelectedCycle(cycle)}
                      className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        selectedCycle === cycle
                          ? 'bg-slate-900 text-white shadow-lg'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {cycle}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {currentPlans.map((plan, idx) => (
                <motion.div 
                  key={plan.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + (idx * 0.1) }}
                  className={`flex flex-col relative rounded-[3rem] p-10 transition-all duration-500 overflow-hidden group ${
                    plan.isCurrent
                      ? 'ring-4 ring-blue-500 ring-offset-4 bg-white border-transparent shadow-2xl z-30'
                      : plan.highlight 
                        ? 'bg-slate-900 text-white shadow-[0_40px_100px_-20px_rgba(37,99,235,0.2)] scale-105 z-20 md:-translate-y-4 border border-blue-500/30' 
                        : 'bg-white border border-slate-100 shadow-xl shadow-blue-900/5 z-10'
                  }`}
                >
                  {/* Current Plan Badge */}
                  {plan.isCurrent && (
                    <div className="absolute top-8 left-10">
                      <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg animate-pulse">
                        <Zap className="w-3 h-3 fill-white" />
                        Current Plan
                      </div>
                    </div>
                  )}

                  {/* Most Popular/Trial Badge */}
                  {(plan.popular || plan.trial) && !plan.isCurrent && (
                    <div className="absolute top-8 right-10">
                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-5 py-2.5 rounded-full shadow-lg transition-transform group-hover:scale-110 ${
                          plan.highlight ? 'bg-blue-600 text-white shadow-blue-500/40' : 'bg-slate-900 text-white'
                       }`}>
                          {plan.trial ? `${plan.trialDays}-Day Trial` : 'Most Popular'}
                       </span>
                    </div>
                  )}

                  {/* Plan Content */}
                  <div className="mb-10 pt-4">
                    <h3 className={`text-2xl font-black tracking-tight mb-2 ${plan.highlight ? 'text-blue-400' : 'text-slate-900'}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-sm font-medium leading-relaxed mb-10 ${plan.highlight ? 'text-slate-400' : 'text-slate-500'}`}>
                      {plan.description}
                    </p>
                    
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className={`text-3xl font-bold text-slate-400`}>{plan.currency}</span>
                      <span className={`text-7xl font-black tracking-tighter ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                         {plan.price === 0 ? '0' : plan.price.toLocaleString()}
                      </span>
                      <span className={`text-sm font-bold opacity-60 ml-2 ${plan.highlight ? 'text-white' : 'text-slate-500'}`}>
                        / {selectedCycle === 'yearly' ? 'year' : (selectedCycle === 'quarterly' ? 'quarter' : 'month')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-6 mb-12 flex-grow">
                    {plan.features.map((feature, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-4">
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                          plan.highlight ? 'bg-blue-600/20' : 'bg-blue-50'
                        }`}>
                          <Check className={`w-3.5 h-3.5 font-bold ${plan.highlight ? 'text-blue-400' : 'text-blue-600'}`} />
                        </div>
                        <span className={`text-sm font-bold tracking-tight ${plan.highlight ? 'text-slate-200' : 'text-slate-700'}`}>
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {plan.trial && !plan.isCurrent && !user?.hasUsedTrial && (
                      <button 
                        onClick={() => handleStartTrial(plans!.find(p => p.name === plan.name)!)}
                        disabled={startTrial.isPending || plan.isCurrent}
                        className={`w-full py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 flex justify-center items-center gap-3 group/btn bg-blue-600 hover:bg-blue-500 text-white shadow-2xl shadow-blue-600/30 ${startTrial.isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {startTrial.isPending && selectedPlan?.name === plan.name ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            {`Start ${plan.trialDays}-Day Free Trial`}
                            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform" />
                          </>
                        )}
                      </button>
                    )}

                    <button 
                      onClick={() => handleJoinPlan(plans!.find(p => p.name === plan.name)!)}
                      disabled={initializePayment.isPending || plan.isCurrent}
                      className={`w-full py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 flex justify-center items-center gap-3 group/btn ${
                        plan.isCurrent
                          ? 'bg-slate-100 text-slate-400 cursor-default'
                          : plan.trial && !user?.hasUsedTrial
                            ? 'bg-white border-2 border-slate-900 text-slate-900 hover:bg-slate-50'
                            : plan.highlight 
                              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-2xl shadow-blue-600/30' 
                              : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/10'
                      } ${initializePayment.isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {((initializePayment.isPending || subscribeFree.isPending) && selectedPlan?.name === plan.name) ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          {plan.isCurrent ? "Active Plan" : (plan.trial && !user?.hasUsedTrial ? "Subscribe Now" : plan.cta)}
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
        </section>

        {/* Add-Ons Section */}
        <section className="max-w-4xl mx-auto px-4 mb-24">
          <div className="text-center mb-10">
            <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Enterprise Add-Ons</h3>
            <p className="text-slate-500 font-medium max-w-xl mx-auto">Enhance your experience with additional features for developers and high-volume businesses.</p>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-white rounded-[3rem] p-10 md:p-14 shadow-2xl shadow-blue-900/5 border border-slate-100 flex flex-col md:flex-row gap-12 items-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-32 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/2 -z-10 blur-3xl opacity-50"></div>
            
            <div className="bg-blue-600 w-24 h-24 rounded-[2rem] flex items-center justify-center flex-shrink-0 shadow-2xl shadow-blue-200">
              <Zap className="w-12 h-12 text-white fill-white" />
            </div>
            
            <div className="flex-grow text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                <h4 className="text-3xl font-black text-slate-900 tracking-tight">Full API Access</h4>
                <div className="bg-blue-50 text-blue-600 font-black text-xs uppercase tracking-widest px-6 py-3 rounded-full inline-block border border-blue-100 shadow-sm">
                   Coming Soon
                </div>
              </div>
              <p className="text-slate-500 font-medium mb-8 leading-relaxed text-lg">
                Automate your QR creation workflow with our high-speed API. Perfect for high-volume generation, dynamic updates, and custom integrations.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {[
                   'Unlimited programmatic QRs',
                   'Webhook notifications',
                   'Custom domain routing',
                   '24/7 Developer support'
                 ].map(item => (
                   <div key={item} className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                         <Check className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <p className="text-[10px] text-slate-700 font-black uppercase tracking-widest">
                        {item}
                      </p>
                   </div>
                 ))}
              </div>
            </div>
          </motion.div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-4xl mx-auto px-4 mb-16">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Common Questions</h2>
            <p className="text-slate-500 font-medium">Everything you need to know about the QRThrive ecosystem.</p>
          </div>

          <div className="space-y-4">
            {displayFaqs.map((faq, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                key={idx} 
                className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
              >
                <button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-8 py-6 text-left flex justify-between items-center group"
                >
                  <span className="font-bold text-slate-800 text-lg pr-8 group-hover:text-blue-600 transition-colors">{faq.question}</span>
                  {openFaq === idx ? (
                    <div className="bg-slate-100 p-2 rounded-xl">
                       <Minus className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-2 rounded-xl">
                       <Plus className="w-5 h-5 text-slate-400 flex-shrink-0 group-hover:text-blue-600" />
                    </div>
                  )}
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-8 pb-8 pt-0 text-slate-500 font-medium leading-relaxed border-t border-slate-50">
                        <div className="pt-4">
                           {faq.answer}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <PublicFooter />

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={handleAuthSuccess} 
      />
    </div>
  );
}
