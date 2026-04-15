import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
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

  // Only redirect once the query has definitively settled with no user
  if (isError || !user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
