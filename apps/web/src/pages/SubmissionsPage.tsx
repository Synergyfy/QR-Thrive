import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ClipboardList, Search, 
  Download, Globe, X, Check
} from 'lucide-react';
import { useForm, useFormSubmissions } from '../hooks/useForms';
import { useQRCodes } from '../hooks/useApi';
import toast from 'react-hot-toast';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const SubmissionsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: qrCodes = [] } = useQRCodes();
  const qrCode = qrCodes.find(q => q.id === id);
  
  const { data: form, isLoading: loadingForm } = useForm(id);
  const { data: submissions = [], isLoading: loadingSubmissions } = useFormSubmissions(id);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportConfig, setExportConfig] = useState<{
    type: 'all' | 'last' | 'range',
    lastN: number,
    startDate: string,
    endDate: string
  }>({
    type: 'all',
    lastN: 10,
    startDate: '',
    endDate: ''
  });

  const filteredSubmissions = useMemo(() => {
    if (!searchQuery.trim()) return submissions;
    const q = searchQuery.toLowerCase();
    return submissions.filter(sub => 
      Object.values(sub.answers).some(val => 
        String(val).toLowerCase().includes(q)
      ) || (sub.ip && sub.ip.toLowerCase().includes(q))
    );
  }, [submissions, searchQuery]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleExport = () => {
    if (!form || !submissions.length) return;
    
    let dataToExport = [...submissions];
    
    // Sort by date descending (should already be from API, but let's be safe)
    dataToExport.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (exportConfig.type === 'last') {
      dataToExport = dataToExport.slice(0, exportConfig.lastN);
    } else if (exportConfig.type === 'range') {
      const start = exportConfig.startDate ? new Date(exportConfig.startDate).getTime() : 0;
      const end = exportConfig.endDate ? new Date(exportConfig.endDate).getTime() : Infinity;
      dataToExport = dataToExport.filter(sub => {
        const time = new Date(sub.createdAt).getTime();
        return time >= start && time <= end;
      });
    }

    if (dataToExport.length === 0) {
      toast.error('No responses found for selected filters');
      return;
    }

    const headers = ['Date', 'IP Address', ...form.fields.map(f => f.label)];
    const rows = dataToExport.map(sub => [
      formatDate(sub.createdAt),
      sub.ip || 'N/A',
      ...form.fields.map(f => sub.answers[f.id] || '')
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${qrCode?.name || 'submissions'}-responses-${exportConfig.type}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportModalOpen(false);
  };

  if (loadingForm || loadingSubmissions) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-bold">Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans selection:bg-blue-100 selection:text-blue-900">
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-10 relative z-20">
           <div className="flex items-center gap-6">
              <button 
                onClick={() => navigate('/dashboard')}
                className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-blue-600 hover:border-blue-600 transition-all shadow-sm active:scale-95"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  <ClipboardList className="w-6 h-6 text-emerald-600" />
                  {qrCode?.name || 'Form'} Responses
                </h1>
                <p className="text-xs font-bold text-slate-400 mt-0.5">{qrCode?.shortUrl || 'Dynamic QR'}</p>
              </div>
           </div>
           
           <div className="flex items-center gap-4 group">
              <div className="flex items-center gap-4 bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-100 w-80 focus-within:ring-2 ring-blue-100 transition-all">
                <Search className="w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search responses..." 
                  className="bg-transparent text-sm font-bold text-slate-600 outline-none w-full placeholder:text-slate-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                onClick={() => setIsExportModalOpen(true)}
                disabled={submissions.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 disabled:grayscale"
              >
                <Download className="w-4 h-4 stroke-[3]" /> Export CSV
              </button>
           </div>
        </header>

        {/* Export Modal */}
        {isExportModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsExportModalOpen(false)} />
            <div className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="p-10">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                      <Download className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 leading-none">Export Responses</h3>
                      <p className="text-sm font-bold text-slate-400 mt-1.5">Customize your CSV export</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsExportModalOpen(false)}
                    className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-8">
                  {/* Export Type Selection */}
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { id: 'all', label: 'All Responses', desc: `Export all ${submissions.length} responses` },
                      { id: 'last', label: 'Last N Responses', desc: 'Export the most recent entries' },
                      { id: 'range', label: 'Date Range', desc: 'Export responses within a period' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setExportConfig(prev => ({ ...prev, type: opt.id as any }))}
                        className={cn(
                          "w-full p-5 rounded-3xl border-2 text-left transition-all relative group",
                          exportConfig.type === opt.id 
                            ? "border-blue-600 bg-blue-50/30 ring-4 ring-blue-50" 
                            : "border-slate-100 hover:border-slate-200 bg-white"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={cn("font-black text-sm uppercase tracking-wider", 
                              exportConfig.type === opt.id ? "text-blue-600" : "text-slate-900")}>
                              {opt.label}
                            </p>
                            <p className="text-xs font-bold text-slate-400 mt-1">{opt.desc}</p>
                          </div>
                          {exportConfig.type === opt.id && (
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white">
                              <Check className="w-4 h-4 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Contextual Inputs */}
                  <div className="pt-2">
                    {exportConfig.type === 'last' && (
                      <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Number of responses</label>
                        <input
                          type="number"
                          value={exportConfig.lastN}
                          onChange={(e) => setExportConfig(prev => ({ ...prev, lastN: parseInt(e.target.value) || 1 }))}
                          className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900"
                          placeholder="Enter amount..."
                          min="1"
                        />
                      </div>
                    )}

                    {exportConfig.type === 'range' && (
                      <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</label>
                          <input
                            type="date"
                            value={exportConfig.startDate}
                            onChange={(e) => setExportConfig(prev => ({ ...prev, startDate: e.target.value }))}
                            className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End Date</label>
                          <input
                            type="date"
                            value={exportConfig.endDate}
                            onChange={(e) => setExportConfig(prev => ({ ...prev, endDate: e.target.value }))}
                            className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => setIsExportModalOpen(false)}
                      className="flex-1 py-5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-[24px] font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleExport}
                      className="flex-[2] py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      Download CSV <Download className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          {submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-24 h-24 bg-slate-100 rounded-[32px] flex items-center justify-center mb-8 text-slate-300">
                <ClipboardList className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">No responses yet</h3>
              <p className="text-slate-400 font-medium mb-8 max-w-sm">
                As soon as people start filling out your form, their responses will appear here.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Submitted Date</th>
                      {form?.fields.map(field => (
                        <th key={field.id} className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {field.label}
                        </th>
                      ))}
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6">
                           <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900">{formatDate(sub.createdAt)}</span>
                           </div>
                        </td>
                        {form?.fields.map(field => (
                          <td key={field.id} className="px-8 py-6 text-sm font-medium text-slate-600">
                            {Array.isArray(sub.answers[field.id]) 
                              ? sub.answers[field.id].join(', ') 
                              : (sub.answers[field.id]?.toString() || '-')}
                          </td>
                        ))}
                        <td className="px-8 py-6">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold">
                            <Globe className="w-3 h-3" /> {sub.ip || 'Unknown'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SubmissionsPage;
