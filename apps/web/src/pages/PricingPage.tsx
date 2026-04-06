import { useState } from 'react';
import { Check, ArrowRight, Plus, Minus, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import PublicNav from '../components/PublicNav';
import PublicFooter from '../components/PublicFooter';

const pricingFeatures = [
  "Unlimited QR Codes",
  "Unlimited Scans",
  "Download PNG & SVG",
  "Dynamic & Static QR Codes",
  "Custom Landing Pages",
  "Scan statistics (how many, when and where)",
  "API Access",
  "Bulk Creation",
  "5 Team Members",
  "Cancel any time",
  "7-day money back guarantee"
];

const faqs = [
  {
    question: "How does billing work?",
    answer: "We bill you securely via our payment processor. You can choose to be billed monthly, quarterly, or yearly. Your subscription will automatically renew at the end of each billing cycle."
  },
  {
    question: "What happens if I want to make changes on my QR Codes?",
    answer: "With our dynamic QR codes, you can change the destination URL or content at any time without having to reprint or recreate the QR code itself."
  },
  {
    question: "Is there a free trial?",
    answer: "Yes, we offer a 7-day money-back guarantee so you can try out all our premium features risk-free."
  },
  {
    question: "How long until I get my QR Codes?",
    answer: "Instantly! As soon as you configure and generate your QR code, it's ready to be downloaded and used in your marketing materials."
  },
  {
    question: "What currency am I billed in?",
    answer: "All our plans are billed in Nigerian Naira (₦). If you're paying with an international card, your bank will handle the conversion automatically."
  },
  {
    question: "Can I change my plan?",
    answer: "Yes, you can upgrade, downgrade, or cancel your plan at any time from your account settings."
  }
];const plans = [
  {
    name: "Standard",
    cycle: "Monthly",
    price: "5,000",
    totalPrice: "5,000",
    description: "Perfect for short-term projects and testing.",
    billing: "Billed monthly",
    popular: false
  },
  {
    name: "Annual",
    cycle: "Yearly",
    price: "4,167",
    totalPrice: "50,000",
    description: "Our best value for growing businesses.",
    billing: "Billed annually (₦50,000)",
    popular: true,
    highlight: true,
    save: "16%"
  },
  {
    name: "Quarterly",
    cycle: "Quarterly",
    price: "4,500",
    totalPrice: "13,500",
    description: "A great middle ground for commitment.",
    billing: "Billed quarterly (₦13,500)",
    popular: false,
    save: "10%"
  }
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-blue-500/30 flex flex-col">
      <PublicNav />

      <main className="flex-grow pt-32 pb-24">
        {/* Hero Section */}
        <section className="pt-16 pb-12 px-4 text-center max-w-4xl mx-auto relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/20 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 text-slate-900"
          >
            Turn Every Scan Into a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">Customer</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-slate-600 mb-6 leading-relaxed max-w-2xl mx-auto"
          >
            Qrthrive helps you create powerful, branded QR codes that don't just link — they track, convert, and grow your business.
          </motion.p>
        </section>

        {/* Pricing Cards Section */}
        <section className="max-w-7xl mx-auto px-4 mb-24 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan, idx) => (
              <motion.div 
                key={plan.cycle}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + (idx * 0.1) }}
                className={`flex flex-col relative rounded-[2.5rem] p-8 transition-all duration-500 overflow-hidden group ${
                  plan.highlight 
                    ? 'bg-slate-900 text-white shadow-2xl shadow-blue-500/20 scale-105 z-20 md:-translate-y-4' 
                    : 'bg-white border border-slate-100 shadow-xl shadow-blue-900/5 z-10'
                }`}
              >
                {/* Most Popular Badge */}
                {plan.popular && (
                  <div className="absolute top-6 right-8">
                     <span className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full shadow-lg shadow-blue-500/40">
                        Most Popular
                     </span>
                  </div>
                )}

                {/* Plan Content */}
                <div className="mb-10 pt-4">
                  <h3 className={`text-xl font-black tracking-tight mb-2 ${plan.highlight ? 'text-blue-400' : 'text-slate-900'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm font-medium leading-relaxed mb-8 ${plan.highlight ? 'text-slate-400' : 'text-slate-500'}`}>
                    {plan.description}
                  </p>
                  
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-2xl font-bold ${plan.highlight ? 'text-slate-400' : 'text-slate-400'}`}>₦</span>
                      <span className={`text-6xl font-black tracking-tighter ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                        {plan.price}
                      </span>
                      <span className={`text-sm font-bold opacity-60 ml-1 ${plan.highlight ? 'text-white' : 'text-slate-500'}`}>
                        / month
                      </span>
                    </div>
                    {plan.save && (
                      <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        plan.highlight ? 'bg-blue-600 text-white' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        SAVE {plan.save}
                      </div>
                    )}
                  </div>
                  <p className={`text-xs font-bold mt-1 uppercase tracking-widest opacity-60 ${plan.highlight ? 'text-blue-400' : 'text-blue-600'}`}>
                    {plan.billing}
                  </p>
                </div>

                <div className="space-y-4 mb-10 flex-grow">
                  {pricingFeatures.slice(0, plan.highlight ? pricingFeatures.length : 8).map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                        plan.highlight ? 'bg-blue-600/20' : 'bg-blue-50'
                      }`}>
                        <Check className={`w-3 h-3 font-bold ${plan.highlight ? 'text-blue-400' : 'text-blue-600'}`} />
                      </div>
                      <span className={`text-sm font-medium ${plan.highlight ? 'text-slate-300' : 'text-slate-600'}`}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <button className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 flex justify-center items-center gap-3 group/btn ${
                   plan.highlight 
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/30' 
                    : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/10'
                }`}>
                  Get Started
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Add-Ons Section */}
        <section className="max-w-4xl mx-auto px-4 mb-24">
          <div className="text-center mb-10">
            <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Powerful Add-Ons</h3>
            <p className="text-slate-500 font-medium max-w-xl mx-auto">Enhance your experience with additional features for developers and businesses.</p>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-blue-900/5 border border-slate-100 flex flex-col md:flex-row gap-10 items-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-32 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/2 -z-10 blur-3xl opacity-50"></div>
            
            <div className="bg-blue-600 w-20 h-20 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-xl shadow-blue-200">
              <Zap className="w-10 h-10 text-white fill-white" />
            </div>
            
            <div className="flex-grow text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                <h4 className="text-2xl font-black text-slate-900 tracking-tight">API Integration</h4>
                <div className="bg-blue-50 text-blue-600 font-black text-xs uppercase tracking-widest px-5 py-2.5 rounded-full inline-block border border-blue-100">
                  + ₦12,500/month (Annual)
                </div>
              </div>
              <p className="text-slate-500 font-medium mb-6 leading-relaxed">
                Automate your QR creation workflow with our high-speed API. Includes webhooks and dedicated support.
              </p>
              <div className="flex items-start gap-3 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                   <Check className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <p className="text-xs text-slate-700 font-bold leading-relaxed uppercase tracking-wider">
                  Includes all Pro features + API access + Data streaming
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-500">Here's what you need to know about your Qrthrive license, based on the questions we are asked the most.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                key={idx} 
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-5 text-left flex justify-between items-center bg-white"
                >
                  <span className="font-semibold text-slate-800 pr-8">{faq.question}</span>
                  {openFaq === idx ? (
                    <Minus className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  ) : (
                    <Plus className="w-5 h-5 text-slate-400 flex-shrink-0" />
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
                      <div className="px-6 pb-5 pt-0 text-slate-600 leading-relaxed border-t border-slate-50 mt-2">
                        {faq.answer}
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
    </div>
  );
}
