import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Settings, 
  LogOut, 
  Bell, 
  Search, 
  Menu, 
  X,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';

const sidebarLinks = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { name: 'User Management', icon: Users, path: '/admin/users' },
  { name: 'Pricing Manager', icon: CreditCard, path: '/admin/pricing' },
  { name: 'Settings', icon: Settings, path: '/admin/settings' },
];

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const activeLink = sidebarLinks.find(link => link.path === location.pathname) || sidebarLinks[0];

  return (
    <div className="min-h-screen bg-[#f1f5f9] font-['Poppins'] flex text-slate-700 selection:bg-blue-100 selection:text-blue-600">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 bg-white border-r border-slate-200 z-50 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'w-72' : 'w-20'
        } hidden md:flex flex-col`}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-200">
            <span className="text-white font-black text-xl">QT</span>
          </div>
          {isSidebarOpen && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-black text-xl tracking-tight text-slate-800"
            >
              QR<span className="text-blue-600">Thrive</span> Admin
            </motion.span>
          )}
        </div>

        <nav className="flex-grow px-4 mt-6 space-y-1">
          {sidebarLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${
                location.pathname === link.path
                  ? 'bg-blue-50 text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <link.icon className={`w-5 h-5 ${location.pathname === link.path ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
              {isSidebarOpen && (
                <span className="font-semibold text-sm tracking-wide">{link.name}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-4 px-4 py-3.5 w-full rounded-2xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all group"
          >
            <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-500" />
            {isSidebarOpen && <span className="font-semibold text-sm tracking-wide">Back to Site</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-grow transition-all duration-300 ${isSidebarOpen ? 'md:ml-72' : 'md:ml-20'}`}>
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg md:flex hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-slate-800 md:block hidden">
              {activeLink?.name}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative hidden sm:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-slate-100 border-none rounded-xl pl-10 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-slate-100 rounded-xl transition-all">
                <Bell className="w-5 h-5 text-slate-500" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
              </button>
              
              <div className="h-8 w-px bg-slate-200"></div>
              
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-800 leading-none">Admin User</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Super Admin</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-blue-200">
                  AD
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
