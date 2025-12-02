import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import './app.css';
// Components
import Menu from './components/Menu';
import Cart from './components/Cart';
import Login from './components/Login';
import Signup from './components/Signup';
import Profile from './components/Profile';
import Dashboard from './components/Dashboard';
import TableManagement from './components/TableManagement';
import FloorManagement from './components/FloorManagement';
import StaffManagement from './components/StaffManagement';
import MenuManagement from './components/MenuManagement';
import RoomManagement from './components/RoomManagement';
import AdminHR from './components/AdminHR';
import OrderManagement from './components/OrderManagement';
import HRManagement from './components/HRManagement';
import EmployeeManagement from './components/EmployeeManagement';
import HRLogin from './components/HRLogin';
import HRDashboard from './components/HRDashboard';
import PayrollManagement from './components/PayrollManagement';
import LeaveManagement from './components/LeaveManagement';
import TrainingManagement from './components/TrainingManagement';
import PerformanceManagement from './components/PerformanceManagement';
import HRSetup from './components/HRSetup';
import StaffLogin from './components/StaffLogin';
import StaffPortal from './components/StaffPortal';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import RestaurantManagement from './components/RestaurantManagement';
import RoleManagement from './components/RoleManagement';
import MyOrders from './components/MyOrders';
import Reviews from './components/Reviews';
import OrderTracking from './components/OrderTracking';
import TableOrders from './components/TableOrders';
import BillPortal from './components/BillPortal';
import SocketTest from './components/SocketTest';
import { AdminLayout, CustomerLayout, HRLayout, StaffLayout, SuperAdminLayout } from './components/RoleLayouts';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { RestaurantProvider } from './context/RestaurantContext';
import { RequireRole, RequirePermission } from './components/RequireRole';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#6ea8fe' },
    secondary: { main: '#22c55e' },
    background: {
      default: '#0b0f14',
      paper: '#0f1217',
    },
    text: {
      primary: '#e5e7eb',
      secondary: '#9ca3af',
    },
    divider: '#1f2937',
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundColor: '#0f1217' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: { backgroundColor: '#0f1217' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <RestaurantProvider>
          <SocketProvider>
            <Router>
              <AppContent />
            </Router>
          </SocketProvider>
        </RestaurantProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      {/* Standalone routes (no MainLayout) */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      
      {/* Customer routes with CustomerLayout */}
      <Route path="/" element={
        <CustomerLayout>
          <Menu />
        </CustomerLayout>
      } />
      <Route path="/r/:restaurantSlug" element={
        <CustomerLayout>
          <Menu />
        </CustomerLayout>
      } />
      <Route path="/cart" element={
        <CustomerLayout>
          <Cart />
        </CustomerLayout>
      } />
      <Route path="/r/:restaurantSlug/cart" element={
        <CustomerLayout>
          <Cart />
        </CustomerLayout>
      } />
      <Route path="/profile" element={
        <CustomerLayout>
          <Profile />
        </CustomerLayout>
      } />
      <Route path="/my-orders" element={
        <CustomerLayout>
          <MyOrders />
        </CustomerLayout>
      } />
      <Route path="/reviews" element={
        <CustomerLayout>
          <Reviews />
        </CustomerLayout>
      } />
      <Route path="/order-tracking/:orderId" element={
        <CustomerLayout>
          <OrderTracking />
        </CustomerLayout>
      } />
      <Route path="/r/:restaurantSlug/order-tracking/:orderId" element={
        <CustomerLayout>
          <OrderTracking />
        </CustomerLayout>
      } />
      <Route path="/table-orders" element={
        <CustomerLayout>
          <TableOrders />
        </CustomerLayout>
      } />
      <Route path="/socket-test" element={
        <CustomerLayout>
          <SocketTest />
        </CustomerLayout>
      } />
      <Route path="/bills" element={
        <CustomerLayout>
          <BillPortal />
        </CustomerLayout>
      } />
      
      {/* Admin routes */}
      <Route
        path="/dashboard"
        element={
          <RequireRole roles={['super_admin', 'restaurant_admin', 'hr_manager', 'staff']}>
            <AdminLayout>
              <Dashboard />
            </AdminLayout>
          </RequireRole>
        }
      />
      <Route
        path="/manage-tables"
        element={
          <RequirePermission permission="manage_tables">
            <AdminLayout>
              <TableManagement />
            </AdminLayout>
          </RequirePermission>
        }
      />
      <Route
        path="/manage-floors"
        element={
          <RequirePermission permission="manage_floors">
            <AdminLayout>
              <FloorManagement />
            </AdminLayout>
          </RequirePermission>
        }
      />
      <Route
        path="/manage-staff"
        element={
          <RequirePermission permission="manage_employees">
            <AdminLayout>
              <StaffManagement />
            </AdminLayout>
          </RequirePermission>
        }
      />
      <Route
        path="/manage-menu"
        element={
          <RequirePermission permission="manage_menu">
            <AdminLayout>
              <MenuManagement />
            </AdminLayout>
          </RequirePermission>
        }
      />
      <Route
        path="/manage-rooms"
        element={
          <RequirePermission permission="manage_rooms">
            <AdminLayout>
              <RoomManagement />
            </AdminLayout>
          </RequirePermission>
        }
      />
      <Route
        path="/staff-portal"
        element={<StaffPortal />}
      />
      <Route
        path="/admin-hr"
        element={
          <RequirePermission permission="manage_employees">
            <AdminLayout>
              <AdminHR />
            </AdminLayout>
          </RequirePermission>
        }
      />
      <Route
        path="/manage-orders"
        element={
          <RequirePermission permission="manage_orders">
            <AdminLayout>
              <OrderManagement />
            </AdminLayout>
          </RequirePermission>
        }
      />
      <Route
        path="/hr-management"
        element={
          <RequirePermission permission="manage_employees">
            <HRLayout>
              <HRDashboard />
            </HRLayout>
          </RequirePermission>
        }
      />
      <Route
        path="/employee-management"
        element={
          <RequirePermission permission="manage_employees">
            <HRLayout>
              <EmployeeManagement />
            </HRLayout>
          </RequirePermission>
        }
      />
      <Route
        path="/payroll-management"
        element={
          <RequirePermission permission="manage_payroll">
            <HRLayout>
              <PayrollManagement />
            </HRLayout>
          </RequirePermission>
        }
      />
      <Route
        path="/attendance-management"
        element={
          <RequirePermission permission="manage_attendance">
            <HRLayout>
              <HRManagement showTabs={false} />
            </HRLayout>
          </RequirePermission>
        }
      />
      <Route
        path="/leave-management"
        element={
          <RequirePermission permission="manage_leaves">
            <HRLayout>
              <LeaveManagement />
            </HRLayout>
          </RequirePermission>
        }
      />
      <Route
        path="/training-management"
        element={
          <RequirePermission permission="manage_training">
            <HRLayout>
              <TrainingManagement />
            </HRLayout>
          </RequirePermission>
        }
      />
      <Route
        path="/performance-management"
        element={
          <RequirePermission permission="manage_performance">
            <HRLayout>
              <PerformanceManagement />
            </HRLayout>
          </RequirePermission>
        }
      />
      <Route
        path="/hr-setup"
        element={
          <RequireRole roles={['restaurant_admin', 'super_admin']}>
            <AdminLayout>
              <HRSetup />
            </AdminLayout>
          </RequireRole>
        }
      />
      <Route
        path="/staff-portal"
        element={
          <RequireRole roles={['staff', 'restaurant_admin', 'hr_manager', 'super_admin']}>
            <StaffLayout>
              <StaffPortal />
            </StaffLayout>
          </RequireRole>
        }
      />
      
      {/* HR System Routes */}
      <Route path="/hr-login" element={<HRLogin />} />
      <Route path="/hr-dashboard" element={<HRDashboard />} />
      <Route path="/staff-login" element={<StaffLogin />} />
      
      {/* Super Admin Routes */}
      <Route
        path="/super-admin"
        element={
          <RequireRole roles={['super_admin']}>
            <SuperAdminLayout>
              <SuperAdminDashboard />
            </SuperAdminLayout>
          </RequireRole>
        }
      />
      <Route
        path="/manage-restaurants"
        element={
          <RequireRole roles={['super_admin']}>
            <SuperAdminLayout>
              <RestaurantManagement />
            </SuperAdminLayout>
          </RequireRole>
        }
      />
      <Route
        path="/role-management"
        element={
          <RequireRole roles={['super_admin']}>
            <SuperAdminLayout>
              <RoleManagement />
            </SuperAdminLayout>
          </RequireRole>
        }
      />
    </Routes>
  );
};

export default App;
