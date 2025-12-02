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
  AppBar,
  Toolbar,
} from '@mui/material';

import { 
  Add as AddIcon, 
  Remove as RemoveIcon, 
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
  ArrowBack as BackIcon,
  Receipt as ReceiptIcon,
  LocalShipping as ShippingIcon,
  Restaurant as RestaurantIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { CartItem } from '../types';
import { apiService } from '../services/api';
import { useRestaurant } from '../context/RestaurantContext';

const Cart: React.FC = () => {
  const params = useParams();
  const { restaurant, switchRestaurant } = useRestaurant();
  const [cart, setCart] = useState<Record<number, CartItem>>({});
  const [tableUniqueId, setTableUniqueId] = useState('');
  const [roomUniqueId, setRoomUniqueId] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchParams] = useSearchParams();
  const theme = useTheme();

  // Extract restaurant slug from URL
  const restaurantSlug = params.restaurantSlug || searchParams.get('restaurant');

  useEffect(() => {
    // Set restaurant context from URL if we have a slug
    if (restaurantSlug && (!restaurant || restaurant.slug !== restaurantSlug)) {
      switchRestaurant(restaurantSlug);
    }
  }, [restaurantSlug, restaurant, switchRestaurant]);

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

    // Validate that we have either table or room ID
    if (!tableUniqueId && !roomUniqueId) {
      setError('Table or Room information is missing. Please scan the QR code again.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Ensure restaurant context is set before creating order
      if (restaurant) {
        apiService.setRestaurantContext(restaurant.id);
        apiService.setRestaurantSlug(restaurant.slug);
      }

      const orderItems = Object.values(cart).map(item => ({
        menu_item: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      const orderData = {
        items: orderItems,
        table_unique_id: tableUniqueId || undefined,
        room_unique_id: roomUniqueId || undefined,
        special_instructions: specialInstructions,
        total_amount: String(getTotalPrice())
      };

      console.log('Creating order with data:', orderData);
      console.log('Restaurant context:', restaurant ? { id: restaurant.id, slug: restaurant.slug } : 'None');
      
      const createdOrder = await apiService.createOrder(orderData);
      console.log('Order created successfully:', createdOrder);
      
      if (!createdOrder || !createdOrder.id) {
        throw new Error('Order creation failed: Invalid response from server');
      }
      
      // Clear cart after successful order
      setCart({});
      localStorage.removeItem('cart');
      
      // Set flag to show success message when returning to menu
      sessionStorage.setItem('orderPlaced', 'true');
      
      setSuccess('Order placed successfully!');
      setTimeout(() => {
        // Redirect to order tracking page with table/room parameters
        const restaurantSlug = params.restaurantSlug || searchParams.get('restaurant') || restaurant?.slug;
        const basePath = restaurantSlug ? `/r/${restaurantSlug}` : '';
        const url = roomUniqueId 
          ? `${basePath}/order-tracking/${createdOrder.id}?room=${roomUniqueId}` 
          : (tableUniqueId 
            ? `${basePath}/order-tracking/${createdOrder.id}?table=${tableUniqueId}` 
            : `${basePath}/order-tracking/${createdOrder.id}`);
        window.location.href = url;
      }, 2000);
      
      // Also show option to return to menu for additional orders
      setTimeout(() => {
        setSuccess('Order placed successfully! You can track your order or return to menu for additional orders.');
      }, 2000);
    } catch (error: any) {
      console.error('Order creation error:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Failed to place order. Please try again.';
      setError(errorMessage);
      
      // Log detailed error for debugging
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToMenu = () => {
    const restaurantSlug = params.restaurantSlug || searchParams.get('restaurant') || restaurant?.slug;
    const basePath = restaurantSlug ? `/r/${restaurantSlug}` : '';
    const url = roomUniqueId 
      ? `${basePath}/?room=${roomUniqueId}` 
      : (tableUniqueId 
        ? `${basePath}/?table=${tableUniqueId}` 
        : `${basePath}/`);
    window.location.href = url;
  };

  if (getTotalItems() === 0) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#0b0f14' }}>
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Card sx={{ 
            p: { xs: 4, md: 6 }, 
            textAlign: 'center',
            borderRadius: 3,
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
            <Box sx={{ mb: 4 }}>
              <Avatar 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  mx: 'auto', 
                  mb: 3,
                  backgroundColor: '#d32f2f',
                  boxShadow: '0 4px 20px rgba(211, 47, 47, 0.3)',
                }}
              >
                <CartIcon sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#e5e7eb', mb: 2 }}>
                Your Cart is Empty
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, color: '#9ca3af', fontSize: '1.1rem' }}>
                Add some delicious items to your cart to get started.
              </Typography>
            </Box>
            
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
                boxShadow: '0 4px 20px rgba(211, 47, 47, 0.3)',
              }}
            >
              Browse Menu
            </Button>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#0b0f14' }}>
      {/* Header */}
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{ 
          background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 3 }, py: 1 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            flex: 1,
            gap: 2
          }}>
            <Button
              startIcon={<BackIcon />}
              onClick={handleBackToMenu}
              sx={{ 
                color: 'white',
                textTransform: 'none',
                fontWeight: 500,
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
            >
              Back to Menu
            </Button>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2
          }}>
            <Typography variant="h6" sx={{ 
              color: 'white', 
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <CartIcon />
              Shopping Cart ({getTotalItems()} items)
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* Alerts */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              borderRadius: 2,
              backgroundColor: '#1f2937',
              color: '#e5e7eb',
              border: '1px solid #374151',
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
              backgroundColor: '#1f2937',
              color: '#e5e7eb',
              border: '1px solid #374151',
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
            <Card sx={{ 
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Typography variant="h6" gutterBottom sx={{ 
                  fontWeight: 600, 
                  color: '#e5e7eb', 
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <RestaurantIcon sx={{ color: '#d32f2f' }} />
                  Order Items
                </Typography>
                
                <Stack spacing={2}>
                  {Object.values(cart).map((item) => (
                    <Card 
                      key={item.id} 
                      sx={{ 
                        backgroundColor: '#374151',
                        border: '1px solid #4b5563',
                        borderRadius: 2,
                        '&:hover': { 
                          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                          transform: 'translateY(-2px)',
                          transition: 'all 0.2s ease-in-out'
                        }
                      }}
                    >
                      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'center' }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#e5e7eb' }}>
                              {item.name}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5, color: '#9ca3af' }}>
                              ₹{item.price} each
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <IconButton
                                size="small"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                sx={{ 
                                  backgroundColor: '#4b5563',
                                  color: '#e5e7eb',
                                  '&:hover': { backgroundColor: '#6b7280' }
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
                                  backgroundColor: '#4b5563',
                                  color: '#e5e7eb',
                                  '&:hover': { backgroundColor: '#6b7280' }
                                }}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="h6" sx={{ fontWeight: 600, color: '#e5e7eb' }}>
                                ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                              </Typography>
                              
                              <IconButton
                                size="small"
                                onClick={() => updateQuantity(item.id, 0)}
                                sx={{ 
                                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                  color: '#ef4444',
                                  '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.3)' }
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
              </CardContent>
            </Card>
          </Box>

          {/* Order Summary */}
          <Box sx={{ flex: { lg: 1 } }}>
            <Card sx={{ 
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              height: 'fit-content',
              position: 'sticky',
              top: 20,
            }}>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Typography variant="h6" gutterBottom sx={{ 
                  fontWeight: 600, 
                  mb: 3,
                  color: '#e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <ReceiptIcon sx={{ color: '#d32f2f' }} />
                  Order Summary
                </Typography>

                {(tableUniqueId || roomUniqueId) && (
                  <Box sx={{ mb: 3 }}>
                    <Chip 
                      label={tableUniqueId ? `Table: ${tableUniqueId}` : `Room: ${roomUniqueId}`} 
                      sx={{ 
                        backgroundColor: '#d32f2f',
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
                      backgroundColor: '#374151',
                      '& fieldset': { borderColor: '#4b5563' },
                      '&:hover fieldset': { borderColor: '#6b7280' },
                      '&.Mui-focused fieldset': { borderColor: '#d32f2f' },
                    },
                    '& .MuiInputLabel-root': { color: '#9ca3af' },
                    '& .MuiInputBase-input': { color: '#e5e7eb' },
                  }}
                  placeholder="Any special requests or dietary requirements..."
                />

                <Divider sx={{ my: 3, borderColor: '#4b5563' }} />

                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1" sx={{ color: '#9ca3af' }}>
                      Items: {getTotalItems()}
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#e5e7eb' }}>
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
                    backgroundColor: '#d32f2f',
                    color: 'white',
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    boxShadow: '0 4px 20px rgba(211, 47, 47, 0.3)',
                    '&:hover': { 
                      backgroundColor: '#b71c1c',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 6px 25px rgba(211, 47, 47, 0.4)',
                    },
                    '&:disabled': {
                      backgroundColor: '#4b5563',
                      color: '#9ca3af',
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
                    borderColor: '#4b5563',
                    color: '#e5e7eb',
                    '&:hover': { 
                      borderColor: '#d32f2f',
                      backgroundColor: 'rgba(211, 47, 47, 0.1)',
                    },
                    textTransform: 'none',
                    fontWeight: 600,
                    py: 1.5,
                    borderRadius: 2,
                  }}
                >
                  Continue Shopping
                </Button>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Cart;
