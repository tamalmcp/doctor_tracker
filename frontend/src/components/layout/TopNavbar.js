'use client';

import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { useAuth } from '@/hooks/useAuth';
import { toggleSidebar } from '@/store/slices/uiSlice';

export default function TopNavbar({ onOpenMobileSidebar }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, roles, isSuperAdmin, logout, refreshAuth } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const initials = (user?.name || 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="dt-topbar px-3 px-md-4 d-flex align-items-center justify-content-between gap-2">
      <div className="d-flex align-items-center gap-2">
        <button
          type="button"
          className="btn btn-light border d-lg-none"
          aria-label="Open menu"
          onClick={onOpenMobileSidebar}
        >
          <i className="bi bi-list fs-5" />
        </button>

        <button
          type="button"
          className="btn btn-light border d-none d-lg-inline-flex"
          aria-label="Toggle sidebar"
          onClick={() => dispatch(toggleSidebar())}
        >
          <i className="bi bi-layout-sidebar-inset" />
        </button>

        <div className="d-none d-sm-flex align-items-center gap-2 ms-2">
          {isSuperAdmin ? (
            <span className="badge bg-teal-subtle rounded-pill px-3 py-2 fw-semibold">
              <i className="bi bi-stars me-1" />
              Super Admin Mode
            </span>
          ) : (
            (roles || []).map((role) => (
              <span
                key={role._id}
                className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-3 py-1"
              >
                {role.name}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="d-flex align-items-center gap-2 gap-md-3">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          title="Refresh authorization permissions"
          onClick={() => refreshAuth()}
        >
          <i className="bi bi-arrow-clockwise me-1" />
          <span className="d-none d-md-inline">Sync Permissions</span>
        </button>

        <div className="d-flex align-items-center gap-2">
          <div className="dt-avatar bg-teal-subtle">{initials}</div>
          <div className="d-none d-md-block lh-sm">
            <div className="fw-semibold small text-dark">{user?.name}</div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
              {user?.email}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-sm btn-outline-danger"
          onClick={handleLogout}
        >
          <i className="bi bi-box-arrow-right me-1" />
          <span className="d-none d-sm-inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
