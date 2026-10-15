import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { PAGE_DEFINITIONS } from '../../config/permissions';
import toast from 'react-hot-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  pageKey?: string; // optional - if not provided, just checks auth
}

export function ProtectedRoute({ children, pageKey }: ProtectedRouteProps) {
  const { session, loading, userRole, canAccessPage } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-[#1B3A6B] rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Memuat...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!session) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // No valid dashboard role at all
  if (!userRole || !['admin', 'editor', 'user'].includes(userRole)) {
    toast.error('Anda tidak memiliki akses ke halaman admin');
    return <Navigate to="/" replace />;
  }

  // Check page-level permission
  if (pageKey && !canAccessPage(pageKey)) {
    // Find first accessible fallback page to avoid infinite redirect loop if 'dashboard' is disabled
    const fallbackPage = PAGE_DEFINITIONS.find(p => canAccessPage(p.key));
    const fallbackPath = fallbackPage ? fallbackPage.path : '/admin/profile';

    if (location.pathname !== fallbackPath) {
      toast.error('Anda tidak memiliki izin untuk mengakses halaman ini');
      return <Navigate to={fallbackPath} replace />;
    }
  }

  return <>{children}</>;
}
