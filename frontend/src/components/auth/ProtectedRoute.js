'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function ProtectedRoute({
  permission,
  anyPermissions,
  allPermissions,
  role,
  children,
}) {
  const router = useRouter();
  const {
    initialized,
    isAuthenticated,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
  } = useAuth();

  let authorized = isAuthenticated;

  if (authorized && role && !hasRole(role)) {
    authorized = false;
  }
  if (authorized && permission && !hasPermission(permission)) {
    authorized = false;
  }
  if (authorized && anyPermissions && !hasAnyPermission(anyPermissions)) {
    authorized = false;
  }
  if (authorized && allPermissions && !hasAllPermissions(allPermissions)) {
    authorized = false;
  }

  useEffect(() => {
    if (!initialized) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (!authorized) {
      router.replace('/unauthorized');
    }
  }, [initialized, isAuthenticated, authorized, router]);

  if (!initialized) {
    return <LoadingSpinner fullPage text="Verifying session..." />;
  }

  if (!isAuthenticated || !authorized) {
    return <LoadingSpinner fullPage text="Redirecting..." />;
  }

  return children;
}
