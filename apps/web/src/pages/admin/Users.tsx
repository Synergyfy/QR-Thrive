import { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal, 
  ChevronLeft, 
  ChevronRight,
  Shield,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const users = [
  { id: 1, name: "Adeola Johnson", email: "adeola.j@gmail.com", plan: "Standard", qrs: 12, status: "Active", joined: "Oct 12, 2025", avatar: "AJ" },
  { id: 2, name: "John Smith", email: "john_smith@corp.com", plan: "Annual", qrs: 45, status: "Active", joined: "Sep 20, 2025", avatar: "JS" },
  { id: 3, name: "Chidi Okafor", email: "chidi.okafor@tech.io", plan: "Quarterly", qrs: 28, status: "Inactive", joined: "Nov 05, 2025", avatar: "CO" },
  { id: 4, name: "Maria Garcia", email: "m.garcia@outlook.com", plan: "Standard", qrs: 5, status: "Active", joined: "Dec 30, 2025", avatar: "MG" },
  { id: 5, name: "Ibrahim Lawal", email: "i.lawal@fintech.ng", plan: "Annual", qrs: 112, status: "Active", joined: "Jan 15, 2026", avatar: "IL" },
  { id: 6, name: "Sarah Connor", email: "s.connor@resistance.net", plan: "Standard", qrs: 3, status: "Banned", joined: "Feb 02, 2026", avatar: "SC" },
  { id: 7, name: "David Miller", email: "d.miller@gmail.com", plan: "Quarterly", qrs: 18, status: "Active", joined: "Mar 10, 2026", avatar: "DM" },
];

export default function UsersManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || user.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">User Directory</h2>
          <p className="text-sm text-slate-500 font-medium">Manage and track all registered users on the platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm shadow-slate-900/5">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95">
            Add New User
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-grow w-full md:w-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search by name, email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {['All', 'Active', 'Inactive', 'Banned'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                selectedStatus === status 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <button className="p-3 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-all md:flex hidden">
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">User</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Plan</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">QR Codes</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Joined Date</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence mode='popLayout'>
                {filteredUsers.map((user, idx) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={user.id} 
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shadow-sm bg-gradient-to-br transition-all group-hover:scale-105 ${
                         idx % 3 === 0 ? 'from-blue-100 to-indigo-100 text-blue-600' : 
                         idx % 3 === 1 ? 'from-amber-100 to-orange-100 text-amber-600' : 
                         'from-rose-100 to-pink-100 text-rose-600'
                        }`}>
                          {user.avatar}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 leading-tight flex items-center gap-1.5">
                            {user.name}
                            {user.plan === 'Annual' && <Shield className="w-3 h-3 text-blue-500" />}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        user.plan === 'Annual' ? 'bg-indigo-50 text-indigo-600' : 
                        user.plan === 'Quarterly' ? 'bg-blue-50 text-blue-600' : 
                        'bg-slate-50 text-slate-500'
                      }`}>
                        {user.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-700">{user.qrs}</span>
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                          <div 
                            className="bg-blue-500 h-full rounded-full" 
                            style={{ width: `${Math.min(user.qrs / 150 * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          user.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 
                          user.status === 'Inactive' ? 'bg-slate-300' : 
                          'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                        }`}></div>
                        <span className="text-xs font-bold text-slate-600">{user.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">{user.joined}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-blue-600 transition-all shadow-none hover:shadow-sm border border-transparent hover:border-slate-100">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-red-500 transition-all shadow-none hover:shadow-sm border border-transparent hover:border-slate-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-slate-600 transition-all shadow-none hover:shadow-sm border border-transparent hover:border-slate-100">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-slate-50/50 px-6 py-4 flex items-center justify-between border-t border-slate-100">
          <p className="text-xs font-bold text-slate-500">
            Showing <span className="text-slate-800">{filteredUsers.length}</span> of <span className="text-slate-800">128</span> users
          </p>
          <div className="flex items-center gap-2">
            <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 disabled:opacity-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              <button className="w-8 h-8 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase">1</button>
              <button className="w-8 h-8 rounded-xl bg-transparent text-slate-400 text-[10px] font-black uppercase hover:bg-slate-200">2</button>
              <button className="w-8 h-8 rounded-xl bg-transparent text-slate-400 text-[10px] font-black uppercase hover:bg-slate-200">3</button>
            </div>
            <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
