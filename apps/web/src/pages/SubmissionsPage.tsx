import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ClipboardList, Search, 
  Download, Globe
} from 'lucide-react';
import { useForm, useFormSubmissions } from '../hooks/useForms';
import { useQRCodes } from '../hooks/useApi';

const SubmissionsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: qrCodes = [] } = useQRCodes();
  const qrCode = qrCodes.find(q => q.id === id);
  
  const { data: form, isLoading: loadingForm } = useForm(id);
  const { data: submissions = [], isLoading: loadingSubmissions } = useFormSubmissions(id);
  
  const [searchQuery, setSearchQuery] = useState('');

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

  const exportToCSV = () => {
    if (!form || !submissions.length) return;
    
    const headers = ['Date', 'IP Address', ...form.fields.map(f => f.label)];
    const rows = submissions.map(sub => [
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
    link.setAttribute('download', `${qrCode?.name || 'submissions'}-responses.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                onClick={exportToCSV}
                disabled={submissions.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 disabled:grayscale"
              >
                <Download className="w-4 h-4 stroke-[3]" /> Export CSV
              </button>
           </div>
        </header>

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
