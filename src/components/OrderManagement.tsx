import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRestaurant } from '../context/RestaurantContext';
import { useSocket } from '../context/SocketContext';
import { Order } from '../types';
import { apiService } from '../services/api';
import {
  ClockIcon,
  UserIcon,
  ShoppingBagIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  TableCellsIcon,
  CurrencyRupeeIcon,
} from '@heroicons/react/24/outline';

const OrderManagement: React.FC = () => {
  const { restaurant } = useRestaurant();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (restaurant) {
      apiService.setRestaurantContext(restaurant.id);
      apiService.setRestaurantSlug(restaurant.slug);
    }
    loadOrders();
  }, [restaurant]);

  // Socket.IO event listeners for real-time updates
  useEffect(() => {
    // Listen for new orders
    const handleNewOrder = (event: CustomEvent) => {
      const data = event.detail;
      console.log('🆕 New order received via Socket.IO:', data);
      setSuccess(`New order #${data.order.id} received!`);
      loadOrders(); // Refresh the orders list
    };

    // Listen for order status updates
    const handleOrderUpdate = (event: CustomEvent) => {
      const data = event.detail;
      console.log('📋 Order update received via Socket.IO:', data);
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === data.order_id 
            ? { ...order, status: data.status }
            : order
        )
      );
      setSuccess(`Order #${data.order_id} status updated to ${data.status}`);
    };

    // Listen for order status updates
    const handleOrderStatus = (event: CustomEvent) => {
      const data = event.detail;
      console.log('📊 Order status received via Socket.IO:', data);
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === data.order.id 
            ? data.order
            : order
        )
      );
    };

    // Add event listeners
    window.addEventListener('newOrder', handleNewOrder as EventListener);
    window.addEventListener('orderUpdated', handleOrderUpdate as EventListener);
    window.addEventListener('orderStatus', handleOrderStatus as EventListener);

    return () => {
      // Remove event listeners
      window.removeEventListener('newOrder', handleNewOrder as EventListener);
      window.removeEventListener('orderUpdated', handleOrderUpdate as EventListener);
      window.removeEventListener('orderStatus', handleOrderStatus as EventListener);
    };
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Ensure restaurant context is set before fetching orders
      if (restaurant) {
        apiService.setRestaurantContext(restaurant.id);
        apiService.setRestaurantSlug(restaurant.slug);
      } else {
        console.warn('No restaurant context available for loading orders');
        setError('Restaurant context is required. Please select a restaurant.');
        setOrders([]);
        setLoading(false);
        return;
      }
      
      console.log('Loading orders for restaurant:', restaurant.name, 'ID:', restaurant.id);
      const orderList = await apiService.getOrders();
      console.log('Orders loaded:', orderList.length, 'orders');
      setOrders(orderList);
      if (success) {
        setTimeout(() => setSuccess(''), 3000); // Clear success message after 3 seconds
      }
    } catch (error: any) {
      console.error('Error loading orders:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || error.message || 'Failed to load orders. Please try refreshing the page.';
      setError(errorMessage);
      setOrders([]); // Reset orders on error
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    if (!window.confirm(`Are you sure you want to mark Order #${orderId} as ${newStatus}?`)) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiService.updateOrderStatus(orderId, newStatus);
      setSuccess(`Order #${orderId} has been successfully marked as ${newStatus}`);
      
      // Emit Socket.IO event for real-time update
      if (socket && isConnected) {
        const userType = user?.is_superuser || user?.cafe_manager ? 'admin' : 'staff';
        socket.emit('order_status_update', {
          order_id: orderId,
          status: newStatus,
          user_type: userType
        });
      }
      
      loadOrders();
    } catch (error: any) {
      console.error('Error updating order status:', error);
      setError(error.response?.data?.error || `Failed to update order status. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (orderId: number) => {
    if (!window.confirm(`Mark Order #${orderId} as paid and free the table?`)) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const updatedOrder = await apiService.markOrderPaid(orderId, 'cash');
      setSuccess(`Order #${orderId} marked as paid. Table is now free.`);

      // Optimistically update local state
      setOrders(prev =>
        prev.map(o => (o.id === updatedOrder.id ? updatedOrder : o))
      );
    } catch (error: any) {
      console.error('Error marking order as paid:', error);
      setError(error.message || 'Failed to mark order as paid. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <ClockIcon className="w-4 h-4" />;
      case 'preparing':
        return <ArrowPathIcon className="w-4 h-4" />;
      case 'ready':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'cancelled':
        return <XCircleIcon className="w-4 h-4" />;
      default:
        return <ExclamationTriangleIcon className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'preparing':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'ready':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'delivered':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPaymentBadge = (payment_status?: string, payment_method?: string) => {
    if (!payment_status) return null;
    const isPaid = payment_status.toLowerCase() === 'paid';
    const baseClasses =
      'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border';
    const colorClasses = isPaid
      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
      : 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40';
    const label = isPaid ? 'Paid' : payment_status.replace('_', ' ');
    const methodLabel = payment_method ? ` • ${payment_method}` : '';
    return (
      <div className={`${baseClasses} ${colorClasses}`}>
        <CurrencyRupeeIcon className="w-3 h-3" />
        <span>{label}{methodLabel}</span>
      </div>
    );
  };

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    return order.status.toLowerCase() === statusFilter.toLowerCase();
  });

  if (!user?.is_superuser && !user?.cafe_manager) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircleIcon className="text-white text-2xl" />
            </div>
            <h2 className="text-xl font-bold text-gray-200 mb-2">Access Denied</h2>
            <p className="text-gray-400">Admin privileges required to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-4">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-200 mb-2">Loading Orders...</h2>
        <p className="text-gray-400">Please wait while we fetch the latest orders</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ShoppingBagIcon className="text-white" />
            </div>
            <h1 className="text-2xl font-bold">Order Management</h1>
          </div>
          <p className="text-red-100 text-sm">Manage and track all restaurant orders</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Filter Section */}
        <div className="bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-300">Filter by Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors text-sm"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div className="text-right">
              <p className="text-gray-400 text-sm">
                Showing {filteredOrders.length} of {orders.length} orders
              </p>
              <button
                onClick={() => {
                  if (socket && isConnected) {
                    socket.emit('order_status_update', {
                      order_id: 88,
                      status: 'ready',
                      user_type: 'admin'
                    });
                    setSuccess('Test event sent! Check both browsers.');
                  }
                }}
                className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
                disabled={!isConnected}
              >
                Test Real-time Update
              </button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-900/20 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-900/20 border border-green-700 text-green-200 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBagIcon className="text-gray-400 text-2xl" />
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No Orders Found</h3>
            <p className="text-gray-400 mb-6">
              {statusFilter === 'all' 
                ? 'No orders have been placed yet. New orders will appear here.' 
                : `No orders with status "${statusFilter}". Try selecting a different status filter.`
              }
            </p>
            <button 
              onClick={() => setStatusFilter('all')}
              className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              View All Orders
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div 
                key={order.id}
                className="bg-gray-800 rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-200 overflow-hidden"
              >
                {/* Order Header */}
                <div className="bg-gray-750 p-4 border-b border-gray-700">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-200">
                          Order #{order.id}
                        </h3>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {order.status}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
                        <div className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          {formatDate(order.created_at)}
                        </div>
                        {order.table_unique_id && (
                          <div className="flex items-center gap-1">
                            <TableCellsIcon className="w-4 h-4" />
                            Table {order.table_unique_id.slice(0, 8)}...
                          </div>
                        )}
                        {order.estimated_time && (
                          <div className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs border border-purple-500/30">
                            {order.estimated_time} min
                          </div>
                        )}
                        {getPaymentBadge(order.payment_status as any, order.payment_method as any)}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-200">
                        ₹{Number(order.price).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Content */}
                <div className="p-4">
                  {/* Special Instructions */}
                  {order.special_instructions && (
                    <div className="mb-4 p-3 bg-gray-700 rounded-lg border border-gray-600">
                      <p className="text-sm text-gray-300 mb-1 font-medium">Special Instructions:</p>
                      <p className="text-sm text-gray-400 italic">{order.special_instructions}</p>
                    </div>
                  )}

                  {/* Order Items */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-300 mb-3">Order Items:</p>
                    <div className="space-y-2">
                      {order.items_json ? Object.entries(JSON.parse(order.items_json)).map(([, data]: [string, any], index) => (
                        <div 
                          key={index} 
                          className="flex justify-between items-center p-3 bg-gray-700 rounded-lg border border-gray-600"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-gray-200">{data[1]}</span>
                            <span className="text-gray-400 text-sm bg-gray-600 px-2 py-1 rounded">x{data[0]}</span>
                          </div>
                          <span className="font-medium text-gray-200">
                            ₹{(data[2] * data[0]).toLocaleString('en-IN')}
                          </span>
                        </div>
                      )) : null}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleStatusUpdate(order.id, 'preparing')}
                      disabled={order.status === 'preparing' || order.status === 'ready' || order.status === 'delivered' || order.status === 'cancelled'}
                      className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:text-gray-400 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <ArrowPathIcon className="w-4 h-4" />
                      Start Preparing
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(order.id, 'ready')}
                      disabled={order.status === 'ready' || order.status === 'delivered' || order.status === 'cancelled'}
                      className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:text-gray-400 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <CheckCircleIcon className="w-4 h-4" />
                      Mark Ready
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(order.id, 'delivered')}
                      disabled={order.status === 'delivered' || order.status === 'cancelled'}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:text-gray-400 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <CheckCircleIcon className="w-4 h-4" />
                      Mark Delivered
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                      disabled={order.status === 'delivered' || order.status === 'cancelled'}
                      className="px-3 py-2 border border-red-500 text-red-400 hover:bg-red-500/10 disabled:bg-gray-600 disabled:text-gray-400 disabled:border-gray-600 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <XCircleIcon className="w-4 h-4" />
                      Cancel Order
                    </button>
                    <button
                      onClick={() => handleMarkPaid(order.id)}
                      disabled={order.payment_status === 'paid'}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:text-gray-400 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <CurrencyRupeeIcon className="w-4 h-4" />
                      {order.payment_status === 'paid' ? 'Already Paid' : 'Mark Paid & Free Table'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderManagement;
