import React, { useState } from 'react';
import { X, Mail, Lock, Globe, Zap, ArrowRight, Loader2, User, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLogin, useSignup } from '../hooks/useApi';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [isLogin]);

  const loginMutation = useLogin();
  const signupMutation = useSignup();
  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (isLogin) {
      if (!email.trim() || !password.trim()) {
        setError("Please fill in all fields");
        return;
      }
    } else {
      if (!email.trim() || !password.trim() || !confirmPassword.trim() || !firstName.trim() || !lastName.trim()) {
        setError("All fields are required");
        return;
      }
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    try {
      if (isLogin) {
        const res = await loginMutation.mutateAsync({ email, password });
        onSuccess(res.user);
        toast.success(`Welcome back, ${res.user.firstName}!`);
        onClose();
        navigate('/dashboard');
      } else {
        const res = await signupMutation.mutateAsync({ email, password, confirmPassword, firstName, lastName });
        onSuccess(res.user);
        toast.success('Account created successfully!');
        onClose();
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Authentication failed');
    }
  };

  const isLoading = loginMutation.isPending || signupMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="text-white w-5 h-5 fill-yellow-300" />
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">QR-Thrive</span>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isLogin ? 'Welcome Back!' : 'Start Growing Today'}
            </h2>
            <p className="text-sm text-gray-500">
              {isLogin 
                ? 'Sign in to access your analytics and premium downloads.' 
                : 'Create an account to start tracking your dynamic QR codes.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">First Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John" 
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900" 
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Last Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe" 
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900" 
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com" 
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900" 
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900" 
                />
              </div>
            </div>
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="password" 
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900" 
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-sm font-medium text-red-600 line-clamp-2">{error}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isLogin ? 'Sign In to Dashboard' : 'Create My Account'}
              {!isLoading && <ArrowRight className="w-4 h-4 ml-1" />}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-gray-400 font-medium">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors">
              <Globe className="w-4 h-4 text-red-500" />
              <span className="text-sm font-bold text-gray-700">Google</span>
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-gray-500">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="ml-1 text-blue-600 font-bold hover:underline"
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
        
        <div className="bg-blue-50 p-6 flex items-center gap-4">
           <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
              <Zap className="w-5 h-5 fill-yellow-400 text-yellow-400" />
           </div>
           <div>
              <p className="text-xs font-bold text-blue-900">Unlock Premium Analytics</p>
              <p className="text-[10px] text-blue-600 opacity-80 leading-tight">Get real-time scan location and device tracking for all your codes.</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
