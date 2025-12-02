import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import {
  UserGroupIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ArrowLeftOnRectangleIcon,
  UserIcon,
  BriefcaseIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import HRManagement from './HRManagement';
import EmployeeManagement from './EmployeeManagement';
import PayrollManagement from './PayrollManagement';
import LeaveManagement from './LeaveManagement';
import TrainingManagement from './TrainingManagement';
import PerformanceManagement from './PerformanceManagement';

interface HRUser {
  id: number;
  phone: string;
  is_superuser: boolean;
  cafe_manager: boolean;
  staff_profile?: any;
}

const HRDashboard: React.FC = () => {
  const { user } = useAuth();
  const { isHRManager, isRestaurantAdmin } = usePermissions();
  const [hrUser, setHrUser] = useState<HRUser | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if user is HR manager or restaurant admin
    if (user) {
      if (isHRManager() || isRestaurantAdmin()) {
        setHrUser({
          id: user.id,
          phone: user.phone || '',
          cafe_manager: user.cafe_manager || false,
          staff_profile: (user as any).staff_profile,
        });
      } else {
        // If not HR manager and not restaurant admin, check for legacy HR session
        const hrSession = localStorage.getItem('hr_session');
        const hrUserData = localStorage.getItem('hr_user');
        
        if (hrSession && hrUserData) {
          try {
            const legacyUser = JSON.parse(hrUserData);
            setHrUser(legacyUser);
          } catch (error) {
            localStorage.removeItem('hr_session');
            localStorage.removeItem('hr_user');
            navigate('/hr-login');
          }
        } else {
          navigate('/hr-login');
        }
      }
    } else {
      // No user logged in, check for legacy HR session
      const hrSession = localStorage.getItem('hr_session');
      const hrUserData = localStorage.getItem('hr_user');
      
      if (!hrSession || !hrUserData) {
        navigate('/hr-login');
        return;
      }

      try {
        const legacyUser = JSON.parse(hrUserData);
        setHrUser(legacyUser);
      } catch (error) {
        localStorage.removeItem('hr_session');
        localStorage.removeItem('hr_user');
        navigate('/hr-login');
      }
    }
  }, [user, isHRManager, isRestaurantAdmin, navigate]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('hr_session');
    localStorage.removeItem('hr_user');
    navigate('/hr-login');
  };

  const handleBackToMain = () => {
    navigate('/');
  };

  const tabButtons = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'employees', label: 'Employees', icon: UserGroupIcon },
    { id: 'payroll', label: 'Payroll', icon: CurrencyDollarIcon },
    { id: 'leaves', label: 'Leave Management', icon: CalendarDaysIcon },
    { id: 'training', label: 'Training', icon: AcademicCapIcon },
    { id: 'performance', label: 'Performance', icon: DocumentTextIcon },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <HRManagement showTabs={false} />;
      case 'employees':
        return <EmployeeManagement />;
      case 'payroll':
        return <PayrollManagement />;
      case 'leaves':
        return <LeaveManagement />;
      case 'training':
        return <TrainingManagement />;
      case 'performance':
        return <PerformanceManagement />;
      default:
        return <HRManagement showTabs={false} />;
    }
  };

  if (!hrUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading HR Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      {/* Sidebar - Fixed position */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-gray-800 to-gray-900 border-r border-gray-700/50 transform transition-transform duration-300 ease-in-out ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <BriefcaseIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-white font-semibold">HR Portal</span>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={handleDrawerToggle}
              className="md:hidden p-1 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
            {tabButtons.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileOpen(false); // Close mobile sidebar when tab is clicked
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-6 border-t border-gray-700/50">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-700/50">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {hrUser.is_superuser ? 'Super Admin' : hrUser.cafe_manager ? 'Manager' : 'Staff'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {hrUser.phone}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area - Properly spaced for sidebar */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64">
        {/* Header - Fixed at top */}
        <header className="fixed top-0 right-0 left-0 md:left-64 bg-gray-800 border-b border-gray-700/50 backdrop-blur-sm z-10">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Mobile Menu Button */}
            <button
              onClick={handleDrawerToggle}
              className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>

            {/* Spacer for mobile */}
            <div className="md:hidden flex-1" />

            {/* Logo and Title - Hidden on mobile, shown on desktop */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <BriefcaseIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">HR Management System</h1>
                <p className="text-gray-400 text-xs">Restaurant HR Portal</p>
              </div>
            </div>

            {/* User Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToMain}
                className="px-3 py-2 text-gray-300 hover:text-white transition-colors text-sm hidden sm:block"
              >
                ← Back to Restaurant
              </button>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 hover:bg-red-500/30 transition-colors"
              >
                <ArrowLeftOnRectangleIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 pt-16">
          <div className="p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              {/* Page Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {tabButtons.find(tab => tab.id === activeTab)?.label}
                </h2>
                <p className="text-gray-400">
                  Manage your organization's human resources
                </p>
              </div>

              {/* Tab Content */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-4 md:p-6 backdrop-blur-sm shadow-xl">
                {renderTabContent()}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={handleDrawerToggle}
        />
      )}
    </div>
  );
};

export default HRDashboard;
