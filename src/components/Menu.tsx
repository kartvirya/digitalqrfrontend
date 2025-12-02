import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Box,
  Alert,
  CircularProgress,
  IconButton,
  AppBar,
  Toolbar,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  Divider,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon,
  Restaurant as RestaurantIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { useSearchParams, useParams } from 'react-router-dom';
import { MenuItem, Table } from '../types';
import { apiService } from '../services/api';
import { useRestaurant } from '../context/RestaurantContext';
import WaiterCallButton from './WaiterCallButton';

const Menu: React.FC = () => {
  const [searchParams] = useSearchParams();
  const params = useParams();
  const { restaurant, switchRestaurant, loading: restaurantLoading } = useRestaurant();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tableInfo, setTableInfo] = useState<Table | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, { quantity: number; name: string; price: string }>>({});
  const [existingOrders, setExistingOrders] = useState<any[]>([]);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Extract restaurant slug from URL path (/r/:restaurantSlug) or query param
  const restaurantSlug = params.restaurantSlug || searchParams.get('restaurant');
  const tableUniqueId = searchParams.get('table');
  const roomUniqueId = searchParams.get('room');

  useEffect(() => {
    // Set restaurant context from URL
    if (restaurantSlug && (!restaurant || restaurant.slug !== restaurantSlug)) {
      switchRestaurant(restaurantSlug);
    }
  }, [restaurantSlug, restaurant, switchRestaurant]);

  useEffect(() => {
    // Wait for restaurant to be loaded if we have a slug, or proceed if no slug is needed
    if (restaurantLoading) {
      // Still loading restaurant, wait
      return;
    }

    // If we have a restaurant slug but no restaurant loaded, wait a bit more
    if (restaurantSlug && !restaurant) {
      return;
    }

    // Load menu and table info
    loadMenu();
    if (tableUniqueId) {
      loadTableInfo();
      loadExistingOrders(tableUniqueId, 'table');
    } else if (roomUniqueId) {
      loadRoomInfo();
      loadExistingOrders(roomUniqueId, 'room');
    }
    
    // Load saved cart
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        setCart(parsed);
      } catch (error) {
        setCart({});
      }
    }
    
    // Check if user just placed an order
    const orderPlaced = sessionStorage.getItem('orderPlaced');
    if (orderPlaced) {
      setShowOrderSuccess(true);
      sessionStorage.removeItem('orderPlaced');
      setTimeout(() => setShowOrderSuccess(false), 5000);
    }
  }, [tableUniqueId, roomUniqueId, restaurant, restaurantSlug, restaurantLoading]);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const loadMenu = async () => {
    try {
      // Set restaurant context in API service if we have it
      if (restaurant) {
        apiService.setRestaurantContext(restaurant.id);
        apiService.setRestaurantSlug(restaurant.slug);
      }
      const items = await apiService.getMenuItems();
      setMenuItems(items);
    } catch (error) {
      console.error('Failed to load menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTableInfo = async () => {
    if (!tableUniqueId) return;
    
    try {
      // Ensure restaurant context is set before fetching tables
      if (restaurant) {
        apiService.setRestaurantContext(restaurant.id);
        apiService.setRestaurantSlug(restaurant.slug);
      }
      
      const tables = await apiService.getTables();
      const table = tables.find(t => t.qr_unique_id === tableUniqueId);
      setTableInfo(table || null);
      
      if (!table) {
        console.warn(`Table with QR ID ${tableUniqueId} not found`);
      }
    } catch (error) {
      console.error('Failed to load table info:', error);
    }
  };

  const loadRoomInfo = async () => {
    // Implement room info loading if needed
  };

  const loadExistingOrders = async (uniqueId: string, type: 'table' | 'room') => {
    try {
      const orders = await apiService.getOrders();
      const filtered = orders.filter(order => 
        (type === 'table' && order.table === uniqueId) ||
        (type === 'room' && order.room_unique_id === uniqueId)
      );
      setExistingOrders(filtered);
    } catch (error) {
      console.error('Failed to load existing orders:', error);
    }
  };

  const getCategories = () => {
    const categories = ['all', ...new Set(menuItems.map(item => item.category))];
    return categories;
  };

  const getFilteredItems = () => {
    if (selectedCategory === 'all') {
      return menuItems;
    }
    return menuItems.filter(item => item.category === selectedCategory);
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => ({
      ...prev,
      [item.id]: {
        quantity: (prev[item.id]?.quantity || 0) + 1,
        name: item.name,
        price: item.price.toString()
      }
    }));
  };

  const removeFromCart = (itemId: number) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[itemId]) {
        newCart[itemId].quantity -= 1;
        if (newCart[itemId].quantity <= 0) {
          delete newCart[itemId];
        }
      }
      return newCart;
    });
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return Object.entries(cart).reduce((total, [itemId, item]) => {
      return total + (parseFloat(item.price) * item.quantity);
    }, 0);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'warning';
      case 'preparing': return 'info';
      case 'ready': return 'success';
      case 'delivered': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <ScheduleIcon />;
      case 'preparing': return <RestaurantIcon />;
      case 'ready': return <CheckCircleIcon />;
      case 'delivered': return <CheckCircleIcon />;
      default: return <ScheduleIcon />;
    }
  };

  if (loading || restaurantLoading) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#0b0f14',
          color: '#e5e7eb'
        }}
      >
        <CircularProgress size={80} sx={{ color: '#d32f2f', mb: 3 }} />
        <Typography variant="h5" sx={{ color: '#e5e7eb', fontWeight: 'bold', mb: 1 }}>
          Loading Menu...
        </Typography>
        <Typography variant="body1" sx={{ color: '#9ca3af', opacity: 0.8 }}>
          Preparing delicious options for you
        </Typography>
      </Box>
    );
  }

  const categories = getCategories();
  const filteredItems = getFilteredItems();

    return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#0b0f14' }}>

      <Container maxWidth="lg" sx={{ py: 2, px: { xs: 2, sm: 3 } }}>
        {/* Success Message */}
        {showOrderSuccess && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 2,
              borderRadius: 2,
              backgroundColor: '#1f2937',
              color: '#e5e7eb',
              border: '1px solid #374151',
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              ✅ Order Placed Successfully!
            </Typography>
            <Typography variant="body2">
              Your order has been placed and is being prepared.
            </Typography>
          </Alert>
        )}

        {/* Waiter Call Button */}
        {tableUniqueId && (
          <Card sx={{ 
            mb: 2, 
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: 2
          }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#e5e7eb', mb: 2 }}>
                Need Help?
              </Typography>
              <WaiterCallButton 
                tableNumber={tableInfo?.table_number || 'Unknown'}
                tableUniqueId={tableUniqueId}
                roomUniqueId={roomUniqueId || undefined}
              />
            </CardContent>
          </Card>
        )}

        {/* Menu Header + actions */}
        <Card sx={{ 
          mb: 2, 
          backgroundColor: '#1f2937',
          border: '1px solid #374151',
          borderRadius: 2
        }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <RestaurantIcon sx={{ fontSize: 32, color: '#d32f2f' }} />
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: '#e5e7eb', mb: 0.5 }}>
                    Menu
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                    Browse our delicious menu and add items to your cart
                  </Typography>
                  {tableInfo && (
                    <Typography variant="body2" sx={{ color: '#9ca3af', mt: 0.5 }}>
                      Table: <strong>{tableInfo.table_number}</strong>
                    </Typography>
                  )}
                </Box>
              </Box>
              {(tableUniqueId || roomUniqueId) && (
                <Button
                  variant="contained"
                  size="small"
                  color="primary"
                  startIcon={<ReceiptIcon />}
                  onClick={() => {
                    const url = roomUniqueId
                      ? `/bills?room=${roomUniqueId}`
                      : tableUniqueId
                        ? `/bills?table=${tableUniqueId}`
                        : '/bills';
                    window.location.href = url;
                  }}
                  sx={{ mt: { xs: 1, sm: 0 } }}
                >
                  View Bill
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Category Tabs */}
        <Box sx={{ mb: 2 }}>
          <Tabs
            value={selectedCategory}
            onChange={(e, newValue) => setSelectedCategory(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                color: '#9ca3af',
                textTransform: 'none',
                fontWeight: 500,
                minWidth: 'auto',
                px: 2,
                py: 1,
                borderRadius: 1,
                mx: 0.5,
                '&.Mui-selected': {
                  color: '#e5e7eb',
                  backgroundColor: '#d32f2f',
                },
                '&:hover': {
                  backgroundColor: 'rgba(211, 47, 47, 0.1)',
                },
              },
              '& .MuiTabs-indicator': {
                display: 'none',
              },
            }}
          >
            {categories.map((category) => (
              <Tab
                key={category}
                value={category}
                label={category === 'all' ? 'All Items' : category}
              />
            ))}
          </Tabs>
        </Box>

        {/* Menu Items List */}
        <Card sx={{ 
          backgroundColor: '#1f2937',
          border: '1px solid #374151',
          borderRadius: 2
        }}>
          <List sx={{ p: 0 }}>
            {filteredItems.map((item, index) => (
              <React.Fragment key={item.id}>
                <ListItem sx={{ 
                  px: 2, 
                  py: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.02)'
                  }
                }}>
                  {/* Item Image */}
                  <Avatar
                    variant="rounded"
                    sx={{ 
                      width: 60, 
                      height: 60, 
                      mr: 2,
                      backgroundColor: '#374151'
                    }}
                  >
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <RestaurantIcon sx={{ color: '#9ca3af' }} />
                    )}
                  </Avatar>

                  {/* Item Details */}
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 600, 
                          color: '#e5e7eb',
                          fontSize: '1rem'
                        }}>
                          {item.name}
                        </Typography>
                        <Chip 
                          label={item.category} 
                          size="small" 
                          sx={{ 
                            backgroundColor: '#d32f2f',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            height: 20
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" sx={{ 
                          color: '#9ca3af', 
                          mb: 1,
                          lineHeight: 1.4
                        }}>
                          {item.description}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 700, 
                            color: '#e5e7eb',
                            fontSize: '1.1rem'
                          }}>
                            ₹{item.price}
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            color: item.is_available ? '#10b981' : '#ef4444',
                            fontWeight: 500
                          }}>
                            {item.is_available ? 'Available' : 'Not Available'}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />

                  {/* Add to Cart Controls */}
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {cart[item.id] ? (
                        <>
                          <IconButton
                            size="small"
                            onClick={() => removeFromCart(item.id)}
                            sx={{ 
                              color: '#e5e7eb',
                              backgroundColor: 'rgba(255,255,255,0.1)',
                              '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
                            }}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          <Typography variant="h6" sx={{ 
                            minWidth: 30, 
                            textAlign: 'center', 
                            color: '#e5e7eb',
                            fontWeight: 600
                          }}>
                            {cart[item.id].quantity}
                          </Typography>
                        </>
                      ) : null}
                      <IconButton
                        size="small"
                        onClick={() => addToCart(item)}
                        disabled={!item.is_available}
                        sx={{ 
                          color: '#e5e7eb',
                          backgroundColor: '#d32f2f',
                          '&:hover': {
                            backgroundColor: '#b71c1c',
                          },
                          '&:disabled': {
                            backgroundColor: '#374151',
                            color: '#6b7280',
                          }
                        }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < filteredItems.length - 1 && (
                  <Divider sx={{ borderColor: '#374151' }} />
                )}
              </React.Fragment>
            ))}
          </List>
        </Card>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <Card sx={{ 
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: 2
          }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <RestaurantIcon sx={{ fontSize: 60, color: '#6b7280', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#9ca3af', mb: 1 }}>
                No items found
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280' }}>
                Try selecting a different category
              </Typography>
            </CardContent>
          </Card>
        )}
      </Container>

      {/* Floating Cart Button */}
      {getTotalItems() > 0 && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000
          }}
        >
          <Button
            variant="contained"
            size="large"
            onClick={() => {
              const basePath = restaurantSlug ? `/r/${restaurantSlug}` : '';
              const url = roomUniqueId 
                ? `${basePath}/cart?room=${roomUniqueId}` 
                : (tableUniqueId 
                  ? `${basePath}/cart?table=${tableUniqueId}` 
                  : `${basePath}/cart`);
              window.location.href = url;
            }}
            startIcon={<CartIcon />}
            sx={{
              backgroundColor: '#d32f2f',
              borderRadius: 3,
              px: 3,
              py: 1.5,
              fontWeight: 600,
              boxShadow: '0 4px 20px rgba(211, 47, 47, 0.3)',
              '&:hover': {
                backgroundColor: '#b71c1c',
                transform: 'scale(1.05)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            <Badge badgeContent={getTotalItems()} color="error" sx={{ mr: 1 }}>
              <Box sx={{ width: 20, height: 20 }} />
            </Badge>
            Cart
          </Button>
        </Box>
      )}

      {/* Cart Drawer */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: { xs: '100%', sm: 400 },
          backgroundColor: '#1f2937',
          transform: cartDrawerOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease',
          zIndex: 1200,
          borderLeft: '1px solid #374151'
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#e5e7eb' }}>
              Cart ({getTotalItems()} items)
            </Typography>
            <IconButton onClick={() => setCartDrawerOpen(false)} sx={{ color: '#e5e7eb' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {Object.keys(cart).length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CartIcon sx={{ fontSize: 60, color: '#6b7280', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#9ca3af' }}>
                Your cart is empty
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280' }}>
                Add some delicious items to get started
              </Typography>
            </Box>
          ) : (
            <>
              <List>
                {Object.entries(cart).map(([itemId, item]) => (
                  <ListItem key={itemId} sx={{ px: 0 }}>
                    <ListItemText
                      primary={item.name}
                      secondary={`₹${item.price} each`}
                      sx={{
                        '& .MuiListItemText-primary': { color: '#e5e7eb' },
                        '& .MuiListItemText-secondary': { color: '#9ca3af' }
                      }}
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => removeFromCart(parseInt(itemId))}
                          sx={{ color: '#e5e7eb' }}
                        >
                          <RemoveIcon />
                        </IconButton>
                        <Typography variant="h6" sx={{ minWidth: 30, textAlign: 'center', color: '#e5e7eb' }}>
                          {item.quantity}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => addToCart({ id: parseInt(itemId), name: item.name, price: item.price } as MenuItem)}
                          sx={{ color: '#e5e7eb' }}
                        >
                          <AddIcon />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 2, borderColor: '#374151' }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#e5e7eb' }}>
                  Total: ₹{getTotalPrice().toFixed(2)}
                </Typography>
              </Box>

              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={() => {
                  const restaurantSlug = params.restaurantSlug || searchParams.get('restaurant') || restaurant?.slug;
                  const basePath = restaurantSlug ? `/r/${restaurantSlug}` : '';
                  const url = roomUniqueId 
                    ? `${basePath}/cart?room=${roomUniqueId}` 
                    : (tableUniqueId 
                      ? `${basePath}/cart?table=${tableUniqueId}` 
                      : `${basePath}/cart`);
                  window.location.href = url;
                }}
                startIcon={<ReceiptIcon />}
                sx={{
                  borderRadius: 2,
                  fontWeight: 600,
                  backgroundColor: '#d32f2f',
                  '&:hover': {
                    backgroundColor: '#b71c1c'
                  }
                }}
              >
                Proceed to Checkout
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Backdrop for cart drawer */}
      {cartDrawerOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1100
          }}
          onClick={() => setCartDrawerOpen(false)}
        />
      )}
    </Box>
  );
};

export default Menu;
