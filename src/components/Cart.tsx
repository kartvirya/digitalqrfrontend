import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  TextField,
  Card,
  CardContent,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  useTheme,
  useMediaQuery,
  Stack,
  Avatar,
} from '@mui/material';

import { 
  Add as AddIcon, 
  Remove as RemoveIcon, 
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
  ArrowBack as BackIcon,
  Receipt as ReceiptIcon,
  LocalShipping as ShippingIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CartItem } from '../types';
import { apiService } from '../services/api';

const Cart: React.FC = () => {
  const [cart, setCart] = useState<Record<number, CartItem>>({});
  const [tableUniqueId, setTableUniqueId] = useState('');
  const [roomUniqueId, setRoomUniqueId] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchParams] = useSearchParams();
  const theme = useTheme();

  useEffect(() => {
    // Load cart from localStorage and normalize structure
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        // Normalize to Record<number, CartItem>
        const normalized: Record<number, CartItem> = {};
        Object.entries(parsed).forEach(([key, value]: any) => {
          if (!value) return;
          const id = value.id ?? parseInt(key, 10);
          normalized[id] = {
            id,
            menu_item_id: value.menu_item_id ?? id,
            name: value.name || 'Unknown Item',
            price: String(value.price) || '0',
            quantity: Number(value.quantity) || 1,
          } as CartItem;
        });
        setCart(normalized);
      } catch (error) {
        // If corrupted, reset
        setCart({});
      }
    }

    // Get table/room info from URL params
    const tableId = searchParams.get('table');
    if (tableId) setTableUniqueId(tableId);
    const roomId = searchParams.get('room');
    if (roomId) setRoomUniqueId(roomId);
  }, [searchParams]);

  const updateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      const newCart = { ...cart };
      delete newCart[itemId];
      setCart(newCart);
    } else {
      setCart(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          quantity: newQuantity
        }
      }));
    }
  };

  const getTotalPrice = () => {
    return Object.values(cart).reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0);
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((total, item) => total + item.quantity, 0);
  };

  const handlePlaceOrder = async () => {
    if (getTotalItems() === 0) {
      setError('Your cart is empty');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const orderItems = Object.values(cart).map(item => ({
        menu_item: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      const orderData = {
        items: orderItems,
        table_unique_id: tableUniqueId,
        room_unique_id: roomUniqueId,
        special_instructions: specialInstructions,
        total_amount: String(getTotalPrice())
      };

      const createdOrder = await apiService.createOrder(orderData);
      
      // Clear cart after successful order
      setCart({});
      localStorage.removeItem('cart');
      
      // Set flag to show success message when returning to menu
      sessionStorage.setItem('orderPlaced', 'true');
      
      setSuccess('Order placed successfully!');
      setTimeout(() => {
        // Redirect to order tracking page with table/room parameters
        const url = roomUniqueId 
          ? `/order-tracking/${createdOrder.id}?room=${roomUniqueId}` 
          : (tableUniqueId 
            ? `/order-tracking/${createdOrder.id}?table=${tableUniqueId}` 
            : `/order-tracking/${createdOrder.id}`);
        window.location.href = url;
      }, 2000);
      
      // Also show option to return to menu for additional orders
      setTimeout(() => {
        setSuccess('Order placed successfully! You can track your order or return to menu for additional orders.');
      }, 2000);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToMenu = () => {
    const url = roomUniqueId ? `/?room=${roomUniqueId}` : (tableUniqueId ? `/?table=${tableUniqueId}` : '/');
    window.location.href = url;
  };

  if (getTotalItems() === 0) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper 
          elevation={2}
          sx={{ 
            p: { xs: 3, md: 6 }, 
            textAlign: 'center',
            borderRadius: 3,
            background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)',
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Avatar 
              sx={{ 
                width: 80, 
                height: 80, 
                mx: 'auto', 
                mb: 2,
                backgroundColor: '#d32f2f',
              }}
            >
              <CartIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#333' }}>
              Your Cart is Empty
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, color: '#666', fontSize: '1.1rem' }}>
              Add some delicious items to your cart to get started.
            </Typography>
          </Box>
          
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              onClick={handleBackToMenu}
              size="large"
              startIcon={<BackIcon />}
              sx={{ 
                backgroundColor: '#d32f2f',
                '&:hover': { backgroundColor: '#b71c1c' },
                px: 4,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1.1rem',
                fontWeight: 600,
              }}
            >
              Browse Menu
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={handleBackToMenu}
          sx={{ 
            mb: 2,
            color: '#666',
            textTransform: 'none',
            fontWeight: 500,
            '&:hover': { backgroundColor: 'rgba(211, 47, 47, 0.1)' }
          }}
        >
          Back to Menu
        </Button>
        
        <Typography 
          variant="h4" 
          gutterBottom 
          sx={{ 
            fontWeight: 700,
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <CartIcon sx={{ color: '#d32f2f' }} />
          Shopping Cart ({getTotalItems()} items)
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            '& .MuiAlert-icon': { fontSize: 24 }
          }}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert 
          severity="success" 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            '& .MuiAlert-icon': { fontSize: 24 }
          }}
        >
          <Typography variant="body1" sx={{ mb: 2 }}>
            {success}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              variant="contained"
              size="small"
              onClick={handleBackToMenu}
              sx={{ 
                backgroundColor: '#d32f2f',
                '&:hover': { backgroundColor: '#b71c1c' },
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Order More Food
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handleBackToMenu}
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
              Browse Menu
            </Button>
          </Stack>
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3 }}>
        {/* Cart Items */}
        <Box sx={{ flex: { lg: 2 } }}>
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
              {Object.values(cart).map((item) => (
                <Card 
                  key={item.id} 
                  elevation={1}
                  sx={{ 
                    borderRadius: 2,
                    border: '1px solid #e0e0e0',
                    '&:hover': { 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      transform: 'translateY(-1px)',
                      transition: 'all 0.2s ease-in-out'
                    }
                  }}
                >
                  <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'center' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
                          {item.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          ₹{item.price} each
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            sx={{ 
                              backgroundColor: '#f5f5f5',
                              '&:hover': { backgroundColor: '#e0e0e0' }
                            }}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              minWidth: 40, 
                              textAlign: 'center',
                              fontWeight: 600,
                              color: '#d32f2f'
                            }}
                          >
                            {item.quantity}
                          </Typography>
                          
                          <IconButton
                            size="small"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            sx={{ 
                              backgroundColor: '#f5f5f5',
                              '&:hover': { backgroundColor: '#e0e0e0' }
                            }}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                            ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                          </Typography>
                          
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => updateQuantity(item.id, 0)}
                            sx={{ 
                              backgroundColor: '#ffebee',
                              '&:hover': { backgroundColor: '#ffcdd2' }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Paper>
        </Box>

        {/* Order Summary */}
        <Box sx={{ flex: { lg: 1 } }}>
          <Paper 
            elevation={2}
            sx={{ 
              p: { xs: 2, md: 3 },
              borderRadius: 3,
              background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
              color: 'white',
              height: 'fit-content',
              position: 'sticky',
              top: 20,
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Order Summary
            </Typography>

            {(tableUniqueId || roomUniqueId) && (
              <Box sx={{ mb: 3 }}>
                <Chip 
                  label={tableUniqueId ? `Table: ${tableUniqueId}` : `Room: ${roomUniqueId}`} 
                  sx={{ 
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 600,
                  }} 
                />
              </Box>
            )}

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Special Instructions"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                  '&.Mui-focused fieldset': { borderColor: 'white' },
                },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.8)' },
                '& .MuiInputBase-input': { color: 'white' },
              }}
              placeholder="Any special requests or dietary requirements..."
            />

            <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.3)' }} />

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Items: {getTotalItems()}
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white' }}>
                ₹{getTotalPrice().toFixed(2)}
              </Typography>
            </Box>

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handlePlaceOrder}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ReceiptIcon />}
              sx={{ 
                mb: 2,
                backgroundColor: 'white',
                color: '#d32f2f',
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1.1rem',
                fontWeight: 600,
                '&:hover': { 
                  backgroundColor: '#f5f5f5',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                },
                '&:disabled': {
                  backgroundColor: 'rgba(255,255,255,0.5)',
                  color: 'rgba(255,255,255,0.7)',
                }
              }}
            >
              {loading ? 'Placing Order...' : 'Place Order'}
            </Button>

            <Button
              fullWidth
              variant="outlined"
              onClick={handleBackToMenu}
              startIcon={<ShippingIcon />}
              sx={{ 
                borderColor: 'rgba(255,255,255,0.5)',
                color: 'white',
                '&:hover': { 
                  borderColor: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                },
                textTransform: 'none',
                fontWeight: 600,
                py: 1.5,
                borderRadius: 2,
              }}
            >
              Continue Shopping
            </Button>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};

export default Cart;
