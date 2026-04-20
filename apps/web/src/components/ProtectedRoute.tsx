import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useApi';

const ProtectedRoute: React.FC = () => {
  const { data: user, isLoading, isError, fetchStatus } = useCurrentUser();

  // Show loading spinner while the auth check is in-flight
  // Also wait if the query is pending but hasn't started fetching yet (fetchStatus === 'idle')
  if (isLoading || fetchStatus === 'fetching') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin shadow-lg"></div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Authenticating...</p>
        </div>
      </div>
    );
  }

  console.log('ProtectedRoute state:', { isLoading, fetchStatus, userExists: !!user, userObjectExists: !!user?.user, isError });

  // Only redirect once the query has definitively settled with no user
  // We also wait if a fetch is in progress (fetchStatus !== 'idle') to avoid premature redirects
  if (!user?.user) {
    return <Navigate to="/" replace />;
  }
  const u = user.user;
  const isTrialValid = u.subscriptionStatus === 'trialing' && u.trialEndsAt && new Date(u.trialEndsAt) > new Date();
  // Allow active, non-renewing, valid trials, or any user with a plan and no explicit status (fallback)
  const isSubscriber = u.subscriptionStatus === 'active' || u.subscriptionStatus === 'non-renewing' || isTrialValid || (!!u.planId && !u.subscriptionStatus);
  
  const location = useLocation();

  // Allow admins and active subscribers
  if (u.role !== 'ADMIN' && !isSubscriber) {
    // If they are on the dashboard, let them stay (DashboardPage handles the pricing view)
    if (location.pathname === '/dashboard') {
      return <Outlet />;
    }
    // Otherwise redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
