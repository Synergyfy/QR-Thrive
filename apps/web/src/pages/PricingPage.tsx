import React, { useState } from 'react';
import { Check, ArrowRight, Plus, Minus, CreditCard, Zap, Shield, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
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
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'Monthly' | 'Quarterly' | 'Yearly'>('Monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const getPrice = () => {
    switch (billingCycle) {
      case 'Monthly': return '5,000';
      case 'Quarterly': return '13,500'; // 10% discount
      case 'Yearly': return '50,000'; // ~16% discount
    }
  };

  const getApiPrice = () => {
    switch (billingCycle) {
      case 'Monthly': return '15,000';
      case 'Quarterly': return '40,500';
      case 'Yearly': return '150,000';
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-blue-500/30 flex flex-col">
      <PublicNav />

      <main className="flex-grow pt-32 pb-24">
        {/* Hero Section */}
        <section className="pt-16 pb-20 px-4 text-center max-w-4xl mx-auto relative">
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
            className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto"
          >
            Qrthrive helps you create powerful, branded QR codes that don't just link — they track, convert, and grow your business.
          </motion.p>

          <div className="flex gap-4 justify-center">
             <Link to="/">
              <button className="px-8 py-3.5 bg-white text-blue-600 border border-blue-200 hover:border-blue-600 hover:bg-blue-50 font-semibold rounded-full transition-all shadow-sm active:scale-95">
                Start Free
              </button>
            </Link>
          </div>
        </section>

        {/* Pricing Toggle */}
        <section className="mb-12 flex justify-center px-4 relative z-10">
          <div className="bg-white p-1.5 rounded-full shadow-md border border-slate-200/60 inline-flex relative">
            {['Monthly', 'Quarterly', 'Yearly'].map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle as any)}
                className={`relative px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 z-10 ${
                  billingCycle === cycle ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {billingCycle === cycle && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 bg-blue-600 rounded-full -z-10 shadow-sm"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}
                {cycle}
              </button>
            ))}
          </div>
        </section>

        {/* Pricing Card */}
        <section className="max-w-md mx-auto px-4 mb-20 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-[2rem] p-8 shadow-2xl shadow-blue-900/5 border border-slate-100 flex flex-col relative overflow-hidden group"
          >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 p-32 bg-gradient-to-bl from-blue-50 to-transparent -z-10 group-hover:scale-110 transition-transform duration-700"></div>

            <div className="mb-8">
              <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-700 text-xs font-bold tracking-wider uppercase mb-4">
                Pro Plan
              </span>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Upgrade Pro Plan</h2>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-3xl font-semibold text-slate-400">₦</span>
                <span className="text-5xl font-extrabold tracking-tight text-slate-900">{getPrice()}</span>
                <span className="text-slate-500 font-medium pb-2">/{billingCycle.toLowerCase().replace('ly', '')}</span>
              </div>
              <p className="text-slate-500 text-sm">Billed {billingCycle.toLowerCase()}.</p>
            </div>

            <div className="space-y-4 mb-8 flex-grow">
              {pricingFeatures.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                    <Check className="w-3 h-3 text-blue-600 font-bold" />
                  </div>
                  <span className="text-slate-600 text-sm">{feature}</span>
                </div>
              ))}
            </div>

            <button className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex justify-center items-center gap-2 group">
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </section>

        {/* Add-Ons Section */}
        <section className="max-w-4xl mx-auto px-4 mb-24">
          <div className="text-center mb-10">
            <h3 className="text-3xl font-bold text-slate-900 mb-3">Powerful Add-Ons</h3>
            <p className="text-slate-500 max-w-xl mx-auto">Enhance your experience with additional features tailored for developers and serious businesses.</p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl p-8 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row gap-8 items-center"
          >
            <div className="bg-blue-50 w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Zap className="w-10 h-10 text-blue-600" />
            </div>
            
            <div className="flex-grow text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                <h4 className="text-2xl font-bold text-slate-900">API Integration</h4>
                <div className="mt-2 md:mt-0 text-blue-600 font-bold text-lg bg-blue-50 px-4 py-1.5 rounded-full inline-block">
                  + ₦{getApiPrice()}/{billingCycle.toLowerCase().replace('ly', '')}
                </div>
              </div>
              <p className="text-slate-600 mb-4 text-justify md:text-left">
                For businesses that want to automate QR code generation or integrate it into their platform.
              </p>
              <div className="flex items-start gap-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700 font-medium">Includes all features of the Paid Plan + API access for dynamic code creation and data tracking.</p>
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
