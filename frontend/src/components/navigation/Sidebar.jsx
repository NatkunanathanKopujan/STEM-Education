import { useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FiChevronDown, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { BrandLogo } from '../BrandLogo';
import { sidebarNavigation } from '../../utils/navigation';
import { useAuth } from '../../hooks/useAuth';

function SidebarItem({ item, collapsed, onNavigate }) {
  const location = useLocation();
  const { logout } = useAuth();
  const [open, setOpen] = useState(() =>
    item.children?.some((child) => location.pathname.startsWith(child.path)),
  );
  const Icon = item.icon;
  const hasChildren = Boolean(item.children?.length);
  const active = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);

  if (hasChildren) {
    return (
      <div>
        <button
          type="button"
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
            active ? 'bg-orange-50 text-primary' : 'text-muted hover:bg-orange-50 hover:text-primary'
          }`}
          onClick={() => setOpen((value) => !value)}
        >
          {Icon ? <Icon className="size-5 shrink-0" /> : null}
          {!collapsed ? <span className="min-w-0 flex-1 text-left">{item.label}</span> : null}
          {!collapsed ? <FiChevronDown className={`size-4 transition ${open ? 'rotate-180' : ''}`} /> : null}
        </button>
        {!collapsed && open ? (
          <div className="ml-8 mt-1 space-y-1 border-l border-line pl-3">
            {item.children.map((child) => (
              <NavLink
                key={`${child.path}:${child.label}`}
                to={child.path}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-orange-50 text-primary' : 'text-muted hover:bg-orange-50 hover:text-primary'
                  }`
                }
              >
                {child.label}
              </NavLink>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  if (item.action === 'logout') {
    return (
      <button
        type="button"
        onClick={() => {
          logout();
          onNavigate?.();
        }}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted transition hover:bg-orange-50 hover:text-primary"
      >
        {Icon ? <Icon className="size-5 shrink-0" /> : null}
        {!collapsed ? <span className="truncate">{item.label}</span> : null}
      </button>
    );
  }

  return (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
          isActive ? 'bg-orange-50 text-primary' : 'text-muted hover:bg-orange-50 hover:text-primary'
        }`
      }
    >
      {Icon ? <Icon className="size-5 shrink-0" /> : null}
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
    </NavLink>
  );
}

export function Sidebar({ role, collapsed, onToggle, onNavigate, className = '' }) {
  const items = useMemo(() => sidebarNavigation[role] || [], [role]);

  return (
    <aside
      className={`flex h-full flex-col border-r border-line bg-white transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-72'
      } ${className}`}
    >
      <div className="flex h-20 items-center justify-between border-b border-line px-4">
        {!collapsed ? <BrandLogo /> : <BrandLogo compact />}
        <button
          type="button"
          className="focus-ring hidden rounded-lg p-2 text-muted hover:bg-orange-50 hover:text-primary lg:inline-flex"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <FiChevronRight className="size-5" /> : <FiChevronLeft className="size-5" />}
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => (
          <SidebarItem key={`${item.path}:${item.label}`} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </nav>
    </aside>
  );
}
