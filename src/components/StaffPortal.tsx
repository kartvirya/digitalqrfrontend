import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserIcon,
  ClockIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ArrowRightOnRectangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  Bars3Icon,
  ArrowPathIcon,
  CalendarIcon,
  DocumentIcon,
  BanknotesIcon,
  ChartBarIcon,
  AcademicCapIcon,
  DocumentCheckIcon,
  TableCellsIcon,
  ClipboardDocumentListIcon,
  FireIcon,
  BellIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import apiService from '../services/api';
import WaiterCall from './WaiterCall';
import SocketDebug from './SocketDebug';
import { Staff, Attendance, Leave } from '../types';

// Dashboard Attendance Section Component
const DashboardAttendanceSection: React.FC<{ staff: Staff | null }> = ({ staff }) => {
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTodayAttendance = async () => {
      if (!staff?.id) return;
      
      try {
        const attendanceData = await apiService.getStaffAttendance(staff.id);
        const today = new Date().toISOString().split('T')[0];
        const todayRecord = attendanceData.find((record: any) => record.date === today);
        setTodayAttendance(todayRecord || null);
      } catch (error) {
        console.error('Error fetching today attendance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTodayAttendance();
  }, [staff?.id]);

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-400 mt-2 text-sm">Loading attendance...</p>
      </div>
    );
  }

  const getStatusColor = () => {
    if (!todayAttendance) return 'text-gray-400';
    if (todayAttendance.check_out_time) return 'text-red-400';
    if (todayAttendance.check_in_time) return 'text-green-400';
    return 'text-yellow-400';
  };

  const getStatusText = () => {
    if (!todayAttendance) return 'Not Checked In';
    if (todayAttendance.check_out_time) return 'Checked Out';
    if (todayAttendance.check_in_time) return 'Present';
    return 'Unknown';
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A';
    try {
      const today = new Date();
      const time = new Date(`${today.toISOString().split('T')[0]}T${timeString}`);
      return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return timeString;
    }
  };

  const calculateHours = () => {
    if (!todayAttendance?.check_in_time || !todayAttendance?.check_out_time) return 'N/A';
    try {
      const today = new Date();
      const checkIn = new Date(`${today.toISOString().split('T')[0]}T${todayAttendance.check_in_time}`);
      const checkOut = new Date(`${today.toISOString().split('T')[0]}T${todayAttendance.check_out_time}`);
      const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
      return `${hours.toFixed(1)}h`;
    } catch (error) {
      return 'N/A';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-gray-700/30 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Status</p>
            <p className={`text-lg font-bold ${getStatusColor()}`}>{getStatusText()}</p>
          </div>
          <CheckCircleIcon className="h-6 w-6 text-green-400" />
        </div>
      </div>
      
      <div className="bg-gray-700/30 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Check In</p>
            <p className="text-lg font-bold text-white">{formatTime(todayAttendance?.check_in_time)}</p>
          </div>
          <ClockIcon className="h-6 w-6 text-blue-400" />
        </div>
      </div>
      
      <div className="bg-gray-700/30 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Check Out</p>
            <p className="text-lg font-bold text-white">{formatTime(todayAttendance?.check_out_time)}</p>
          </div>
          <XCircleIcon className="h-6 w-6 text-red-400" />
        </div>
      </div>
      
      <div className="bg-gray-700/30 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Hours Today</p>
            <p className="text-lg font-bold text-white">{calculateHours()}</p>
          </div>
          <CalendarDaysIcon className="h-6 w-6 text-purple-400" />
        </div>
      </div>
    </div>
  );
};

const StaffPortal: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [attendanceRefreshKey, setAttendanceRefreshKey] = useState(0);
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({ phone: '', password: '' });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const user = await apiService.getCurrentUser();
      if (user && user.staff_profile) {
        setStaff(user.staff_profile);
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.log('Not logged in as staff');
    }
  };

  const handleLogin = async () => {
    if (!loginData.phone || !loginData.password) {
      setError('Please enter phone and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiService.staffLogin(loginData.phone, loginData.password);
      if (response.success) {
        setStaff(response.staff);
        setIsLoggedIn(true);
        setSuccess('Login successful!');
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
      setIsLoggedIn(false);
      setStaff(null);
      // Clear any session cookies
      document.cookie = 'sessionid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      setSuccess('Logged out successfully');
    } catch (error: any) {
      setError('Logout failed');
    }
  };

  const handleDashboardCheckIn = async () => {
    try {
      await apiService.checkIn(staff?.id);
      setSuccess('Check-in successful!');
      // Refresh staff data
      const user = await apiService.getCurrentUser();
      if (user && user.staff_profile) {
        setStaff(user.staff_profile);
      }
      // Force re-render of dashboard attendance section
      setAttendanceRefreshKey(prev => prev + 1);
    } catch (error: any) {
      setError('Check-in failed: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDashboardCheckOut = async () => {
    try {
      await apiService.checkOut(staff?.id);
      setSuccess('Check-out successful!');
      // Refresh staff data
      const user = await apiService.getCurrentUser();
      if (user && user.staff_profile) {
        setStaff(user.staff_profile);
      }
      // Force re-render of dashboard attendance section
      setAttendanceRefreshKey(prev => prev + 1);
    } catch (error: any) {
      setError('Check-out failed: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDashboardRequestLeave = async () => {
    try {
      // Create a sample leave request for testing
      const leaveData = {
        leave_type: 'personal' as const,
        start_date: new Date().toISOString().split('T')[0], // Today
        end_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days from now
        reason: 'Personal leave request from staff portal dashboard'
      };
      
      await apiService.createLeave(leaveData);
      setSuccess('Leave request submitted successfully!');
    } catch (error: any) {
      setError('Leave request failed: ' + (error.response?.data?.message || error.message));
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <UserIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Staff Portal</h1>
            <p className="text-gray-400">Access your work dashboard</p>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-8 shadow-2xl">
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-6">
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}
              {success && (
                <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
                  <p className="text-green-300 text-sm">{success}</p>
                </div>
              )}

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={loginData.phone}
                  onChange={(e) => setLoginData({ ...loginData, phone: e.target.value })}
                  className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                  placeholder="Enter your phone number"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Test: 9813149939</p>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                  placeholder="Enter your password"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Test: test123</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg py-3 font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In to Staff Portal'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/')}
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                ← Back to Restaurant Management
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      {/* Sidebar - Fixed position */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-gray-800 to-gray-900 border-r border-gray-700/50 z-50 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl overflow-hidden
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:fixed md:z-50
      `}
      style={{ zIndex: 9999 }}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50 bg-gray-800/50 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <UserIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Staff Portal</h1>
              <p className="text-gray-400 text-xs">Employee Dashboard</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation - Scrollable */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-4">
            {/* Dashboard */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">
                Dashboard
              </h3>
              <button
                onClick={() => { setActiveTab('dashboard'); setMobileOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === 'dashboard'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                <ArrowPathIcon className="h-5 w-5" />
                <span className="font-medium">Overview</span>
              </button>
            </div>

            {/* Work Management */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">
                Work Management
              </h3>
              <button
                onClick={() => { setActiveTab('attendance'); setMobileOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === 'attendance'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                <ClockIcon className="h-5 w-5" />
                <span className="font-medium">Attendance</span>
              </button>
              <button
                onClick={() => { setActiveTab('leaves'); setMobileOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === 'leaves'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                <CalendarIcon className="h-5 w-5" />
                <span className="font-medium">Leave Requests</span>
              </button>
              <button
                onClick={() => { setActiveTab('schedule'); setMobileOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === 'schedule'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                <CalendarDaysIcon className="h-5 w-5" />
                <span className="font-medium">My Schedule</span>
              </button>
            </div>

            {/* Restaurant Operations */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">
                Restaurant Operations
              </h3>
              <button
                onClick={() => { setActiveTab('tables'); setMobileOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === 'tables'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                <TableCellsIcon className="h-5 w-5" />
                <span className="font-medium">Tables & Orders</span>
              </button>
              <button
                onClick={() => { setActiveTab('menu'); setMobileOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === 'menu'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                <ClipboardDocumentListIcon className="h-5 w-5" />
                <span className="font-medium">Menu Management</span>
              </button>
              <button
                onClick={() => { setActiveTab('kitchen'); setMobileOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === 'kitchen'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                <FireIcon className="h-5 w-5" />
                <span className="font-medium">Kitchen Orders</span>
              </button>
              <button
                onClick={() => { setActiveTab('waiter-calls'); setMobileOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === 'waiter-calls'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                <BellIcon className="h-5 w-5" />
                <span className="font-medium">Waiter Calls</span>
              </button>
            </div>

            {/* Personal */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">
                Personal
              </h3>
              <button
                onClick={() => { setActiveTab('profile'); setMobileOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === 'profile'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                <UserIcon className="h-5 w-5" />
                <span className="font-medium">My Profile</span>
              </button>
              <button
                onClick={() => { setActiveTab('documents'); setMobileOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === 'documents'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                <DocumentIcon className="h-5 w-5" />
                <span className="font-medium">My Documents</span>
              </button>
              <button
                onClick={() => { setActiveTab('payroll'); setMobileOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === 'payroll'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                <BanknotesIcon className="h-5 w-5" />
                <span className="font-medium">My Payroll</span>
              </button>
              <button
                onClick={() => { setActiveTab('performance'); setMobileOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === 'performance'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                <ChartBarIcon className="h-5 w-5" />
                <span className="font-medium">My Performance</span>
              </button>
            </div>

            {/* Training */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">
                Training
              </h3>
              <button
                onClick={() => { setActiveTab('training'); setMobileOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === 'training'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                <AcademicCapIcon className="h-5 w-5" />
                <span className="font-medium">My Training</span>
              </button>
              <button
                onClick={() => { setActiveTab('certificates'); setMobileOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === 'certificates'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                <DocumentCheckIcon className="h-5 w-5" />
                <span className="font-medium">Certificates</span>
              </button>
            </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64">
        {/* Header - Fixed at top */}
        <header 
          className="fixed top-0 right-0 left-0 md:left-64 bg-gray-800 border-b border-gray-700/50 backdrop-blur-sm z-10"
          style={{ zIndex: 10 }}
        >
          <div className="flex items-center justify-between px-4 py-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>

            {/* Spacer for mobile */}
            <div className="md:hidden flex-1" />

            {/* User Section */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="px-3 py-2 text-gray-300 hover:text-white transition-colors text-sm hidden sm:block"
              >
                ← Back to Restaurant
              </button>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 hover:bg-red-500/30 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 pt-16">
          <div className="p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              {error && (
                <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}
              {success && (
                <div className="mb-6 bg-green-500/20 border border-green-500/50 rounded-lg p-4">
                  <p className="text-green-300 text-sm">{success}</p>
                </div>
              )}

              <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-4 md:p-6 backdrop-blur-sm shadow-xl">
                {activeTab === 'dashboard' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white">Dashboard</h2>
                      <p className="text-gray-400">Welcome back, {staff?.full_name}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-sm">Department</p>
                            <p className="text-xl font-bold text-white">{staff?.department?.name}</p>
                          </div>
                          <UserIcon className="h-8 w-8 text-blue-400" />
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-sm">Position</p>
                            <p className="text-xl font-bold text-white">{staff?.role?.name}</p>
                          </div>
                          <UserIcon className="h-8 w-8 text-green-400" />
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-sm">Employee ID</p>
                            <p className="text-xl font-bold text-white">{staff?.employee_id}</p>
                          </div>
                          <UserIcon className="h-8 w-8 text-purple-400" />
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-sm">Status</p>
                            <p className="text-xl font-bold text-yellow-400 capitalize">{staff?.employment_status}</p>
                          </div>
                          <UserIcon className="h-8 w-8 text-yellow-400" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Today's Attendance</h3>
                      <DashboardAttendanceSection key={attendanceRefreshKey} staff={staff} />
                    </div>

                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                      <div className="flex flex-wrap gap-4">
                        <button 
                          onClick={handleDashboardCheckIn}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 hover:bg-green-500/30 transition-colors"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                          <span>Check In</span>
                        </button>
                        <button 
                          onClick={handleDashboardCheckOut}
                          className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 hover:bg-red-500/30 transition-colors"
                        >
                          <XCircleIcon className="h-5 w-5" />
                          <span>Check Out</span>
                        </button>
                        <button 
                          onClick={handleDashboardRequestLeave}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-300 hover:bg-blue-500/30 transition-colors"
                        >
                          <PlusIcon className="h-5 w-5" />
                          <span>Request Leave</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'attendance' && (
                  <AttendanceSection staff={staff} />
                )}

                {activeTab === 'leaves' && (
                  <LeaveSection staff={staff} />
                )}

                {activeTab === 'schedule' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white">My Schedule</h2>
                      <p className="text-gray-400">View your work schedule and upcoming shifts</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-sm">This Week</p>
                            <p className="text-2xl font-bold text-white">40h</p>
                          </div>
                          <CalendarDaysIcon className="h-8 w-8 text-blue-400" />
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-sm">Next Shift</p>
                            <p className="text-xl font-bold text-white">Tomorrow</p>
                          </div>
                          <ClockIcon className="h-8 w-8 text-green-400" />
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-sm">Shift Time</p>
                            <p className="text-xl font-bold text-white">9:00 AM</p>
                          </div>
                          <UserIcon className="h-8 w-8 text-purple-400" />
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-sm">Days Off</p>
                            <p className="text-xl font-bold text-white">2 days</p>
                          </div>
                          <CalendarIcon className="h-8 w-8 text-yellow-400" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Weekly Schedule</h3>
                      <div className="space-y-3">
                        {[
                          { day: 'Monday', time: '9:00 AM - 5:00 PM', type: 'Regular Shift' },
                          { day: 'Tuesday', time: '9:00 AM - 5:00 PM', type: 'Regular Shift' },
                          { day: 'Wednesday', time: '9:00 AM - 5:00 PM', type: 'Regular Shift' },
                          { day: 'Thursday', time: '9:00 AM - 5:00 PM', type: 'Regular Shift' },
                          { day: 'Friday', time: '9:00 AM - 5:00 PM', type: 'Regular Shift' },
                          { day: 'Saturday', time: 'Off', type: 'Day Off' },
                          { day: 'Sunday', time: 'Off', type: 'Day Off' },
                        ].map((shift, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                shift.type === 'Day Off' ? 'bg-gray-500/20' : 'bg-blue-500/20'
                              }`}>
                                <CalendarDaysIcon className={`h-5 w-5 ${
                                  shift.type === 'Day Off' ? 'text-gray-400' : 'text-blue-400'
                                }`} />
                              </div>
                              <div>
                                <p className="text-white font-medium">{shift.day}</p>
                                <p className="text-gray-400 text-sm">{shift.time}</p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              shift.type === 'Day Off' ? 'bg-gray-500/20 text-gray-300' : 'bg-blue-500/20 text-blue-300'
                            }`}>
                              {shift.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white">Profile</h2>
                      <p className="text-gray-400">Your personal and employment information</p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-700/50 pb-2">
                          Personal Information
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <p className="text-gray-400 text-sm">Employee ID</p>
                            <p className="text-white font-medium">{staff?.employee_id}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Full Name</p>
                            <p className="text-white font-medium">{staff?.full_name}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Email</p>
                            <p className="text-white">{staff?.email}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Phone</p>
                            <p className="text-white">{staff?.phone}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-700/50 pb-2">
                          Employment Information
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <p className="text-gray-400 text-sm">Department</p>
                            <p className="text-white font-medium">{staff?.department?.name}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Position</p>
                            <p className="text-white font-medium">{staff?.role?.name}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Hire Date</p>
                            <p className="text-white">
                              {staff?.hire_date ? new Date(staff.hire_date).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Salary</p>
                            <p className="text-white font-medium">₹{staff?.salary}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tables & Orders Tab */}
                {activeTab === 'tables' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white">Tables & Orders</h2>
                      <p className="text-gray-400">Manage tables and take customer orders</p>
                    </div>
                    
                    <TablesAndOrdersSection />
                  </div>
                )}

                {/* Menu Management Tab */}
                {activeTab === 'menu' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white">Menu Management</h2>
                      <p className="text-gray-400">View and manage restaurant menu items</p>
                    </div>
                    
                    <MenuManagementSection />
                  </div>
                )}

                {/* Kitchen Orders Tab */}
                {activeTab === 'kitchen' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white">Kitchen Orders</h2>
                      <p className="text-gray-400">Track and manage kitchen order status</p>
                    </div>
                    
                    <KitchenOrdersSection />
                  </div>
                )}

                {/* Waiter Calls Tab */}
                {activeTab === 'waiter-calls' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white">Waiter Calls</h2>
                      <p className="text-gray-400">Manage customer calls and table assistance requests</p>
                    </div>
                    
                    <WaiterCall />
                    <SocketDebug />
                  </div>
                )}

                {/* Documents Tab */}
                {activeTab === 'documents' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-white">My Documents</h2>
                        <p className="text-gray-400">Access and manage your employment documents</p>
                      </div>
                      <button className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-300 hover:bg-blue-500/30 transition-colors">
                        <PlusIcon className="h-5 w-5" />
                        <span>Upload Document</span>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[
                        { name: 'Employment Contract', type: 'Contract', status: 'Active', date: '2024-01-01' },
                        { name: 'ID Proof', type: 'Identity', status: 'Verified', date: '2024-01-01' },
                        { name: 'Address Proof', type: 'Address', status: 'Verified', date: '2024-01-01' },
                        { name: 'Educational Certificate', type: 'Education', status: 'Pending', date: '2024-01-15' },
                        { name: 'Training Certificate', type: 'Training', status: 'Active', date: '2024-02-01' },
                        { name: 'Performance Review', type: 'Review', status: 'Active', date: '2024-01-30' },
                      ].map((doc, index) => (
                        <div key={index} className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                              <DocumentIcon className="h-5 w-5 text-blue-400" />
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              doc.status === 'Active' ? 'bg-green-500/20 text-green-300' : 
                              doc.status === 'Verified' ? 'bg-blue-500/20 text-blue-300' : 'bg-yellow-500/20 text-yellow-300'
                            }`}>
                              {doc.status}
                            </span>
                          </div>
                          <h3 className="text-white font-semibold mb-2">{doc.name}</h3>
                          <p className="text-gray-400 text-sm mb-2">Type: {doc.type}</p>
                          <p className="text-gray-400 text-sm">Uploaded: {doc.date}</p>
                          <div className="mt-4 flex gap-2">
                            <button className="flex-1 px-3 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-300 hover:bg-blue-500/30 transition-colors text-sm">
                              View
                            </button>
                            <button className="flex-1 px-3 py-2 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 hover:bg-green-500/30 transition-colors text-sm">
                              Download
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payroll Tab */}
                {activeTab === 'payroll' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white">My Payroll</h2>
                      <p className="text-gray-400">View your salary details and payment history</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-sm">Current Salary</p>
                            <p className="text-2xl font-bold text-white">₹{staff?.salary}</p>
                          </div>
                          <BanknotesIcon className="h-8 w-8 text-green-400" />
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-sm">This Month</p>
                            <p className="text-2xl font-bold text-white">₹{staff?.salary}</p>
                          </div>
                          <CalendarIcon className="h-8 w-8 text-blue-400" />
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-sm">Last Payment</p>
                            <p className="text-xl font-bold text-white">₹{staff?.salary}</p>
                          </div>
                          <DocumentTextIcon className="h-8 w-8 text-purple-400" />
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-sm">Payment Date</p>
                            <p className="text-xl font-bold text-white">25th</p>
                          </div>
                          <CalendarDaysIcon className="h-8 w-8 text-yellow-400" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Payment History</h3>
                      <div className="space-y-3">
                        {[
                          { month: 'January 2024', amount: staff?.salary, status: 'Paid', date: '2024-01-25' },
                          { month: 'December 2023', amount: staff?.salary, status: 'Paid', date: '2023-12-25' },
                          { month: 'November 2023', amount: staff?.salary, status: 'Paid', date: '2023-11-25' },
                        ].map((payment, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                                <BanknotesIcon className="h-5 w-5 text-green-400" />
                              </div>
                              <div>
                                <p className="text-white font-medium">{payment.month}</p>
                                <p className="text-gray-400 text-sm">Paid on {payment.date}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-white font-medium">₹{payment.amount}</p>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300">
                                {payment.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Performance Tab */}
                {activeTab === 'performance' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white">My Performance</h2>
                      <p className="text-gray-400">Track your performance metrics and reviews</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-sm">Overall Rating</p>
                            <p className="text-2xl font-bold text-white">4.5/5</p>
                          </div>
                          <ChartBarIcon className="h-8 w-8 text-green-400" />
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-sm">Customer Rating</p>
                            <p className="text-2xl font-bold text-white">4.8/5</p>
                          </div>
                          <UserIcon className="h-8 w-8 text-blue-400" />
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-sm">Tasks Completed</p>
                            <p className="text-2xl font-bold text-white">95%</p>
                          </div>
                          <CheckCircleIcon className="h-8 w-8 text-purple-400" />
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-sm">Last Review</p>
                            <p className="text-xl font-bold text-white">2 weeks ago</p>
                          </div>
                          <DocumentTextIcon className="h-8 w-8 text-yellow-400" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Recent Performance Reviews</h3>
                      <div className="space-y-3">
                        {[
                          { date: '2024-01-15', rating: '4.5/5', reviewer: 'Manager', status: 'Completed' },
                          { date: '2023-12-15', rating: '4.3/5', reviewer: 'Manager', status: 'Completed' },
                          { date: '2023-11-15', rating: '4.7/5', reviewer: 'Manager', status: 'Completed' },
                        ].map((review, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                <ChartBarIcon className="h-5 w-5 text-blue-400" />
                              </div>
                              <div>
                                <p className="text-white font-medium">Performance Review</p>
                                <p className="text-gray-400 text-sm">Reviewed by {review.reviewer} on {review.date}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-white font-medium">{review.rating}</p>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300">
                                {review.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Training Tab */}
                {activeTab === 'training' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-white">My Training</h2>
                        <p className="text-gray-400">Access training materials and track your progress</p>
                      </div>
                      <button className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-300 hover:bg-blue-500/30 transition-colors">
                        <PlusIcon className="h-5 w-5" />
                        <span>Enroll in Course</span>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[
                        { name: 'Customer Service Excellence', progress: 85, status: 'In Progress', type: 'Mandatory' },
                        { name: 'Food Safety & Hygiene', progress: 100, status: 'Completed', type: 'Required' },
                        { name: 'Point of Sale Training', progress: 60, status: 'In Progress', type: 'Optional' },
                        { name: 'Team Leadership Skills', progress: 0, status: 'Not Started', type: 'Optional' },
                        { name: 'Emergency Procedures', progress: 100, status: 'Completed', type: 'Mandatory' },
                        { name: 'Menu Knowledge', progress: 75, status: 'In Progress', type: 'Required' },
                      ].map((course, index) => (
                        <div key={index} className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                              <AcademicCapIcon className="h-5 w-5 text-blue-400" />
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              course.status === 'Completed' ? 'bg-green-500/20 text-green-300' : 
                              course.status === 'In Progress' ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-500/20 text-gray-300'
                            }`}>
                              {course.status}
                            </span>
                          </div>
                          <h3 className="text-white font-semibold mb-2">{course.name}</h3>
                          <p className="text-gray-400 text-sm mb-3">Type: {course.type}</p>
                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-400">Progress</span>
                              <span className="text-white">{course.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${course.progress}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button className="flex-1 px-3 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-300 hover:bg-blue-500/30 transition-colors text-sm">
                              {course.status === 'Completed' ? 'Review' : 'Continue'}
                            </button>
                            <button className="flex-1 px-3 py-2 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 hover:bg-green-500/30 transition-colors text-sm">
                              Certificate
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certificates Tab */}
                {activeTab === 'certificates' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white">Certificates</h2>
                      <p className="text-gray-400">View and download your training certificates</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[
                        { name: 'Food Safety & Hygiene', issueDate: '2024-01-15', expiryDate: '2025-01-15', status: 'Valid' },
                        { name: 'Emergency Procedures', issueDate: '2024-01-10', expiryDate: '2025-01-10', status: 'Valid' },
                        { name: 'Customer Service Excellence', issueDate: '2024-02-01', expiryDate: '2025-02-01', status: 'Valid' },
                      ].map((cert, index) => (
                        <div key={index} className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                              <DocumentCheckIcon className="h-5 w-5 text-green-400" />
                            </div>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300">
                              {cert.status}
                            </span>
                          </div>
                          <h3 className="text-white font-semibold mb-2">{cert.name}</h3>
                          <p className="text-gray-400 text-sm mb-2">Issued: {cert.issueDate}</p>
                          <p className="text-gray-400 text-sm mb-4">Expires: {cert.expiryDate}</p>
                          <div className="flex gap-2">
                            <button className="flex-1 px-3 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-300 hover:bg-blue-500/30 transition-colors text-sm">
                              View
                            </button>
                            <button className="flex-1 px-3 py-2 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 hover:bg-green-500/30 transition-colors text-sm">
                              Download
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </div>
  );
};

// Attendance Section Component
const AttendanceSection: React.FC<{ staff: Staff | null }> = ({ staff }) => {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [stats, setStats] = useState({
    todayHours: '0h',
    weekHours: '0h',
    status: 'Not Checked In',
    lastCheckIn: 'N/A'
  });

  useEffect(() => {
    if (staff) {
      fetchAttendanceData();
    }
  }, [staff]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const [attendanceData, staffAttendance] = await Promise.all([
        apiService.getAttendance(),
        staff ? apiService.getStaffAttendance(staff.id) : Promise.resolve([])
      ]);
      
      setAttendance(staffAttendance);
      
      // Calculate today's attendance
      const today = new Date().toISOString().split('T')[0];
      const todayRecord = staffAttendance.find(a => a.date === today);
      setTodayAttendance(todayRecord || null);
      
      // Calculate stats
      calculateStats(staffAttendance, todayRecord || null);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (attendanceData: Attendance[], todayRecord: Attendance | null) => {
    // Calculate today's hours
    let todayHours = '0h';
    if (todayRecord?.check_in_time && todayRecord?.check_out_time) {
      try {
        // Parse time strings properly
        const checkInTime = todayRecord.check_in_time;
        const checkOutTime = todayRecord.check_out_time;
        
        // Create proper datetime objects
        const today = new Date(todayRecord.date);
        const checkIn = new Date(`${today.toISOString().split('T')[0]}T${checkInTime}`);
        const checkOut = new Date(`${today.toISOString().split('T')[0]}T${checkOutTime}`);
        
        if (!isNaN(checkIn.getTime()) && !isNaN(checkOut.getTime())) {
          const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
          todayHours = `${hours.toFixed(1)}h`;
        }
      } catch (error) {
        console.error('Error calculating today hours:', error);
      }
    }
    
    // Calculate week hours
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekAttendance = attendanceData.filter(a => new Date(a.date) >= weekStart);
    const weekHours = weekAttendance.reduce((total, record) => {
      if (record.check_in_time && record.check_out_time) {
        try {
          const today = new Date(record.date);
          const checkIn = new Date(`${today.toISOString().split('T')[0]}T${record.check_in_time}`);
          const checkOut = new Date(`${today.toISOString().split('T')[0]}T${record.check_out_time}`);
          
          if (!isNaN(checkIn.getTime()) && !isNaN(checkOut.getTime())) {
            return total + (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
          }
        } catch (error) {
          console.error('Error calculating week hours:', error);
        }
      }
      return total;
    }, 0);
    
    // Get status
    const status = todayRecord ? 
      (todayRecord.check_out_time ? 'Checked Out' : 'Present') : 
      'Not Checked In';
    
    // Get last check-in
    let lastCheckIn = 'N/A';
    if (attendanceData.length > 0) {
      try {
        const firstRecord = attendanceData[0];
        if (firstRecord.check_in_time) {
          const today = new Date(firstRecord.date);
          const checkInTime = new Date(`${today.toISOString().split('T')[0]}T${firstRecord.check_in_time}`);
          if (!isNaN(checkInTime.getTime())) {
            lastCheckIn = checkInTime.toLocaleTimeString();
          }
        } else if (firstRecord.created_at) {
          const createdTime = new Date(firstRecord.created_at);
          if (!isNaN(createdTime.getTime())) {
            lastCheckIn = createdTime.toLocaleTimeString();
          }
        }
      } catch (error) {
        console.error('Error calculating last check-in:', error);
      }
    }
    
    setStats({
      todayHours,
      weekHours: `${weekHours.toFixed(1)}h`,
      status,
      lastCheckIn
    });
  };

  const handleCheckIn = async () => {
    try {
      await apiService.checkIn(staff?.id);
      await fetchAttendanceData();
    } catch (error) {
      console.error('Error checking in:', error);
    }
  };

  const handleCheckOut = async () => {
    try {
      await apiService.checkOut(staff?.id);
      await fetchAttendanceData();
    } catch (error) {
      console.error('Error checking out:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-400 mt-2">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Attendance</h2>
          <p className="text-gray-400">Track your work hours and attendance</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleCheckIn}
            disabled={!!(todayAttendance?.check_in_time && !todayAttendance?.check_out_time)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircleIcon className="h-5 w-5" />
            <span>Check In</span>
          </button>
          <button 
            onClick={handleCheckOut}
            disabled={!!(!todayAttendance?.check_in_time || todayAttendance?.check_out_time)}
            className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XCircleIcon className="h-5 w-5" />
            <span>Check Out</span>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Today's Hours</p>
              <p className="text-2xl font-bold text-white">{stats.todayHours}</p>
            </div>
            <ClockIcon className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">This Week</p>
              <p className="text-2xl font-bold text-white">{stats.weekHours}</p>
            </div>
            <CalendarDaysIcon className="h-8 w-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Status</p>
              <p className="text-xl font-bold text-green-400">{stats.status}</p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Last Check-in</p>
              <p className="text-xl font-bold text-white">{stats.lastCheckIn}</p>
            </div>
            <UserIcon className="h-8 w-8 text-purple-400" />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Attendance</h3>
        <div className="space-y-3">
          {attendance.slice(0, 5).map((record) => {
            let hours = 'N/A';
            let checkInTime = 'N/A';
            let checkOutTime = 'N/A';
            
            try {
              if (record.check_in_time && record.check_out_time) {
                const today = new Date(record.date);
                const checkIn = new Date(`${today.toISOString().split('T')[0]}T${record.check_in_time}`);
                const checkOut = new Date(`${today.toISOString().split('T')[0]}T${record.check_out_time}`);
                
                if (!isNaN(checkIn.getTime()) && !isNaN(checkOut.getTime())) {
                  const hoursDiff = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
                  hours = `${hoursDiff.toFixed(1)}h`;
                  checkInTime = checkIn.toLocaleTimeString();
                  checkOutTime = checkOut.toLocaleTimeString();
                }
              }
            } catch (error) {
              console.error('Error parsing attendance record:', error);
            }
            
            return (
              <div key={record.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <CalendarIcon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{new Date(record.date).toLocaleDateString()}</p>
                    <p className="text-gray-400 text-sm">
                      {checkInTime} - {checkOutTime}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">{hours}</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    record.status === 'present' ? 'bg-green-500/20 text-green-300' : 
                    record.status === 'late' ? 'bg-yellow-500/20 text-yellow-300' : 
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {record.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Leave Section Component
const LeaveSection: React.FC<{ staff: Staff | null }> = ({ staff }) => {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    availableLeave: 15,
    usedLeave: 0,
    pendingLeave: 0
  });

  useEffect(() => {
    if (staff) {
      fetchLeaveData();
    }
  }, [staff]);

  const fetchLeaveData = async () => {
    try {
      setLoading(true);
      const [allLeaves, staffLeaves] = await Promise.all([
        apiService.getLeaves(),
        staff ? apiService.getStaffLeaves(staff.id) : Promise.resolve([])
      ]);
      
      setLeaves(staffLeaves);
      
      // Calculate stats
      const usedLeave = staffLeaves.filter(l => l.status === 'approved').length;
      const pendingLeave = staffLeaves.filter(l => l.status === 'pending').length;
      
      setStats({
        availableLeave: 15 - usedLeave,
        usedLeave,
        pendingLeave
      });
    } catch (error) {
      console.error('Error fetching leave data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestLeave = async () => {
    try {
      // Create a sample leave request for testing
      const leaveData = {
        leave_type: 'personal' as const,
        start_date: new Date().toISOString().split('T')[0], // Today
        end_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days from now
        reason: 'Personal leave request from staff portal'
      };
      
      await apiService.createLeave(leaveData);
      await fetchLeaveData(); // Refresh the data
      alert('Leave request submitted successfully!');
    } catch (error) {
      console.error('Error requesting leave:', error);
      alert('Failed to submit leave request. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-400 mt-2">Loading leave data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Leave Requests</h2>
          <p className="text-gray-400">Manage your leave applications</p>
        </div>
        <button 
          onClick={handleRequestLeave}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-300 hover:bg-blue-500/30 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Request Leave</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Available Leave</p>
              <p className="text-2xl font-bold text-white">{stats.availableLeave} days</p>
            </div>
            <CalendarIcon className="h-8 w-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Used Leave</p>
              <p className="text-2xl font-bold text-white">{stats.usedLeave} days</p>
            </div>
            <DocumentTextIcon className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pending</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.pendingLeave} days</p>
            </div>
            <ClockIcon className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Leave Requests</h3>
        <div className="space-y-3">
          {leaves.length > 0 ? (
            leaves.slice(0, 5).map((leave) => {
              const startDate = new Date(leave.start_date).toLocaleDateString();
              const endDate = new Date(leave.end_date).toLocaleDateString();
              const days = Math.ceil((new Date(leave.end_date).getTime() - new Date(leave.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1;
              
              return (
                <div key={leave.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <CalendarIcon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{leave.leave_type}</p>
                      <p className="text-gray-400 text-sm">{startDate} - {endDate}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">{days} days</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      leave.status === 'approved' ? 'bg-green-500/20 text-green-300' : 
                      leave.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' : 
                      'bg-red-500/20 text-red-300'
                    }`}>
                      {leave.status}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No leave requests found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Restaurant Operations Components
const TablesAndOrdersSection: React.FC = () => {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await apiService.getTables();
        setTables(response);
      } catch (error) {
        console.error('Error fetching tables:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTables();
  }, []);

  const handleViewOrders = (tableId: number) => {
    alert(`Viewing orders for Table ${tableId}. This feature will be implemented soon!`);
  };

  const handleTakeOrder = (tableId: number) => {
    alert(`Taking order for Table ${tableId}. This feature will be implemented soon!`);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-400 mt-2">Loading tables...</p>
      </div>
    );
  }

    return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tables.map((table) => (
          <div key={table.id} className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Table {table.table_number}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                table.is_active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
              }`}>
                {table.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-gray-400 text-sm">Floor</p>
                <p className="text-white font-medium">{table.floor?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Room</p>
                <p className="text-white font-medium">{table.room?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Capacity</p>
                <p className="text-white font-medium">{table.capacity} people</p>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button 
                onClick={() => handleViewOrders(table.id)}
                className="flex-1 px-3 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-300 hover:bg-blue-500/30 transition-colors text-sm"
              >
                View Orders
              </button>
              <button 
                onClick={() => handleTakeOrder(table.id)}
                className="flex-1 px-3 py-2 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 hover:bg-green-500/30 transition-colors text-sm"
              >
                Take Order
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MenuManagementSection: React.FC = () => {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const response = await apiService.getMenuItems();
        setMenuItems(response);
      } catch (error) {
        console.error('Error fetching menu items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  const categories = ['all', ...new Set(menuItems.map(item => item.category))];
  const filteredItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-400 mt-2">Loading menu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{item.name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                item.is_available ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
              }`}>
                {item.is_available ? 'Available' : 'Unavailable'}
              </span>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-gray-400 text-sm">Category</p>
                <p className="text-white font-medium capitalize">{item.category}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Price</p>
                <p className="text-white font-medium">₹{item.price}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Description</p>
                <p className="text-gray-300 text-sm">{item.description}</p>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button className="flex-1 px-3 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-300 hover:bg-blue-500/30 transition-colors text-sm">
                Add to Order
              </button>
              <button className="flex-1 px-3 py-2 bg-gray-500/20 border border-gray-500/50 rounded-lg text-gray-300 hover:bg-gray-500/30 transition-colors text-sm">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const KitchenOrdersSection: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // This would typically fetch orders from the kitchen API
        // For now, we'll use a mock response
        const mockOrders = [
          {
            id: 1,
            table_number: 'T001',
            items: ['Butter Tandoor', 'Dal Tadka'],
            status: 'preparing',
            created_at: new Date().toISOString(),
            total_amount: 209
          },
          {
            id: 2,
            table_number: 'T003',
            items: ['Paneer Chilli', 'Jeera Rice'],
            status: 'ready',
            created_at: new Date(Date.now() - 300000).toISOString(),
            total_amount: 408
          }
        ];
        setOrders(mockOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-300';
      case 'preparing': return 'bg-blue-500/20 text-blue-300';
      case 'ready': return 'bg-green-500/20 text-green-300';
      case 'served': return 'bg-gray-500/20 text-gray-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-400 mt-2">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Order #{order.id}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-gray-400 text-sm">Table</p>
                <p className="text-white font-medium">{order.table_number}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Items</p>
                <ul className="text-gray-300 text-sm">
                  {order.items.map((item: string, index: number) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total</p>
                <p className="text-white font-medium">₹{order.total_amount}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Time</p>
                <p className="text-gray-300 text-sm">
                  {new Date(order.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button className="flex-1 px-3 py-2 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 hover:bg-green-500/30 transition-colors text-sm">
                Mark Ready
              </button>
              <button className="flex-1 px-3 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-300 hover:bg-blue-500/30 transition-colors text-sm">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StaffPortal;
