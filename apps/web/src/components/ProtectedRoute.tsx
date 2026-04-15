import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useApi';

const ProtectedRoute: React.FC = () => {
  const { data: user, isLoading, isError } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin shadow-lg"></div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!user || isError) {
    return <Navigate to="/" replace />;
  }

  const u = user.user;
  const isSubscriber = u.subscriptionStatus === 'active' || u.subscriptionStatus === 'trialing' || u.subscriptionStatus === 'non-renewing';
  
  // Allow admins and active subscribers
  if (u.role !== 'ADMIN' && !isSubscriber) {
    return <Navigate to="/pricing" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
