import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Paper,
  Tabs,
  Tab,
  Button,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Work as WorkIcon,
} from '@mui/icons-material';
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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const StaffManagement: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const handleCreateStaff = async () => {
    if (!newStaff.employee_id || !newStaff.first_name || !newStaff.last_name) {
      setError('Employee ID, First Name, and Last Name are required');
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
      setError(error.response?.data?.error || 'Failed to create staff');
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
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" color="error">
          Access Denied
        </Typography>
        <Typography variant="body1">
          You don't have permission to manage staff.
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Staff Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          aria-label="staff management tabs"
        >
          <Tab label="Staff" icon={<PeopleIcon />} />
          <Tab label="Departments" icon={<BusinessIcon />} />
          <Tab label="Roles" icon={<WorkIcon />} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Staff Members</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenStaffDialog(true)}
            >
              ADD STAFF
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
              {staff.map((member) => (
                <Card key={member.id}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ mr: 2 }}>
                        {member.first_name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6">
                          {member.full_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {member.employee_id}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Department:</strong> {member.department?.name}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Role:</strong> {member.role?.name}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Salary:</strong> ₹{member.salary}
                    </Typography>
                    <Chip
                      label={member.employment_status}
                      color={member.employment_status === 'active' ? 'success' : 'error'}
                      size="small"
                    />
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <IconButton size="small" onClick={() => {
                        setEditingStaff(member);
                        setOpenStaffDialog(true);
                      }}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteStaff(member.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Departments</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDeptDialog(true)}
            >
              ADD DEPARTMENT
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
              {departments.map((dept) => (
                <Card key={dept.id}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {dept.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {dept.description}
                    </Typography>
                    <Chip
                      label={dept.is_active ? 'Active' : 'Inactive'}
                      color={dept.is_active ? 'success' : 'error'}
                      size="small"
                    />
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <IconButton size="small" onClick={() => {
                        setEditingDept(dept);
                        setOpenDeptDialog(true);
                      }}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteDepartment(dept.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Roles</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenRoleDialog(true)}
            >
              ADD ROLE
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
              {roles.map((role) => (
                <Card key={role.id}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {role.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {role.description}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      <strong>Department:</strong> {role.department_name}
                    </Typography>
                    <Chip
                      label={role.is_active ? 'Active' : 'Inactive'}
                      color={role.is_active ? 'success' : 'error'}
                      size="small"
                    />
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <IconButton size="small" onClick={() => {
                        setEditingRole(role);
                        setOpenRoleDialog(true);
                      }}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteRole(role.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </TabPanel>
      </Paper>

      {/* Staff Dialog */}
      <Dialog open={openStaffDialog} onClose={() => setOpenStaffDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingStaff ? 'Edit Staff' : 'Add New Staff'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Employee ID"
              value={editingStaff ? editingStaff.employee_id : newStaff.employee_id}
              onChange={(e) => {
                if (editingStaff) {
                  setEditingStaff({ ...editingStaff, employee_id: e.target.value });
                } else {
                  setNewStaff({ ...newStaff, employee_id: e.target.value });
                }
              }}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Phone (Login)"
              value={editingStaff ? editingStaff.phone : newStaff.user_data.phone}
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
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="First Name"
              value={editingStaff ? editingStaff.first_name : newStaff.first_name}
              onChange={(e) => {
                if (editingStaff) {
                  setEditingStaff({ ...editingStaff, first_name: e.target.value });
                } else {
                  setNewStaff({ ...newStaff, first_name: e.target.value });
                }
              }}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Last Name"
              value={editingStaff ? editingStaff.last_name : newStaff.last_name}
              onChange={(e) => {
                if (editingStaff) {
                  setEditingStaff({ ...editingStaff, last_name: e.target.value });
                } else {
                  setNewStaff({ ...newStaff, last_name: e.target.value });
                }
              }}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={editingStaff ? editingStaff.email : newStaff.email}
              onChange={(e) => {
                if (editingStaff) {
                  setEditingStaff({ ...editingStaff, email: e.target.value });
                } else {
                  setNewStaff({ ...newStaff, email: e.target.value });
                }
              }}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Date of Birth"
              type="date"
              value={editingStaff ? editingStaff.date_of_birth : newStaff.date_of_birth}
              onChange={(e) => {
                if (editingStaff) {
                  setEditingStaff({ ...editingStaff, date_of_birth: e.target.value });
                } else {
                  setNewStaff({ ...newStaff, date_of_birth: e.target.value });
                }
              }}
              margin="normal"
              required
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Gender</InputLabel>
              <Select
                value={editingStaff ? editingStaff.gender : newStaff.gender}
                label="Gender"
                onChange={(e) => {
                  if (editingStaff) {
                    setEditingStaff({ ...editingStaff, gender: e.target.value as any });
                  } else {
                    setNewStaff({ ...newStaff, gender: e.target.value as any });
                  }
                }}
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Hire Date"
              type="date"
              value={editingStaff ? editingStaff.hire_date : newStaff.hire_date}
              onChange={(e) => {
                if (editingStaff) {
                  setEditingStaff({ ...editingStaff, hire_date: e.target.value });
                } else {
                  setNewStaff({ ...newStaff, hire_date: e.target.value });
                }
              }}
              margin="normal"
              required
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Salary"
              type="number"
              value={editingStaff ? editingStaff.salary : newStaff.salary}
              onChange={(e) => {
                if (editingStaff) {
                  setEditingStaff({ ...editingStaff, salary: parseFloat(e.target.value) });
                } else {
                  setNewStaff({ ...newStaff, salary: parseFloat(e.target.value) });
                }
              }}
              margin="normal"
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Department</InputLabel>
              <Select
                value={editingStaff ? editingStaff.department : newStaff.department}
                label="Department"
                onChange={(e) => {
                  if (editingStaff) {
                    setEditingStaff({ ...editingStaff, department: e.target.value as any });
                  } else {
                    setNewStaff({ ...newStaff, department: e.target.value as number });
                  }
                }}
              >
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Role</InputLabel>
              <Select
                value={editingStaff ? editingStaff.role : newStaff.role}
                label="Role"
                onChange={(e) => {
                  if (editingStaff) {
                    setEditingStaff({ ...editingStaff, role: e.target.value as any });
                  } else {
                    setNewStaff({ ...newStaff, role: e.target.value as number });
                  }
                }}
              >
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Address"
              multiline
              rows={3}
              value={editingStaff ? editingStaff.address : newStaff.address}
              onChange={(e) => {
                if (editingStaff) {
                  setEditingStaff({ ...editingStaff, address: e.target.value });
                } else {
                  setNewStaff({ ...newStaff, address: e.target.value });
                }
              }}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Emergency Contact Name"
              value={editingStaff ? editingStaff.emergency_contact_name : newStaff.emergency_contact_name}
              onChange={(e) => {
                if (editingStaff) {
                  setEditingStaff({ ...editingStaff, emergency_contact_name: e.target.value });
                } else {
                  setNewStaff({ ...newStaff, emergency_contact_name: e.target.value });
                }
              }}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Emergency Contact Phone"
              value={editingStaff ? editingStaff.emergency_contact_phone : newStaff.emergency_contact_phone}
              onChange={(e) => {
                if (editingStaff) {
                  setEditingStaff({ ...editingStaff, emergency_contact_phone: e.target.value });
                } else {
                  setNewStaff({ ...newStaff, emergency_contact_phone: e.target.value });
                }
              }}
              margin="normal"
              required
            />
            {!editingStaff && (
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={newStaff.user_data.password}
                onChange={(e) => {
                  setNewStaff({ 
                    ...newStaff, 
                    user_data: { ...newStaff.user_data, password: e.target.value }
                  });
                }}
                margin="normal"
                required
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStaffDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={editingStaff ? handleUpdateStaff : handleCreateStaff}
            variant="contained"
            disabled={loading}
          >
            {editingStaff ? 'Update Staff' : 'Create Staff'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Department Dialog */}
      <Dialog open={openDeptDialog} onClose={() => setOpenDeptDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingDept ? 'Edit Department' : 'Add New Department'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Department Name"
            value={editingDept ? editingDept.name : newDept.name}
            onChange={(e) => {
              if (editingDept) {
                setEditingDept({ ...editingDept, name: e.target.value });
              } else {
                setNewDept({ ...newDept, name: e.target.value });
              }
            }}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description (Optional)"
            value={editingDept ? editingDept.description || '' : newDept.description}
            onChange={(e) => {
              if (editingDept) {
                setEditingDept({ ...editingDept, description: e.target.value });
              } else {
                setNewDept({ ...newDept, description: e.target.value });
              }
            }}
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeptDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={editingDept ? () => {
              // Handle edit department
              setOpenDeptDialog(false);
            } : handleCreateDepartment}
            variant="contained"
            disabled={loading}
          >
            {editingDept ? 'Update Department' : 'Create Department'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Role Dialog */}
      <Dialog open={openRoleDialog} onClose={() => setOpenRoleDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingRole ? 'Edit Role' : 'Add New Role'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Role Name"
            value={editingRole ? editingRole.name : newRole.name}
            onChange={(e) => {
              if (editingRole) {
                setEditingRole({ ...editingRole, name: e.target.value });
              } else {
                setNewRole({ ...newRole, name: e.target.value });
              }
            }}
            margin="normal"
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Department</InputLabel>
            <Select
              value={editingRole ? editingRole.department : newRole.department}
              label="Department"
              onChange={(e) => {
                if (editingRole) {
                  setEditingRole({ ...editingRole, department: e.target.value as number });
                } else {
                  setNewRole({ ...newRole, department: e.target.value as number });
                }
              }}
            >
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Description (Optional)"
            value={editingRole ? editingRole.description || '' : newRole.description}
            onChange={(e) => {
              if (editingRole) {
                setEditingRole({ ...editingRole, description: e.target.value });
              } else {
                setNewRole({ ...newRole, description: e.target.value });
              }
            }}
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRoleDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={editingRole ? () => {
              // Handle edit role
              setOpenRoleDialog(false);
            } : handleCreateRole}
            variant="contained"
            disabled={loading}
          >
            {editingRole ? 'Update Role' : 'Create Role'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StaffManagement;
