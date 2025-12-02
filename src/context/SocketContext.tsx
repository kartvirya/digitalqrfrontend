import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinRoom: (room: string, userType: string) => void;
  leaveRoom: (room: string) => void;
  emitOrderStatusUpdate: (orderId: number, status: string, userType: string) => void;
  requestOrderTracking: (orderId: number, tableId?: string, roomId?: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [joinedRooms, setJoinedRooms] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  useEffect(() => {
    // Initialize Socket.IO connection
    // Use environment variable or detect from current host
    let socketUrl = import.meta.env.VITE_SOCKET_URL;
    if (!socketUrl) {
      // Extract host from URL string directly (handles 0.0.0.0 issue)
      let host = '';
      const currentUrl = window.location.href;
      
      // Try to extract host from URL string using regex (more reliable than hostname property)
      const urlMatch = currentUrl.match(/https?:\/\/([^\/:]+)/);
      if (urlMatch && urlMatch[1] && urlMatch[1] !== '0.0.0.0') {
        host = urlMatch[1];
      } else {
        // Fallback to hostname property
        host = window.location.hostname;
        
        // If hostname is invalid, try URL object
        if (!host || host === '0.0.0.0' || host === '') {
          try {
            const url = new URL(currentUrl);
            host = url.hostname;
          } catch (e) {
            console.warn('Failed to parse URL:', e);
          }
        }
        
        // Final fallback
        if (!host || host === '0.0.0.0' || host === '') {
          host = 'localhost';
        }
      }
      
      const port = '8001';
      socketUrl = `http://${host}:${port}`;
    }
    
    // Final safety check - replace any remaining 0.0.0.0
    if (socketUrl.includes('0.0.0.0')) {
      // Extract from URL string one more time
      const urlMatch = window.location.href.match(/https?:\/\/([^\/:]+)/);
      if (urlMatch && urlMatch[1] && urlMatch[1] !== '0.0.0.0') {
        socketUrl = socketUrl.replace(/0\.0\.0\.0/g, urlMatch[1]);
      } else {
        socketUrl = socketUrl.replace(/0\.0\.0\.0/g, 'localhost');
      }
    }
    
    console.log(`🔌 Connecting to Socket.IO server at: ${socketUrl}`);
    console.log(`   Current hostname: ${window.location.hostname}`);
    console.log(`   Current URL: ${window.location.href}`);
    
    const socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    // Connection events
    socketInstance.on('connect', () => {
      console.log('✅ Connected to Socket.IO server');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Disconnected from Socket.IO server');
      setIsConnected(false);
      setJoinedRooms(new Set()); // Clear joined rooms on disconnect
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
      setIsConnected(false);
    });

    // Welcome message
    socketInstance.on('welcome', (data) => {
      console.log('👋 Socket.IO welcome:', data.message);
    });

    // Room events
    socketInstance.on('room_joined', (data) => {
      console.log(`🏠 Joined room: ${data.room} as ${data.user_type}`);
      setJoinedRooms(prev => new Set([...prev, data.room]));
    });

    socketInstance.on('room_left', (data) => {
      console.log(`🚪 Left room: ${data.room}`);
      setJoinedRooms(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.room);
        return newSet;
      });
    });

    // Order events
    socketInstance.on('order_updated', (data) => {
      console.log(`📋 Order ${data.order_id} status updated to ${data.status}`);
      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('orderUpdated', { detail: data }));
    });

    socketInstance.on('new_order', (data) => {
      console.log('🆕 New order received:', data.order);
      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('newOrder', { detail: data }));
    });

    socketInstance.on('order_status', (data) => {
      console.log('📊 Order status received:', data.order);
      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('orderStatus', { detail: data }));
    });

    socketInstance.on('tracking_started', (data) => {
      console.log('🔍 Tracking started for order:', data.order_id);
      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('trackingStarted', { detail: data }));
    });

    // Waiter call events
    socketInstance.on('waiter_call', (data) => {
      console.log('🔔 Waiter call received:', data);
      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('waiterCall', { detail: data }));
    });

    socketInstance.on('waiter_call_update', (data) => {
      console.log('🔄 Waiter call update received:', data);
      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('waiterCallUpdate', { detail: data }));
    });

    socketInstance.on('waiter_call_sent', (data) => {
      console.log('✅ Waiter call sent confirmation:', data);
      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('waiterCallSent', { detail: data }));
    });

    socketInstance.on('error', (data) => {
      console.error('❌ Socket.IO error:', data.message);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Join a specific room (prevent duplicates)
  const joinRoom = (room: string, userType: string) => {
    if (socket && isConnected && !joinedRooms.has(room)) {
      console.log(`🏠 Joining room: ${room} as ${userType}`);
      socket.emit('join_room', { room, user_type: userType });
    } else if (joinedRooms.has(room)) {
      console.log(`🏠 Already in room: ${room}`);
    }
  };

  // Leave a specific room
  const leaveRoom = (room: string) => {
    if (socket && isConnected && joinedRooms.has(room)) {
      console.log(`🚪 Leaving room: ${room}`);
      socket.emit('leave_room', { room });
    }
  };

  // Emit order status update
  const emitOrderStatusUpdate = (orderId: number, status: string, userType: string) => {
    if (socket && isConnected) {
      console.log(`📤 Emitting order status update: ${orderId} -> ${status}`);
      socket.emit('order_status_update', {
        order_id: orderId,
        status: status,
        user_type: userType
      });
    }
  };

  // Request order tracking
  const requestOrderTracking = (orderId: number, tableId?: string, roomId?: string) => {
    if (socket && isConnected) {
      console.log(`🔍 Requesting tracking for order: ${orderId}`);
      socket.emit('order_tracking_request', {
        order_id: orderId,
        table_id: tableId,
        room_id: roomId
      });
    }
  };

  // Auto-join admin/staff rooms based on user type (prevent duplicates)
  useEffect(() => {
    if (socket && isConnected && user) {
      if (user.is_superuser || user.cafe_manager) {
        joinRoom('admin', 'admin');
      } else if (user.staff_profile) {
        joinRoom('staff', 'staff');
      }
    }
  }, [socket, isConnected, user, joinedRooms]);

  const value: SocketContextType = {
    socket,
    isConnected,
    joinRoom,
    leaveRoom,
    emitOrderStatusUpdate,
    requestOrderTracking,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
