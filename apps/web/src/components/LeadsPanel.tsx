import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, Search, 
  Mail, MoreVertical,
  ArrowUpRight, Target, Zap, TrendingUp,
  Loader2, Database, X
} from 'lucide-react';
import { formsApi } from '../hooks/useForms';
import type { FormSubmission, Form } from '../types/form';
import type { BackendQRCode } from '../types/api';
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

const LeadsPanel: React.FC<LeadsPanelProps> = ({ codes: qrCodes }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [formsMap, setFormsMap] = useState<Record<string, Form>>({});
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQRId, setSelectedQRId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeleteLead = async (lead: Lead) => {
     if (window.confirm('Are you sure you want to delete this lead?')) {
        try {
           await formsApi.deleteSubmission(lead.qrCodeId, lead.id);
           setLeads(prev => prev.filter(l => l.id !== lead.id));
           toast.success('Lead deleted');
        } catch (err) {
           // Fallback for mocks
           if (lead.id.startsWith('l')) {
              setLeads(prev => prev.filter(l => l.id !== lead.id));
              toast.success('Mock lead removed locally');
           } else {
              toast.error('Failed to delete lead');
           }
        }
        setMenuOpenId(null);
     }
  };

  const handleExportCSV = () => {
    const headers = ['Interaction', 'Source', 'Date', 'Time'];
    const maxFields = Math.max(...leads.map(l => Object.keys(l.answers).length));
    for (let i = 0; i < maxFields; i++) headers.push(`Field ${i+1}`);

    const csvRows = leads.map(l => {
       const interaction = (Object.values(l.answers)[0] as string || 'N/A').replace(/,/g, ' ');
       const row = [
          interaction,
          l.qrCodeName,
          formatDate(l.createdAt),
          formatTime(l.createdAt),
          ...Object.entries(l.answers).map(([k, v]) => `${k}: ${String(v).replace(/,/g, ' ')}`)
       ];
       return row.join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + "\n" + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `qr-thrive-leads-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fetch all leads for all relevant QRs
  useEffect(() => {
    const fetchAllLeads = async () => {
      setLoadingLeads(true);
      try {
        const rawSubmissions = await formsApi.getAllSubmissions();
        
        const fMap: Record<string, Form> = {};
        const transLeads: Lead[] = rawSubmissions.map((s: any) => {
          // Store form in map for lookup
          if (s.form && !fMap[s.form.qrCodeId]) {
            fMap[s.form.qrCodeId] = s.form;
          }

          return {
            id: s.id,
            formId: s.formId,
            answers: s.answers,
            ip: s.ip,
            userAgent: s.userAgent,
            createdAt: s.createdAt,
            qrCodeId: s.form.qrCodeId,
            qrCodeName: s.form.qrCode.name,
            qrType: s.form.qrCode.type,
            formTitle: s.form.title
          };
        });

        setLeads(transLeads);
        setFormsMap(fMap);
      } catch (err) {
        console.error('Failed to fetch leads:', err);
        setLeads([]);
        toast.error('Failed to load lead data');
      } finally {
        setLoadingLeads(false);
      }
    };

    fetchAllLeads();
  }, []); // Only once on mount or when refresh needed

  const filteredLeads = useMemo(() => {
    let result = leads;
    
    if (selectedQRId !== 'all') {
      result = result.filter(l => l.qrCodeId === selectedQRId);
    }

    if (selectedType !== 'all') {
      result = result.filter(l => l.qrType === selectedType);
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
  }, [leads, selectedQRId, selectedType, searchQuery]);

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
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
          {/* intelligence captured, fresh interactions, etc */}
          {[
            { label: 'Intelligence Captured', value: stats.total, icon: Users, color: 'blue', trend: '+12%' },
            { label: 'Fresh Interactions', value: stats.today, icon: Zap, color: 'indigo', trend: 'ACTIVE' },
            { label: 'Smart Campaigns', value: stats.activeForms, icon: Target, color: 'amber', trend: 'LIVE' },
            { label: 'Conversion Power', value: `${stats.conversion}%`, icon: TrendingUp, color: 'emerald', trend: 'OPTIMIZED' },
          ].map((s, i) => (
            <div key={i} className="bg-white p-4 sm:p-10 rounded-2xl sm:rounded-[3rem] border border-slate-100/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_45px_90px_-20px_rgba(0,0,0,0.1)] transition-all group relative overflow-hidden">
               <div className={`absolute top-0 right-0 w-32 h-32 bg-${s.color}-400/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000`} />
               <div className="relative z-10">
                  <div className={cn("w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-8 shadow-sm group-hover:scale-110 group-hover:-rotate-6 transition-all", `bg-${s.color}-50 text-${s.color}-600`)}>
                     <s.icon className="w-5 h-5 sm:w-7 sm:h-7" />
                  </div>
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mb-1 sm:mb-2">{s.label}</p>
                  <div className="flex items-center justify-between group/val">
                     <h3 className="text-2xl sm:text-4xl font-black text-slate-900 leading-none tracking-tighter">{s.value}</h3>
                     <span className={cn("hidden sm:flex text-[9px] font-black px-3 py-1.5 rounded-full tracking-widest shadow-sm", 
                       s.trend === 'LIVE' || s.trend === 'ACTIVE' ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600")}>
                       {s.trend}
                     </span>
                  </div>
               </div>
            </div>
          ))}
       </div>

       {/* Actions Bar */}
       <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
             <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-100 w-full sm:w-80 shadow-sm focus-within:ring-2 ring-indigo-100 transition-all">
                <Search className="w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Filtered search..." 
                  className="bg-transparent text-xs font-bold text-slate-600 outline-none w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
              <button 
               onClick={handleExportCSV}
               className="w-full sm:w-auto px-5 py-3.5 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm flex items-center justify-center gap-2 font-bold text-xs shrink-0"
             >
                <Database className="w-4 h-4" /> Export CSV
             </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
             <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm mr-2 shrink-0">
                {['all', 'form', 'menu', 'coupon'].map((t) => (
                  <button 
                    key={t}
                    onClick={() => {
                       setSelectedType(t);
                       setSelectedQRId('all'); 
                    }}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                      selectedType === t ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                     {t === 'all' ? 'All Types' : `${t}s`}
                  </button>
                ))}
             </div>

             <div className="h-8 w-px bg-slate-100 mx-2 shrink-0" />

             <button 
               onClick={() => setSelectedQRId('all')}
               className={cn(
                 "px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                 selectedQRId === 'all' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-white text-slate-500 border border-slate-100 hover:bg-slate-50"
               )}
             >
                All Sources
             </button>
             {qrCodes
               .filter(qr => formsMap[qr.id] && (selectedType === 'all' || qr.type === selectedType))
               .slice(0, 5) 
               .map(qr => (
               <button 
                 key={qr.id}
                 onClick={() => setSelectedQRId(qr.id)}
                 className={cn(
                   "px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2",
                   selectedQRId === qr.id ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "bg-white text-slate-500 border border-slate-100 hover:bg-slate-50"
                 )}
               >
                  <div className={cn("w-2 h-2 rounded-full", qr.type === 'menu' ? "bg-amber-400" : "bg-blue-500")} />
                  {qr.name}
               </button>
             ))}

             {qrCodes.filter(qr => formsMap[qr.id] && (selectedType === 'all' || qr.type === selectedType)).length > 5 && (
                <select 
                  value={selectedQRId === 'all' || qrCodes.slice(0, 5).find(q => q.id === selectedQRId) ? '' : selectedQRId}
                  onChange={(e) => setSelectedQRId(e.target.value)}
                  className="px-4 py-3 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 outline-none focus:ring-2 ring-indigo-100 cursor-pointer"
                >
                   <option value="">More Sources...</option>
                   {qrCodes
                     .filter(qr => formsMap[qr.id] && (selectedType === 'all' || qr.type === selectedType))
                     .slice(5)
                     .map(qr => (
                      <option key={qr.id} value={qr.id}>{qr.name}</option>
                   ))}
                </select>
             )}
          </div>
       </div>

       {/* Leads Table Card */}
       <div className="bg-white rounded-3xl sm:rounded-[40px] border border-slate-100 overflow-hidden shadow-sm relative min-h-[400px]">
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
                      <th className="px-4 sm:px-8 py-4 sm:py-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Interaction</th>
                      <th className="px-4 sm:px-8 py-4 sm:py-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] hidden sm:table-cell">Data Points</th>
                      <th className="px-4 sm:px-8 py-4 sm:py-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] hidden lg:table-cell">Source</th>
                      <th className="px-4 sm:px-8 py-4 sm:py-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50/80 transition-all group">
                         <td className="px-4 sm:px-8 py-4 sm:py-6">
                            <div className="flex items-center gap-3 sm:gap-4">
                               <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-100 flex items-center justify-center relative shrink-0">
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
                         <td className="px-4 sm:px-8 py-4 sm:py-6 hidden sm:table-cell">
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
                         <td className="px-4 sm:px-8 py-4 sm:py-6 hidden lg:table-cell">
                            <div className="flex items-center gap-2">
                               <div className={cn("w-1.5 h-1.5 rounded-full", lead.qrType === 'menu' ? "bg-amber-400" : "bg-blue-500")} />
                               <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">{lead.qrCodeName}</span>
                            </div>
                         </td>
                         <td className="px-4 sm:px-8 py-4 sm:py-6 text-right">
                            <div className="flex items-center justify-end gap-2 relative">
                               <button 
                                 onClick={() => setViewingLead(lead)}
                                 className="p-2 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-all shadow-sm"
                                 title="View Details"
                               >
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                               </button>
                               <div className="relative">
                                  <button 
                                    onClick={() => setMenuOpenId(menuOpenId === lead.id ? null : lead.id)}
                                    className={cn(
                                      "p-2 bg-white border border-slate-100 rounded-lg transition-all shadow-sm",
                                      menuOpenId === lead.id ? "text-indigo-600 border-indigo-100" : "text-slate-400 hover:text-slate-900"
                                    )}
                                  >
                                     <MoreVertical className="w-3.5 h-3.5" />
                                  </button>
                                  
                                  {menuOpenId === lead.id && (
                                    <div ref={menuRef} className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                       <button 
                                         onClick={() => { setViewingLead(lead); setMenuOpenId(null); }}
                                         className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-all"
                                       >
                                          <Users className="w-3.5 h-3.5 text-indigo-500" /> View Details
                                       </button>
                                       <button 
                                         onClick={() => { 
                                           navigator.clipboard.writeText(JSON.stringify(lead.answers, null, 2)); 
                                           toast.success('Data copied to clipboard');
                                           setMenuOpenId(null); 
                                         }}
                                         className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                                       >
                                          <Database className="w-3.5 h-3.5 text-slate-400" /> Copy JSON
                                       </button>
                                       <div className="my-1 border-t border-slate-50" />
                                       <button 
                                         onClick={() => handleDeleteLead(lead)}
                                         className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 transition-all"
                                       >
                                          <X className="w-3.5 h-3.5" /> Delete Lead
                                       </button>
                                    </div>
                                  )}
                               </div>
                            </div>
                         </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          )}
       </div>

       {/* Lead Details Modal */}
       {viewingLead && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setViewingLead(null)} />
            <div className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
               <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                        <Users className="w-6 h-6" />
                     </div>
                     <div>
                        <h3 className="text-lg font-black text-slate-900 leading-none">Lead Intelligence</h3>
                        <p className="text-xs font-bold text-slate-400 mt-1">Detailed submission data</p>
                     </div>
                  </div>
                  <button onClick={() => setViewingLead(null)} className="p-3 hover:bg-white rounded-2xl text-slate-400 transition-colors shadow-sm border border-transparent hover:border-slate-100">
                     <X className="w-5 h-5" />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                  {/* Meta Section */}
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Source</p>
                        <p className="text-sm font-bold text-slate-900">{viewingLead.qrCodeName}</p>
                        <span className="text-[10px] font-medium text-slate-400 uppercase">{viewingLead.qrType}</span>
                     </div>
                     <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Date Captured</p>
                        <p className="text-sm font-bold text-slate-900">{formatDate(viewingLead.createdAt)}</p>
                        <span className="text-[10px] font-medium text-slate-400">{formatTime(viewingLead.createdAt)}</span>
                     </div>
                  </div>

                  {/* Data Section */}
                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Captured Fields</h4>
                     <div className="space-y-3">
                        {Object.entries(viewingLead.answers).map(([key, value]) => {
                           const field = formsMap[viewingLead.qrCodeId]?.fields.find(f => f.id === key);
                           return (
                              <div key={key} className="group p-5 bg-white border border-slate-100 rounded-3xl hover:border-indigo-100 transition-all shadow-sm">
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover:text-indigo-400 transition-colors">
                                    {field?.label || key}
                                 </p>
                                 <p className="text-sm font-bold text-slate-900 leading-relaxed whitespace-pre-wrap">
                                    {Array.isArray(value) ? value.join(', ') : String(value)}
                                 </p>
                              </div>
                           );
                        })}
                     </div>
                  </div>

                  {/* Technical Section */}
                  <div className="pt-4 mt-8 border-t border-slate-50">
                     <div className="flex items-center gap-2 text-slate-300">
                        <Database className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Submission ID: {viewingLead.id}</span>
                        <span className="mx-2">•</span>
                        <span className="text-[9px] font-black uppercase tracking-widest">IP: {viewingLead.ip || 'Hidden'}</span>
                     </div>
                  </div>
               </div>

               <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-3">
                  <button 
                    onClick={() => setViewingLead(null)}
                    className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold transition-all hover:bg-slate-100"
                  >
                    Close View
                  </button>
                  <button 
                    onClick={() => {
                       handleDeleteLead(viewingLead);
                       setViewingLead(null);
                    }}
                    className="flex-1 py-4 bg-red-50 text-red-600 rounded-2xl font-bold transition-all hover:bg-red-100"
                  >
                    Delete Lead
                  </button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};

export default LeadsPanel;
