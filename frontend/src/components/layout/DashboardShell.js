'use client';

import { useState } from 'react';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

export default function DashboardShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarCollapsed = useSelector((state) => state.ui.sidebarCollapsed);

  return (
    <div className="dt-shell">
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="dt-main">
        <TopNavbar onOpenMobileSidebar={() => setMobileOpen(true)} />
        <main className="p-3 p-md-4 flex-grow-1">{children}</main>
      </div>
    </div>
  );
}
