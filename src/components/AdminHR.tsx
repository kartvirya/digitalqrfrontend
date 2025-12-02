import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Staff, Attendance, Leave } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-hr-tabpanel-${index}`}
      aria-labelledby={`admin-hr-tab-${index}`}
      {...other}
    >
      {value === index && <div className="p-6">{children}</div>}
    </div>
  );
}

const AdminHR: React.FC = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);


  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [staffData, attendanceData, leaveData] = await Promise.all([
        apiService.getStaff(),
        apiService.getAttendance(),
        apiService.getLeaves(),
      ]);
      setStaff(staffData);
      setAttendance(attendanceData);
      setLeaves(leaveData);
    } catch (error: any) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLeave = async (leaveId: number) => {
    try {
      setLoading(true);
      await apiService.approveLeave(leaveId);
      setSuccess('Leave approved successfully!');
      loadData();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to approve leave');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectLeave = async (leaveId: number) => {
    try {
      setLoading(true);
      await apiService.rejectLeave(leaveId);
      setSuccess('Leave rejected successfully!');
      loadData();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to reject leave');
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceStatus = (record: Attendance) => {
    if (record.check_in_time && record.check_out_time) {
      return 'Completed';
    } else if (record.check_in_time) {
      return 'Checked In';
    } else {
      return 'Not Checked In';
    }
  };

  const getAttendanceForDate = (date: string) => {
    return attendance.filter(a => a.date === date);
  };

  const getLeavesByStatus = (status: string) => {
    return leaves.filter(l => l.status === status);
  };

  return (
    <div className="max-w-7xl mx-auto mt-8 p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900">HR Management</h1>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
          <div className="flex items-center mb-4">
            <svg className="w-6 h-6 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-gray-600 font-medium">Total Staff</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">{staff.length}</div>
          <div className="text-sm text-gray-500">Active employees</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
          <div className="flex items-center mb-4">
            <svg className="w-6 h-6 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-600 font-medium">Present Today</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {getAttendanceForDate(selectedDate).filter(a => a.check_in_time).length}
          </div>
          <div className="text-sm text-gray-500">Checked in employees</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
          <div className="flex items-center mb-4">
            <svg className="w-6 h-6 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-600 font-medium">Pending Leaves</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {getLeavesByStatus('pending').length}
          </div>
          <div className="text-sm text-gray-500">Awaiting approval</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
          <div className="flex items-center mb-4">
            <svg className="w-6 h-6 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-600 font-medium">Approved Leaves</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {getLeavesByStatus('approved').length}
          </div>
          <div className="text-sm text-gray-500">This month</div>
        </div>
      </div>

      {/* Date Selector */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6 flex items-center gap-4">
        <span className="text-gray-700 font-medium">Select Date:</span>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setTabValue(0)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                tabValue === 0 
                  ? 'bg-white text-gray-700 border-b-2 border-gray-700' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Attendance
            </button>
            <button
              onClick={() => setTabValue(1)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                tabValue === 1 
                  ? 'bg-white text-gray-700 border-b-2 border-gray-700' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Leave Requests
            </button>
            <button
              onClick={() => setTabValue(2)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                tabValue === 2 
                  ? 'bg-white text-gray-700 border-b-2 border-gray-700' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Staff Directory
            </button>
          </nav>
        </div>

        <TabPanel value={tabValue} index={0}>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Attendance for {new Date(selectedDate).toLocaleDateString()}
          </h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getAttendanceForDate(selectedDate).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="text-center">
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Attendance Records</h3>
                          <p className="text-gray-500">No attendance records found for the selected date.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    getAttendanceForDate(selectedDate).map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-medium mr-4">
                              {record.staff?.full_name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{record.staff?.full_name}</div>
                              <div className="text-sm text-gray-500">{record.staff?.employee_id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm ${record.check_in_time ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                            {record.check_in_time || 'Not checked in'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm ${record.check_out_time ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                            {record.check_out_time || 'Not checked out'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            record.check_in_time && record.check_out_time 
                              ? 'bg-green-100 text-green-800'
                              : record.check_in_time 
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}>
                            {getAttendanceStatus(record)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm ${record.notes ? 'text-gray-900' : 'text-gray-500 italic'} max-w-xs truncate`}>
                            {record.notes || 'No notes'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Leave Requests</h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaves.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="text-center">
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Leave Requests</h3>
                          <p className="text-gray-500">There are no leave requests to display.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    leaves.map((leave) => (
                      <tr key={leave.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-medium mr-4">
                              {leave.staff?.full_name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{leave.staff?.full_name}</div>
                              <div className="text-sm text-gray-500">{leave.staff?.employee_id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-1 rounded capitalize">
                            {leave.leave_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {new Date(leave.start_date).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              to {new Date(leave.end_date).toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900 max-w-xs truncate">
                            {leave.reason}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${
                            leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                            leave.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {leave.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {leave.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveLeave(leave.id)}
                                disabled={loading}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleRejectLeave(leave.id)}
                                disabled={loading}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Staff Directory</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staff.map((member) => (
              <div 
                key={member.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
              >
                <div className="flex items-center mb-6">
                  <div className="w-14 h-14 bg-gray-600 rounded-full flex items-center justify-center text-white text-xl font-medium mr-4">
                    {member.full_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{member.full_name}</h3>
                    <p className="text-gray-500 text-sm">ID: {member.employee_id}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">Department</span>
                    <span className="text-gray-900 font-medium text-sm">{member.department?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">Role</span>
                    <span className="text-gray-900 font-medium text-sm">{member.role?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">Salary</span>
                    <span className="text-gray-700 font-semibold text-sm">₹{member.salary.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-500 text-sm mb-2">Contact Information</p>
                  <div className="space-y-1">
                    <p className="text-gray-900 text-sm">{member.email}</p>
                    <p className="text-gray-900 text-sm">{member.phone}</p>
                  </div>
                </div>

                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${
                  member.employment_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {member.employment_status}
                </span>
              </div>
            ))}
          </div>
        </TabPanel>
      </div>
    </div>
  );
};

export default AdminHR;
