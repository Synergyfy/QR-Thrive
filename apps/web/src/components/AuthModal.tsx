import React, { useState } from 'react';
import { X, Mail, Lock, Share2, Globe, Zap, ArrowRight, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { AuthResponse } from '../types/auth';
import { AxiosError } from 'axios';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (response: AuthResponse | null) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        await signup({
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          firstName: formData.firstName,
          lastName: formData.lastName,
        });
      }
      onSuccess(null); // AuthContext handles the user state
      onClose();
      navigate('/dashboard');
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

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

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">First Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      type="text" 
                      required
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
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      type="text" 
                      required
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
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  type="email" 
                  required
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
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  type="password" 
                  required
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
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    type="password" 
                    required
                    placeholder="••••••••" 
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900" 
                  />
                </div>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In to Dashboard' : 'Create My Account')}
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
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
