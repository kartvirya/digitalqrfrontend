import React, { useState } from 'react';
import { Box, IconButton, useMediaQuery, useTheme } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import Sidebar from './Sidebar';

interface Props {
  children: React.ReactNode;
}

const drawerWidth = 280;

const MainLayout: React.FC<Props> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default', position: 'relative' }}>
      {/* Mobile Toggle Button - Fixed position above everything */}
      {isMobile && (
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 1300,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            width: 48,
            height: 48,
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
            },
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      <Sidebar mobileOpen={mobileOpen} onDrawerToggle={handleDrawerToggle} />
      
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: { xs: 2, md: 4 }, 
          ml: isMobile ? 0 : `${drawerWidth}px`,
          pt: isMobile ? 4 : undefined,
          width: '100%',
          position: 'relative',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;

