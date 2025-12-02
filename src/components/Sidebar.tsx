import React, { useState } from 'react';
import {
  HomeIcon,
  BuildingOfficeIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
  Squares2X2Icon,
  ClipboardDocumentListIcon,
  UserCircleIcon,
  ClockIcon,
  ArrowRightOnRectangleIcon,
  ChatBubbleLeftRightIcon,
  ShoppingCartIcon,
  UserIcon,
  ArrowLeftOnRectangleIcon,
  UserPlusIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  XMarkIcon,
  ChevronDownIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';

const drawerWidth = 280;

interface MenuItemConfig {
  label: string;
  icon: React.ReactNode;
  path: string;
}

interface SidebarProps {
  mobileOpen: boolean;
  onDrawerToggle: () => void;
}

const mainNavigationItems: MenuItemConfig[] = [
  { label: 'Overview', icon: <ArrowPathIcon className="w-5 h-5" />, path: '/dashboard' },
];

const customerItems: MenuItemConfig[] = [
  { label: 'Menu', icon: <HomeIcon className="w-5 h-5" />, path: '/' },
  { label: 'Reviews', icon: <ChatBubbleLeftRightIcon className="w-5 h-5" />, path: '/reviews' },
  { label: 'Cart', icon: <ShoppingCartIcon className="w-5 h-5" />, path: '/cart' },
];

const superAdminItems: MenuItemConfig[] = [
  { label: 'Super Admin Dashboard', icon: <ChartBarIcon className="w-5 h-5" />, path: '/super-admin' },
  { label: 'Restaurant Management', icon: <BuildingStorefrontIcon className="w-5 h-5" />, path: '/manage-restaurants' },
  { label: 'Role Management', icon: <UserGroupIcon className="w-5 h-5" />, path: '/role-management' },
];

const adminItems: MenuItemConfig[] = [
  { label: 'Tables', icon: <Squares2X2Icon className="w-5 h-5" />, path: '/manage-tables' },
  { label: 'Rooms', icon: <BuildingOfficeIcon className="w-5 h-5" />, path: '/manage-rooms' },
  { label: 'Floors', icon: <BuildingStorefrontIcon className="w-5 h-5" />, path: '/manage-floors' },
  { label: 'Menu Management', icon: <ClipboardDocumentListIcon className="w-5 h-5" />, path: '/manage-menu' },
  { label: 'Orders', icon: <ClipboardDocumentListIcon className="w-5 h-5" />, path: '/manage-orders' },
];

const hrItems: MenuItemConfig[] = [
  { label: 'HR Overview', icon: <ChartBarIcon className="w-5 h-5" />, path: '/hr-management' },
  { label: 'Employees', icon: <UserGroupIcon className="w-5 h-5" />, path: '/employee-management' },
  { label: 'Payroll', icon: <CurrencyDollarIcon className="w-5 h-5" />, path: '/payroll-management' },
  { label: 'Attendance', icon: <CalendarDaysIcon className="w-5 h-5" />, path: '/attendance-management' },
  { label: 'Leaves', icon: <CalendarDaysIcon className="w-5 h-5" />, path: '/leave-management' },
  { label: 'Training', icon: <AcademicCapIcon className="w-5 h-5" />, path: '/training-management' },
  { label: 'Performance', icon: <ChartBarIcon className="w-5 h-5" />, path: '/performance-management' },
];

const hrSetupItem: MenuItemConfig[] = [
  { label: 'HR Setup', icon: <UserPlusIcon className="w-5 h-5" />, path: '/hr-setup' },
];

const staffItems: MenuItemConfig[] = [
  { label: 'Staff Portal', icon: <Squares2X2Icon className="w-5 h-5" />, path: '/staff-portal' },
];

const userItems: MenuItemConfig[] = [
  { label: 'Profile', icon: <UserCircleIcon className="w-5 h-5" />, path: '/profile' },
  { label: 'My Orders', icon: <ClockIcon className="w-5 h-5" />, path: '/my-orders' },
  { label: 'Table Orders', icon: <ClipboardDocumentListIcon className="w-5 h-5" />, path: '/table-orders' },
  { label: 'Bills', icon: <DocumentTextIcon className="w-5 h-5" />, path: '/bills' },
];

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onDrawerToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasRole } = usePermissions();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['main', 'customer']));

  const isActive = (path: string) => location.pathname === path;

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const SectionHeader = ({ title, section }: { title: string; section: string }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between py-3 px-4 text-left hover:bg-gray-700/50 rounded-lg transition-colors duration-200 group"
    >
      <span className="text-gray-300 text-sm font-semibold uppercase tracking-wider">
        {title}
      </span>
      <ChevronDownIcon 
        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
          expandedSections.has(section) ? 'rotate-180' : ''
        }`} 
      />
    </button>
  );

  const MenuItem = ({ item }: { item: MenuItemConfig }) => (
    <button
      onClick={() => navigate(item.path)}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-lg transition-all duration-200 group ${
        isActive(item.path)
          ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
          : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
      }`}
    >
      <div className={`transition-colors duration-200 ${
        isActive(item.path) ? 'text-white' : 'text-gray-400 group-hover:text-white'
      }`}>
        {item.icon}
      </div>
      <span className="font-medium">{item.label}</span>
    </button>
  );

  // Determine primary role for sidebar behavior
  const isSuperAdmin =
    !!user && (hasRole('super_admin') || user.is_super_admin || user.is_superuser);
  const isRestaurantAdminOnly =
    !!user && !isSuperAdmin && (hasRole('restaurant_admin') || user.cafe_manager);
  const isHRManagerOnly =
    !!user && !isSuperAdmin && !isRestaurantAdminOnly && hasRole('hr_manager');
  const isStaffOnly =
    !!user && !isSuperAdmin && !isRestaurantAdminOnly && !isHRManagerOnly && hasRole('staff');
  const isCustomerOnly =
    !!user &&
    !isSuperAdmin &&
    !isRestaurantAdminOnly &&
    !isHRManagerOnly &&
    !isStaffOnly &&
    (hasRole('customer') || !user.role);

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onDrawerToggle}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`
          fixed top-0 left-0 h-full w-72 bg-gradient-to-b from-gray-800 to-gray-900 border-r border-gray-700/50 z-50 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl overflow-hidden
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:fixed md:z-50
        `}
        style={{ zIndex: 9999 }}
      >
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50 bg-gray-800/50 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Restaurant</h1>
              <p className="text-gray-400 text-xs">Management System</p>
            </div>
          </div>
        </div>

        {/* Navigation - Scrollable */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
          {/* Main Navigation */}
          <div>
            <SectionHeader title="Main" section="main" />
            {expandedSections.has('main') && (
              <div className="mt-3 space-y-1">
                {mainNavigationItems.map((item) => (
                  <MenuItem key={item.label} item={item} />
                ))}
              </div>
            )}
          </div>

          {/* Customer Section - Only for pure customers */}
          {isCustomerOnly && (
            <div>
              <SectionHeader title="Browse" section="customer" />
              {expandedSections.has('customer') && (
                <div className="mt-3 space-y-1">
                  {customerItems.map((item) => (
                    <MenuItem key={item.label} item={item} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Super Admin Section - Only for super admins */}
          {isSuperAdmin && (
            <div>
              <SectionHeader title="Super Admin" section="superadmin" />
              {expandedSections.has('superadmin') && (
                <div className="mt-3 space-y-1">
                  {superAdminItems.map((item) => (
                    <MenuItem key={item.label} item={item} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Management Section - For Restaurant Admins */}
          {isRestaurantAdminOnly && (
            <div>
              <SectionHeader title="Management" section="admin" />
              {expandedSections.has('admin') && (
                <div className="mt-3 space-y-1">
                  {adminItems.map((item) => (
                    <MenuItem key={item.label} item={item} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* HR Section - For HR Managers and Restaurant Admins */}
          {(isRestaurantAdminOnly || isHRManagerOnly) && (
            <div>
              <SectionHeader title="Human Resources" section="hr" />
              {expandedSections.has('hr') && (
                <div className="mt-3 space-y-1">
                  {hrItems.map((item) => (
                    <MenuItem key={item.label} item={item} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* HR Setup - For Restaurant Admins who haven't set up HR yet */}
          {isRestaurantAdminOnly && !isHRManagerOnly && (
            <div>
              <SectionHeader title="HR Setup" section="hr-setup" />
              {expandedSections.has('hr-setup') && (
                <div className="mt-3 space-y-1">
                  {hrSetupItem.map((item) => (
                    <MenuItem key={item.label} item={item} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Staff Section - For Staff members */}
          {isStaffOnly && (
            <div>
              <SectionHeader title="Staff" section="staff" />
              {expandedSections.has('staff') && (
                <div className="mt-3 space-y-1">
                  {staffItems.map((item) => (
                    <MenuItem key={item.label} item={item} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* User Section */}
          {user && (
            <div>
              <SectionHeader title="Account" section="user" />
              {expandedSections.has('user') && (
                <div className="mt-3 space-y-1">
                  {userItems.map((item) => (
                    <MenuItem key={item.label} item={item} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;