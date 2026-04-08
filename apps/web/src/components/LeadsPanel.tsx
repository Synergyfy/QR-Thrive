import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, Search, Filter, 
  Mail, MoreVertical,
  ArrowUpRight, Target, Zap, TrendingUp,
  Loader2, Database
} from 'lucide-react';
import { formsApi } from '../hooks/useForms';
import type { FormSubmission, Form } from '../types/form';
import type { BackendQRCode } from '../types/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

interface Lead extends FormSubmission {
  qrCodeName: string;
  qrCodeId: string;
  qrType: string;
  formTitle: string;
}

interface LeadsPanelProps {
  codes: BackendQRCode[];
}

const MOCK_FORMS: Record<string, Form> = {
  'mock-qr-1': {
    id: 'f1',
    qrCodeId: 'mock-qr-1',
    title: 'Customer Feedback',
    description: 'General inquiry form',
    fields: [
      { id: 'name', type: 'text', label: 'Full Name', required: true, order: 0 },
      { id: 'email', type: 'email', label: 'Email Address', required: true, order: 1 },
      { id: 'msg', type: 'text', label: 'Message', required: false, order: 2 }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  'mock-qr-2': {
    id: 'f2',
    qrCodeId: 'mock-qr-2',
    title: 'Dine-in Order',
    description: 'Digital menu order form',
    fields: [
      { id: 'cust', type: 'text', label: 'Customer', required: true, order: 0 },
      { id: 'items', type: 'text', label: 'Ordered Items', required: true, order: 1 },
      { id: 'table', type: 'text', label: 'Table No.', required: true, order: 2 }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
};

const MOCK_LEADS: Lead[] = [
  {
    id: 'l1',
    formId: 'f1',
    qrCodeId: 'mock-qr-1',
    qrCodeName: 'Global Feedback QR',
    qrType: 'form',
    formTitle: 'Customer Feedback',
    answers: { name: 'Sarah Jenkins', email: 'sarah.j@gmail.com', msg: 'Interested in the premium plan.' },
    ip: '192.168.1.1',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'l2',
    formId: 'f2',
    qrCodeId: 'mock-qr-2',
    qrCodeName: 'Main Restaurant Menu',
    qrType: 'menu',
    formTitle: 'Dine-in Order',
    answers: { cust: 'Marcus Aurelius', items: '2x Truffle Pasta, 1x Red Wine', table: 'B-12' },
    ip: '192.168.1.5',
    createdAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'l3',
    formId: 'f1',
    qrCodeId: 'mock-qr-1',
    qrCodeName: 'Global Feedback QR',
    qrType: 'form',
    formTitle: 'Customer Feedback',
    answers: { name: 'David Chen', email: 'd.chen@techcorp.io', msg: 'The QR scan speed is impressive.' },
    ip: '172.16.0.4',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

const LeadsPanel: React.FC<LeadsPanelProps> = ({ codes: qrCodes }) => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [formsMap, setFormsMap] = useState<Record<string, Form>>({});
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQRId, setSelectedQRId] = useState<string>('all');

  // Fetch all leads for all relevant QRs
  useEffect(() => {
    const fetchAllLeads = async () => {
      setLoadingLeads(true);
      try {
        const leadQRs = qrCodes.filter(qr => qr.type === 'form' || qr.type === 'menu' || qr.type === 'coupon');
        
        const allLeads: Lead[] = [];
        const fMap: Record<string, Form> = {};

        await Promise.all(leadQRs.map(async (qr) => {
          try {
            const [form, submissions] = await Promise.all([
              formsApi.getForm(qr.id),
              formsApi.getSubmissions(qr.id)
            ]);
            
            fMap[qr.id] = form;
            
            const transLeads: Lead[] = submissions.map(s => ({
              ...s,
              qrCodeName: qr.name,
              qrCodeId: qr.id,
              qrType: qr.type,
              formTitle: form.title
            }));
            
            allLeads.push(...transLeads);
          } catch (err) {
            console.error(`Failed to fetch leads for QR ${qr.id}:`, err);
          }
        }));

        // Merge with mocks for demonstration if empty or as extra
        const finalLeads = allLeads.length > 0 ? allLeads : [...MOCK_LEADS];
        const finalForms = { ...MOCK_FORMS, ...fMap };

        // Sort by date descending
        finalLeads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setLeads(finalLeads);
        setFormsMap(finalForms);
      } catch (err) {
        // Fallback to mocks on error for dev visibility
        setLeads([...MOCK_LEADS]);
        setFormsMap(MOCK_FORMS);
        toast.error('Failed to load real lead data, showing demo model.');
      } finally {
        setLoadingLeads(false);
      }
    };

    fetchAllLeads();
  }, [qrCodes]);

  const filteredLeads = useMemo(() => {
    let result = leads;
    
    if (selectedQRId !== 'all') {
      result = result.filter(l => l.qrCodeId === selectedQRId);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l => 
        l.qrCodeName.toLowerCase().includes(q) ||
        l.formTitle.toLowerCase().includes(q) ||
        Object.values(l.answers).some(val => String(val).toLowerCase().includes(q))
      );
    }

    return result;
  }, [leads, selectedQRId, searchQuery]);

  const stats = useMemo(() => ({
    total: leads.length,
    today: leads.filter(l => new Date(l.createdAt).toDateString() === new Date().toDateString()).length,
    activeForms: Object.keys(formsMap).length,
    conversion: leads.length > 0 ? (leads.length / (qrCodes.reduce((acc, qr) => acc + (qr.scans || 0), 0) || 1) * 100).toFixed(1) : '0'
  }), [leads, formsMap, qrCodes]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
       {/* Stats Cards */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Leads', value: stats.total, icon: Users, color: 'blue', trend: '+12%' },
            { label: 'Leads Today', value: stats.today, icon: Zap, color: 'indigo', trend: 'Fresh' },
            { label: 'Active Campaigns', value: stats.activeForms, icon: Target, color: 'amber', trend: 'LIVE' },
            { label: 'Avg. Conversion', value: `${stats.conversion}%`, icon: TrendingUp, color: 'emerald', trend: 'Good' },
          ].map((s, i) => (
            <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group">
               <div className="relative z-10">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6", `bg-${s.color}-50 text-${s.color}-600`)}>
                     <s.icon className="w-6 h-6" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{s.label}</p>
                  <div className="flex items-end gap-3">
                     <h3 className="text-2xl font-black text-slate-900 leading-none">{s.value}</h3>
                     <span className={cn("text-[10px] font-bold px-2 py-1 rounded-md mb-1", 
                       s.trend === 'LIVE' ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600")}>
                       {s.trend}
                     </span>
                  </div>
               </div>
               <div className={cn("absolute -bottom-6 -right-6 w-24 h-24 bg-slate-50 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-700", `bg-${s.color}-100`)} />
            </div>
          ))}
       </div>

       {/* Actions Bar */}
       <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-100 w-full md:w-80 shadow-sm focus-within:ring-2 ring-indigo-100 transition-all">
                <Search className="w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Filtered search..." 
                  className="bg-transparent text-xs font-bold text-slate-600 outline-none w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             <button className="p-3.5 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
                <Filter className="w-4 h-4" />
             </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
             <button 
               onClick={() => setSelectedQRId('all')}
               className={cn(
                 "px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                 selectedQRId === 'all' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-white text-slate-500 border border-slate-100 hover:bg-slate-50"
               )}
             >
                All
             </button>
             {qrCodes.filter(qr => formsMap[qr.id]).map(qr => (
               <button 
                 key={qr.id}
                 onClick={() => setSelectedQRId(qr.id)}
                 className={cn(
                   "px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2",
                   selectedQRId === qr.id ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "bg-white text-slate-500 border border-slate-100 hover:bg-slate-50"
                 )}
               >
                  {qr.name}
               </button>
             ))}
          </div>
       </div>

       {/* Leads Table Card */}
       <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm relative min-h-[400px]">
          {loadingLeads ? (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center gap-4">
               <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Syncing Intelligence...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
               <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mb-6 text-slate-200">
                  <Database className="w-10 h-10" />
               </div>
               <h3 className="text-xl font-black text-slate-900 mb-1">No captured leads</h3>
               <p className="text-slate-400 text-xs font-medium">Activate a form or menu to start collecting data.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Interaction</th>
                      <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Data Points</th>
                      <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Source</th>
                      <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50/80 transition-all group">
                         <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center relative">
                                  {Object.keys(lead.answers).some(k => k.toLowerCase().includes('mail')) ? (
                                    <Mail className="w-5 h-5 text-indigo-600" />
                                  ) : (
                                    <Users className="w-5 h-5 text-slate-400" />
                                  )}
                               </div>
                               <div>
                                  <p className="text-sm font-bold text-slate-900">
                                    {Object.values(lead.answers)[0] as string || 'New Submission'}
                                  </p>
                                  <p className="text-[10px] font-medium text-slate-400">
                                    {formatDate(lead.createdAt)} • {formatTime(lead.createdAt)}
                                  </p>
                               </div>
                            </div>
                         </td>
                         <td className="px-8 py-6">
                            <div className="flex flex-wrap gap-2">
                               {Object.entries(lead.answers).slice(0, 3).map(([key, val], idx) => (
                                 <div key={idx} className="px-2 py-1 bg-slate-100 rounded-md text-[9px] font-bold text-slate-600">
                                    <span className="opacity-50 mr-1">{formsMap[lead.qrCodeId]?.fields.find(f => f.id === key)?.label || key}:</span>
                                    {Array.isArray(val) ? val.join(', ') : String(val)}
                                 </div>
                               ))}
                               {Object.keys(lead.answers).length > 3 && (
                                 <span className="text-[9px] font-bold text-indigo-500 mt-1">+{Object.keys(lead.answers).length - 3} more</span>
                               )}
                            </div>
                         </td>
                         <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                               <div className={cn("w-1.5 h-1.5 rounded-full", lead.qrType === 'menu' ? "bg-amber-400" : "bg-blue-500")} />
                               <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">{lead.qrCodeName}</span>
                            </div>
                         </td>
                         <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button 
                                 onClick={() => navigate(`/dashboard/qr/${lead.qrCodeId}/submissions`)}
                                 className="p-2 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-all shadow-sm"
                               >
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                               </button>
                               <button className="p-2 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                                  <MoreVertical className="w-3.5 h-3.5" />
                               </button>
                            </div>
                         </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          )}
       </div>
    </div>
  );
};

export default LeadsPanel;
