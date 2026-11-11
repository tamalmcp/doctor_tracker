'use client';

import { useAuth } from '@/hooks/useAuth';

export default function Can({
  permission,
  anyPermissions,
  allPermissions,
  role,
  fallback = null,
  children,
}) {
  const {
    isAuthenticated,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
  } = useAuth();

  if (!isAuthenticated) {
    return fallback;
  }

  let allowed = true;

  if (role && !hasRole(role)) {
    allowed = false;
  }

  if (allowed && permission && !hasPermission(permission)) {
    allowed = false;
  }

  if (allowed && anyPermissions && !hasAnyPermission(anyPermissions)) {
    allowed = false;
  }

  if (allowed && allPermissions && !hasAllPermissions(allPermissions)) {
    allowed = false;
  }

  return allowed ? children : fallback;
}
