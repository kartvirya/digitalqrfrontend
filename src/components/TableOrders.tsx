import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Button
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Restaurant as RestaurantIcon,
  Done as DoneIcon
} from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { apiService } from '../services/api';
import { Order } from '../types';

const TableOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();

  const tableUniqueId = searchParams.get('table');
  const roomUniqueId = searchParams.get('room');

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        let ordersData: Order[] = [];
        
        if (tableUniqueId) {
          ordersData = await apiService.getOrdersByTableUniqueId(tableUniqueId);
        } else if (roomUniqueId) {
          ordersData = await apiService.getOrdersByRoomUniqueId(roomUniqueId);
        } else {
          setError('No table or room ID provided');
          return;
        }
        
        setOrders(ordersData);
      } catch (error: any) {
        setError(error.response?.data?.error || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [tableUniqueId, roomUniqueId]);

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

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <ScheduleIcon color="warning" />;
      case 'preparing':
        return <RestaurantIcon color="info" />;
      case 'ready':
        return <CheckCircleIcon color="success" />;
      case 'completed':
        return <DoneIcon color="success" />;
      default:
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

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          {error}
        </Alert>
      </Container>
    );
  }

  const location = tableUniqueId ? `Table ${tableUniqueId.substring(0, 8)}...` : `Room ${roomUniqueId?.substring(0, 8)}...`;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Orders for {location}
        </Typography>
        <Button
          variant="outlined"
          onClick={() => {
            const url = roomUniqueId ? `/?room=${roomUniqueId}` : (tableUniqueId ? `/?table=${tableUniqueId}` : '/');
            window.location.href = url;
          }}
        >
          Back to Menu
        </Button>
      </Box>

      {orders.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No Orders Found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            No orders have been placed for this {tableUniqueId ? 'table' : 'room'} yet.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={() => {
                const url = roomUniqueId ? `/?room=${roomUniqueId}` : (tableUniqueId ? `/?table=${tableUniqueId}` : '/');
                window.location.href = url;
              }}
              size="large"
            >
              Place New Order
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                const url = roomUniqueId ? `/?room=${roomUniqueId}` : (tableUniqueId ? `/?table=${tableUniqueId}` : '/');
                window.location.href = url;
              }}
              size="large"
            >
              Back to Menu
            </Button>
          </Box>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {orders.map((order) => {
            const items = parseItems(order.items_json);
            return (
              <Card key={order.id} variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6">
                        Order #{order.id}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(order.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusIcon(order.status)}
                      <Chip 
                        label={order.status.toUpperCase()} 
                        color={getStatusColor(order.status) as any}
                        size="small"
                      />
                    </Box>
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Customer
                      </Typography>
                      <Typography variant="body1">
                        {order.name}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total Amount
                      </Typography>
                      <Typography variant="h6" color="primary">
                        ${(parseFloat(order.price) || 0).toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>

                  {order.special_instructions && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Special Instructions
                      </Typography>
                      <Typography variant="body1">
                        {order.special_instructions}
                      </Typography>
                    </Box>
                  )}

                  <Typography variant="subtitle2" gutterBottom>
                    Order Items:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {items.map((item, index) => (
                      <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">
                          {item.name} x{item.quantity}
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        const url = roomUniqueId 
                          ? `/order-tracking/${order.id}?room=${roomUniqueId}` 
                          : (tableUniqueId 
                            ? `/order-tracking/${order.id}?table=${tableUniqueId}` 
                            : `/order-tracking/${order.id}`);
                        window.location.href = url;
                      }}
                    >
                      Track Order
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </Container>
  );
};

export default TableOrders;
