'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardShell from '@/components/layout/DashboardShell';

export default function DashboardLayout({ children }) {
  return (
    <ProtectedRoute>
      <DashboardShell>{children}</DashboardShell>
    </ProtectedRoute>
  );
}
