import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Breadcrumb } from '../components/navigation/Breadcrumb';
import { Footer } from '../components/navigation/Footer';
import { MobileSidebar } from '../components/navigation/MobileSidebar';
import { Navbar } from '../components/navigation/Navbar';
import { Sidebar } from '../components/navigation/Sidebar';
import { useAuth } from '../hooks/useAuth';

export function DashboardLayout() {
  const { logout, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-page text-ink">
      <div className="flex min-h-screen">
        <Sidebar
          role={user?.role}
          collapsed={collapsed}
          onToggle={() => setCollapsed((value) => !value)}
          className="sticky top-0 hidden h-screen lg:flex"
        />
        <MobileSidebar open={mobileOpen} role={user?.role} onClose={() => setMobileOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar user={user} onMenuClick={() => setMobileOpen(true)} onLogout={() => logout()} />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-6">
              <Breadcrumb />
            </div>
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
