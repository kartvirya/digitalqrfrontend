import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress,
  Button,
  Stack,
  Avatar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Receipt as ReceiptIcon,
  ArrowBack as BackIcon,
  Home as HomeIcon,
  ShoppingCart as CartIcon,
} from '@mui/icons-material';
import { useParams, useSearchParams } from 'react-router-dom';
import { apiService } from '../services/api';

interface Order {
  id: number;
  name: string;
  phone: string;
  table: string;
  price: string;
  status: string;
  estimated_time: number;
  created_at: string;
  updated_at: string;
  special_instructions?: string;
  items_json: string;
  table_unique_id?: string;
  room_unique_id?: string;
  order_type: 'table' | 'room';
}

const OrderTracking: React.FC = () => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  
  const tableUniqueId = searchParams.get('table');
  const roomUniqueId = searchParams.get('room');

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true);
        if (orderId && !isNaN(parseInt(orderId))) {
          const orderData = await apiService.getOrder(parseInt(orderId));
          setOrder(orderData);
        } else {
          setError('Invalid Order ID');
        }
      } catch (error: any) {
        console.error('Error loading order:', error);
        if (error.response?.status === 404) {
          setError('Order not found. It may have been deleted or the ID is incorrect.');
        } else {
          setError(error.response?.data?.error || 'Failed to load order. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  const getStatusStep = (status: string) => {
    switch ((status || 'pending').toLowerCase()) {
      case 'pending':
        return 1;
      case 'preparing':
        return 2;
      case 'ready':
        return 3;
      case 'completed':
        return 4;
      default:
        return 0;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'preparing':
        return 'info';
      case 'ready':
        return 'success';
      case 'completed':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (step: number, currentStep: number) => {
    if (step < currentStep) {
      return <CheckCircleIcon color="success" />;
    } else if (step === currentStep) {
      return <ScheduleIcon color="primary" />;
    } else {
      return <ScheduleIcon color="disabled" />;
    }
  };

  const parseItems = (itemsJson: string) => {
    try {
      const items = JSON.parse(itemsJson);
      return Object.entries(items).map(([id, data]: [string, any]) => ({
        id: parseInt(id),
        quantity: data[0],
        name: data[1],
        price: data[2]
      }));
    } catch {
      return [];
    }
  };

  const handleOrderMore = () => {
    const url = roomUniqueId ? `/?room=${roomUniqueId}` : (tableUniqueId ? `/?table=${tableUniqueId}` : '/');
    window.location.href = url;
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f8f9fa',
        }}
      >
        <CircularProgress size={80} sx={{ color: '#d32f2f', mb: 3 }} />
        <Typography variant="h5" sx={{ color: '#333', fontWeight: 600, mb: 1 }}>
          Loading Order Details...
        </Typography>
        <Typography variant="body1" sx={{ color: '#666' }}>
          Order ID: {orderId}
        </Typography>
      </Box>
    );
  }

  if (error || !order) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper 
          elevation={2}
          sx={{ 
            p: 4, 
            textAlign: 'center',
            borderRadius: 3,
            background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)',
          }}
        >
          <Avatar 
            sx={{ 
              width: 80, 
              height: 80, 
              mx: 'auto', 
              mb: 2,
              backgroundColor: '#f44336',
            }}
          >
            <ReceiptIcon sx={{ fontSize: 40 }} />
          </Avatar>
          
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error || 'Order not found'}
          </Alert>
          
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button 
              variant="contained" 
              onClick={() => window.history.back()}
              startIcon={<BackIcon />}
              sx={{ 
                backgroundColor: '#d32f2f',
                '&:hover': { backgroundColor: '#b71c1c' },
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Go Back
            </Button>
            <Button 
              variant="outlined" 
              onClick={handleOrderMore}
              startIcon={<CartIcon />}
              sx={{ 
                borderColor: '#d32f2f',
                color: '#d32f2f',
                '&:hover': { 
                  borderColor: '#b71c1c',
                  backgroundColor: 'rgba(211, 47, 47, 0.1)'
                },
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Order More Food
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => window.location.href = '/'}
              startIcon={<HomeIcon />}
              sx={{ 
                borderColor: '#666',
                color: '#666',
                '&:hover': { 
                  borderColor: '#333',
                  backgroundColor: 'rgba(0,0,0,0.1)'
                },
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Go to Home
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  const currentStep = getStatusStep(order.status);
  const items = parseItems(order.items_json || '{}');

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" sx={{ fontWeight: 700, color: '#333', mb: 1 }}>
            Order #{order.id}
          </Typography>
          <Typography variant="body1" sx={{ color: '#666' }}>
            Track your order progress
          </Typography>
        </Box>

        {/* Order Details Card */}
        <Paper 
          elevation={2}
          sx={{ 
            p: { xs: 2, md: 3 }, 
            mb: 3,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
            color: 'white'
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Order Details
          </Typography>
          
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, 
            gap: 3 
          }}>
            <Box>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Customer
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {order.name}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {order.order_type === 'room' ? 'Room' : 'Table'}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {order.table}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Total Amount
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                ₹{(parseFloat(order.price) || 0).toFixed(2)}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Estimated Time
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {order.estimated_time || 20} minutes
              </Typography>
            </Box>
          </Box>

          {order.special_instructions && (
            <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid rgba(255,255,255,0.3)' }}>
              <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                Special Instructions
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {order.special_instructions}
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Order Status Progress */}
        <Paper 
          elevation={2}
          sx={{ 
            p: { xs: 2, md: 3 }, 
            mb: 3,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)',
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#333', mb: 3 }}>
            Order Status
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <LinearProgress 
              variant="determinate" 
              value={(currentStep / 4) * 100} 
              sx={{ 
                height: 10, 
                borderRadius: 5,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#d32f2f',
                }
              }}
            />
          </Box>

          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, 
            gap: 2 
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <Avatar 
                sx={{ 
                  mx: 'auto', 
                  mb: 1,
                  backgroundColor: currentStep >= 1 ? '#d32f2f' : '#e0e0e0',
                  color: currentStep >= 1 ? 'white' : '#666',
                }}
              >
                {getStatusIcon(1, currentStep)}
              </Avatar>
              <Typography variant="body2" sx={{ fontWeight: 600, color: currentStep >= 1 ? '#d32f2f' : '#666' }}>
                Pending
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Avatar 
                sx={{ 
                  mx: 'auto', 
                  mb: 1,
                  backgroundColor: currentStep >= 2 ? '#d32f2f' : '#e0e0e0',
                  color: currentStep >= 2 ? 'white' : '#666',
                }}
              >
                {getStatusIcon(2, currentStep)}
              </Avatar>
              <Typography variant="body2" sx={{ fontWeight: 600, color: currentStep >= 2 ? '#d32f2f' : '#666' }}>
                Preparing
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Avatar 
                sx={{ 
                  mx: 'auto', 
                  mb: 1,
                  backgroundColor: currentStep >= 3 ? '#d32f2f' : '#e0e0e0',
                  color: currentStep >= 3 ? 'white' : '#666',
                }}
              >
                {getStatusIcon(3, currentStep)}
              </Avatar>
              <Typography variant="body2" sx={{ fontWeight: 600, color: currentStep >= 3 ? '#d32f2f' : '#666' }}>
                Ready
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Avatar 
                sx={{ 
                  mx: 'auto', 
                  mb: 1,
                  backgroundColor: currentStep >= 4 ? '#d32f2f' : '#e0e0e0',
                  color: currentStep >= 4 ? 'white' : '#666',
                }}
              >
                {getStatusIcon(4, currentStep)}
              </Avatar>
              <Typography variant="body2" sx={{ fontWeight: 600, color: currentStep >= 4 ? '#d32f2f' : '#666' }}>
                Completed
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Chip 
              label={(order.status || 'pending').toUpperCase()} 
              color={getStatusColor(order.status || 'pending') as any}
              variant="outlined"
              size="medium"
              sx={{ fontWeight: 600 }}
            />
          </Box>
        </Paper>

        {/* Order Items */}
        <Paper 
          elevation={2}
          sx={{ 
            p: { xs: 2, md: 3 },
            borderRadius: 3,
            background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)',
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#333', mb: 3 }}>
            Order Items
          </Typography>
          
          <Stack spacing={2}>
            {items.map((item, index) => (
              <Card 
                key={index} 
                elevation={1}
                sx={{ 
                  borderRadius: 2,
                  border: '1px solid #e0e0e0',
                  '&:hover': { 
                    boxShadow: 2,
                    borderColor: '#d32f2f',
                  }
                }}
              >
                <CardContent sx={{ py: 2, px: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#333' }}>
                        {item.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        Quantity: {item.quantity}
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#d32f2f' }}>
                      ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Paper>

        {/* Navigation Buttons */}
        <Paper 
          elevation={2}
          sx={{ 
            p: { xs: 2, md: 3 }, 
            mt: 3,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)',
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#333', mb: 3 }}>
            What would you like to do next?
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button 
              variant="contained" 
              onClick={handleOrderMore}
              startIcon={<CartIcon />}
              sx={{ 
                backgroundColor: '#d32f2f',
                '&:hover': { backgroundColor: '#b71c1c' },
                textTransform: 'none',
                fontWeight: 600,
                py: 1.5,
              }}
            >
              Order More Food
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => window.history.back()}
              startIcon={<BackIcon />}
              sx={{ 
                borderColor: '#d32f2f',
                color: '#d32f2f',
                '&:hover': { 
                  borderColor: '#b71c1c',
                  backgroundColor: 'rgba(211, 47, 47, 0.1)'
                },
                textTransform: 'none',
                fontWeight: 600,
                py: 1.5,
              }}
            >
              Go Back
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => window.location.href = '/'}
              startIcon={<HomeIcon />}
              sx={{ 
                borderColor: '#666',
                color: '#666',
                '&:hover': { 
                  borderColor: '#333',
                  backgroundColor: 'rgba(0,0,0,0.1)'
                },
                textTransform: 'none',
                fontWeight: 600,
                py: 1.5,
              }}
            >
              Go to Home
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default OrderTracking;
