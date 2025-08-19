import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Container,
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  RateReview as ReviewIcon,
  Dashboard as DashboardIcon,
  TableRestaurant as TableIcon,
  Hotel as RoomIcon,
  Business as FloorIcon,
  People as StaffIcon,
  Restaurant as MenuIcon,
  Work as HRIcon,
  Receipt as OrderIcon,
  AccountCircle as ProfileIcon,
  History as OrderHistoryIcon,
  Logout as LogoutIcon,
  Login as LoginIcon,
  PersonAdd as SignupIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
    handleClose();
    setMobileOpen(false);
  };

  const handleMobileMenuToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const adminMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Tables', icon: <TableIcon />, path: '/manage-tables' },
    { text: 'Rooms', icon: <RoomIcon />, path: '/manage-rooms' },
    { text: 'Floors', icon: <FloorIcon />, path: '/manage-floors' },
    { text: 'Staff', icon: <StaffIcon />, path: '/manage-staff' },
    { text: 'Menu', icon: <MenuIcon />, path: '/manage-menu' },
    { text: 'Staff Portal', icon: <DashboardIcon />, path: '/staff-portal' },
    { text: 'HR Admin', icon: <HRIcon />, path: '/admin-hr' },
    { text: 'Orders', icon: <OrderIcon />, path: '/manage-orders' },
  ];

  const customerMenuItems = [
    { text: 'Menu', icon: <HomeIcon />, path: '/' },
    { text: 'Reviews', icon: <ReviewIcon />, path: '/reviews' },
  ];

  const userMenuItems = [
    { text: 'Profile', icon: <ProfileIcon />, path: '/profile' },
    { text: 'My Orders', icon: <OrderHistoryIcon />, path: '/my-orders' },
  ];

  const renderDesktopMenu = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {/* Customer Menu Items */}
      {customerMenuItems.map((item) => (
        <Button
          key={item.text}
          color="inherit"
          onClick={() => handleNavigation(item.path)}
          sx={{ 
            textTransform: 'none',
            fontWeight: 500,
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
          }}
        >
          {item.text}
        </Button>
      ))}

      {/* Cart */}
      <IconButton 
        color="inherit" 
        onClick={() => handleNavigation('/cart')}
        sx={{ 
          '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
        }}
      >
        <Badge badgeContent={0} color="secondary">
          <CartIcon />
        </Badge>
      </IconButton>

      {/* Admin Menu Items */}
      {user?.is_superuser || user?.cafe_manager ? (
        adminMenuItems.map((item) => (
          <Button
            key={item.text}
            color="inherit"
            component={Link}
            to={item.path}
            sx={{ 
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
            }}
          >
            {item.text}
          </Button>
        ))
      ) : null}

      {/* User Menu */}
      {user ? (
        <>
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
            sx={{ 
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
            }}
          >
            <PersonIcon />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 150,
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              }
            }}
          >
            {userMenuItems.map((item) => (
              <MenuItem 
                key={item.text}
                onClick={() => { handleNavigation(item.path); handleClose(); }}
                sx={{ py: 1 }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {item.icon}
                </ListItemIcon>
                {item.text}
              </MenuItem>
            ))}
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ py: 1 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <LogoutIcon />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </>
      ) : (
        <>
          <Button 
            color="inherit" 
            onClick={() => handleNavigation('/login')}
            startIcon={<LoginIcon />}
            sx={{ 
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
            }}
          >
            Login
          </Button>
          <Button 
            color="inherit" 
            onClick={() => handleNavigation('/signup')}
            startIcon={<SignupIcon />}
            sx={{ 
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
            }}
          >
            Sign Up
          </Button>
        </>
      )}
    </Box>
  );

  const renderMobileMenu = () => (
    <Drawer
      anchor="right"
      open={mobileOpen}
      onClose={handleMobileMenuToggle}
      PaperProps={{
        sx: {
          width: 280,
          backgroundColor: '#0f1217',
          color: '#e5e7eb',
        }
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Menu
        </Typography>
        
        <List>
          {/* Customer Menu Items */}
          {customerMenuItems.map((item) => (
            <ListItem 
              key={item.text}
              onClick={() => handleNavigation(item.path)}
              sx={{ 
                borderRadius: 2, 
                mb: 1, 
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}

          {/* Cart */}
          <ListItem 
            onClick={() => handleNavigation('/cart')}
            sx={{ 
              borderRadius: 2, 
              mb: 1, 
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <CartIcon />
            </ListItemIcon>
            <ListItemText primary="Cart" />
          </ListItem>

          {/* Admin Menu Items */}
          {user?.is_superuser || user?.cafe_manager ? (
            <>
              <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)', px: 2, py: 1, fontWeight: 600 }}>
                ADMIN
              </Typography>
              {adminMenuItems.map((item) => (
                <ListItem 
                  key={item.text}
                  onClick={() => handleNavigation(item.path)}
                  sx={{ 
                    borderRadius: 2, 
                    mb: 1, 
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItem>
              ))}
            </>
          ) : null}

          {/* User Menu Items */}
          {user ? (
            <>
              <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)', px: 2, py: 1, fontWeight: 600 }}>
                ACCOUNT
              </Typography>
              {userMenuItems.map((item) => (
                <ListItem 
                  key={item.text}
                  onClick={() => handleNavigation(item.path)}
                  sx={{ 
                    borderRadius: 2, 
                    mb: 1, 
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItem>
              ))}
              <ListItem 
                onClick={handleLogout}
                sx={{ 
                  borderRadius: 2, 
                  mb: 1, 
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItem>
            </>
          ) : (
            <>
              <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.3)' }} />
              <ListItem 
                onClick={() => handleNavigation('/login')}
                sx={{ 
                  borderRadius: 2, 
                  mb: 1, 
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <LoginIcon />
                </ListItemIcon>
                <ListItemText primary="Login" />
              </ListItem>
              <ListItem 
                onClick={() => handleNavigation('/signup')}
                sx={{ 
                  borderRadius: 2, 
                  mb: 1, 
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <SignupIcon />
                </ListItemIcon>
                <ListItemText primary="Sign Up" />
              </ListItem>
            </>
          )}
        </List>
      </Box>
    </Drawer>
  );

  return (
    <AppBar 
      position="static" 
      sx={{ 
        backgroundColor: '#0f1217',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
      }}
    >
      <Container maxWidth="xl">
        <Toolbar sx={{ px: { xs: 0 } }}>
          <Typography
            variant="h6"
            component="div"
            sx={{ 
              flexGrow: 1, 
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: { xs: '1.1rem', sm: '1.25rem' }
            }}
            onClick={() => navigate('/')}
          >
            SnackDonald's
          </Typography>

          {isMobile ? (
            <>
              <IconButton
                color="inherit"
                onClick={handleMobileMenuToggle}
                sx={{ 
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                }}
              >
                <MenuIcon />
              </IconButton>
              {renderMobileMenu()}
            </>
          ) : (
            renderDesktopMenu()
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
