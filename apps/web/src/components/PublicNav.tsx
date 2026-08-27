import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, LogOut, Menu, X, ChevronRight } from 'lucide-react';
import { useCurrentUser, useLogout } from '../hooks/useApi';
import { getDashboardPath } from '../utils/auth';
import AuthModal from './AuthModal';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function PublicNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: userData } = useCurrentUser();
  const logoutMutation = useLogout();
  const user = userData?.user;
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      setIsMenuOpen(false);
      setIsAvatarMenuOpen(false);
      toast.success('Logged out successfully');
      navigate('/');
    } catch (e) {
      console.error('Logout failed', e);
      toast.error('Logout failed. Please try again.');
    }
  };

  const handleOutsideClick = (e: MouseEvent) => {
    if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) {
      setIsAvatarMenuOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const navLinks = [
    { name: 'Why Us', path: '/why-us' },
    { name: 'Solutions', path: '/solutions' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'FAQ', path: '/faq' },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl z-[100] border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center group cursor-pointer shrink-0">
              <img src="/QRThrive_Logo_Full-BG.png" alt="QR Thrive" className="h-12 sm:h-16 w-auto transform transition-all duration-300" style={{ filter: 'brightness(0) saturate(100%) invert(32%) sepia(95%) saturate(3033%) hue-rotate(211deg) brightness(96%) contrast(92%)' }} />
            </Link>
            
            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-1 p-1 rounded-xl border border-slate-100 bg-slate-50/60">
              {navLinks.map((link) => (
                <Link 
                  key={link.path}
                  to={link.path} 
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                    location.pathname === link.path 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              {user ? (
                <div ref={avatarMenuRef} className="relative">
                  <button 
                    onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)}
                    aria-haspopup="menu"
                    aria-expanded={isAvatarMenuOpen}
                    className="flex items-center gap-3 pl-4 pr-3 py-1.5 bg-white hover:bg-gray-50 rounded-full transition-all border border-gray-100 shadow-sm"
                  >
                    <div className="flex flex-col items-end -space-y-1">
                      <span className="text-sm font-semibold text-slate-900">{user.firstName} {user.lastName}</span>
                      <span className="text-[11px] font-semibold text-blue-600 capitalize">{user.role.toLowerCase()}</span>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-blue-200">
                      {user.firstName[0]}{user.lastName[0]}
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  <div className={`absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 transition-all duration-300 z-50 p-2 transform origin-top-right ${isAvatarMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2 pointer-events-none'}`}>
                    <div className="p-4 border-b border-slate-100 mb-2">
                      <p className="text-[11px] font-semibold text-slate-400 mb-1">Logged in as</p>
                      <p className="text-sm font-semibold text-slate-900 truncate">{user.email}</p>
                    </div>
                    
                    <button 
                      onClick={() => { setIsAvatarMenuOpen(false); navigate(getDashboardPath(user)); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    >
                      <LayoutGrid size={18} /> My Dashboard
                    </button>
                    
                    <div className="h-px bg-slate-100 my-2" />
                    
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <LogOut size={18} /> Logout Session
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button 
                    onClick={() => setIsAuthModalOpen(true)} 
                    className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                  >
                    Log In
                  </button>
                  <button 
                    onClick={() => setIsAuthModalOpen(true)} 
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-sm active:scale-95"
                  >
                    Get Started Free
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              className="lg:hidden p-2.5 bg-gray-50 rounded-xl text-gray-600 hover:text-blue-600 transition-colors" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
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
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 gap-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-3 rounded-xl text-slate-700 hover:bg-slate-50 transition-all group"
                    >
                      <span className="font-medium group-hover:text-blue-600">{link.name}</span>
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600 transition-all" />
                    </Link>
                  ))}
                </div>

                <div className="pt-3 space-y-3 border-t border-slate-100">
                  {user ? (
                    <button 
                      onClick={() => { navigate(getDashboardPath(user)); setIsMenuOpen(false); }}
                      className="w-full p-3.5 bg-blue-600 text-white rounded-xl font-semibold shadow-sm flex items-center justify-center gap-2"
                    >
                      <LayoutGrid size={20} /> My Dashboard
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => { setIsAuthModalOpen(true); setIsMenuOpen(false); }}
                        className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold shadow-sm active:scale-[0.98] transition-all"
                      >
                        Create Account
                      </button>
                      <button 
                        onClick={() => { setIsAuthModalOpen(true); setIsMenuOpen(false); }}
                        className="w-full py-3.5 bg-slate-50 text-slate-700 rounded-xl font-medium border border-slate-100 text-center active:scale-[0.98] transition-all"
                      >
                        Log In
                      </button>
                    </>
                  )}
                  {user && (
                    <button 
                      onClick={handleLogout}
                      className="w-full py-3.5 text-red-500 font-medium hover:bg-red-50 rounded-xl transition-colors"
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
        onSuccess={(u) => {
          setIsAuthModalOpen(false);
          const path = getDashboardPath(u);
          navigate(path);
        }} 
      />
    </>
  );
}

