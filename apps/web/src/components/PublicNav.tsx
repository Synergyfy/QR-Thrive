import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Zap, LayoutGrid, LogOut, Menu, X, ChevronRight } from 'lucide-react';
import { useCurrentUser, useLogout } from '../hooks/useApi';
import { getDashboardPath } from '../utils/auth';
import AuthModal from './AuthModal';
import { motion, AnimatePresence } from 'framer-motion';

export default function PublicNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: userData } = useCurrentUser();
  const logoutMutation = useLogout();
  const user = userData?.user;
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      setIsMenuOpen(false);
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  const navLinks = [
    { name: 'Why Us', path: '/why-us' },
    { name: 'Solutions', path: '/solutions' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'FAQ', path: '/faq' },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-white/70 backdrop-blur-xl z-[100] border-b border-gray-100/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group cursor-pointer shrink-0">
              <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center transform group-hover:rotate-12 transition-all duration-300 shadow-lg shadow-blue-500/20">
                <Zap className="text-white w-6 h-6 fill-yellow-300" />
              </div>
              <div className="flex flex-col -space-y-1">
                <span className="text-xl font-black tracking-tighter text-gray-900">QR Thrive</span>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest px-0.5">Marketing</span>
              </div>
            </Link>
            
            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-1 bg-gray-50/50 p-1 rounded-2xl border border-gray-100/50">
              {navLinks.map((link) => (
                <Link 
                  key={link.path}
                  to={link.path} 
                  className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${
                    location.pathname === link.path 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => navigate(getDashboardPath(user.role))}
                    className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full transition-all border border-blue-100"
                  >
                    <LayoutGrid size={16} /> My Dashboard
                  </button>
                  <button onClick={handleLogout} className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-red-500 rounded-full border border-gray-100 transition-colors">
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <>
                  <button 
                    onClick={() => setIsAuthModalOpen(true)} 
                    className="px-6 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-full transition-all"
                  >
                    Log In
                  </button>
                  <button 
                    onClick={() => setIsAuthModalOpen(true)} 
                    className="px-8 py-3 text-sm font-black text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-all shadow-xl shadow-blue-600/30 active:scale-95 uppercase tracking-widest"
                  >
                    Get Started Free
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              className="lg:hidden p-3 bg-gray-50 rounded-2xl text-gray-600 hover:text-blue-600 transition-colors" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Content */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white border-t border-gray-100 overflow-hidden shadow-2xl"
            >
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-blue-50 group transition-all"
                    >
                      <span className="font-bold text-gray-700 group-hover:text-blue-600">{link.name}</span>
                      <ChevronRight size={18} className="text-gray-400 group-hover:text-blue-600 transform group-hover:translate-x-1 transition-all" />
                    </Link>
                  ))}
                </div>

                <div className="pt-4 space-y-3">
                  {user ? (
                    <button 
                      onClick={() => { navigate(getDashboardPath(user.role)); setIsMenuOpen(false); }}
                      className="w-full p-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2"
                    >
                      <LayoutGrid size={20} /> My Dashboard
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => { setIsAuthModalOpen(true); setIsMenuOpen(false); }}
                        className="w-full p-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg"
                      >
                        Create Account
                      </button>
                      <button 
                        onClick={() => { setIsAuthModalOpen(true); setIsMenuOpen(false); }}
                        className="w-full p-4 bg-gray-50 text-gray-700 rounded-2xl font-bold border border-gray-100 text-center"
                      >
                        Log In
                      </button>
                    </>
                  )}
                  {user && (
                    <button 
                      onClick={handleLogout}
                      className="w-full p-4 text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-colors"
                    >
                      Logout Session
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={() => {}} 
      />
    </>
  );
}

