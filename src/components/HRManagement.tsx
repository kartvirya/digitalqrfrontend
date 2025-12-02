import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserGroupIcon, 
  UserPlusIcon, 
  CurrencyDollarIcon, 
  CalendarDaysIcon,
  AcademicCapIcon,
  ChartBarIcon,
  DocumentTextIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';
import apiService from '../services/api';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';

interface Employee {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  department_name: string;
  role_name: string;
  employment_status: string;
  hire_date: string;
  salary: string;
  full_name: string;
}

interface HRStats {
  totalEmployees: number;
  activeEmployees: number;
  pendingLeaves: number;
  upcomingTrainings: number;
  monthlyPayroll: number;
  overdueReviews: number;
}

interface HRManagementProps {
  showTabs?: boolean;
}

const HRManagement: React.FC<HRManagementProps> = ({ showTabs = true }) => {
  const { user } = useAuth();
  const { isHRManager, isRestaurantAdmin } = usePermissions();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState<HRStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    pendingLeaves: 0,
    upcomingTrainings: 0,
    monthlyPayroll: 0,
    overdueReviews: 0
  });
  const [loading, setLoading] = useState(true);
  const [checkingHRSetup, setCheckingHRSetup] = useState(true);
  const [hrManagerExists, setHrManagerExists] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkHRSetup();
  }, []);

  const checkHRSetup = async () => {
    // If user is HR manager, they can access directly
    if (isHRManager()) {
      setHrManagerExists(true);
      setCheckingHRSetup(false);
      loadData();
      return;
    }

    // If user is restaurant admin, check if HR manager exists
    if (isRestaurantAdmin()) {
      try {
        // Check if HR manager user exists for this restaurant
        const employees = await apiService.getEmployees();
        // For now, if we can load employees, assume HR is set up
        // In a real scenario, we'd check for a user with hr_manager role
        setHrManagerExists(true);
        setCheckingHRSetup(false);
        loadData();
      } catch (err) {
        // If no employees or error, HR might not be set up
        setHrManagerExists(false);
        setCheckingHRSetup(false);
      }
    } else {
      setCheckingHRSetup(false);
      loadData();
    }
  };

  useEffect(() => {
    if (!checkingHRSetup && hrManagerExists) {
      loadData();
    }
  }, [checkingHRSetup, hrManagerExists]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load employees data
      const employeesData = await apiService.getEmployees();
      setEmployees(employeesData);
      
      // Calculate stats from employees data
      const activeEmployees = employeesData.filter(emp => emp.employment_status === 'active');
      const totalSalary = activeEmployees.reduce((sum, emp) => {
        const salary = parseFloat(emp.salary || '0');
        return sum + salary;
      }, 0);

      // For now, set default values for other stats since those endpoints might not be fully implemented
      setStats({
        totalEmployees: employeesData.length,
        activeEmployees: activeEmployees.length,
        pendingLeaves: 0, // Will be implemented when leave system is ready
        upcomingTrainings: 0, // Will be implemented when training system is ready
        monthlyPayroll: totalSalary,
        overdueReviews: 0 // Will be implemented when performance system is ready
      });

    } catch (error: any) {
      console.error('HR data loading error:', error);
      setError('Failed to load HR data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const tabButtons = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'employees', label: 'Employees', icon: UserGroupIcon },
    { id: 'payroll', label: 'Payroll', icon: CurrencyDollarIcon },
    { id: 'leaves', label: 'Leave Management', icon: CalendarDaysIcon },
    { id: 'training', label: 'Training', icon: AcademicCapIcon },
    { id: 'performance', label: 'Performance', icon: DocumentTextIcon },
  ];

  const StatCard: React.FC<{ title: string; value: number | string; icon: React.ElementType; color: string }> = 
    ({ title, value, icon: Icon, color }) => (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-red-500/30">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>
            {typeof value === 'number' && title.includes('Payroll') 
              ? `₹${value.toLocaleString()}` 
              : value}
          </p>
        </div>
        <div className={`p-3 rounded-lg bg-gradient-to-br ${color === 'text-red-400' ? 'from-red-500/20 to-red-600/30' : 'from-blue-500/20 to-blue-600/30'}`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Total Employees" 
          value={stats.totalEmployees} 
          icon={UserGroupIcon} 
          color="text-blue-400" 
        />
        <StatCard 
          title="Active Employees" 
          value={stats.activeEmployees} 
          icon={UserPlusIcon} 
          color="text-green-400" 
        />
        <StatCard 
          title="Pending Leaves" 
          value={stats.pendingLeaves} 
          icon={CalendarDaysIcon} 
          color="text-yellow-400" 
        />
        <StatCard 
          title="Upcoming Trainings" 
          value={stats.upcomingTrainings} 
          icon={AcademicCapIcon} 
          color="text-purple-400" 
        />
        <StatCard 
          title="Monthly Payroll" 
          value={stats.monthlyPayroll} 
          icon={CurrencyDollarIcon} 
          color="text-red-400" 
        />
        <StatCard 
          title="Overdue Reviews" 
          value={stats.overdueReviews} 
          icon={DocumentTextIcon} 
          color="text-orange-400" 
        />
      </div>

      {/* Recent Employees */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm shadow-xl">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <UserGroupIcon className="h-6 w-6 text-red-400 mr-2" />
          Recent Employees
        </h3>
        
        {employees.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Employee</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Department</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Position</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Hire Date</th>
                </tr>
              </thead>
              <tbody>
                {employees.slice(0, 5).map((employee) => (
                  <tr key={employee.id} className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-white font-medium">{employee.full_name}</p>
                        <p className="text-gray-400 text-sm">{employee.employee_id}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-300">{employee.department_name}</td>
                    <td className="py-3 px-4 text-gray-300">{employee.role_name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        employee.employment_status === 'active' 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {employee.employment_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {new Date(employee.hire_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <UserGroupIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No employees found</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'employees':
        return <div className="text-white">Employees Management (Coming Soon)</div>;
      case 'payroll':
        return <div className="text-white">Payroll Management (Coming Soon)</div>;
      case 'leaves':
        return <div className="text-white">Leave Management (Coming Soon)</div>;
      case 'training':
        return <div className="text-white">Training Management (Coming Soon)</div>;
      case 'performance':
        return <div className="text-white">Performance Management (Coming Soon)</div>;
      default:
        return <OverviewTab />;
    }
  };

  if (checkingHRSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Checking HR setup...</p>
        </div>
      </div>
    );
  }

  // If restaurant admin and HR manager doesn't exist, show setup prompt
  if (isRestaurantAdmin() && !hrManagerExists && !isHRManager()) {
    return (
      <div className="p-6">
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">HR Manager Not Set Up</h2>
          <p className="text-gray-300 mb-4">
            You need to set up an HR Manager account before you can access HR features. 
            The HR Manager will be able to manage employees, payroll, attendance, and other HR functions.
          </p>
          <button
            onClick={() => navigate('/hr-setup')}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200"
          >
            Set Up HR Manager Account
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading HR Management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={showTabs ? "min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-6" : ""}>
      <div className={showTabs ? "max-w-7xl mx-auto" : ""}>
        {/* Header */}
        {showTabs && (
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center">
              <BriefcaseIcon className="h-8 w-8 text-red-400 mr-3" />
              HR Management System
            </h1>
            <p className="text-gray-400">Comprehensive human resources management for your organization</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Navigation Tabs */}
        {showTabs && (
          <div className="mb-8">
            <div className="border-b border-gray-700/50">
              <nav className="flex space-x-8 overflow-x-auto">
                {tabButtons.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                        activeTab === tab.id
                          ? 'border-red-500 text-red-400'
                          : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      <Icon className="h-5 w-5 mr-2" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className={showTabs ? "animate-fadeIn" : ""}>
          {showTabs ? renderTabContent() : <OverviewTab />}
        </div>
      </div>
    </div>
  );
};

export default HRManagement;
