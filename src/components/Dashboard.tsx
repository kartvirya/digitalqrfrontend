import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
} from '@mui/material';
import {
  ArrowUpward as ArrowUpIcon,
  GitHub as GitHubIcon,
  PersonAdd as PersonAddIcon,
  ExpandMore as ExpandMoreIcon,
  Psychology as PsychologyIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user?.is_superuser && !user?.cafe_manager) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" color="error">
          Access Denied
        </Typography>
        <Typography variant="body1">
          You don't have permission to access the dashboard.
        </Typography>
      </Container>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#e5e7eb' }}>
          Restaurant Dashboard
        </Typography>
      </Box>

      {/* Plan Cards Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#e5e7eb', fontWeight: 500 }}>
          Plans
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
          {/* Free Plan Card */}
          <Card sx={{ 
            backgroundColor: '#1f2937', 
            border: '1px solid #374151',
            borderRadius: 2,
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#e5e7eb', fontWeight: 600 }}>
                  Free Plan
                </Typography>
                <Chip 
                  label="Active" 
                  size="small" 
                  sx={{ 
                    backgroundColor: '#10b981', 
                    color: 'white',
                    fontSize: '0.75rem',
                    height: 20,
                  }} 
                />
              </Box>
              <Typography variant="body2" sx={{ color: '#9ca3af', mb: 2 }}>
                Limited menu items and order requests.
              </Typography>
            </CardContent>
          </Card>

          {/* Pro Plan Card */}
          <Card sx={{ 
            backgroundColor: '#1f2937', 
            border: '1px solid #374151',
            borderRadius: 2,
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ color: '#e5e7eb', fontWeight: 600, mb: 2 }}>
                Pro
              </Typography>
              <Typography variant="body2" sx={{ color: '#9ca3af', mb: 3 }}>
                Extended limits on orders, unlimited menu items, max table capacity, and more.
              </Typography>
              <Button
                variant="outlined"
                fullWidth
                sx={{
                  borderColor: '#6b7280',
                  color: '#e5e7eb',
                  '&:hover': {
                    borderColor: '#9ca3af',
                    backgroundColor: 'rgba(156, 163, 175, 0.1)',
                  },
                }}
              >
                Upgrade to Pro
              </Button>
            </CardContent>
          </Card>

          {/* Ultra Plan Card */}
          <Card sx={{ 
            backgroundColor: '#1f2937', 
            border: '1px solid #374151',
            borderRadius: 2,
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ color: '#e5e7eb', fontWeight: 600, mb: 2 }}>
                Ultra
              </Typography>
              <Typography variant="body2" sx={{ color: '#9ca3af', mb: 3 }}>
                20x higher limits for orders, unlimited staff, advanced analytics, and early access to premium features.
              </Typography>
              <Button
                variant="contained"
                fullWidth
                startIcon={<ArrowUpIcon />}
                sx={{
                  backgroundColor: '#3b82f6',
                  '&:hover': {
                    backgroundColor: '#2563eb',
                  },
                }}
              >
                Upgrade to Ultra
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Invite Team Members Section */}
      <Card sx={{ 
        backgroundColor: '#1f2937', 
        border: '1px solid #374151',
        borderRadius: 2,
        mb: 4,
      }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ color: '#e5e7eb', fontWeight: 600, mb: 1 }}>
            Invite Team Members
          </Typography>
          <Typography variant="body2" sx={{ color: '#9ca3af', mb: 3 }}>
            Accelerate your restaurant operations with admin controls, analytics, and enterprise-grade security.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<PersonAddIcon />}
            sx={{
              borderColor: '#6b7280',
              color: '#e5e7eb',
              '&:hover': {
                borderColor: '#9ca3af',
                backgroundColor: 'rgba(156, 163, 175, 0.1)',
              },
            }}
          >
            Invite Your Team
          </Button>
        </CardContent>
      </Card>

      {/* Integrations Section */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, color: '#e5e7eb', fontWeight: 500 }}>
          Integrations
        </Typography>
        
        {/* GitHub Integration */}
        <Card sx={{ 
          backgroundColor: '#1f2937', 
          border: '1px solid #374151',
          borderRadius: 2,
          mb: 2,
        }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <GitHubIcon sx={{ color: '#e5e7eb', fontSize: 32, mr: 2 }} />
                <Box>
                  <Typography variant="h6" sx={{ color: '#e5e7eb', fontWeight: 600 }}>
                    GitHub
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                    Connect GitHub for order tracking and enhanced restaurant management
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6b7280' }}>
                    Connected as 'restaurant-admin'
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="outlined"
                endIcon={<ExpandMoreIcon />}
                sx={{
                  borderColor: '#6b7280',
                  color: '#e5e7eb',
                  '&:hover': {
                    borderColor: '#9ca3af',
                    backgroundColor: 'rgba(156, 163, 175, 0.1)',
                  },
                }}
              >
                Manage
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Slack Integration */}
        <Card sx={{ 
          backgroundColor: '#1f2937', 
          border: '1px solid #374151',
          borderRadius: 2,
          mb: 2,
        }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ 
                  width: 32, 
                  height: 32, 
                  backgroundColor: '#e5e7eb', 
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
                }}>
                  <Typography variant="caption" sx={{ color: '#1f2937', fontWeight: 600 }}>
                    S
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ color: '#e5e7eb', fontWeight: 600 }}>
                    Slack
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                    Work with orders and staff management from Slack
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="outlined"
                disabled
                sx={{
                  borderColor: '#374151',
                  color: '#6b7280',
                }}
              >
                Connect
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Linear Integration */}
        <Card sx={{ 
          backgroundColor: '#1f2937', 
          border: '1px solid #374151',
          borderRadius: 2,
        }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ 
                  width: 32, 
                  height: 32, 
                  backgroundColor: '#e5e7eb', 
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
                }}>
                  <Typography variant="caption" sx={{ color: '#1f2937', fontWeight: 600 }}>
                    L
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ color: '#e5e7eb', fontWeight: 600 }}>
                    Linear
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                    Manage restaurant operations and track issues with Linear
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="outlined"
                disabled
                sx={{
                  borderColor: '#374151',
                  color: '#6b7280',
                }}
              >
                Connect
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Floating Action Button */}
      <Box sx={{ position: 'fixed', bottom: 24, right: 24 }}>
        <IconButton
          sx={{
            backgroundColor: '#8b5cf6',
            color: 'white',
            width: 56,
            height: 56,
            '&:hover': {
              backgroundColor: '#7c3aed',
            },
          }}
        >
          <PsychologyIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default Dashboard;
