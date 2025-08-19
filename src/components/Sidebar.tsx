import React, { useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  IconButton,
  Button,
  useMediaQuery,
  useTheme,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  TableRestaurant as TableIcon,
  Hotel as RoomIcon,
  Business as FloorIcon,
  People as StaffIcon,
  Restaurant as RestaurantIcon,
  Receipt as OrderIcon,
  AccountCircle as ProfileIcon,
  History as OrderHistoryIcon,
  Logout as LogoutIcon,
  Home as HomeIcon,
  RateReview as ReviewIcon,
  ShoppingCart as CartIcon,
  Person as PersonIcon,
  Login as LoginIcon,
  PersonAdd as SignupIcon,
  Work as HRIcon,
  Receipt as ReceiptIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 260;

interface MenuItemConfig {
  label: string;
  icon: React.ReactNode;
  path: string;
}

interface SidebarProps {
  mobileOpen: boolean;
  onDrawerToggle: () => void;
}

const mainNavigationItems: MenuItemConfig[] = [
  { label: 'Overview', icon: <RefreshIcon />, path: '/dashboard' },
];

const customerItems: MenuItemConfig[] = [
  { label: 'Menu', icon: <HomeIcon />, path: '/' },
  { label: 'Reviews', icon: <ReviewIcon />, path: '/reviews' },
  { label: 'Cart', icon: <CartIcon />, path: '/cart' },
];

const adminItems: MenuItemConfig[] = [
  { label: 'Tables', icon: <TableIcon />, path: '/manage-tables' },
  { label: 'Rooms', icon: <RoomIcon />, path: '/manage-rooms' },
  { label: 'Floors', icon: <FloorIcon />, path: '/manage-floors' },
  { label: 'Staff', icon: <StaffIcon />, path: '/manage-staff' },
  { label: 'Menu Management', icon: <RestaurantIcon />, path: '/manage-menu' },
  { label: 'Staff Portal', icon: <DashboardIcon />, path: '/staff-portal' },
  { label: 'HR Admin', icon: <HRIcon />, path: '/admin-hr' },
  { label: 'Orders', icon: <OrderIcon />, path: '/manage-orders' },
];

const userItems: MenuItemConfig[] = [
  { label: 'Profile', icon: <ProfileIcon />, path: '/profile' },
  { label: 'My Orders', icon: <OrderHistoryIcon />, path: '/my-orders' },
  { label: 'Table Orders', icon: <OrderIcon />, path: '/table-orders' },
  { label: 'Bills', icon: <ReceiptIcon />, path: '/bills' },
];

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onDrawerToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['main']));

  const isActive = (path: string) => location.pathname === path;

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const SectionHeader = ({ title, section }: { title: string; section: string }) => (
    <ListItemButton
      onClick={() => toggleSection(section)}
      sx={{
        py: 1,
        px: 2,
        minHeight: 'auto',
        '&:hover': {
          backgroundColor: 'transparent',
        },
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: '#9ca3af',
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          flexGrow: 1,
        }}
      >
        {title}
      </Typography>
      <IconButton
        size="small"
        sx={{
          color: '#9ca3af',
          p: 0,
          transform: expandedSections.has(section) ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
        }}
      >
        <ExpandMoreIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </ListItemButton>
  );

  const MenuItem = ({ item }: { item: MenuItemConfig }) => (
    <Tooltip title={item.label} placement="right" arrow>
      <ListItemButton
        onClick={() => navigate(item.path)}
        selected={isActive(item.path)}
        sx={{
          mx: 1.5,
          mb: 0.5,
          borderRadius: '6px',
          minHeight: '32px',
          px: 1.5,
          py: 0.5,
          color: isActive(item.path) ? '#ffffff' : '#e5e7eb',
          backgroundColor: isActive(item.path) ? '#4b5563' : 'transparent',
          '&.Mui-selected': {
            backgroundColor: '#4b5563',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#6b7280',
            },
          },
          '&:hover': {
            backgroundColor: isActive(item.path) ? '#6b7280' : 'rgba(229, 231, 235, 0.1)',
            color: isActive(item.path) ? '#ffffff' : '#f9fafb',
          },
          transition: 'all 0.15s ease',
        }}
      >
        <ListItemIcon 
          sx={{ 
            color: 'inherit',
            minWidth: '20px',
            mr: 1,
            '& .MuiSvgIcon-root': {
              fontSize: '16px',
            }
          }}
        >
          {item.icon}
        </ListItemIcon>
        <ListItemText 
          primary={item.label}
          primaryTypographyProps={{
            fontSize: '13px',
            fontWeight: isActive(item.path) ? 500 : 400,
          }}
        />
      </ListItemButton>
    </Tooltip>
  );

  return (
    <Drawer
      variant={isMobile ? "temporary" : "permanent"}
      open={isMobile ? mobileOpen : true}
      onClose={onDrawerToggle}
      ModalProps={{
        keepMounted: true,
      }}
      PaperProps={{
        sx: {
          width: drawerWidth,
          backgroundColor: '#1f2937',
          borderRight: '1px solid #374151',
          boxShadow: 'none',
        },
      }}
    >
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        pb: 1.5,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: '1px solid #374151',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ 
            width: 24, 
            height: 24, 
            backgroundColor: '#f59e0b', 
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Typography variant="caption" sx={{ 
              color: '#ffffff', 
              fontWeight: 700, 
              fontSize: '12px',
              lineHeight: 1,
            }}>
              R
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ 
            color: '#f9fafb', 
            fontWeight: 600, 
            fontSize: '14px',
          }}>
            Restaurant
          </Typography>
        </Box>
        {isMobile && (
          <IconButton
            onClick={onDrawerToggle}
            size="small"
            sx={{ color: '#9ca3af' }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}
      </Box>

      {/* Navigation */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', py: 1 }}>
        <List sx={{ py: 0 }}>
          {/* Main Navigation */}
          {expandedSections.has('main') && (
            <>
              {mainNavigationItems.map((item) => (
                <MenuItem key={item.label} item={item} />
              ))}
              <Box sx={{ height: 8 }} />
            </>
          )}

          {/* Customer Section */}
          {!(user?.is_superuser || user?.cafe_manager) && (
            <>
              <SectionHeader title="Browse" section="customer" />
              {expandedSections.has('customer') && (
                <>
                  {customerItems.map((item) => (
                    <MenuItem key={item.label} item={item} />
                  ))}
                  <Box sx={{ height: 8 }} />
                </>
              )}
            </>
          )}

          {/* Admin Section */}
          {(user?.is_superuser || user?.cafe_manager) && (
            <>
              <SectionHeader title="Management" section="admin" />
              {expandedSections.has('admin') && (
                <>
                  {adminItems.map((item) => (
                    <MenuItem key={item.label} item={item} />
                  ))}
                  <Box sx={{ height: 8 }} />
                </>
              )}
            </>
          )}

          {/* User Section */}
          {user && (
            <>
              <SectionHeader title="Account" section="user" />
              {expandedSections.has('user') && (
                <>
                  {userItems.map((item) => (
                    <MenuItem key={item.label} item={item} />
                  ))}
                  <Box sx={{ height: 8 }} />
                </>
              )}
            </>
          )}
        </List>
      </Box>

      {/* Bottom Section */}
      <Box sx={{ 
        p: 2, 
        pt: 1,
        borderTop: '1px solid #374151',
        backgroundColor: '#111827',
      }}>
        {user ? (
          <Box>
            {/* User Info */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5, 
              mb: 1.5,
              p: 1,
              borderRadius: '6px',
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
            }}>
              <Box sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: '#374151',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <PersonIcon sx={{ fontSize: 16, color: '#9ca3af' }} />
              </Box>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ 
                  fontSize: '13px', 
                  fontWeight: 500, 
                  color: '#f9fafb',
                  lineHeight: 1.2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {user.username}
                </Typography>
                <Typography variant="caption" sx={{ 
                  fontSize: '11px', 
                  color: '#9ca3af',
                  lineHeight: 1.2,
                }}>
                  {user.is_superuser ? 'Admin' : user.cafe_manager ? 'Manager' : 'Customer'}
                </Typography>
              </Box>
            </Box>

            {/* Logout Button */}
            <Button
              fullWidth
              onClick={handleLogout}
              startIcon={<LogoutIcon sx={{ fontSize: 16 }} />}
              sx={{
                color: '#9ca3af',
                fontSize: '13px',
                fontWeight: 400,
                textTransform: 'none',
                justifyContent: 'flex-start',
                px: 1.5,
                py: 0.75,
                minHeight: '32px',
                borderRadius: '6px',
                '&:hover': {
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#f87171',
                },
              }}
            >
              Sign out
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<LoginIcon sx={{ fontSize: 16 }} />}
              onClick={() => navigate('/login')}
              sx={{
                color: '#9ca3af',
                borderColor: '#4b5563',
                fontSize: '13px',
                textTransform: 'none',
                py: 0.75,
                minHeight: '32px',
                borderRadius: '6px',
                '&:hover': {
                  borderColor: '#6b7280',
                  backgroundColor: 'rgba(156, 163, 175, 0.1)',
                },
              }}
            >
              Sign in
            </Button>
            <Button
              fullWidth
              variant="contained"
              startIcon={<SignupIcon sx={{ fontSize: 16 }} />}
              onClick={() => navigate('/signup')}
              sx={{
                backgroundColor: '#f59e0b',
                fontSize: '13px',
                textTransform: 'none',
                py: 0.75,
                minHeight: '32px',
                borderRadius: '6px',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: '#d97706',
                  boxShadow: 'none',
                },
              }}
            >
              Sign up
            </Button>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default Sidebar;