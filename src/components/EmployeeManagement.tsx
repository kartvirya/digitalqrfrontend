import React, { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  UserPlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import apiService from '../services/api';

interface Employee {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  date_of_birth: string;
  hire_date: string;
  employment_status: string;
  department_name: string;
  role_name: string;
  salary: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  full_name: string;
}

interface Department {
  id: number;
  name: string;
}

interface Position {
  id: number;
  name: string;
  department: number;
}

const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [newEmployee, setNewEmployee] = useState({
    employee_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    gender: 'male',
    date_of_birth: '',
    hire_date: '',
    department: '',
    role: '',
    salary: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    user_data: {
      phone: '',
      password: ''
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [employeesData, departmentsData, rolesData] = await Promise.all([
        apiService.getEmployees(),
        apiService.getDepartments(),
        apiService.getRoles(),
      ]);

      setEmployees(employeesData);
      setDepartments(departmentsData);
      setPositions(rolesData);
    } catch (error: any) {
      console.error('Employee data loading error:', error);
      setError('Failed to load employee data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = 
      employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = !selectedDepartment || employee.department_name === selectedDepartment;
    const matchesStatus = !selectedStatus || employee.employment_status === selectedStatus;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const handleCreateEmployee = async () => {
    try {
      setLoading(true);
      await apiService.createEmployee(newEmployee);
      setShowAddModal(false);
      setNewEmployee({
        employee_id: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        gender: 'male',
        date_of_birth: '',
        hire_date: '',
        department: '',
        role: '',
        salary: '',
        address: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        user_data: {
          phone: '',
          password: ''
        }
      });
      await loadData();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to create employee');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (employeeId: number) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await apiService.deleteEmployee(employeeId);
        await loadData();
      } catch (error: any) {
        setError('Failed to delete employee');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'inactive': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'terminated': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'on_leave': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'probation': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const AddEmployeeModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <UserPlusIcon className="h-6 w-6 text-red-400 mr-2" />
            Add New Employee
          </h2>
          <button
            onClick={() => setShowAddModal(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700/50 pb-2">
              Personal Information
            </h3>
            
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Employee ID *
              </label>
              <input
                type="text"
                value={newEmployee.employee_id}
                onChange={(e) => setNewEmployee({...newEmployee, employee_id: e.target.value})}
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                placeholder="EMP001"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Employee ID *
              </label>
              <input
                type="text"
                value={newEmployee.employee_id}
                onChange={(e) => setNewEmployee({...newEmployee, employee_id: e.target.value})}
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                placeholder="EMP001"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={newEmployee.first_name}
                  onChange={(e) => setNewEmployee({...newEmployee, first_name: e.target.value})}
                  className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={newEmployee.last_name}
                  onChange={(e) => setNewEmployee({...newEmployee, last_name: e.target.value})}
                  className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Email *
              </label>
              <input
                type="email"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                placeholder="john.doe@company.com"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Phone *
                </label>
                <input
                  type="tel"
                  value={newEmployee.phone}
                  onChange={(e) => setNewEmployee({
                    ...newEmployee, 
                    phone: e.target.value,
                    user_data: { ...newEmployee.user_data, phone: e.target.value }
                  })}
                  className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                  placeholder="9876543210"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Gender
                </label>
                <select
                  value={newEmployee.gender}
                  onChange={(e) => setNewEmployee({...newEmployee, gender: e.target.value})}
                  className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Date of Birth *
              </label>
              <input
                type="date"
                value={newEmployee.date_of_birth}
                onChange={(e) => setNewEmployee({...newEmployee, date_of_birth: e.target.value})}
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
              />
            </div>
          </div>

          {/* Employment Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700/50 pb-2">
              Employment Information
            </h3>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Department *
              </label>
              <select
                value={newEmployee.department}
                onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})}
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Position *
              </label>
              <select
                value={newEmployee.role}
                onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
              >
                <option value="">Select Position</option>
                {positions
                  .filter(pos => !newEmployee.department || pos.department.toString() === newEmployee.department)
                  .map(pos => (
                    <option key={pos.id} value={pos.id}>{pos.name}</option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Hire Date *
              </label>
              <input
                type="date"
                value={newEmployee.hire_date}
                onChange={(e) => setNewEmployee({...newEmployee, hire_date: e.target.value})}
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Base Salary *
                </label>
                <input
                  type="number"
                                  value={newEmployee.salary}
                onChange={(e) => setNewEmployee({...newEmployee, salary: e.target.value})}
                  className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                  placeholder="50000"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Current Salary *
                </label>
                <input
                  type="number"
                                  value={newEmployee.salary}
                onChange={(e) => setNewEmployee({...newEmployee, salary: e.target.value})}
                  className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                  placeholder="55000"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Address *
              </label>
              <textarea
                value={newEmployee.address}
                onChange={(e) => setNewEmployee({...newEmployee, address: e.target.value})}
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                rows={3}
                placeholder="123 Main Street, City, State, PIN"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Emergency Contact Name *
              </label>
              <input
                type="text"
                value={newEmployee.emergency_contact_name}
                onChange={(e) => setNewEmployee({...newEmployee, emergency_contact_name: e.target.value})}
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                placeholder="Jane Doe"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Emergency Contact Phone *
              </label>
              <input
                type="tel"
                value={newEmployee.emergency_contact_phone}
                onChange={(e) => setNewEmployee({...newEmployee, emergency_contact_phone: e.target.value})}
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                placeholder="9876543210"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Password for User Account *
              </label>
              <input
                type="password"
                value={newEmployee.user_data.password}
                onChange={(e) => setNewEmployee({
                  ...newEmployee,
                  user_data: { ...newEmployee.user_data, password: e.target.value }
                })}
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                placeholder="Enter password"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-8">
          <button
            onClick={() => setShowAddModal(false)}
            className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateEmployee}
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Employee'}
          </button>
        </div>
      </div>
    </div>
  );

  const ViewEmployeeModal = () => (
    selectedEmployee && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <EyeIcon className="h-6 w-6 text-red-400 mr-2" />
              Employee Details
            </h2>
            <button
              onClick={() => setShowViewModal(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-700/50 pb-2">
                  Personal Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-400 text-sm">Employee ID:</span>
                    <p className="text-white font-medium">{selectedEmployee.employee_id}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Full Name:</span>
                    <p className="text-white font-medium">{selectedEmployee.full_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Email:</span>
                    <p className="text-white">{selectedEmployee.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Phone:</span>
                    <p className="text-white">{selectedEmployee.phone}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Gender:</span>
                    <p className="text-white capitalize">{selectedEmployee.gender}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Date of Birth:</span>
                    <p className="text-white">{new Date(selectedEmployee.date_of_birth).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-700/50 pb-2">
                  Emergency Contact
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-400 text-sm">Contact Name:</span>
                    <p className="text-white">{selectedEmployee.emergency_contact_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Contact Phone:</span>
                    <p className="text-white">{selectedEmployee.emergency_contact_phone}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-700/50 pb-2">
                  Employment Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-400 text-sm">Department:</span>
                    <p className="text-white">{selectedEmployee.department_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Position:</span>
                    <p className="text-white">{selectedEmployee.role_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Status:</span>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedEmployee.employment_status)}`}>
                      {selectedEmployee.employment_status}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Hire Date:</span>
                    <p className="text-white">{new Date(selectedEmployee.hire_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Employee ID:</span>
                    <p className="text-white">{selectedEmployee.employee_id}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Salary:</span>
                    <p className="text-white font-medium">₹{selectedEmployee.salary ? parseFloat(selectedEmployee.salary).toLocaleString() : 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-700/50 pb-2">
                  Address
                </h3>
                <p className="text-white">{selectedEmployee.address}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <button
              onClick={() => setShowViewModal(false)}
              className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  );

  const EditEmployeeModal = () => (
    selectedEmployee && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <PencilIcon className="h-6 w-6 text-red-400 mr-2" />
              Edit Employee
            </h2>
            <button
              onClick={() => setShowEditModal(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-gray-700/50 pb-2">
                  Personal Information
                </h3>
                
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    defaultValue={selectedEmployee.employee_id}
                    className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                    placeholder="EMP001"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      defaultValue={selectedEmployee.first_name}
                      className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      defaultValue={selectedEmployee.last_name}
                      className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    defaultValue={selectedEmployee.email}
                    className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                    placeholder="john.doe@company.com"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    defaultValue={selectedEmployee.phone}
                    className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                    placeholder="+1234567890"
                  />
                </div>
              </div>

              {/* Employment Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-gray-700/50 pb-2">
                  Employment Information
                </h3>
                
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Department
                  </label>
                  <select className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50">
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id} selected={dept.name === selectedEmployee.department_name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Position
                  </label>
                  <select className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50">
                    {positions.map(pos => (
                      <option key={pos.id} value={pos.id} selected={pos.name === selectedEmployee.role_name}>
                        {pos.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Employment Status
                  </label>
                  <select className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50">
                    <option value="active" selected={selectedEmployee.employment_status === 'active'}>Active</option>
                    <option value="inactive" selected={selectedEmployee.employment_status === 'inactive'}>Inactive</option>
                    <option value="terminated" selected={selectedEmployee.employment_status === 'terminated'}>Terminated</option>
                    <option value="probation" selected={selectedEmployee.employment_status === 'probation'}>Probation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Salary
                  </label>
                  <input
                    type="number"
                    defaultValue={selectedEmployee.salary}
                    className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                    placeholder="50000"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-700/50">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // TODO: Implement update functionality
                  alert('Update functionality will be implemented here');
                  setShowEditModal(false);
                }}
                className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200"
              >
                Update Employee
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center">
            <UserGroupIcon className="h-8 w-8 text-red-400 mr-3" />
            Employee Management
          </h1>
          <p className="text-gray-400">Manage your organization's employee records</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="mb-6 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-4">
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="terminated">Terminated</option>
                  <option value="on_leave">On Leave</option>
                  <option value="probation">Probation</option>
                </select>
              </div>
            </div>

            {/* Add Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <UserPlusIcon className="h-5 w-5 mr-2" />
              Add Employee
            </button>
          </div>
        </div>

        {/* Employees Table */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-700 to-gray-800 border-b border-gray-700/50">
                <tr>
                  <th className="text-left py-4 px-6 text-gray-300 font-medium">Employee</th>
                  <th className="text-left py-4 px-6 text-gray-300 font-medium">Department</th>
                  <th className="text-left py-4 px-6 text-gray-300 font-medium">Position</th>
                  <th className="text-left py-4 px-6 text-gray-300 font-medium">Status</th>
                  <th className="text-left py-4 px-6 text-gray-300 font-medium">Hire Date</th>
                  <th className="text-left py-4 px-6 text-gray-300 font-medium">Salary</th>
                  <th className="text-left py-4 px-6 text-gray-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee, index) => (
                  <tr key={employee.id} className={`border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors ${index % 2 === 0 ? 'bg-gray-800/30' : ''}`}>
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-white font-medium">{employee.full_name}</p>
                        <p className="text-gray-400 text-sm">{employee.employee_id}</p>
                        <p className="text-gray-400 text-sm">{employee.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-300">{employee.department_name}</td>
                    <td className="py-4 px-6 text-gray-300">{employee.role_name}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(employee.employment_status)}`}>
                        {employee.employment_status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-300">
                      {new Date(employee.hire_date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-gray-300 font-medium">
                      ₹{employee.salary ? parseFloat(employee.salary).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedEmployee(employee);
                            setShowViewModal(true);
                          }}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedEmployee(employee);
                            setShowEditModal(true);
                          }}
                          className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(employee.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEmployees.length === 0 && (
            <div className="text-center py-12">
              <UserGroupIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No employees found</p>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mt-4 text-center">
          <p className="text-gray-400">
            Showing {filteredEmployees.length} of {employees.length} employees
          </p>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && <AddEmployeeModal />}
      {showViewModal && <ViewEmployeeModal />}
      {showEditModal && <EditEmployeeModal />}
    </div>
  );
};

export default EmployeeManagement;
