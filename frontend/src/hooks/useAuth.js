'use client';

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentUser, logoutUser } from '@/store/slices/authSlice';
import {
  hasPermission as checkPermission,
  hasRole as checkRole,
  hasAnyPermission as checkAnyPermission,
  hasAllPermissions as checkAllPermissions,
} from '@/lib/permissions';

export function useAuth() {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);

  const hasPermission = useCallback(
    (permissionSlug) => checkPermission(auth, permissionSlug),
    [auth]
  );

  const hasRole = useCallback(
    (roleSlug) => checkRole(auth, roleSlug),
    [auth]
  );

  const hasAnyPermission = useCallback(
    (permissionSlugs) => checkAnyPermission(auth, permissionSlugs),
    [auth]
  );

  const hasAllPermissions = useCallback(
    (permissionSlugs) => checkAllPermissions(auth, permissionSlugs),
    [auth]
  );

  const refreshAuth = useCallback(() => {
    return dispatch(fetchCurrentUser());
  }, [dispatch]);

  const logout = useCallback(() => {
    return dispatch(logoutUser());
  }, [dispatch]);

  return {
    ...auth,
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    refreshAuth,
    logout,
  };
}
