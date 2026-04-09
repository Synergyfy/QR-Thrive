import { useState, useEffect } from 'react';
import {
  Save,
  Plus,
  Trash2,
  Check,
  Info,
  Type,
  CreditCard,
  ListTodo,
  HelpCircle,
  Eye,
  Settings,
  Globe,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSystemConfig, useUpdateSystemConfig } from '../../hooks/useAdmin';

export default function PricingManager() {
  const [activeTab, setActiveTab] = useState('Hero');
  const { data: config, isLoading } = useSystemConfig();
  const updateConfig = useUpdateSystemConfig();

  const [hero, setHero] = useState({ title: '', description: '' });
  const [prices, setPrices] = useState({ monthly: 0, quarterly: 0, yearly: 0 });
  const [features, setFeatures] = useState<string[]>([]);
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([]);

  useEffect(() => {
    if (config) {
      setHero({ title: config.heroTitle || '', description: config.heroSubtitle || '' });
      setPrices({
        monthly: config.monthlyPrice || 0,
        quarterly: config.quarterlyPrice || 0,
        yearly: config.yearlyPrice || 0
      });
      setFeatures(config.features || []);
      setFaqs(config.faqs || []);
    }
  }, [config]);

  const tabs = [
    { id: 'Hero', icon: Type },
    { id: 'Plans', icon: CreditCard },
    { id: 'Features', icon: ListTodo },
    { id: 'FAQs', icon: HelpCircle },
  ];

  const handleSave = () => {
    updateConfig.mutate({
      heroTitle: hero.title,
      heroSubtitle: hero.description,
      monthlyPrice: Number(prices.monthly),
      quarterlyPrice: Number(prices.quarterly),
      yearlyPrice: Number(prices.yearly),
      features,
      faqs,
    }, {
      onSuccess: () => alert('Pricing and configuration updated successfully!')
    });
  };

  const addFeature = () => {
    setFeatures([...features, "New feature..."]);
  };

  const removeFeature = (idx: number) => {
    setFeatures(features.filter((_, i) => i !== idx));
  };

  const addFaq = () => {
    setFaqs([...faqs, { question: "New Question?", answer: "New Answer..." }]);
  };

  const removeFaq = (idx: number) => {
    setFaqs(faqs.filter((_, i) => i !== idx));
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
            <h2 className="text-3xl font-black tracking-tight leading-none mb-2">Pricing Manager</h2>
            <p className="text-slate-400 font-medium text-sm flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-500" />
              Configure every detail of your public pricing page
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={updateConfig.isPending}
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-600/30 active:scale-95 flex items-center gap-3 disabled:opacity-50"
        >
          {updateConfig.isPending ? 'Publishing...' : (
            <>
              <Save className="w-5 h-5" />
              Publish Changes
            </>
          )}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:w-72 flex w-full lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-4 px-6 py-5 rounded-3xl font-bold text-sm tracking-wide transition-all w-full text-left whitespace-nowrap lg:whitespace-normal group ${activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-xl shadow-blue-900/5 ring-1 ring-slate-100'
                : 'text-slate-400 hover:bg-white hover:text-slate-600'
                }`}
            >
              <div className={`p-2.5 rounded-xl transition-all ${activeTab === tab.id ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                }`}>
                <tab.icon className="w-5 h-5" />
              </div>
              {tab.id}
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
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Hero Title (HTML supported)</label>
                  <textarea
                    value={hero.title}
                    onChange={(e) => setHero({ ...hero, title: e.target.value })}
                    className="w-full bg-slate-50 border-none rounded-2xl p-5 text-slate-800 font-bold focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-lg min-h-[120px]"
                    placeholder="Enter main heading..."
                  />
                  <p className="mt-3 text-[10px] text-slate-400 flex items-start gap-2 italic">
                    <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    Tip: Use &lt;span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400"&gt;...&lt;/span&gt; for gradient text.
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Hero Subtitle</label>
                  <textarea
                    value={hero.description}
                    onChange={(e) => setHero({ ...hero, description: e.target.value })}
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
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800">Subscription Plans (Paystack Sync)</h3>
                </div>

                <div className="space-y-6">
                  <div className="p-6 rounded-3xl bg-slate-50/50 border border-slate-100 group">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Monthly Price (₦)</label>
                        <input
                          type="number"
                          value={prices.monthly}
                          onChange={(e) => setPrices({ ...prices, monthly: Number(e.target.value) })}
                          className="w-full bg-white rounded-xl px-4 py-2.5 border border-slate-100 font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Quarterly Price (₦)</label>
                        <input
                          type="number"
                          value={prices.quarterly}
                          onChange={(e) => setPrices({ ...prices, quarterly: Number(e.target.value) })}
                          className="w-full bg-white rounded-xl px-4 py-2.5 border border-slate-100 font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Yearly Price (₦)</label>
                        <input
                          type="number"
                          value={prices.yearly}
                          onChange={(e) => setPrices({ ...prices, yearly: Number(e.target.value) })}
                          className="w-full bg-white rounded-xl px-4 py-2.5 border border-slate-100 font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>
                  ))}
                  <p className="mt-4 text-[10px] text-slate-400 flex items-center gap-2 italic">
                    <Info className="w-3 h-3" />
                    Changing these values will automatically create or update the corresponding plans on Paystack.
                  </p>
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
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800">Pricing Features</h3>
                  <button
                    onClick={addFeature}
                    className="flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Add Feature
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3 group">
                      <div className="flex-grow flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:bg-white focus-within:border-white">
                        <Check className="w-4 h-4 text-blue-500 flex-shrink-0 mr-3" />
                        <input
                          value={feature}
                          onChange={(e) => {
                            const newFeatures = [...features];
                            newFeatures[idx] = e.target.value;
                            setFeatures(newFeatures);
                          }}
                          className="w-full bg-transparent border-none p-0 text-sm font-semibold text-slate-700 outline-none"
                        />
                        <button
                          onClick={() => removeFeature(idx)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-500 transition-all ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800">Frequently Asked Questions</h3>
                  <button
                    onClick={addFaq}
                    className="flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Add FAQ
                  </button>
                </div>

                <div className="space-y-4">
                  {faqs.map((faq, idx) => (
                    <motion.div
                      key={idx}
                      className="bg-slate-50 border border-slate-100 rounded-3xl p-6 group relative"
                    >
                      <button
                        onClick={() => removeFaq(idx)}
                        className="absolute top-6 right-6 p-2 bg-white text-slate-300 hover:text-rose-500 rounded-xl shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="space-y-4 pr-10">
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Question</label>
                          <input
                            value={faq.question}
                            onChange={(e) => {
                              const newFaqs = [...faqs];
                              newFaqs[idx] = { ...newFaqs[idx], question: e.target.value };
                              setFaqs(newFaqs);
                            }}
                            className="w-full bg-white rounded-xl px-5 py-3 border border-slate-100 font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Answer</label>
                          <textarea
                            value={faq.answer}
                            onChange={(e) => {
                              const newFaqs = [...faqs];
                              newFaqs[idx] = { ...newFaqs[idx], answer: e.target.value };
                              setFaqs(newFaqs);
                            }}
                            className="w-full bg-white rounded-xl px-5 py-3 border border-slate-100 font-medium text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[80px]"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
