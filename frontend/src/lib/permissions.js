export function hasRole(authState, roleSlug) {
  if (!authState || !authState.isAuthenticated) {
    return false;
  }
  const roles = authState.roles || [];
  return roles.some(
    (role) => role && role.slug === roleSlug && role.isActive !== false
  );
}

export function hasPermission(authState, permissionSlug) {
  if (!authState || !authState.isAuthenticated) {
    return false;
  }
  if (authState.isSuperAdmin) {
    return true;
  }
  const permissions = authState.permissions || [];
  return permissions.includes(permissionSlug);
}

export function hasAnyPermission(authState, permissionSlugs = []) {
  if (!authState || !authState.isAuthenticated) {
    return false;
  }
  if (authState.isSuperAdmin) {
    return true;
  }
  if (!Array.isArray(permissionSlugs) || permissionSlugs.length === 0) {
    return true;
  }
  const permissions = authState.permissions || [];
  return permissionSlugs.some((slug) => permissions.includes(slug));
}

export function hasAllPermissions(authState, permissionSlugs = []) {
  if (!authState || !authState.isAuthenticated) {
    return false;
  }
  if (authState.isSuperAdmin) {
    return true;
  }
  if (!Array.isArray(permissionSlugs) || permissionSlugs.length === 0) {
    return true;
  }
  const permissions = authState.permissions || [];
  return permissionSlugs.every((slug) => permissions.includes(slug));
}
