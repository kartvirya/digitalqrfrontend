import React, { useState, useEffect } from 'react';
import {
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import apiService from '../services/api';

interface LeaveRequest {
  id: number;
  employee_id: string;
  employee_name: string;
  leave_type: 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'other';
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  duration_days: number;
  created_at: string;
}

const LeaveManagement: React.FC = () => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load employees for leave requests
      const employeesData = await apiService.getEmployees();
      setEmployees(employeesData);
      
      // Create sample leave requests since the leave system isn't fully implemented
      const sampleLeaves: LeaveRequest[] = [
        {
          id: 1,
          employee_id: employeesData[0]?.employee_id || 'EMP001',
          employee_name: employeesData[0]?.full_name || 'John Doe',
          leave_type: 'annual',
          start_date: '2025-09-01',
          end_date: '2025-09-05',
          reason: 'Family vacation',
          status: 'pending',
          duration_days: 5,
          created_at: '2025-08-20'
        },
        {
          id: 2,
          employee_id: employeesData[1]?.employee_id || 'EMP002',
          employee_name: employeesData[1]?.full_name || 'Jane Smith',
          leave_type: 'sick',
          start_date: '2025-08-15',
          end_date: '2025-08-17',
          reason: 'Medical appointment',
          status: 'approved',
          duration_days: 3,
          created_at: '2025-08-14'
        },
        {
          id: 3,
          employee_id: employeesData[2]?.employee_id || 'EMP003',
          employee_name: employeesData[2]?.full_name || 'Bob Johnson',
          leave_type: 'personal',
          start_date: '2025-08-25',
          end_date: '2025-08-26',
          reason: 'Personal emergency',
          status: 'rejected',
          duration_days: 2,
          created_at: '2025-08-22'
        }
      ];
      
      setLeaveRequests(sampleLeaves);
    } catch (error: any) {
      console.error('Leave data loading error:', error);
      setError('Failed to load leave data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const filteredLeaves = leaveRequests.filter(leave => {
    const matchesSearch = 
      leave.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.employee_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !selectedType || leave.leave_type === selectedType;
    const matchesStatus = !selectedStatus || leave.status === selectedStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'cancelled':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'annual':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'sick':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'personal':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'maternity':
        return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
      case 'paternity':
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const totalLeaves = filteredLeaves.length;
  const pendingLeaves = filteredLeaves.filter(l => l.status === 'pending').length;
  const approvedLeaves = filteredLeaves.filter(l => l.status === 'approved').length;
  const totalDays = filteredLeaves.reduce((sum, leave) => sum + leave.duration_days, 0);

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
          <h2 className="text-2xl font-bold text-white">Leave Management</h2>
          <p className="text-gray-400">Manage employee leave requests and approvals</p>
        </div>
        <button className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center gap-2">
          <PlusIcon className="h-5 w-5" />
          New Leave Request
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Requests</p>
              <p className="text-2xl font-bold text-white">{totalLeaves}</p>
            </div>
            <DocumentTextIcon className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pending</p>
              <p className="text-2xl font-bold text-yellow-400">{pendingLeaves}</p>
            </div>
            <ClockIcon className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Approved</p>
              <p className="text-2xl font-bold text-green-400">{approvedLeaves}</p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Days</p>
              <p className="text-2xl font-bold text-purple-400">{totalDays}</p>
            </div>
            <CalendarDaysIcon className="h-8 w-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
          >
            <option value="">All Leave Types</option>
            <option value="annual">Annual Leave</option>
            <option value="sick">Sick Leave</option>
            <option value="personal">Personal Leave</option>
            <option value="maternity">Maternity Leave</option>
            <option value="paternity">Paternity Leave</option>
            <option value="other">Other</option>
          </select>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-gray-300 font-medium">Employee</th>
                <th className="px-6 py-4 text-left text-gray-300 font-medium">Leave Type</th>
                <th className="px-6 py-4 text-left text-gray-300 font-medium">Duration</th>
                <th className="px-6 py-4 text-left text-gray-300 font-medium">Dates</th>
                <th className="px-6 py-4 text-left text-gray-300 font-medium">Reason</th>
                <th className="px-6 py-4 text-left text-gray-300 font-medium">Status</th>
                <th className="px-6 py-4 text-left text-gray-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaves.map((leave) => (
                <tr key={leave.id} className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-medium">{leave.employee_name}</p>
                      <p className="text-gray-400 text-sm">{leave.employee_id}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getLeaveTypeColor(leave.leave_type)}`}>
                      {leave.leave_type.charAt(0).toUpperCase() + leave.leave_type.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {leave.duration_days} day{leave.duration_days !== 1 ? 's' : ''}
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    <div>
                      <p className="text-sm">{new Date(leave.start_date).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-400">to {new Date(leave.end_date).toLocaleDateString()}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300 max-w-xs truncate">
                    {leave.reason}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(leave.status)}`}>
                      {leave.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {leave.status === 'pending' && (
                        <>
                          <button className="p-1 text-green-400 hover:text-green-300 transition-colors">
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-red-400 hover:text-red-300 transition-colors">
                            <XCircleIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
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

export default LeaveManagement;
