import { useState, useEffect } from 'react';
import {
  Save,
  Plus,
  Trash2,
  Check,
  Info,
  Type,
  ListTodo,
  HelpCircle,
  Settings as SettingsIcon,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useSystemConfig, useUpdateSystemConfig } from '../../hooks/useAdmin';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Hero');
  const { data: config, isLoading } = useSystemConfig();
  const updateConfig = useUpdateSystemConfig();

  const [hero, setHero] = useState({ title: '', description: '' });
  const [features, setFeatures] = useState<string[]>([]);
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([]);

  useEffect(() => {
    if (config) {
      setHero({ title: config.heroTitle, description: config.heroSubtitle });
      setFeatures(config.features || []);
      setFaqs(config.faqs || []);
    }
  }, [config]);

  const tabs = [
    { id: 'Hero', icon: Type },
    { id: 'Features', icon: ListTodo },
    { id: 'FAQs', icon: HelpCircle },
  ];

  const handleSave = () => {
    updateConfig.mutate({
      heroTitle: hero.title,
      heroSubtitle: hero.description,
      features,
      faqs,
    }, {
      onSuccess: () => toast.success('General settings updated successfully!')
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

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center text-blue-600">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white rounded-[2rem] px-8 py-10 border border-slate-100 shadow-sm relative overflow-hidden group">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center">
            <SettingsIcon className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight leading-none mb-2 text-slate-800">General Settings</h2>
            <p className="text-slate-400 font-medium text-sm">Configure platform content and defaults</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={updateConfig.isPending}
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-600/30 active:scale-95 flex items-center gap-3 disabled:opacity-50"
        >
          {updateConfig.isPending ? 'Saving...' : (
            <>
              <Save className="w-5 h-5" />
              Save Changes
            </>
          )}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
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
            </button>
          ))}
        </div>

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
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Hero Title</label>
                  <textarea
                    value={hero.title}
                    onChange={(e) => setHero({ ...hero, title: e.target.value })}
                    className="w-full bg-slate-50 border-none rounded-2xl p-5 text-slate-800 font-bold focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-lg min-h-[120px]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Hero Subtitle</label>
                  <textarea
                    value={hero.description}
                    onChange={(e) => setHero({ ...hero, description: e.target.value })}
                    className="w-full bg-slate-50 border-none rounded-2xl p-5 text-slate-600 font-medium focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-base min-h-[100px]"
                  />
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
                  <h3 className="text-lg font-bold text-slate-800">Platform Features</h3>
                  <button onClick={addFeature} className="flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all">
                    <Plus className="w-4 h-4" /> Add Feature
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {features.map((feature, idx) => (
                    <div key={idx} className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 group">
                      <Check className="w-4 h-4 text-blue-500 mr-3" />
                      <input
                        value={feature}
                        onChange={(e) => {
                          const nf = [...features];
                          nf[idx] = e.target.value;
                          setFeatures(nf);
                        }}
                        className="w-full bg-transparent border-none text-sm font-semibold text-slate-700 outline-none"
                      />
                      <button onClick={() => removeFeature(idx)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 ml-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
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
                  <h3 className="text-lg font-bold text-slate-800">Common FAQs</h3>
                  <button onClick={addFaq} className="flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all">
                    <Plus className="w-4 h-4" /> Add FAQ
                  </button>
                </div>
                <div className="space-y-4">
                  {faqs.map((faq, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-100 rounded-3xl p-6 group relative">
                      <button onClick={() => removeFaq(idx)} className="absolute top-6 right-6 p-2 bg-white text-slate-300 hover:text-rose-500 rounded-xl opacity-0 group-hover:opacity-100 shadow-sm transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="space-y-4 pr-10">
                        <input
                          value={faq.question}
                          onChange={(e) => {
                            const nf = [...faqs];
                            nf[idx].question = e.target.value;
                            setFaqs(nf);
                          }}
                          placeholder="Question"
                          className="w-full bg-white rounded-xl px-5 py-3 border border-slate-100 font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                        <textarea
                          value={faq.answer}
                          onChange={(e) => {
                            const nf = [...faqs];
                            nf[idx].answer = e.target.value;
                            setFaqs(nf);
                          }}
                          placeholder="Answer"
                          className="w-full bg-white rounded-xl px-5 py-3 border border-slate-100 font-medium text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[80px]"
                        />
                      </div>
                    </div>
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
