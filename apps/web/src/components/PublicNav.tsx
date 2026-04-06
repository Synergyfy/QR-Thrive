import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, LayoutGrid, LogOut, Menu, X } from 'lucide-react';
import { useCurrentUser, useLogout } from '../hooks/useApi';
import AuthModal from './AuthModal';

export default function PublicNav() {
  const navigate = useNavigate();
  const { data: userData } = useCurrentUser();
  const logoutMutation = useLogout();
  const user = userData?.user;
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2 group cursor-pointer">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform">
                <Zap className="text-white w-5 h-5 fill-yellow-300" />
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900">QR Thrive</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              {user && (
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <LayoutGrid className="w-4 h-4" /> Go to Dashboard
                </button>
              )}
              <Link to="/pricing" className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors">Pricing</Link>
              <a href="#" className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors">Solutions</a>
              <a href="#" className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors">API</a>
            </div>

            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-900">{user.firstName} {user.lastName}</p>
                  </div>
                  <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <button onClick={() => setIsAuthModalOpen(true)} className="px-5 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-full transition-all">Log In</button>
                  <button onClick={() => setIsAuthModalOpen(true)} className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-all shadow-md active:scale-95">Sign Up Free</button>
                </>
              )}
            </div>

            <button className="md:hidden p-2 text-gray-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={() => {}} 
      />
    </>
  );
}
