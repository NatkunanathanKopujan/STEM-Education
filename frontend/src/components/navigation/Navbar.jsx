import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiBell, FiLogOut, FiMenu, FiMoon, FiSun, FiUser } from 'react-icons/fi';
import { Button } from '../ui/Button';
import { Dropdown } from '../ui/Dropdown';
import { GlobalSearchBox } from '../search/GlobalSearchBox';
import { NotificationPanel } from '../notifications/NotificationPanel';
import { ROLE_LABELS } from '../../utils/constants';
import { useTheme } from '../../hooks/useTheme';

const formatTitle = (pathname) => {
  const segment = pathname.split('/').filter(Boolean).pop() || 'Dashboard';
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export function Navbar({ user, onMenuClick, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const pageTitle = useMemo(() => formatTitle(location.pathname), [location.pathname]);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 shadow-sm backdrop-blur">
      <div className="flex h-[72px] min-h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="focus-ring rounded-lg p-2 text-muted hover:bg-slate-100 hover:text-primary lg:hidden"
            onClick={onMenuClick}
            aria-label="Open sidebar"
          >
            <FiMenu className="size-5" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-ink">{pageTitle}</h1>
            <p className="hidden text-xs font-semibold uppercase tracking-wide text-muted sm:block">
              {ROLE_LABELS[user?.role] || 'LMS User'}
            </p>
          </div>
        </div>

        <div className="hidden w-full max-w-md md:block">
          <GlobalSearchBox />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="px-3"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggleTheme}
          >
            {isDark ? <FiSun className="size-5" /> : <FiMoon className="size-5" />}
          </Button>
          <Button
            variant="ghost"
            className="px-3"
            aria-label="Notifications"
            onClick={() => setNotificationsOpen((value) => !value)}
          >
            <FiBell className="size-5" />
          </Button>
          <Dropdown
            label={
              <span className="inline-flex items-center gap-2">
                <FiUser className="size-4" />
                <span className="hidden sm:inline">{user?.name || 'Profile'}</span>
              </span>
            }
            items={[
              { label: 'Profile', onClick: () => navigate('/profile') },
              { label: 'Settings', onClick: () => navigate('/settings') },
              { label: 'Notification Preferences', onClick: () => navigate('/notification-preferences') },
            ]}
          />
          <Button variant="secondary" className="px-3" onClick={onLogout} aria-label="Logout">
            <FiLogOut className="size-5" />
          </Button>
        </div>
      </div>
      <div className="border-t border-line px-4 py-3 md:hidden">
        <GlobalSearchBox />
      </div>
      <NotificationPanel open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </header>
  );
}
