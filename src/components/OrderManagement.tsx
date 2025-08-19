import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { Order } from '../types';
import { apiService } from '../services/api';

const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { user } = useAuth();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const orderList = await apiService.getOrders();
      setOrders(orderList);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    setLoading(true);
    setError('');

    try {
      await apiService.updateOrderStatus(orderId, newStatus);
      setSuccess(`Order ${orderId} status updated to ${newStatus}`);
      loadOrders();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update order status');
    } finally {
      setLoading(false);
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
      case 'delivered':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    return order.status.toLowerCase() === statusFilter.toLowerCase();
  });

  if (!user?.is_superuser && !user?.cafe_manager) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          Access denied. Admin privileges required.
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Order Management
        </Typography>
        
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Status</InputLabel>
          <Select
            value={statusFilter}
            label="Filter by Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All Orders</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="preparing">Preparing</MenuItem>
            <MenuItem value="ready">Ready</MenuItem>
            <MenuItem value="delivered">Delivered</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Typography variant="body1" sx={{ mb: 2 }}>
        Showing {filteredOrders.length} of {orders.length} orders
      </Typography>

      {filteredOrders.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No Orders Found
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {statusFilter === 'all' ? 'No orders have been placed yet.' : `No orders with status "${statusFilter}".`}
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredOrders.map((order) => (
            <Card key={order.id}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6">
                      Order #{order.id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(order.created_at)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                    <Chip
                      label={order.status}
                      color={getStatusColor(order.status) as any}
                      size="small"
                    />
                    <Typography variant="h6" color="primary">
                      ₹{order.price}
                    </Typography>
                  </Box>
                </Box>

                {order.table_unique_id && (
                  <Box sx={{ mb: 2 }}>
                    <Chip label={`Table: ${order.table_unique_id}`} size="small" />
                  </Box>
                )}

                {order.special_instructions && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Special Instructions:</strong> {order.special_instructions}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Order Items:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {order.items_json ? Object.entries(JSON.parse(order.items_json)).map(([id, data]: [string, any], index) => (
                      <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">
                          {data[1]} x{data[0]}
                        </Typography>
                        <Typography variant="body2" color="primary">
                          ₹{data[2] * data[0]}
                        </Typography>
                      </Box>
                    )) : null}
                  </Box>
                </Box>

                {order.estimated_time && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Estimated Time: {order.estimated_time} minutes
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleStatusUpdate(order.id, 'preparing')}
                    disabled={order.status === 'preparing' || order.status === 'ready' || order.status === 'delivered' || order.status === 'cancelled'}
                  >
                    Start Preparing
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleStatusUpdate(order.id, 'ready')}
                    disabled={order.status === 'ready' || order.status === 'delivered' || order.status === 'cancelled'}
                  >
                    Mark Ready
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleStatusUpdate(order.id, 'delivered')}
                    disabled={order.status === 'delivered' || order.status === 'cancelled'}
                  >
                    Mark Delivered
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                    disabled={order.status === 'delivered' || order.status === 'cancelled'}
                  >
                    Cancel Order
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Container>
  );
};

export default OrderManagement;
