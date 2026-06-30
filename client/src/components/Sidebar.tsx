import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  FileText,
  CheckSquare,
  DollarSign,
  ShoppingCart,
  BarChart3,
  Bell,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { cn } from '../utils/cn';

const navItems = [
  {
    path: '/admin',
    icon: LayoutDashboard,
    label: 'Dashboard',
    roles: ['ADMIN'],
  },
  {
    path: '/procurement',
    icon: FileText,
    label: 'RFQs',
    roles: ['ADMIN', 'PROCUREMENT_OFFICER'],
  },
  {
    path: '/vendors',
    icon: Users,
    label: 'Vendors',
    roles: ['ADMIN', 'PROCUREMENT_OFFICER'],
  },
  {
    path: '/manager',
    icon: CheckSquare,
    label: 'Approvals',
    roles: ['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER'],
  },
  {
    path: '/finance',
    icon: DollarSign,
    label: 'Finance',
    roles: ['ADMIN', 'FINANCE', 'PROCUREMENT_OFFICER'],
  },
  {
    path: '/vendor',
    icon: ShoppingCart,
    label: 'Vendor Portal',
    roles: ['ADMIN', 'VENDOR'],
  },
  {
    path: '/reports',
    icon: BarChart3,
    label: 'Reports',
    roles: ['ADMIN', 'PROCUREMENT_OFFICER', 'FINANCE'],
  },
  {
    path: '/audit-trail',
    icon: Bell,
    label: 'Audit Trail',
    roles: ['ADMIN', 'FINANCE', 'MANAGER', 'PROCUREMENT_OFFICER'],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user?.role || '')
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-64 border-r border-border bg-bg-surface transition-transform duration-300 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between border-b border-border p-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
                <ShoppingCart size={20} className="text-white" />
              </div>
              <span className="text-lg font-semibold text-text-primary">VendorBridge</span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden"
            >
              <X size={20} className="text-text-secondary" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => onClose()}
                  className={({ isActive: active }) =>
                    cn(
                      'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-accent/10 text-accent'
                        : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                    )
                  }
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-nav"
                      className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-accent"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-border p-4">
            <div className="flex items-center gap-3 rounded-lg bg-bg-elevated p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-accent">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-text-primary">
                  {user?.name}
                </p>
                <p className="truncate text-xs text-text-secondary">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
              <button
                onClick={logout}
                className="rounded-input p-2 text-text-secondary hover:bg-border hover:text-text-primary"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
