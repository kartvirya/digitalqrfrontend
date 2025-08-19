import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Paper,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Login as LoginIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Event as EventIcon,
  Work as WorkIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
} from '@mui/icons-material';
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
      id={`staff-tabpanel-${index}`}
      aria-labelledby={`staff-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const StaffPortal: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loginData, setLoginData] = useState({ phone: '', password: '' });
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [leaveDialog, setLeaveDialog] = useState(false);
  const [newLeave, setNewLeave] = useState({
    leave_type: '' as 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'other',
    start_date: '',
    end_date: '',
    reason: '',
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      const user = await apiService.getCurrentUser();
      if (user && user.staff_profile) {
        setStaff(user.staff_profile);
        setIsLoggedIn(true);
        loadStaffData();
      }
    } catch (error) {
      console.log('Not logged in as staff');
    }
  }, []);

  const loadStaffData = async () => {
    if (!staff) return;
    
    try {
      setLoading(true);
      // Load attendance and leave data
      const [attendanceData, leaveData] = await Promise.all([
        apiService.getStaffAttendance(staff.id),
        apiService.getStaffLeaves(staff.id),
      ]);
      setAttendance(attendanceData);
      setLeaves(leaveData);
    } catch (error: any) {
      setError('Failed to load staff data');
    } finally {
      setLoading(false);
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
      const user = await apiService.login(loginData.phone, loginData.password);
      if (user.staff_profile) {
        setStaff(user.staff_profile);
        setIsLoggedIn(true);
        setSuccess('Login successful!');
        loadStaffData();
      } else {
        setError('This account is not associated with staff');
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
      setIsLoggedIn(false);
      setStaff(null);
      setAttendance([]);
      setLeaves([]);
      setSuccess('Logged out successfully');
    } catch (error: any) {
      setError('Logout failed');
    }
  };

  const handleCheckIn = async () => {
    if (!staff) return;

    setLoading(true);
    setError('');

    try {
      await apiService.checkIn(staff.id);
      setSuccess('Check-in successful!');
      loadStaffData();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!staff) return;

    setLoading(true);
    setError('');

    try {
      await apiService.checkOut(staff.id);
      setSuccess('Check-out successful!');
      loadStaffData();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Check-out failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestLeave = async () => {
    if (!staff) return;

    if (!newLeave.leave_type || !newLeave.start_date || !newLeave.end_date || !newLeave.reason) {
      setError('Please fill all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiService.createLeave({
        ...newLeave,
        staff: staff.id,
      } as any);
      setSuccess('Leave request submitted successfully!');
      setLeaveDialog(false);
      setNewLeave({ leave_type: '' as 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'other', start_date: '', end_date: '', reason: '' });
      loadStaffData();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to submit leave request');
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

  const getLeaveStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (!isLoggedIn) {
    return (
      <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4, p: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <WorkIcon sx={{ mr: 2, fontSize: 40, color: 'primary.main' }} />
              <Typography variant="h4">Staff Portal</Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <TextField
              fullWidth
              label="Phone Number"
              value={loginData.phone}
              onChange={(e) => setLoginData({ ...loginData, phone: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              margin="normal"
            />
            <Button
              fullWidth
              variant="contained"
              onClick={handleLogin}
              disabled={loading}
              sx={{ mt: 2 }}
              startIcon={<LoginIcon />}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4, p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="h5">{staff?.full_name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {staff?.employee_id} • {staff?.department?.name} • {staff?.role?.name}
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
          >
            Logout
          </Button>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Quick Actions */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Quick Actions</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleCheckIn}
                disabled={loading}
                startIcon={<CheckCircleIcon />}
              >
                Check In
              </Button>
              <Button
                variant="outlined"
                onClick={handleCheckOut}
                disabled={loading}
                startIcon={<CancelIcon />}
              >
                Check Out
              </Button>
              <Button
                variant="outlined"
                onClick={() => setLeaveDialog(true)}
                startIcon={<AddIcon />}
              >
                Request Leave
              </Button>
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Today's Status</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ScheduleIcon color="primary" />
              <Typography>
                {attendance.find(a => a.date === new Date().toISOString().split('T')[0])?.check_in_time 
                  ? 'Checked In' 
                  : 'Not Checked In'}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Attendance" />
          <Tab label="Leave Requests" />
          <Tab label="Profile" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" sx={{ mb: 2 }}>Attendance History</Typography>
          <List>
            {attendance.map((record) => (
              <ListItem key={record.id} divider>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: record.check_in_time ? 'success.main' : 'grey.300' }}>
                    <ScheduleIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={new Date(record.date).toLocaleDateString()}
                  secondary={
                    <Box>
                      <Typography variant="body2">
                        Check In: {record.check_in_time || 'Not checked in'}
                      </Typography>
                      <Typography variant="body2">
                        Check Out: {record.check_out_time || 'Not checked out'}
                      </Typography>
                      <Chip 
                        label={getAttendanceStatus(record)} 
                        size="small" 
                        color={record.check_in_time ? 'success' : 'default'}
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Leave Requests</Typography>
            <Button
              variant="contained"
              onClick={() => setLeaveDialog(true)}
              startIcon={<AddIcon />}
            >
              Request Leave
            </Button>
          </Box>
          <List>
            {leaves.map((leave) => (
              <ListItem key={leave.id} divider>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <EventIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`${leave.leave_type} Leave`}
                  secondary={
                    <Box>
                      <Typography variant="body2">
                        {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {leave.reason}
                      </Typography>
                      <Chip 
                        label={leave.status} 
                        size="small" 
                        color={getLeaveStatusColor(leave.status) as any}
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" sx={{ mb: 2 }}>Profile Information</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Box>
              <Typography variant="subtitle2">Employee ID</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{staff?.employee_id}</Typography>
              
              <Typography variant="subtitle2">Full Name</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{staff?.full_name}</Typography>
              
              <Typography variant="subtitle2">Email</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{staff?.email}</Typography>
              
              <Typography variant="subtitle2">Phone</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{staff?.phone}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2">Department</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{staff?.department?.name}</Typography>
              
              <Typography variant="subtitle2">Role</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{staff?.role?.name}</Typography>
              
              <Typography variant="subtitle2">Hire Date</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {staff?.hire_date ? new Date(staff.hire_date).toLocaleDateString() : 'N/A'}
              </Typography>
              
              <Typography variant="subtitle2">Salary</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>${staff?.salary}</Typography>
            </Box>
          </Box>
        </TabPanel>
      </Paper>

      {/* Leave Request Dialog */}
      <Dialog open={leaveDialog} onClose={() => setLeaveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Leave</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Leave Type</InputLabel>
            <Select
              value={newLeave.leave_type}
              onChange={(e) => setNewLeave({ ...newLeave, leave_type: e.target.value })}
              label="Leave Type"
            >
              <MenuItem value="annual">Annual Leave</MenuItem>
              <MenuItem value="sick">Sick Leave</MenuItem>
              <MenuItem value="personal">Personal Leave</MenuItem>
              <MenuItem value="maternity">Maternity Leave</MenuItem>
              <MenuItem value="paternity">Paternity Leave</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Start Date"
            type="date"
            value={newLeave.start_date}
            onChange={(e) => setNewLeave({ ...newLeave, start_date: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          
          <TextField
            fullWidth
            label="End Date"
            type="date"
            value={newLeave.end_date}
            onChange={(e) => setNewLeave({ ...newLeave, end_date: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          
          <TextField
            fullWidth
            label="Reason"
            multiline
            rows={3}
            value={newLeave.reason}
            onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLeaveDialog(false)}>Cancel</Button>
          <Button onClick={handleRequestLeave} variant="contained" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StaffPortal;
