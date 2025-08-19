import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import './App.css';
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
import StaffPortal from './components/StaffPortal';
import AdminHR from './components/AdminHR';
import OrderManagement from './components/OrderManagement';
import MyOrders from './components/MyOrders';
import Reviews from './components/Reviews';
import OrderTracking from './components/OrderTracking';
import TableOrders from './components/TableOrders';
import BillPortal from './components/BillPortal';
import MainLayout from './components/MainLayout';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

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
        <Router>
          <AppContent />
        </Router>
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
      
      {/* Routes with MainLayout */}
      <Route path="/" element={
        <MainLayout>
          <Menu />
        </MainLayout>
      } />
      <Route path="/cart" element={
        <MainLayout>
          <Cart />
        </MainLayout>
      } />
      <Route path="/profile" element={
        <MainLayout>
          <Profile />
        </MainLayout>
      } />
      <Route path="/my-orders" element={
        <MainLayout>
          <MyOrders />
        </MainLayout>
      } />
      <Route path="/reviews" element={
        <MainLayout>
          <Reviews />
        </MainLayout>
      } />
      <Route path="/order-tracking/:orderId" element={
        <MainLayout>
          <OrderTracking />
        </MainLayout>
      } />
      <Route path="/table-orders" element={
        <MainLayout>
          <TableOrders />
        </MainLayout>
      } />
      <Route path="/bills" element={
        <MainLayout>
          <BillPortal />
        </MainLayout>
      } />
      
      {/* Admin routes */}
      <Route
        path="/dashboard"
        element={
          user?.is_superuser || user?.cafe_manager ? (
            <MainLayout>
              <Dashboard />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/manage-tables"
        element={
          user?.is_superuser || user?.cafe_manager ? (
            <MainLayout>
              <TableManagement />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/manage-floors"
        element={
          user?.is_superuser || user?.cafe_manager ? (
            <MainLayout>
              <FloorManagement />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/manage-staff"
        element={
          user?.is_superuser || user?.cafe_manager ? (
            <MainLayout>
              <StaffManagement />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/manage-menu"
        element={
          user?.is_superuser || user?.cafe_manager ? (
            <MainLayout>
              <MenuManagement />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/manage-rooms"
        element={
          user?.is_superuser || user?.cafe_manager ? (
            <MainLayout>
              <RoomManagement />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/staff-portal"
        element={
          <MainLayout>
            <StaffPortal />
          </MainLayout>
        }
      />
      <Route
        path="/admin-hr"
        element={
          user?.is_superuser || user?.cafe_manager ? (
            <MainLayout>
              <AdminHR />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/manage-orders"
        element={
          user?.is_superuser || user?.cafe_manager ? (
            <MainLayout>
              <OrderManagement />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
    </Routes>
  );
};

export default App;
