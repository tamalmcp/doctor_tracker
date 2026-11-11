'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function HomePage() {
  const router = useRouter();
  const { initialized, isAuthenticated, hasPermission } = useAuth();

  useEffect(() => {
    if (!initialized) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (hasPermission('dashboard.view')) {
      router.replace('/dashboard');
    } else if (hasPermission('doctors.view')) {
      router.replace('/doctors');
    } else if (hasPermission('patients.view')) {
      router.replace('/patients');
    } else if (hasPermission('users.view')) {
      router.replace('/users');
    } else {
      router.replace('/unauthorized');
    }
  }, [initialized, isAuthenticated, hasPermission, router]);

  return <LoadingSpinner fullPage text="Loading Doctor Tracker..." />;
}
