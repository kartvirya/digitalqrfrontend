import React from 'react';
import MainLayout from './MainLayout';
import MobileBottomNav from './MobileBottomNav';
import { useRestaurant } from '../context/RestaurantContext';

interface RoleLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout for customer-facing pages (menu, cart, bills, order tracking).
 * This is a lightweight, mobile-first layout without the admin sidebar.
 */
export const CustomerLayout: React.FC<RoleLayoutProps> = ({ children }) => {
  const { restaurant } = useRestaurant();

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      {/* Simple top bar */}
      <header className="sticky top-0 z-10 bg-gray-900/95 border-b border-gray-800 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <div>
              <p className="text-white text-sm font-semibold">
                {restaurant?.name || 'Restaurant'}
              </p>
              {restaurant?.slug && (
                <p className="text-gray-400 text-xs">
                  Tap items to add to cart. Use bottom bar to view cart, orders and bill.
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-0 sm:px-2 pt-2 pb-16">
        {children}
      </main>

      {/* Mobile bottom navigation for customers/admins */}
      <MobileBottomNav />
    </div>
  );
};

/**
 * Layout for restaurant admins (and features where admins work).
 * This is a thin wrapper around MainLayout for now, but it gives us
 * a clear separation point if we want a different header/sidebar later.
 */
export const AdminLayout: React.FC<RoleLayoutProps> = ({ children }) => {
  return <MainLayout>{children}</MainLayout>;
};

/**
 * Layout for HR managers.
 */
export const HRLayout: React.FC<RoleLayoutProps> = ({ children }) => {
  return <MainLayout>{children}</MainLayout>;
};

/**
 * Layout for staff users.
 */
export const StaffLayout: React.FC<RoleLayoutProps> = ({ children }) => {
  return <MainLayout>{children}</MainLayout>;
};

/**
 * Layout for super admin area.
 */
export const SuperAdminLayout: React.FC<RoleLayoutProps> = ({ children }) => {
  return <MainLayout>{children}</MainLayout>;
};


