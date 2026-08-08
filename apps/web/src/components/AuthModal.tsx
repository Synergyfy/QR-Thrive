import React, { useState } from 'react';
import { X, Mail, Lock, Zap, ArrowRight, Loader2, User, AlertCircle, Phone, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLogin, useSignup } from '../hooks/useApi';
import { getDashboardPath } from '../utils/auth';
import GoogleLoginButton from './GoogleLoginButton';

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
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      if (!email.trim() || !password.trim() || !confirmPassword.trim() || !firstName.trim() || !lastName.trim() || !phone.trim()) {
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
        navigate(getDashboardPath(res.user, isLogin ? false : true));
      } else {
        const res = await signupMutation.mutateAsync({ email, password, confirmPassword, firstName, lastName, phone });
        onSuccess(res.user);
        toast.success('Account created successfully!');
        onClose();
        navigate(getDashboardPath(res.user, isLogin ? false : true));
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Authentication failed');
    }
  };

  const isLoading = loginMutation.isPending || signupMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[92dvh] flex flex-col">
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="text-white w-5 h-5 fill-yellow-300" />
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">QR-Thrive</span>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="field-label ml-1">First Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John" 
                      className="input pl-11" 
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="field-label ml-1">Last Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe" 
                      className="input pl-11" 
                    />
                  </div>
                </div>
              </div>
            )}
            {!isLogin && (
              <div className="space-y-1">
                <label className="field-label ml-1">Business Phone (WhatsApp)</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="tel" 
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 234 567 890" 
                    className="input pl-11" 
                  />
                </div>
              </div>
            )}
            <div className="space-y-1">
              <label className="field-label ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com" 
                  className="input pl-11" 
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="field-label ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="input pl-11 pr-11" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {!isLogin && (
              <div className="space-y-1">
                <label className="field-label ml-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="input pl-11 pr-11" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
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
              className="btn btn-primary w-full h-12 text-xs uppercase tracking-widest"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isLogin ? 'Sign In to Dashboard' : 'Create My Account'}
              {!isLoading && <ArrowRight className="w-4 h-4 ml-1" />}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500">or</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <GoogleLoginButton 
              onSuccess={(user) => {
                onSuccess(user);
                onClose();
              }}
              onError={(msg) => setError(msg)}
            />
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="ml-1 text-blue-600 font-bold hover:underline"
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
        
        <div className="bg-blue-50 p-4 sm:p-5 flex items-center gap-3 shrink-0">
           <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-100 shrink-0">
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
