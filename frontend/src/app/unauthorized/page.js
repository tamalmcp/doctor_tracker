'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function UnauthorizedPage() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-3">
      <div className="dt-card p-4 p-md-5 text-center" style={{ maxWidth: 480 }}>
        <div
          className="d-inline-flex align-items-center justify-content-center rounded-circle bg-danger bg-opacity-10 text-danger mb-3"
          style={{ width: 72, height: 72 }}
        >
          <i className="bi bi-shield-exclamation fs-1" />
        </div>
        <h1 className="h3 fw-bold text-dark mb-2">Access Restricted (403)</h1>
        <p className="text-secondary mb-4">
          Your current roles do not include permission to view this module.
          Contact your Super Admin if you believe this is an error.
        </p>
        <div className="d-flex justify-content-center gap-2 flex-wrap">
          <Link href="/" className="btn btn-teal">
            <i className="bi bi-house-door me-2" />
            Go Home
          </Link>
          {isAuthenticated && (
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={logout}
            >
              <i className="bi bi-box-arrow-right me-2" />
              Switch Account
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
