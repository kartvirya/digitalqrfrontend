import React, { useState } from 'react';
import { 
  Bars3Icon, 
  UserIcon, 
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
  UserPlusIcon,
  SignalIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import RestaurantSelector from './RestaurantSelector';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import MobileBottomNav from './MobileBottomNav';

interface Props {
  children: React.ReactNode;
}

const MainLayout: React.FC<Props> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-900">
      {/* Sidebar - Fixed position */}
      <Sidebar mobileOpen={mobileOpen} onDrawerToggle={handleDrawerToggle} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-72">
        {/* Header - Fixed at top */}
        <header 
          className="fixed top-0 right-0 left-0 md:left-72 bg-gray-800 border-b border-gray-700/50 backdrop-blur-sm z-10"
          style={{ zIndex: 10 }}
        >
          <div className="flex items-center justify-between px-4 py-3">
            {/* Restaurant Selector for Admins */}
            {(user?.is_super_admin || user?.is_superuser || user?.cafe_manager) && (
              <div className="flex items-center mr-4">
                <RestaurantSelector />
              </div>
            )}
            {/* Mobile Menu Button */}
            <button
              onClick={handleDrawerToggle}
              className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>

            {/* Spacer for mobile */}
            <div className="md:hidden flex-1" />

            {/* User / Status Section */}
            <div className="flex items-center gap-3">
              {/* Socket.IO Connection Status */}
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                isConnected 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                <SignalIcon className={`w-3 h-3 ${isConnected ? 'text-green-400' : 'text-red-400'}`} />
                <span className="hidden sm:inline">
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>
              {user ? (
                <>
                  {/* User Info */}
                  <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-700/50 border border-gray-600/50">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <UserIcon className="w-4 h-4 text-white" />
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-sm font-semibold text-white truncate">
                        {user.username}
                      </p>
                      <p className="text-xs text-gray-400">
                        {user.is_super_admin ? 'Super Admin' : user.is_superuser ? 'Administrator' : user.cafe_manager ? 'Manager' : 'Customer'}
                      </p>
                    </div>
                  </div>

                  {/* Sign Out Button */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 rounded-lg hover:bg-red-600/20 hover:text-red-400 transition-all duration-200 border border-gray-600/50 hover:border-red-500/50"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Sign out</span>
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </header>

        {/* Page Content - With top margin for header and bottom padding for mobile nav */}
        <main className="flex-1 pt-16 pb-16 md:pb-4">
          {children}
        </main>

        {/* Mobile bottom navigation */}
        <MobileBottomNav />
      </div>
    </div>
  );
};

export default MainLayout;

