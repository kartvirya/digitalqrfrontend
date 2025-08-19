import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Avatar,
  TextField,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
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
      id={`admin-hr-tabpanel-${index}`}
      aria-labelledby={`admin-hr-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
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

  const getAttendanceForDate = (date: string) => {
    return attendance.filter(a => a.date === date);
  };

  const getLeavesByStatus = (status: string) => {
    return leaves.filter(l => l.status === status);
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', mt: 4, p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>HR Management</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Quick Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 3, mb: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" color="primary">
              {staff.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Staff
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" color="success.main">
              {getAttendanceForDate(selectedDate).filter(a => a.check_in_time).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Present Today
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" color="warning.main">
              {getLeavesByStatus('pending').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pending Leaves
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" color="info.main">
              {getLeavesByStatus('approved').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Approved Leaves
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Date Selector */}
      <Box sx={{ mb: 3 }}>
        <TextField
          type="date"
          label="Select Date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Box>

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Attendance" />
          <Tab label="Leave Requests" />
          <Tab label="Staff Directory" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Attendance for {new Date(selectedDate).toLocaleDateString()}
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Staff</TableCell>
                  <TableCell>Check In</TableCell>
                  <TableCell>Check Out</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getAttendanceForDate(selectedDate).map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                          <PersonIcon />
                        </Avatar>
                        {record.staff?.full_name}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {record.check_in_time || 'Not checked in'}
                    </TableCell>
                    <TableCell>
                      {record.check_out_time || 'Not checked out'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getAttendanceStatus(record)} 
                        color={record.check_in_time ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {record.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" sx={{ mb: 2 }}>Leave Requests</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Staff</TableCell>
                  <TableCell>Leave Type</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaves.map((leave) => (
                  <TableRow key={leave.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                          <PersonIcon />
                        </Avatar>
                        {leave.staff?.full_name}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {leave.leave_type}
                    </TableCell>
                    <TableCell>
                      {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {leave.reason}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={leave.status} 
                        color={getLeaveStatusColor(leave.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {leave.status === 'pending' && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleApproveLeave(leave.id)}
                            disabled={loading}
                          >
                            <CheckCircleIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRejectLeave(leave.id)}
                            disabled={loading}
                          >
                            <CancelIcon />
                          </IconButton>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" sx={{ mb: 2 }}>Staff Directory</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
            {staff.map((member) => (
              <Card key={member.id}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      <PersonIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{member.full_name}</Typography>
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
                    <strong>Email:</strong> {member.email}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Phone:</strong> {member.phone}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Salary:</strong> ${member.salary}
                  </Typography>
                  <Chip 
                    label={member.employment_status} 
                    color={member.employment_status === 'active' ? 'success' : 'default'}
                    size="small"
                  />
                </CardContent>
              </Card>
            ))}
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default AdminHR;
