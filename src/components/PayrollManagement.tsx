import React, { useState, useEffect } from 'react';
import {
  CurrencyDollarIcon,
  CalendarIcon,
  DocumentTextIcon,
  EyeIcon,
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import apiService from '../services/api';

interface PayrollData {
  id: number;
  employee_id: string;
  employee_name: string;
  month: number;
  year: number;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  payment_status: 'pending' | 'paid' | 'cancelled';
  payment_date?: string;
  created_at: string;
}

const PayrollManagement: React.FC = () => {
  const [payrolls, setPayrolls] = useState<PayrollData[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load employees for payroll generation
      const employeesData = await apiService.getEmployees();
      setEmployees(employeesData);
      
      // For now, we'll create sample payroll data since the payroll system isn't fully implemented
      const samplePayrolls: PayrollData[] = employeesData.map((emp, index) => ({
        id: index + 1,
        employee_id: emp.employee_id,
        employee_name: emp.full_name,
        month: 8,
        year: 2025,
        basic_salary: parseFloat(emp.salary || '0'),
        allowances: parseFloat(emp.salary || '0') * 0.1, // 10% allowances
        deductions: parseFloat(emp.salary || '0') * 0.05, // 5% deductions
        net_salary: parseFloat(emp.salary || '0') * 1.05, // Basic + allowances - deductions
        payment_status: index % 3 === 0 ? 'paid' : index % 3 === 1 ? 'pending' : 'cancelled',
        payment_date: index % 3 === 0 ? '2025-08-15' : undefined,
        created_at: '2025-08-01'
      }));
      
      setPayrolls(samplePayrolls);
    } catch (error: any) {
      console.error('Payroll data loading error:', error);
      setError('Failed to load payroll data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const filteredPayrolls = payrolls.filter(payroll => {
    const matchesSearch = 
      payroll.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payroll.employee_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMonth = !selectedMonth || payroll.month.toString() === selectedMonth;
    const matchesYear = !selectedYear || payroll.year.toString() === selectedYear;
    const matchesStatus = !selectedStatus || payroll.payment_status === selectedStatus;
    
    return matchesSearch && matchesMonth && matchesYear && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const totalPayroll = filteredPayrolls.reduce((sum, payroll) => sum + payroll.net_salary, 0);
  const paidPayrolls = filteredPayrolls.filter(p => p.payment_status === 'paid').length;
  const pendingPayrolls = filteredPayrolls.filter(p => p.payment_status === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Payroll Management</h2>
          <p className="text-gray-400">Manage employee salaries and payments</p>
        </div>
        <button className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center gap-2">
          <PlusIcon className="h-5 w-5" />
          Generate Payroll
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Payroll</p>
              <p className="text-2xl font-bold text-white">₹{totalPayroll.toLocaleString()}</p>
            </div>
            <CurrencyDollarIcon className="h-8 w-8 text-red-400" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Employees</p>
              <p className="text-2xl font-bold text-white">{filteredPayrolls.length}</p>
            </div>
            <UserGroupIcon className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Paid</p>
              <p className="text-2xl font-bold text-green-400">{paidPayrolls}</p>
            </div>
            <DocumentTextIcon className="h-8 w-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pending</p>
              <p className="text-2xl font-bold text-yellow-400">{pendingPayrolls}</p>
            </div>
            <CalendarIcon className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
            />
          </div>
          
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
          >
            <option value="">All Months</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2025, i, 1).toLocaleDateString('en-US', { month: 'long' })}
              </option>
            ))}
          </select>
          
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
          >
            <option value="">All Years</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
          >
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-gray-300 font-medium">Employee</th>
                <th className="px-6 py-4 text-left text-gray-300 font-medium">Period</th>
                <th className="px-6 py-4 text-left text-gray-300 font-medium">Basic Salary</th>
                <th className="px-6 py-4 text-left text-gray-300 font-medium">Allowances</th>
                <th className="px-6 py-4 text-left text-gray-300 font-medium">Deductions</th>
                <th className="px-6 py-4 text-left text-gray-300 font-medium">Net Salary</th>
                <th className="px-6 py-4 text-left text-gray-300 font-medium">Status</th>
                <th className="px-6 py-4 text-left text-gray-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayrolls.map((payroll) => (
                <tr key={payroll.id} className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-medium">{payroll.employee_name}</p>
                      <p className="text-gray-400 text-sm">{payroll.employee_id}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {new Date(2025, payroll.month - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-gray-300">₹{payroll.basic_salary.toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-300">₹{payroll.allowances.toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-300">₹{payroll.deductions.toLocaleString()}</td>
                  <td className="px-6 py-4 text-white font-medium">₹{payroll.net_salary.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(payroll.payment_status)}`}>
                      {payroll.payment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1 text-gray-400 hover:text-white transition-colors">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-white transition-colors">
                        <DocumentTextIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default PayrollManagement;
