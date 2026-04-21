import { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  Shield,
  Trash2,
  ExternalLink,
  Loader2,
  Gift,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminUsers, useBanUser, useDeleteUser, useExportUsers, useGrantPlan, useAdminPlans } from '../../hooks/useAdmin';
import { format } from 'date-fns';
import toast from 'react-hot-toast';


export default function UsersManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAdminUsers({
    page,
    search: searchTerm,
    status: selectedStatus === 'All' ? undefined : selectedStatus.toLowerCase(),
  });

  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [duration, setDuration] = useState('month');

  const grantPlanMutation = useGrantPlan();
  const { data: plans } = useAdminPlans();

  const banMutation = useBanUser();
  const deleteMutation = useDeleteUser();
  const exportMutation = useExportUsers();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">User Directory</h2>
          <p className="text-sm text-slate-500 font-medium">Manage and track all registered users on the platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              const t = toast.loading('Exporting users...');
              exportMutation.mutate(undefined, {
                onSuccess: () => toast.success('Export completed', { id: t }),
                onError: () => toast.error('Export failed', { id: t })
              });
            }}
            disabled={exportMutation.isPending}
            className="bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm shadow-slate-900/5 disabled:opacity-50"
          >
            {exportMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
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
            onChange={handleSearch}
            className="w-full bg-slate-50 border-none rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {['All', 'Active', 'Inactive', 'Banned'].map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
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
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px] relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}
        
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
                {(data?.users || []).map((user, idx: number) => (
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
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 leading-tight flex items-center gap-1.5">
                            {user.firstName} {user.lastName}
                            {user.plan?.name === 'PRO' && <Shield className="w-3 h-3 text-blue-500" />}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">{user.email}</p>

                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        user.plan?.name === 'PRO' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-500'
                      }`}>
                        {user.plan?.name || 'FREE'}
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
                          user.isBanned ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' :
                          user.subscriptionStatus === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 
                          user.subscriptionStatus === 'canceled' ? 'bg-slate-300' : 
                          'bg-amber-500'
                        }`}></div>

                        <span className="text-xs font-bold text-slate-600 capitalize">
                          {user.isBanned ? 'Banned' : (user.subscriptionStatus || 'N/A')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-blue-600 transition-all shadow-none hover:shadow-sm border border-transparent hover:border-slate-100">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button 
                          title={user.isBanned ? "Unban User" : "Ban User"}
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to ${user.isBanned ? 'unban' : 'ban'} ${user.firstName}?`)) {
                              banMutation.mutate(user.id, {
                                onSuccess: () => toast.success(`User ${user.isBanned ? 'unbanned' : 'banned'} successfully`)
                              });
                            }
                          }}
                          className={`p-2 hover:bg-white rounded-lg transition-all shadow-none hover:shadow-sm border border-transparent hover:border-slate-100 ${
                            user.isBanned ? 'text-emerald-500' : 'text-amber-500'
                          }`}
                        >
                          <Shield className={`w-4 h-4 ${user.isBanned ? 'text-emerald-500' : 'text-rose-500'}`} />
                        </button>
                        <button 
                          title="Gift Plan"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsGiftModalOpen(true);
                          }}
                          className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-amber-500 transition-all shadow-none hover:shadow-sm border border-transparent hover:border-slate-100"
                        >
                          <Gift className="w-4 h-4" />
                        </button>
                        <button 
                          title="Delete User"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete ${user.firstName}? This cannot be undone.`)) {
                              deleteMutation.mutate(user.id, {
                                onSuccess: () => toast.success('User deleted successfully')
                              });
                            }
                          }}
                          className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-red-500 transition-all shadow-none hover:shadow-sm border border-transparent hover:border-slate-100"
                        >
                          <Trash2 className="w-4 h-4" />
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
            Showing <span className="text-slate-800">{(data?.users || []).length}</span> of <span className="text-slate-800">{data?.total || 0}</span> users
          </p>
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 disabled:opacity-50 hover:bg-slate-50 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: data?.pages || 1 }, (_, i) => (
                <button 
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 rounded-xl text-[10px] font-black uppercase transition-all ${
                    page === i + 1 ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button 
              disabled={page === data?.pages}
              onClick={() => setPage(p => Math.min(data?.pages || 1, p + 1))}
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 disabled:opacity-50 hover:bg-slate-50 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Gift Plan Modal */}
      <AnimatePresence>
        {isGiftModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGiftModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                    <Gift className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Gift Free Plan</h3>
                    <p className="text-sm text-slate-500 font-medium">{selectedUser?.email}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                      Select Plan
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {plans?.filter(p => !p.isDefault).map((plan) => (
                        <button
                          key={plan.id}
                          onClick={() => setSelectedPlanId(plan.id)}
                          className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                            selectedPlanId === plan.id
                              ? 'border-blue-600 bg-blue-50/50'
                              : 'border-slate-100 hover:border-slate-200 bg-slate-50/30'
                          }`}
                        >
                          <div className="text-left">
                            <p className={`text-sm font-bold ${selectedPlanId === plan.id ? 'text-blue-700' : 'text-slate-700'}`}>
                              {plan.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              Limit: {plan.qrCodeLimit} QRs
                            </p>
                          </div>
                          {selectedPlanId === plan.id && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                      Duration
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['month', 'quarter', 'year'].map((d) => (
                        <button
                          key={d}
                          onClick={() => setDuration(d)}
                          className={`py-3 px-4 rounded-xl text-xs font-bold capitalize transition-all border-2 ${
                            duration === d
                              ? 'bg-slate-900 border-slate-900 text-white shadow-lg'
                              : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-8">
                  <button
                    onClick={() => setIsGiftModalOpen(false)}
                    className="flex-1 py-4 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!selectedPlanId || grantPlanMutation.isPending}
                    onClick={async () => {
                      try {
                        await grantPlanMutation.mutateAsync({
                          userId: selectedUser.id,
                          planId: selectedPlanId,
                          duration
                        });
                        toast.success('Plan gifted successfully!');
                        setIsGiftModalOpen(false);
                        setSelectedPlanId('');
                      } catch (err) {
                        toast.error('Failed to gift plan');
                      }
                    }}
                    className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white rounded-2xl text-sm font-extrabold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                  >
                    {grantPlanMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Grant Access'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
