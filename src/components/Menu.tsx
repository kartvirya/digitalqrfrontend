import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardMedia,
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
  Divider,
  Fab,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
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
import { useSearchParams } from 'react-router-dom';
import { MenuItem, Table } from '../types';
import { apiService } from '../services/api';

const Menu: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tableInfo, setTableInfo] = useState<Table | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, { quantity: number; name: string; price: string }>>({});
  const [existingOrders, setExistingOrders] = useState<any[]>([]);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const theme = useTheme();

  const tableUniqueId = searchParams.get('table');
  const roomUniqueId = searchParams.get('room');

  useEffect(() => {
    loadMenu();
    if (tableUniqueId) {
      loadTableInfo();
      loadExistingOrders(tableUniqueId, 'table');
    } else if (roomUniqueId) {
      loadRoomInfo();
      loadExistingOrders(roomUniqueId, 'room');
    }
    // Load saved cart if coming back
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        setCart(parsed);
      } catch (error) {
        setCart({});
      }
    }
    
    // Check if user just placed an order (cart was cleared)
    const orderPlaced = sessionStorage.getItem('orderPlaced');
    if (orderPlaced) {
      setShowOrderSuccess(true);
      sessionStorage.removeItem('orderPlaced');
      setTimeout(() => setShowOrderSuccess(false), 5000);
    }
  }, [tableUniqueId, roomUniqueId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Persist cart for Cart page
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const loadMenu = async () => {
    try {
      const items = await apiService.getMenuItems();
      setMenuItems(items);
    } catch (error) {
      console.error('Failed to load menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTableInfo = async () => {
    try {
      const tables = await apiService.getTables();
      const table = tables.find(t => t.qr_unique_id === tableUniqueId);
      setTableInfo(table || null);
    } catch (error) {
      console.error('Failed to load table info:', error);
    }
  };

  const loadRoomInfo = async () => {
    try {
      const rooms = await apiService.getRooms();
      const room = rooms.find(r => r.qr_unique_id === roomUniqueId);
      if (room) {
        setTableInfo({
          id: room.id,
          table_name: room.room_name,
          table_number: room.room_number,
          capacity: room.capacity,
          qr_unique_id: room.qr_unique_id,
          is_occupied: room.is_active || false,
          floor: room.floor,
          is_active: room.is_active,
          created_at: room.created_at,
        } as Table);
      }
    } catch (error) {
      console.error('Failed to load room info:', error);
    }
  };

  const loadExistingOrders = async (uniqueId: string, type: 'table' | 'room') => {
    try {
      let orders;
      if (type === 'table') {
        orders = await apiService.getOrdersByTableUniqueId(uniqueId);
      } else {
        orders = await apiService.getOrdersByRoomUniqueId(uniqueId);
      }
      setExistingOrders(orders.filter((order: any) => 
        ['pending', 'preparing', 'ready'].includes(order.status.toLowerCase())
      ));
    } catch (error) {
      console.error('Failed to load existing orders:', error);
    }
  };

  const getCategories = () => {
    const categories = Array.from(new Set(menuItems.map(item => item.category)));
    return ['all', ...categories];
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
        price: item.price
      }
    }));
  };

  const removeFromCart = (itemId: number) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[itemId]?.quantity > 1) {
        newCart[itemId].quantity -= 1;
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  const getCartItemQuantity = (itemId: number) => {
    return cart[itemId]?.quantity || 0;
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return Object.values(cart).reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0);
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

  if (loading) {
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
      {/* App Bar */}
      <AppBar 
        position="sticky" 
        elevation={1}
        sx={{ 
          backgroundColor: '#d32f2f',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <RestaurantIcon sx={{ mr: 2, color: 'white' }} />
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
              Digital Menu
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {existingOrders.length > 0 && (
              <Chip
                icon={<CheckCircleIcon />}
                label={`${existingOrders.length} Active Order${existingOrders.length > 1 ? 's' : ''}`}
                color="success"
                variant="outlined"
                sx={{ color: 'white', borderColor: 'white' }}
              />
            )}
            
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                const url = roomUniqueId ? `/bills?room=${roomUniqueId}` : (tableUniqueId ? `/bills?table=${tableUniqueId}` : '/bills');
                window.location.href = url;
              }}
              sx={{ 
                color: 'white', 
                borderColor: 'white',
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              VIEW BILLS
            </Button>
            
            <Badge badgeContent={getTotalItems()} color="error">
              <IconButton
                onClick={() => setCartDrawerOpen(true)}
                sx={{ color: 'white' }}
              >
                <CartIcon />
              </IconButton>
            </Badge>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* Success Message */}
        {showOrderSuccess && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 3,
              borderRadius: 2,
              boxShadow: 2,
              backgroundColor: '#1f2937',
              color: '#e5e7eb',
              border: '1px solid #374151',
              '& .MuiAlert-icon': { fontSize: '2rem' }
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              ✅ Order Placed Successfully!
            </Typography>
            <Typography variant="body1">
              Your order has been placed and is being prepared. You can continue to add more items to your cart for additional orders!
            </Typography>
          </Alert>
        )}

        {/* Menu Header Section */}
        <Box sx={{ 
          backgroundColor: '#ffffff', 
          borderRadius: 2, 
          p: 3, 
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <RestaurantIcon sx={{ fontSize: 48, color: '#6b7280' }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#374151', mb: 1 }}>
              Menu
            </Typography>
            <Typography variant="body1" sx={{ color: '#6b7280' }}>
              Browse our delicious menu and add items to your cart.
            </Typography>
          </Box>
        </Box>

        {/* Category Tabs */}
        <Box sx={{ mb: 3 }}>
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
                px: 3,
                py: 1,
                borderRadius: 2,
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

        {/* Menu Items */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: '1fr', 
            sm: 'repeat(2, 1fr)', 
            lg: 'repeat(3, 1fr)',
            xl: 'repeat(4, 1fr)'
          }, 
          gap: 3 
        }}>
          {filteredItems.map((item) => (
            <Card 
              key={item.id}
              elevation={0}
              sx={{ 
                borderRadius: 2,
                overflow: 'hidden',
                transition: 'all 0.2s ease',
                border: '1px solid #374151',
                backgroundColor: '#1f2937',
                '&:hover': { 
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                }
              }}
            >
              {/* Image Section */}
              <Box sx={{ 
                height: 200, 
                backgroundColor: '#ffffff',
                border: item.id === 1 ? '2px solid #d32f2f' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {item.image_url ? (
                  <CardMedia
                    component="img"
                    height="200"
                    image={item.image_url}
                    alt={item.name}
                    sx={{ objectFit: 'cover' }}
                  />
                ) : (
                  <RestaurantIcon sx={{ fontSize: 48, color: '#9ca3af' }} />
                )}
              </Box>

              {/* Content Section */}
              <CardContent sx={{ 
                p: 2, 
                backgroundColor: '#1f2937',
                color: '#e5e7eb'
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#e5e7eb', flex: 1 }}>
                    {item.name}
                  </Typography>
                  <Chip 
                    label={item.category} 
                    size="small" 
                    sx={{ 
                      backgroundColor: '#d32f2f',
                      color: 'white',
                      fontWeight: 600,
                      ml: 1,
                      fontSize: '0.7rem',
                      height: 20
                    }}
                  />
                </Box>
                
                <Typography variant="body2" sx={{ color: '#9ca3af', mb: 2, lineHeight: 1.4 }}>
                  {item.description}
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#e5e7eb' }}>
                    ₹{item.price}
                  </Typography>
                  <Typography variant="body2" sx={{ color: item.is_available ? '#10b981' : '#ef4444' }}>
                    {item.is_available ? 'Available' : 'Not Available'}
                  </Typography>
                </Box>
                
                {/* Add to Cart Button */}
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<AddIcon />}
                  onClick={() => addToCart(item)}
                  disabled={!item.is_available}
                  sx={{ 
                    borderRadius: 1,
                    fontWeight: 600,
                    backgroundColor: '#d32f2f',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#b71c1c',
                    },
                    '&:disabled': {
                      backgroundColor: '#374151',
                      color: '#6b7280',
                    }
                  }}
                >
                  ADD TO CART
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>

      {/* Floating Cart Button */}
      {getTotalItems() > 0 && (
        <Fab
          color="primary"
          aria-label="cart"
          onClick={() => {
            const url = roomUniqueId ? `/cart?room=${roomUniqueId}` : (tableUniqueId ? `/cart?table=${tableUniqueId}` : '/cart');
            window.location.href = url;
          }}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            backgroundColor: '#d32f2f',
            '&:hover': {
              backgroundColor: '#b71c1c',
              transform: 'scale(1.05)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          <Badge badgeContent={getTotalItems()} color="error">
            <CartIcon />
          </Badge>
        </Fab>
      )}

      {/* Cart Drawer */}
      <Drawer
        anchor="right"
        open={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        PaperProps={{
          sx: { 
            width: { xs: '100%', sm: 400 },
            backgroundColor: '#1f2937',
            color: '#e5e7eb'
          }
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#e5e7eb' }}>
              Your Cart ({getTotalItems()} items)
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

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#e5e7eb' }}>
                  Total: ₹{getTotalPrice().toFixed(2)}
                </Typography>
              </Box>

              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={() => {
                  const url = roomUniqueId ? `/cart?room=${roomUniqueId}` : (tableUniqueId ? `/cart?table=${tableUniqueId}` : '/cart');
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
      </Drawer>
    </Box>
  );
};

export default Menu;
