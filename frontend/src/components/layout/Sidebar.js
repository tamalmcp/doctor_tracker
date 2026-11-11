'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: 'bi-grid-1x2-fill',
    permission: 'dashboard.view',
  },
  {
    href: '/doctors',
    label: 'Doctors',
    icon: 'bi-heart-pulse-fill',
    permission: 'doctors.view',
  },
  {
    href: '/patients',
    label: 'Patients',
    icon: 'bi-people-fill',
    permission: 'patients.view',
  },
  {
    href: '/users',
    label: 'Users',
    icon: 'bi-person-badge-fill',
    permission: 'users.view',
  },
  {
    href: '/roles',
    label: 'Roles & RBAC',
    icon: 'bi-shield-lock-fill',
    permission: 'roles.view',
    role: 'super-admin',
  },
  {
    href: '/permissions',
    label: 'Permissions',
    icon: 'bi-key-fill',
    permission: 'roles.assign_permissions',
    role: 'super-admin',
  },
];

function SidebarContent({ collapsed = false, onNavigate }) {
  const pathname = usePathname();
  const { hasPermission, hasRole, user, roles, isSuperAdmin } = useAuth();

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.role && !hasRole(item.role)) return false;
    if (item.permission && !hasPermission(item.permission)) return false;
    return true;
  });

  return (
    <div className="d-flex flex-column h-100">
      <div className="dt-sidebar-brand">
        <div className="dt-brand-icon">
          <i className="bi bi-hospital" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="fw-bold text-white lh-sm text-truncate">
              Doctor Tracker
            </div>
            <small className="text-info-emphasis" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              Clinical &amp; RBAC Portal
            </small>
          </div>
        )}
      </div>

      <div className="py-3 flex-grow-1 overflow-y-auto">
        {!collapsed && (
          <div
            className="px-4 pb-2 text-uppercase fw-semibold"
            style={{ fontSize: '0.68rem', letterSpacing: '0.08em', color: '#64748b' }}
          >
            Navigation
          </div>
        )}
        <nav className="nav flex-column">
          {visibleItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                className={`dt-nav-link ${isActive ? 'active' : ''}`}
              >
                <i className={`bi ${item.icon}`} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {!collapsed && user && (
        <div
          className="p-3 m-3 rounded-3"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="d-flex align-items-center gap-2 mb-1">
            <i className="bi bi-shield-check text-info" />
            <span className="small fw-semibold text-white text-truncate">
              {isSuperAdmin ? 'Super Admin Access' : roles?.[0]?.name || 'Member'}
            </span>
          </div>
          <div className="small text-truncate" style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
            {user.email}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ collapsed, mobileOpen, onCloseMobile }) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`dt-sidebar dt-sidebar-desktop ${
          collapsed ? 'collapsed' : ''
        }`}
      >
        <SidebarContent collapsed={collapsed} />
      </aside>

      {/* Mobile Offcanvas Drawer */}
      {mobileOpen && (
        <>
          <div
            className="offcanvas offcanvas-start show text-bg-dark border-0"
            style={{
              width: 264,
              background: 'linear-gradient(180deg, #0f2438 0%, #091726 100%)',
              visibility: 'visible',
            }}
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
          >
            <div className="position-relative h-100">
              <button
                type="button"
                className="btn-close btn-close-white position-absolute top-0 end-0 m-3"
                style={{ zIndex: 10 }}
                aria-label="Close navigation"
                onClick={onCloseMobile}
              />
              <SidebarContent collapsed={false} onNavigate={onCloseMobile} />
            </div>
          </div>
          <div
            className="offcanvas-backdrop fade show"
            onClick={onCloseMobile}
          />
        </>
      )}
    </>
  );
}
