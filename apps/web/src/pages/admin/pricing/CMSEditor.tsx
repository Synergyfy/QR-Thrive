import { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  HelpCircle, 
  Type, 
  Eye, 
  Edit3,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SystemConfig } from '../../../types/api';

interface CMSEditorProps {
  config: SystemConfig;
  onUpdate: (data: Partial<SystemConfig>) => void;
}

export default function CMSEditor({ config, onUpdate }: CMSEditorProps) {
  const [activeView, setActiveView] = useState<'edit' | 'preview'>('edit');
  const [editingFaqIdx, setEditingFaqIdx] = useState<number | null>(null);

  const handleUpdateFaq = (idx: number, data: { question?: string; answer?: string }) => {
    const next = [...config.faqs];
    next[idx] = { ...next[idx], ...data };
    onUpdate({ faqs: next });
  };

  const handleAddFaq = () => {
    const next = [...config.faqs, { question: 'New Question?', answer: 'New Answer...' }];
    onUpdate({ faqs: next });
    setEditingFaqIdx(next.length - 1);
  };

  const handleDeleteFaq = (idx: number) => {
    onUpdate({ faqs: config.faqs.filter((_, i) => i !== idx) });
    if (editingFaqIdx === idx) setEditingFaqIdx(null);
  };

  return (
    <div className="space-y-10">
      {/* CMS Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h3 className="text-2xl font-black text-slate-900 mb-2">Public Content Editor</h3>
           <p className="text-slate-500 font-medium text-sm">Fine-tune the messaging and FAQs visible to your customers.</p>
        </div>
        <div className="flex p-1 bg-slate-100 rounded-2xl">
           <button 
            onClick={() => setActiveView('edit')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
              activeView === 'edit' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
           >
             <Edit3 className="w-4 h-4" />
             Editor
           </button>
           <button 
            onClick={() => setActiveView('preview')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
              activeView === 'preview' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
           >
             <Eye className="w-4 h-4" />
             Live Preview
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Editor Panel */}
        <div className={`lg:col-span-7 space-y-10 ${activeView === 'preview' ? 'hidden lg:block' : ''}`}>
           {/* Hero Section */}
           <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm space-y-8">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Type className="w-4 h-4" />
                 </div>
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Hero Section</h4>
              </div>

              <div className="space-y-6">
                 <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Display Heading</label>
                    <textarea 
                       defaultValue={config.heroTitle}
                       onBlur={(e) => onUpdate({ heroTitle: e.target.value })}
                       className="w-full bg-slate-50 border-none rounded-2xl p-6 text-xl font-black text-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none min-h-[140px] resize-none"
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Descriptive Subtitle</label>
                    <textarea 
                       defaultValue={config.heroSubtitle}
                       onBlur={(e) => onUpdate({ heroSubtitle: e.target.value })}
                       className="w-full bg-slate-50 border-none rounded-2xl p-6 text-sm font-medium text-slate-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none min-h-[100px] resize-none"
                    />
                 </div>
              </div>
           </div>

           {/* FAQs Section */}
           <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                       <HelpCircle className="w-4 h-4" />
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Support FAQs</h4>
                 </div>
                 <button 
                  onClick={handleAddFaq}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                 >
                    <Plus className="w-4 h-4" />
                 </button>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
                {config.faqs.map((faq, idx) => (
                  <div key={idx} className={`bg-white border transition-all rounded-[2rem] overflow-hidden ${
                    editingFaqIdx === idx ? 'border-blue-200' : 'border-slate-100'
                  }`}>
                    <div 
                      className="p-6 flex items-center justify-between cursor-pointer group"
                      onClick={() => setEditingFaqIdx(editingFaqIdx === idx ? null : idx)}
                    >
                       <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            <HelpCircle className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-black text-slate-700 truncate max-w-xs">{faq.question}</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteFaq(idx); }}
                            className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {editingFaqIdx === idx ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                       </div>
                    </div>

                    <AnimatePresence>
                       {editingFaqIdx === idx && (
                         <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="px-6 pb-6 overflow-hidden"
                         >
                            <div className="space-y-4 pt-4 border-t border-slate-50">
                               <input 
                                  value={faq.question} 
                                  onChange={(e) => handleUpdateFaq(idx, { question: e.target.value })}
                                  className="w-full bg-slate-50 border-none rounded-xl p-4 text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/10"
                                  placeholder="Question..."
                               />
                               <textarea 
                                  value={faq.answer} 
                                  onChange={(e) => handleUpdateFaq(idx, { answer: e.target.value })}
                                  className="w-full bg-slate-50 border-none rounded-xl p-4 text-xs font-medium text-slate-500 outline-none focus:ring-2 focus:ring-blue-500/10 min-h-[100px] resize-none"
                                  placeholder="Answer..."
                               />
                            </div>
                         </motion.div>
                       )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
           </div>
        </div>

        {/* Live Preview Panel */}
        <div className={`lg:col-span-5 ${activeView === 'edit' ? 'hidden lg:block' : 'col-span-full'}`}>
           <div className="sticky top-10">
              <div className="bg-slate-900 rounded-[3rem] p-4 shadow-2xl overflow-hidden border-[8px] border-slate-800 h-[800px] flex flex-col">
                 <div className="w-20 h-6 bg-slate-800 rounded-full mx-auto mb-4" />
                 <div className="flex-grow bg-white rounded-[2rem] overflow-y-auto scrollbar-hide">
                    {/* Public Page Simulation */}
                    <div className="p-8 space-y-8">
                       <div className="text-center py-10 border-b border-slate-50">
                          <h1 
                            className="text-2xl font-black text-slate-900 mb-4 leading-tight"
                            dangerouslySetInnerHTML={{ __html: config.heroTitle }}
                          />
                          <p className="text-xs font-medium text-slate-500 leading-relaxed px-4">{config.heroSubtitle}</p>
                       </div>

                       <div className="space-y-6">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-center text-slate-400">Frequently Asked Questions</h4>
                          <div className="space-y-3">
                             {config.faqs.slice(0, 4).map((faq, i) => (
                               <div key={i} className="bg-slate-50 p-4 rounded-2xl">
                                  <p className="text-[10px] font-black text-slate-900 mb-1">{faq.question}</p>
                                  <p className="text-[10px] font-medium text-slate-500 line-clamp-2">{faq.answer}</p>
                               </div>
                             ))}
                          </div>
                       </div>

                       <div className="bg-blue-600 p-6 rounded-[2rem] text-center text-white space-y-2">
                          <p className="text-xs font-black uppercase tracking-widest">Pricing Matrix Below</p>
                          <p className="text-[10px] opacity-70">Simulation of user-facing plans</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
