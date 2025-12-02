import React from 'react';
import {
  HomeIcon,
  Squares2X2Icon,
  ClipboardDocumentListIcon,
  ShoppingCartIcon,
  UserCircleIcon,
  ChartBarIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';

interface BottomItem {
  label: string;
  icon: React.ReactNode;
  path: string;
}

const MobileBottomNav: React.FC = () => {
  const { user, hasRole } = usePermissions();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  // Role detection (same idea as Sidebar)
  const isSuperAdmin =
    !!user && (hasRole('super_admin') || user.is_super_admin || user.is_superuser);
  const isRestaurantAdminOnly =
    !!user && !isSuperAdmin && (hasRole('restaurant_admin') || user.cafe_manager);
  const isHRManagerOnly =
    !!user && !isSuperAdmin && !isRestaurantAdminOnly && hasRole('hr_manager');
  const isStaffOnly =
    !!user && !isSuperAdmin && !isRestaurantAdminOnly && !isHRManagerOnly && hasRole('staff');
  const isCustomerRole =
    !!user &&
    !isSuperAdmin &&
    !isRestaurantAdminOnly &&
    !isHRManagerOnly &&
    !isStaffOnly &&
    (hasRole('customer') || !user.role);
  const isAnonymousCustomer = !user;

  let items: BottomItem[] = [];

  if (isSuperAdmin) {
    items = [
      { label: 'Dashboard', icon: <ChartBarIcon className="w-5 h-5" />, path: '/super-admin' },
      { label: 'Restaurants', icon: <BuildingStorefrontIcon className="w-5 h-5" />, path: '/manage-restaurants' },
      { label: 'Roles', icon: <Squares2X2Icon className="w-5 h-5" />, path: '/role-management' },
      { label: 'Account', icon: <UserCircleIcon className="w-5 h-5" />, path: '/profile' },
    ];
  } else if (isRestaurantAdminOnly) {
    items = [
      { label: 'Dashboard', icon: <HomeIcon className="w-5 h-5" />, path: '/dashboard' },
      { label: 'Orders', icon: <ClipboardDocumentListIcon className="w-5 h-5" />, path: '/manage-orders' },
      { label: 'Menu', icon: <Squares2X2Icon className="w-5 h-5" />, path: '/manage-menu' },
      { label: 'Account', icon: <UserCircleIcon className="w-5 h-5" />, path: '/profile' },
    ];
  } else if (isHRManagerOnly) {
    items = [
      { label: 'HR', icon: <ChartBarIcon className="w-5 h-5" />, path: '/hr-management' },
      { label: 'Employees', icon: <Squares2X2Icon className="w-5 h-5" />, path: '/employee-management' },
      { label: 'Payroll', icon: <ClipboardDocumentListIcon className="w-5 h-5" />, path: '/payroll-management' },
      { label: 'Account', icon: <UserCircleIcon className="w-5 h-5" />, path: '/profile' },
    ];
  } else if (isStaffOnly) {
    items = [
      { label: 'Staff', icon: <Squares2X2Icon className="w-5 h-5" />, path: '/staff-portal' },
      { label: 'Orders', icon: <ClipboardDocumentListIcon className="w-5 h-5" />, path: '/manage-orders' },
      { label: 'Account', icon: <UserCircleIcon className="w-5 h-5" />, path: '/profile' },
    ];
  } else if (isCustomerRole || isAnonymousCustomer) {
    items = [
      { label: 'Menu', icon: <HomeIcon className="w-5 h-5" />, path: '/' },
      { label: 'Cart', icon: <ShoppingCartIcon className="w-5 h-5" />, path: '/cart' },
      { label: 'Orders', icon: <ClipboardDocumentListIcon className="w-5 h-5" />, path: '/my-orders' },
      { label: 'Bill', icon: <ClipboardDocumentListIcon className="w-5 h-5" />, path: '/bills' },
    ];
  }

  if (!items.length) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 flex md:hidden bg-gray-900/95 border-t border-gray-700/60 backdrop-blur-sm">
      {items.map((item) => (
        <button
          key={item.label}
          onClick={() => navigate(item.path)}
          className={`flex-1 flex flex-col items-center justify-center py-2 text-xs font-medium ${
            isActive(item.path)
              ? 'text-purple-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <div
            className={`flex items-center justify-center w-9 h-9 rounded-full mb-1 ${
              isActive(item.path)
                ? 'bg-purple-500/20 border border-purple-500/60'
                : 'bg-gray-800/60 border border-gray-700/60'
            }`}
          >
            {item.icon}
          </div>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default MobileBottomNav;


