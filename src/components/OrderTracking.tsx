import React, { useState, useEffect } from 'react';
import {
  Alert,
  CircularProgress,
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
import { useSocket } from '../context/SocketContext';
import { useRestaurant } from '../context/RestaurantContext';

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
  const { socket, requestOrderTracking } = useSocket();
  const { restaurant, switchRestaurant } = useRestaurant();
  
  const tableUniqueId = searchParams.get('table');
  const roomUniqueId = searchParams.get('room');
  
  // Extract restaurant slug from URL if present
  const restaurantSlug = window.location.pathname.match(/\/r\/([^\/]+)/)?.[1];

  // Set restaurant context from URL if available
  useEffect(() => {
    if (restaurantSlug && (!restaurant || restaurant.slug !== restaurantSlug)) {
      switchRestaurant(restaurantSlug);
    }
  }, [restaurantSlug, restaurant, switchRestaurant]);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Ensure restaurant context is set before fetching order
        if (restaurant) {
          apiService.setRestaurantContext(restaurant.id);
          apiService.setRestaurantSlug(restaurant.slug);
        }
        
        if (orderId && !isNaN(parseInt(orderId))) {
          console.log('Loading order:', orderId, 'Restaurant:', restaurant?.name);
          const orderData = await apiService.getOrder(parseInt(orderId));
          console.log('Order loaded:', orderData);
          setOrder(orderData);
          
          // Request real-time tracking for this order
          if (socket) {
            requestOrderTracking(parseInt(orderId), tableUniqueId || undefined, roomUniqueId || undefined);
          }
        } else {
          setError('Invalid Order ID');
        }
      } catch (error: any) {
        console.error('Error loading order:', error);
        const errorMessage = error.response?.data?.error || 
                            error.response?.data?.detail || 
                            error.message || 
                            'Failed to load order. Please try again.';
        
        if (error.response?.status === 404) {
          setError('Order not found. It may have been deleted or the ID is incorrect.');
        } else if (error.response?.status === 401 || error.response?.status === 403) {
          setError('Authentication required. Please make sure you are logged in or the order belongs to your restaurant.');
        } else {
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId, socket, requestOrderTracking, tableUniqueId, roomUniqueId, restaurant]);

  // Socket.IO event listeners for real-time order updates
  useEffect(() => {
    if (!orderId) return;

    const handleOrderStatus = (event: CustomEvent) => {
      const data = event.detail;
      console.log('📊 Order status update received via Socket.IO:', data);
      if (data.order && data.order.id === parseInt(orderId)) {
        setOrder(data.order);
      }
    };

    const handleOrderUpdate = (event: CustomEvent) => {
      const data = event.detail;
      console.log('📋 Order update received via Socket.IO:', data);
      if (data.order_id === parseInt(orderId)) {
        setOrder(prevOrder => 
          prevOrder ? { ...prevOrder, status: data.status } : null
        );
      }
    };

    const handleTrackingStarted = (event: CustomEvent) => {
      const data = event.detail;
      console.log('🔍 Tracking started for order:', data.order_id);
    };

    // Add event listeners
    window.addEventListener('orderStatus', handleOrderStatus as EventListener);
    window.addEventListener('orderUpdated', handleOrderUpdate as EventListener);
    window.addEventListener('trackingStarted', handleTrackingStarted as EventListener);

    return () => {
      // Remove event listeners
      window.removeEventListener('orderStatus', handleOrderStatus as EventListener);
      window.removeEventListener('orderUpdated', handleOrderUpdate as EventListener);
      window.removeEventListener('trackingStarted', handleTrackingStarted as EventListener);
    };
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

  const getStatusIcon = (step: number, currentStep: number) => {
    if (step < currentStep) {
      return <CheckCircleIcon className="text-green-500" />;
    } else if (step === currentStep) {
      return <ScheduleIcon className="text-red-500" />;
    } else {
      return <ScheduleIcon className="text-gray-400" />;
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
    const restaurantSlug = restaurant?.slug || window.location.pathname.match(/\/r\/([^\/]+)/)?.[1];
    const basePath = restaurantSlug ? `/r/${restaurantSlug}` : '';
    const url = roomUniqueId 
      ? `${basePath}/?room=${roomUniqueId}` 
      : (tableUniqueId 
        ? `${basePath}/?table=${tableUniqueId}` 
        : `${basePath}/`);
    window.location.href = url;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-4">
        <CircularProgress sx={{ color: '#d32f2f', mb: 3 }} size={60} />
        <h2 className="text-xl font-semibold text-gray-200 mb-2">Loading Order Details...</h2>
        <p className="text-gray-400">Order ID: {orderId}</p>
        {restaurant && (
          <p className="text-gray-500 text-sm mt-2">Restaurant: {restaurant.name}</p>
        )}
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl shadow-lg p-6 max-w-md w-full border border-gray-700">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <ReceiptIcon className="text-white text-2xl" />
            </div>
            
            <Alert severity="error" className="mb-4 rounded-lg bg-red-900/20 border border-red-700 text-red-200">
              {error || 'Order not found'}
            </Alert>
            
            <div className="space-y-3">
              <button 
                onClick={() => window.history.back()}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <BackIcon />
                Go Back
              </button>
              <button 
                onClick={handleOrderMore}
                className="w-full border border-red-500 text-red-500 hover:bg-red-500/10 font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <CartIcon />
                Order More Food
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="w-full border border-gray-600 text-gray-300 hover:bg-gray-700 font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <HomeIcon />
                Go to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentStep = getStatusStep(order.status);
  const items = parseItems(order.items_json || '{}');

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <button 
              onClick={() => window.history.back()}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <BackIcon />
            </button>
            <h1 className="text-2xl font-bold">Order #{order.id}</h1>
          </div>
          <p className="text-red-100 text-sm">Track your order progress</p>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Order Details Card */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl p-4 shadow-lg">
          <h2 className="text-lg font-bold mb-3">Order Details</h2>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-red-200 text-xs">Customer</p>
              <p className="font-semibold">{order.name || 'Unknown'}</p>
            </div>
            
            <div>
              <p className="text-red-200 text-xs">{order.order_type === 'room' ? 'Room' : 'Table'}</p>
              <p className="font-semibold">{order.table || '-'}</p>
            </div>
            
            <div>
              <p className="text-red-200 text-xs">Total Amount</p>
              <p className="font-bold text-lg">₹{(parseFloat(order.price) || 0).toFixed(2)}</p>
            </div>
            
            <div>
              <p className="text-red-200 text-xs">Estimated Time</p>
              <p className="font-semibold">{order.estimated_time || 20} minutes</p>
            </div>
          </div>

          {order.special_instructions && (
            <div className="mt-3 pt-3 border-t border-red-400">
              <p className="text-red-200 text-xs mb-1">Special Instructions</p>
              <p className="text-sm">{order.special_instructions}</p>
            </div>
          )}
        </div>

        {/* Order Status Progress */}
        <div className="bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-700">
          <h2 className="text-lg font-bold text-gray-200 mb-3">Order Status</h2>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Status Steps */}
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 ${
                currentStep >= 1 ? 'bg-red-500' : 'bg-gray-600'
              }`}>
                {getStatusIcon(1, currentStep)}
              </div>
              <p className={`text-xs font-semibold ${
                currentStep >= 1 ? 'text-red-500' : 'text-gray-400'
              }`}>
                Pending
              </p>
            </div>
            <div className="text-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 ${
                currentStep >= 2 ? 'bg-red-500' : 'bg-gray-600'
              }`}>
                {getStatusIcon(2, currentStep)}
              </div>
              <p className={`text-xs font-semibold ${
                currentStep >= 2 ? 'text-red-500' : 'text-gray-400'
              }`}>
                Preparing
              </p>
            </div>
            <div className="text-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 ${
                currentStep >= 3 ? 'bg-red-500' : 'bg-gray-600'
              }`}>
                {getStatusIcon(3, currentStep)}
              </div>
              <p className={`text-xs font-semibold ${
                currentStep >= 3 ? 'text-red-500' : 'text-gray-400'
              }`}>
                Ready
              </p>
            </div>
            <div className="text-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 ${
                currentStep >= 4 ? 'bg-red-500' : 'bg-gray-600'
              }`}>
                {getStatusIcon(4, currentStep)}
              </div>
              <p className={`text-xs font-semibold ${
                currentStep >= 4 ? 'text-red-500' : 'text-gray-400'
              }`}>
                Completed
              </p>
            </div>
          </div>

          {/* Current Status */}
          <div className="text-center mt-3">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
              currentStep >= 4 ? 'bg-green-900/30 text-green-400 border border-green-700' : 'bg-red-900/30 text-red-400 border border-red-700'
            }`}>
              {(order.status || 'pending').toUpperCase()}
            </span>
          </div>
        </div>

        {/* Order Items - Compact */}
        {items.length > 0 && (
          <div className="bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-700">
            <h2 className="text-lg font-bold text-gray-200 mb-3">Order Items</h2>
            
            <div className="space-y-2">
              {items.map((item, index) => (
                <div 
                  key={index} 
                  className="flex justify-between items-center p-3 bg-gray-700 rounded-lg border border-gray-600"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-200 text-sm">{item.name}</p>
                    <p className="text-gray-400 text-xs">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-bold text-red-400 text-sm">
                    ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-700">
          <h2 className="text-lg font-bold text-gray-200 mb-3">What would you like to do next?</h2>
          <div className="space-y-3">
            <button 
              onClick={handleOrderMore}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <CartIcon />
              Order More Food
            </button>
            <button 
              onClick={() => window.history.back()}
              className="w-full border border-red-500 text-red-500 hover:bg-red-500/10 font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <BackIcon />
              Go Back
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full border border-gray-600 text-gray-300 hover:bg-gray-700 font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <HomeIcon />
              Go to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
