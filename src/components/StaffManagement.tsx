import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import { Staff, Department, Role } from '../types';

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
      id={`staff-tabpanel-${index}`}
      aria-labelledby={`staff-tab-${index}`}
      {...other}
    >
      {value === index && <div className="p-6">{children}</div>}
    </div>
  );
}

const StaffManagement: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Helpers
  const formatINRCurrency = (value: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(value) ? value : 0);

  // Staff state
  const [staff, setStaff] = useState<Staff[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [openStaffDialog, setOpenStaffDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [newStaff, setNewStaff] = useState({
    employee_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: 'male' as 'male' | 'female' | 'other',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    department: 1,
    role: 1,
    hire_date: '',
    salary: 0,
    user_data: {
      phone: '',
      password: '',
    },
  });

  // Department state
  const [openDeptDialog, setOpenDeptDialog] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [newDept, setNewDept] = useState({
    name: '',
    description: '',
  });

  // Role state
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    department: 1,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [staffData, deptData, roleData] = await Promise.all([
        apiService.getStaff(),
        apiService.getDepartments(),
        apiService.getRoles(),
      ]);
      setStaff(staffData);
      setDepartments(deptData);
      setRoles(roleData);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Check if phone number already exists
  const checkPhoneExists = async (phone: string): Promise<boolean> => {
    try {
      // Use API endpoint to check phone uniqueness
      return await apiService.checkPhoneExists(phone);
    } catch (error) {
      console.error('Error checking phone existence:', error);
      // Fallback: check against existing staff data
      const existingStaff = staff.find(s => s.phone === phone || s.user?.phone === phone);
      return !!existingStaff;
    }
  };

  const handleCreateStaff = async () => {
    // Validate all required fields
    const requiredFields = [
      { field: 'employee_id', label: 'Employee ID' },
      { field: 'first_name', label: 'First Name' },
      { field: 'last_name', label: 'Last Name' },
      { field: 'email', label: 'Email' },
      { field: 'date_of_birth', label: 'Date of Birth' },
      { field: 'address', label: 'Address' },
      { field: 'emergency_contact_name', label: 'Emergency Contact Name' },
      { field: 'emergency_contact_phone', label: 'Emergency Contact Phone' },
      { field: 'hire_date', label: 'Hire Date' },
      { field: 'salary', label: 'Salary' }
    ];

    const missingFields = requiredFields.filter(({ field }) => !newStaff[field as keyof typeof newStaff]);
    
    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    // Validate user_data
    if (!newStaff.user_data.phone || !newStaff.user_data.password) {
      setError('Phone number and password are required for user account');
      return;
    }

    // Check if phone number already exists
    const phoneExists = await checkPhoneExists(newStaff.user_data.phone);
    if (phoneExists) {
      setError('Phone number already exists. Please use a different phone number.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newStaff.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate salary is positive
    if (newStaff.salary <= 0) {
      setError('Salary must be greater than 0');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Update phone field from user_data.phone
      const staffData = {
        ...newStaff,
        phone: newStaff.user_data.phone || newStaff.phone
      };
      
      // Debug: Log the data being sent
      console.log('Sending staff data:', staffData);
      
      await apiService.createStaff(staffData);
      setSuccess('Staff created successfully!');
      setOpenStaffDialog(false);
      setNewStaff({
        employee_id: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        gender: 'male',
        address: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        department: 1,
        role: 1,
        hire_date: '',
        salary: 0,
        user_data: {
          phone: '',
          password: '',
        },
      });
      loadData();
    } catch (error: any) {
      console.error('Staff creation error:', error.response?.data);
      console.error('Full error object:', error);
      
      // Handle different types of validation errors
      if (error.response?.data?.email) {
        setError(`Email error: ${error.response.data.email.join(', ')}`);
      } else if (error.response?.data?.employee_id) {
        setError(`Employee ID error: ${error.response.data.employee_id.join(', ')}`);
      } else if (error.response?.data?.phone) {
        setError(`Phone error: ${error.response.data.phone.join(', ')}`);
      } else if (error.response?.data?.user_data) {
        setError(`User data error: ${JSON.stringify(error.response.data.user_data)}`);
      } else {
        setError(error.response?.data?.error || error.response?.data?.detail || 'Failed to create staff');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStaff = async () => {
    if (!editingStaff) return;
    
    if (!editingStaff.employee_id || !editingStaff.first_name || !editingStaff.last_name) {
      setError('Employee ID, First Name, and Last Name are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiService.updateStaff(editingStaff.id, editingStaff);
      setSuccess('Staff updated successfully!');
      setOpenStaffDialog(false);
      setEditingStaff(null);
      loadData();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update staff');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDepartment = async () => {
    if (!newDept.name.trim()) {
      setError('Department name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiService.createDepartment(newDept);
      setSuccess('Department created successfully!');
      setOpenDeptDialog(false);
      setNewDept({ name: '', description: '' });
      loadData();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create department');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    if (!newRole.name.trim()) {
      setError('Role name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiService.createRole(newRole);
      setSuccess('Role created successfully!');
      setOpenRoleDialog(false);
      setNewRole({ name: '', description: '', department: 1 });
      loadData();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create role');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async (staffId: number) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiService.deleteStaff(staffId);
      setSuccess('Staff deleted successfully!');
      loadData();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to delete staff');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDepartment = async (deptId: number) => {
    if (!window.confirm('Are you sure you want to delete this department?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiService.deleteDepartment(deptId);
      setSuccess('Department deleted successfully!');
      loadData();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to delete department');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (!window.confirm('Are you sure you want to delete this role?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiService.deleteRole(roleId);
      setSuccess('Role deleted successfully!');
      loadData();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to delete role');
    } finally {
      setLoading(false);
    }
  };

  if (!user?.is_superuser && !user?.cafe_manager) {
    return (
      <div className="min-h-screen text-white p-6">
        <div className="max-w-4xl mx-auto text-center mt-20">
          <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-8">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h2>
            <p className="text-gray-400">You don't have permission to manage staff.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Staff Management</h1>
              <p className="text-gray-400 text-lg">Manage employees, departments, and roles</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700/50 text-red-200 rounded-lg backdrop-blur-sm flex items-center gap-3">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-900/50 border border-green-700/50 text-green-200 rounded-lg backdrop-blur-sm flex items-center gap-3">
            <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="border-b border-gray-700">
            <nav className="flex">
              <button
                onClick={() => setTabValue(0)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                  tabValue === 0
                    ? 'bg-blue-600 text-white border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Staff
              </button>
              <button
                onClick={() => setTabValue(1)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                  tabValue === 1
                    ? 'bg-blue-600 text-white border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Departments
              </button>
              <button
                onClick={() => setTabValue(2)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                  tabValue === 2
                    ? 'bg-blue-600 text-white border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                </svg>
                Roles
              </button>
            </nav>
          </div>

        <TabPanel value={tabValue} index={0}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">Staff Members</h2>
            <button
              onClick={() => setOpenStaffDialog(true)}
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center gap-2 font-medium shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              ADD STAFF
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-600 border-t-blue-500"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {staff.map((member) => (
                <div key={member.id} className="bg-gray-700 rounded-xl p-6 border border-gray-600 hover:border-gray-500 transition-all duration-200 hover:shadow-xl hover:transform hover:scale-105 group">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-semibold">
                      {member.first_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {member.full_name}
                      </h3>
                      <p className="text-gray-400 text-sm">ID: {member.employee_id}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/50 rounded-lg p-4 mb-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Department</span>
                      <span className="text-white font-medium">{member.department?.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Role</span>
                      <span className="text-white font-medium">{member.role?.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Salary</span>
                      <span className="text-green-400 font-semibold">₹{member.salary.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      member.employment_status === 'active' 
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      {member.employment_status === 'active' ? '🟢 Active' : '🔴 Inactive'}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingStaff(member);
                          setOpenStaffDialog(true);
                        }}
                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 rounded-lg transition-all duration-200"
                        title="Edit Staff"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(member.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg transition-all duration-200"
                        title="Delete Staff"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">Departments</h2>
            <button
              onClick={() => setOpenDeptDialog(true)}
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center gap-2 font-medium shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              ADD DEPARTMENT
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-600 border-t-blue-500"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {departments.map((dept) => (
                <div key={dept.id} className="bg-gray-700 rounded-xl p-6 border border-gray-600 hover:border-gray-500 transition-all duration-200 hover:shadow-xl hover:transform hover:scale-105">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">{dept.name}</h3>
                      <p className="text-gray-400 text-sm mb-3">{dept.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      dept.is_active 
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      {dept.is_active ? '🟢 Active' : '🔴 Inactive'}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingDept(dept);
                          setOpenDeptDialog(true);
                        }}
                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 rounded-lg transition-all duration-200"
                        title="Edit Department"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteDepartment(dept.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg transition-all duration-200"
                        title="Delete Department"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">Roles</h2>
            <button
              onClick={() => setOpenRoleDialog(true)}
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center gap-2 font-medium shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              ADD ROLE
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-600 border-t-blue-500"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roles.map((role) => (
                <div key={role.id} className="bg-gray-700 rounded-xl p-6 border border-gray-600 hover:border-gray-500 transition-all duration-200 hover:shadow-xl hover:transform hover:scale-105">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white mb-2">{role.name}</h3>
                    <p className="text-gray-400 text-sm mb-2">{role.description}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400">Department:</span>
                      <span className="text-white font-medium">{role.department_name}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      role.is_active 
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      {role.is_active ? '🟢 Active' : '🔴 Inactive'}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingRole(role);
                          setOpenRoleDialog(true);
                        }}
                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 rounded-lg transition-all duration-200"
                        title="Edit Role"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg transition-all duration-200"
                        title="Delete Role"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabPanel>
        </div>
      </div>

      {/* Staff Dialog */}
      {openStaffDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-700 shadow-2xl">
            {/* Dialog Header */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-600 rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
                    </h2>
                    <p className="text-gray-400 text-sm">
                      {editingStaff ? 'Update staff member information' : 'Create a new staff member for your restaurant'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOpenStaffDialog(false)}
                  className="p-1 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Dialog Content */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    value={editingStaff?.employee_id || newStaff.employee_id}
                    onChange={(e) => {
                      if (editingStaff) {
                        setEditingStaff({ ...editingStaff, employee_id: e.target.value });
                      } else {
                        setNewStaff({ ...newStaff, employee_id: e.target.value });
                      }
                    }}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="e.g., EMP001"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Phone (Login) *
                  </label>
                  <input
                    type="tel"
                    value={editingStaff?.phone || newStaff.user_data.phone}
                    onChange={(e) => {
                      if (editingStaff) {
                        setEditingStaff({ ...editingStaff, phone: e.target.value });
                      } else {
                        setNewStaff({ 
                          ...newStaff, 
                          user_data: { ...newStaff.user_data, phone: e.target.value }
                        });
                      }
                    }}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="e.g., +91 9876543210"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={editingStaff?.first_name || newStaff.first_name}
                    onChange={(e) => {
                      if (editingStaff) {
                        setEditingStaff({ ...editingStaff, first_name: e.target.value });
                      } else {
                        setNewStaff({ ...newStaff, first_name: e.target.value });
                      }
                    }}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="First name"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={editingStaff?.last_name || newStaff.last_name}
                    onChange={(e) => {
                      if (editingStaff) {
                        setEditingStaff({ ...editingStaff, last_name: e.target.value });
                      } else {
                        setNewStaff({ ...newStaff, last_name: e.target.value });
                      }
                    }}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Last name"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={editingStaff?.email || newStaff.email}
                    onChange={(e) => {
                      if (editingStaff) {
                        setEditingStaff({ ...editingStaff, email: e.target.value });
                      } else {
                        setNewStaff({ ...newStaff, email: e.target.value });
                      }
                    }}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    value={editingStaff?.date_of_birth || newStaff.date_of_birth}
                    onChange={(e) => {
                      if (editingStaff) {
                        setEditingStaff({ ...editingStaff, date_of_birth: e.target.value });
                      } else {
                        setNewStaff({ ...newStaff, date_of_birth: e.target.value });
                      }
                    }}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Gender *
                  </label>
                  <select
                    value={editingStaff?.gender || newStaff.gender}
                    onChange={(e) => {
                      if (editingStaff) {
                        setEditingStaff({ ...editingStaff, gender: e.target.value as any });
                      } else {
                        setNewStaff({ ...newStaff, gender: e.target.value as any });
                      }
                    }}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Hire Date *
                  </label>
                  <input
                    type="date"
                    value={editingStaff?.hire_date || newStaff.hire_date}
                    onChange={(e) => {
                      if (editingStaff) {
                        setEditingStaff({ ...editingStaff, hire_date: e.target.value });
                      } else {
                        setNewStaff({ ...newStaff, hire_date: e.target.value });
                      }
                    }}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Salary *
                  </label>
                  <input
                    type="number"
                    value={editingStaff?.salary || newStaff.salary}
                    onChange={(e) => {
                      if (editingStaff) {
                        setEditingStaff({ ...editingStaff, salary: parseFloat(e.target.value) });
                      } else {
                        setNewStaff({ ...newStaff, salary: parseFloat(e.target.value) });
                      }
                    }}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Monthly salary"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Department *
                  </label>
                  <select
                    value={editingStaff ? (typeof editingStaff.department === 'object' ? editingStaff.department.id : editingStaff.department) : newStaff.department}
                    onChange={(e) => {
                      if (editingStaff) {
                        setEditingStaff({ ...editingStaff, department: parseInt(e.target.value) as any });
                      } else {
                        setNewStaff({ ...newStaff, department: parseInt(e.target.value) });
                      }
                    }}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Role *
                  </label>
                  <select
                    value={editingStaff ? (typeof editingStaff.role === 'object' ? editingStaff.role.id : editingStaff.role) : newStaff.role}
                    onChange={(e) => {
                      if (editingStaff) {
                        setEditingStaff({ ...editingStaff, role: parseInt(e.target.value) as any });
                      } else {
                        setNewStaff({ ...newStaff, role: parseInt(e.target.value) });
                      }
                    }}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Address *
                  </label>
                  <textarea
                    rows={3}
                    value={editingStaff?.address || newStaff.address}
                    onChange={(e) => {
                      if (editingStaff) {
                        setEditingStaff({ ...editingStaff, address: e.target.value });
                      } else {
                        setNewStaff({ ...newStaff, address: e.target.value });
                      }
                    }}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Full address"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Emergency Contact Name *
                  </label>
                  <input
                    type="text"
                    value={editingStaff?.emergency_contact_name || newStaff.emergency_contact_name}
                    onChange={(e) => {
                      if (editingStaff) {
                        setEditingStaff({ ...editingStaff, emergency_contact_name: e.target.value });
                      } else {
                        setNewStaff({ ...newStaff, emergency_contact_name: e.target.value });
                      }
                    }}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Emergency contact name"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Emergency Contact Phone *
                  </label>
                  <input
                    type="tel"
                    value={editingStaff?.emergency_contact_phone || newStaff.emergency_contact_phone}
                    onChange={(e) => {
                      if (editingStaff) {
                        setEditingStaff({ ...editingStaff, emergency_contact_phone: e.target.value });
                      } else {
                        setNewStaff({ ...newStaff, emergency_contact_phone: e.target.value });
                      }
                    }}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Emergency contact phone"
                  />
                </div>

                {!editingStaff && (
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Password *
                    </label>
                    <input
                      type="password"
                      value={newStaff.user_data.password}
                      onChange={(e) => {
                        setNewStaff({ 
                          ...newStaff, 
                          user_data: { ...newStaff.user_data, password: e.target.value }
                        });
                      }}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="Login password"
                    />
                  </div>
                )}
              </div>
            </div>
            
            {/* Dialog Footer */}
            <div className="p-6 border-t border-gray-700 bg-gray-800/50">
              <div className="flex gap-3">
                <button
                  onClick={() => setOpenStaffDialog(false)}
                  className="flex-1 px-4 py-3 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-700 hover:border-gray-500 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={editingStaff ? handleUpdateStaff : handleCreateStaff}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingStaff ? 'Updating...' : 'Creating...'}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      {editingStaff ? 'Update Staff' : 'Create Staff'}
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Department Dialog */}
      {openDeptDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl max-w-md w-full border border-gray-700 shadow-2xl">
            {/* Dialog Header */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {editingDept ? 'Edit Department' : 'Add New Department'}
                    </h2>
                    <p className="text-gray-400 text-sm">
                      {editingDept ? 'Update department information' : 'Create a new department'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOpenDeptDialog(false)}
                  className="p-1 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Dialog Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Department Name *
                </label>
                <input
                  type="text"
                  value={editingDept?.name || newDept.name}
                  onChange={(e) => {
                    if (editingDept) {
                      setEditingDept({ ...editingDept, name: e.target.value });
                    } else {
                      setNewDept({ ...newDept, name: e.target.value });
                    }
                  }}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g., Kitchen, Service, Management"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={editingDept?.description || newDept.description}
                  onChange={(e) => {
                    if (editingDept) {
                      setEditingDept({ ...editingDept, description: e.target.value });
                    } else {
                      setNewDept({ ...newDept, description: e.target.value });
                    }
                  }}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Brief description of the department"
                />
              </div>
            </div>
            
            {/* Dialog Footer */}
            <div className="p-6 border-t border-gray-700 bg-gray-800/50">
              <div className="flex gap-3">
                <button
                  onClick={() => setOpenDeptDialog(false)}
                  className="flex-1 px-4 py-3 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-700 hover:border-gray-500 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={editingDept ? () => {
                    // Handle edit department
                    setOpenDeptDialog(false);
                  } : handleCreateDepartment}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingDept ? 'Updating...' : 'Creating...'}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      {editingDept ? 'Update Department' : 'Create Department'}
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Dialog */}
      {openRoleDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl max-w-md w-full border border-gray-700 shadow-2xl">
            {/* Dialog Header */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {editingRole ? 'Edit Role' : 'Add New Role'}
                    </h2>
                    <p className="text-gray-400 text-sm">
                      {editingRole ? 'Update role information' : 'Create a new role'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOpenRoleDialog(false)}
                  className="p-1 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Dialog Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Role Name *
                </label>
                <input
                  type="text"
                  value={editingRole?.name || newRole.name}
                  onChange={(e) => {
                    if (editingRole) {
                      setEditingRole({ ...editingRole, name: e.target.value });
                    } else {
                      setNewRole({ ...newRole, name: e.target.value });
                    }
                  }}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="e.g., Chef, Waiter, Manager"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Department *
                </label>
                <select
                  value={editingRole?.department || newRole.department}
                  onChange={(e) => {
                    if (editingRole) {
                      setEditingRole({ ...editingRole, department: parseInt(e.target.value) });
                    } else {
                      setNewRole({ ...newRole, department: parseInt(e.target.value) });
                    }
                  }}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={editingRole?.description || newRole.description}
                  onChange={(e) => {
                    if (editingRole) {
                      setEditingRole({ ...editingRole, description: e.target.value });
                    } else {
                      setNewRole({ ...newRole, description: e.target.value });
                    }
                  }}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Brief description of the role"
                />
              </div>
            </div>
            
            {/* Dialog Footer */}
            <div className="p-6 border-t border-gray-700 bg-gray-800/50">
              <div className="flex gap-3">
                <button
                  onClick={() => setOpenRoleDialog(false)}
                  className="flex-1 px-4 py-3 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-700 hover:border-gray-500 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={editingRole ? () => {
                    // Handle edit role
                    setOpenRoleDialog(false);
                  } : handleCreateRole}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingRole ? 'Updating...' : 'Creating...'}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      {editingRole ? 'Update Role' : 'Create Role'}
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
